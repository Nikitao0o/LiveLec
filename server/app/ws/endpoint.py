import asyncio
import json
import logging
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db, AsyncSessionLocal
from app.models.lecture import Lecture, LectureStatus
from app.models.question import Question
from app.models.analytics import Analytics
from app.models.confusion_session import ConfusionSession
from app.models.transcript import TranscriptSegment
from app.ws.manager import manager
from app.services.asr import asr_service
from app.services.confusion import (
    CONFUSION_COOLDOWN_SECONDS,
    get_confusion_cooldown_remaining,
    get_confusion_session,
    _utc_now,
)

logger = logging.getLogger(__name__)

router = APIRouter()

_asr_busy: dict[str, bool] = {}
_asr_pending: dict[str, tuple[int, str]] = {}
_last_asr_text: dict[str, str] = {}


async def _schedule_asr(pin_code: str, lecture_id: int, base64_chunk: str) -> None:
    """Один поток ASR на лекцию: при перегрузке берём только последний чанк."""
    _asr_pending[pin_code] = (lecture_id, base64_chunk)
    if _asr_busy.get(pin_code):
        return
    _asr_busy[pin_code] = True
    try:
        while pin_code in _asr_pending:
            lec_id, chunk = _asr_pending.pop(pin_code)
            await _run_asr_pipeline(pin_code, lec_id, chunk)
    finally:
        _asr_busy[pin_code] = False
        if pin_code in _asr_pending:
            asyncio.create_task(_schedule_asr(pin_code, *_asr_pending[pin_code]))

def serialize_question(question: Question) -> dict:
    return {
        "id": question.id,
        "lecture_id": question.lecture_id,
        "content": question.content,
        "likes_count": question.likes_count,
        "is_answered": question.is_answered,
        "created_at": question.created_at.isoformat() if question.created_at else None
    }

@router.websocket("/ws/{pin_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    pin_code: str,
    user_type: str = "student",
    session_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket эндпоинт для подключения к лекции
    
    user_type: "teacher" или "student"
    Подключение: ws://localhost:8000/ws/451968?user_type=teacher
    """
    
    if user_type not in ("teacher", "student"):
        await websocket.close(code=1008, reason="Invalid user type")
        return

    result = await db.execute(select(Lecture).where(Lecture.pin_code == pin_code))
    lecture = result.scalar_one_or_none()
    
    if not lecture:
        await websocket.close(code=1008, reason="Lecture not found")
        return
    
    # Подключаем клиента
    normalized_session_id = (session_id or "").strip() or None
    await manager.connect(
        websocket, pin_code, user_type, session_id=normalized_session_id
    )

    if user_type == "student":
        student_count = manager.count_students(pin_code)
        if student_count > (lecture.peak_students or 0):
            lecture.peak_students = student_count
            await db.commit()
    
    try:
        # Подтверждение подключения
        connected_payload = {
            "lecture_id": lecture.id,
            "pin_code": pin_code,
            "user_type": user_type,
            "title": lecture.title,
            "discipline": lecture.discipline,
            "status": lecture.status.value,
            "slide_count": lecture.slide_count or 0,
            "current_slide": lecture.current_slide or 1,
        }
        if user_type == "student" and normalized_session_id:
            connected_payload["confusion_cooldown_seconds"] = (
                await get_confusion_cooldown_remaining(
                    db, lecture.id, normalized_session_id
                )
            )
        await websocket.send_json({"type": "CONNECTED", "data": connected_payload})
        if user_type == "student" and lecture.slide_count:
            await websocket.send_json({
                "type": "SLIDE_CHANGE",
                "data": {
                    "slide_number": lecture.current_slide or 1,
                    "total_slides": lecture.slide_count,
                    "lecture_id": lecture.id,
                }
            })
        await manager.broadcast_participants(pin_code)
        
        # Обработка входящих сообщений
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "ERROR",
                    "data": {"detail": "Invalid JSON"}
                })
                continue
            message_type = message.get("type")
            message_data = message.get("data", {})
            
            if message_type == "NEW_QUESTION":
                await handle_new_question(pin_code, message_data, db)
            
            elif message_type == "LIKE_QUESTION":
                await handle_like_question(pin_code, message_data, db)
            
            elif message_type == "CONFUSION_CLICK":
                await handle_confusion_click(pin_code, message_data, db)
            
            elif message_type == "SLIDE_CHANGE":
                if user_type == "teacher":
                    await handle_slide_change(pin_code, message_data, db)
                
            # --- ОБРАБОТКА АУДИО ---
            elif message_type == "AUDIO_CHUNK":
                if user_type == "teacher":
                    await handle_audio_chunk(pin_code, message_data, db, websocket)

            # --- ОБРАБОТКА ОПРОСОВ (КВИЗОВ) ---
            elif message_type == "QUIZ_START":
                if user_type == "teacher":
                    await manager.broadcast_to_room(pin_code, {"type": "QUIZ_START", "data": message_data}, exclude_teacher=True)
            
            elif message_type == "QUIZ_ANSWER":
                if user_type == "student":
                    await manager.broadcast_to_teacher(pin_code, {"type": "QUIZ_ANSWER", "data": message_data})
            
            elif message_type == "PING":
                await websocket.send_json({"type": "PONG"})

            else:
                await websocket.send_json({
                    "type": "ERROR",
                    "data": {"detail": "Unknown message type"}
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, pin_code)
        await manager.broadcast_participants(pin_code)


async def handle_new_question(pin_code: str, data: dict, db: AsyncSession):
    """Обработка нового вопроса"""
    content = data.get("content")
    if not content:
        return
    
    # Получаем lecture_id по pin_code
    result = await db.execute(select(Lecture).where(Lecture.pin_code == pin_code))
    lecture = result.scalar_one_or_none()
    
    if not lecture:
        return
    if lecture.status == LectureStatus.FINISHED:
        return
    
    # Сохраняем вопрос в БД
    new_question = Question(
        lecture_id=lecture.id,
        content=content,
        likes_count=0
    )
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    
    question_data = serialize_question(new_question)
    
    # Рассылаем всем в комнате
    await manager.broadcast_to_room(pin_code, {
        "type": "NEW_QUESTION",
        "data": question_data
    })


async def handle_like_question(pin_code: str, data: dict, db: AsyncSession):
    """Обработка лайка вопроса"""
    question_id = data.get("question_id")
    if not question_id:
        return
    
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        return
    lecture = await db.get(Lecture, question.lecture_id)
    if not lecture or lecture.status == LectureStatus.FINISHED:
        return

    question.likes_count += 1
    await db.commit()
    await db.refresh(question)
    
    # Рассылаем всем обновление лайка
    await manager.broadcast_to_room(pin_code, {
        "type": "LIKE_UPDATE",
        "data": {
            "question_id": question_id,
            "likes_count": question.likes_count
        }
    })


async def handle_confusion_click(pin_code: str, data: dict, db: AsyncSession):
    """Обработка нажатия 'Не понимаю'"""
    session_id = (data.get("session_id") or "").strip()
    if not session_id:
        return

    result = await db.execute(select(Lecture).where(Lecture.pin_code == pin_code))
    lecture = result.scalar_one_or_none()

    if not lecture:
        return
    if lecture.status == LectureStatus.FINISHED:
        return

    remaining = await get_confusion_cooldown_remaining(db, lecture.id, session_id)
    if remaining > 0:
        await manager.send_to_student_session(
            pin_code,
            session_id,
            {
                "type": "CONFUSION_COOLDOWN",
                "data": {"cooldown_seconds": remaining},
            },
        )
        return

    now = _utc_now()
    session_row = await get_confusion_session(db, lecture.id, session_id)
    if session_row:
        session_row.last_confusion_at = now
    else:
        db.add(
            ConfusionSession(
                lecture_id=lecture.id,
                session_id=session_id,
                last_confusion_at=now,
            )
        )

    db.add(Analytics(lecture_id=lecture.id, confusion_count=1))
    await db.commit()

    total_res = await db.execute(
        select(func.coalesce(func.sum(Analytics.confusion_count), 0)).where(
            Analytics.lecture_id == lecture.id
        )
    )
    total_confusion = int(total_res.scalar_one())

    await manager.broadcast_to_teacher(
        pin_code,
        {
            "type": "CONFUSION_UPDATE",
            "data": {
                "confusion_count": 1,
                "total_confusion_count": total_confusion,
                "lecture_id": lecture.id,
            },
        },
    )
    await manager.send_to_student_session(
        pin_code,
        session_id,
        {
            "type": "CONFUSION_ACK",
            "data": {"cooldown_seconds": CONFUSION_COOLDOWN_SECONDS},
        },
    )


async def handle_slide_change(pin_code: str, data: dict, db: AsyncSession):
    """Обработка смены слайда (только от преподавателя)"""
    slide_number = data.get("slide_number")
    if slide_number is None:
        return

    result = await db.execute(select(Lecture).where(Lecture.pin_code == pin_code))
    lecture = result.scalar_one_or_none()
    if not lecture or not lecture.slide_count:
        return

    slide_number = max(1, min(int(slide_number), lecture.slide_count))
    lecture.current_slide = slide_number
    await db.commit()

    await manager.broadcast_to_room(pin_code, {
        "type": "SLIDE_CHANGE",
        "data": {
            "slide_number": slide_number,
            "total_slides": lecture.slide_count,
            "lecture_id": lecture.id,
        }
    }, exclude_teacher=True)


async def _notify_teacher_asr(pin_code: str, payload: dict) -> None:
    await manager.broadcast_to_teacher(
        pin_code,
        {"type": "ASR_STATUS", "data": payload},
    )


async def _run_asr_pipeline(pin_code: str, lecture_id: int, base64_chunk: str) -> None:
    try:
        recognized_text = await asr_service.process_audio_chunk(base64_chunk)
        text = (recognized_text or "").strip()
        if text and text.lower() == (_last_asr_text.get(pin_code) or "").lower():
            return
        if text:
            _last_asr_text[pin_code] = text
            await manager.broadcast_to_room(
                pin_code,
                {"type": "ASR_TEXT", "data": {"text": text}},
            )
            await _notify_teacher_asr(
                pin_code,
                {"status": "ok", "text": text},
            )

            async def _save_transcript() -> None:
                async with AsyncSessionLocal() as session:
                    session.add(
                        TranscriptSegment(
                            lecture_id=lecture_id,
                            start_ms=0,
                            end_ms=0,
                            raw_text=text,
                        )
                    )
                    await session.commit()

            asyncio.create_task(_save_transcript())
        else:
            pass
    except Exception as exc:
        logger.exception("ASR pipeline failed for lecture %s: %s", lecture_id, exc)
        await _notify_teacher_asr(
            pin_code,
            {"status": "error", "message": str(exc)},
        )


async def handle_audio_chunk(
    pin_code: str,
    data: dict,
    db: AsyncSession,
    websocket: WebSocket,
):
    """Обработка аудио чанков от преподавателя (в фоне, не блокируя WS)."""
    base64_chunk = data.get("chunk")
    if not base64_chunk:
        return

    result = await db.execute(select(Lecture).where(Lecture.pin_code == pin_code))
    lecture = result.scalar_one_or_none()

    if not lecture:
        await websocket.send_json(
            {
                "type": "ASR_STATUS",
                "data": {"status": "error", "message": "Лекция не найдена"},
            }
        )
        return
    if lecture.status == LectureStatus.FINISHED:
        return

    chunk_bytes = len(base64_chunk) * 3 // 4
    logger.info(
        "AUDIO_CHUNK lecture_id=%s pin=%s approx_bytes=%s",
        lecture.id,
        pin_code,
        chunk_bytes,
    )

    if not asr_service.model:
        await _notify_teacher_asr(
            pin_code,
            {"status": "processing", "message": "Загрузка модели распознавания…"},
        )
    asyncio.create_task(_schedule_asr(pin_code, lecture.id, base64_chunk))