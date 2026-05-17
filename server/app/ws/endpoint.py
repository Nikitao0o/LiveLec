import json
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.lecture import Lecture, LectureStatus
from app.models.question import Question
from app.models.analytics import Analytics
from app.ws.manager import manager

router = APIRouter()

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
    db: AsyncSession = Depends(get_db)
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
    await manager.connect(websocket, pin_code, user_type)
    
    try:
        # Подтверждение подключения
        await websocket.send_json({
            "type": "CONNECTED",
            "data": {
                "lecture_id": lecture.id,
                "pin_code": pin_code,
                "user_type": user_type,
                "title": lecture.title,
                "discipline": lecture.discipline,
                "status": lecture.status.value
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
                await handle_slide_change(pin_code, message_data)
            
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
    # Получаем lecture_id по pin_code
    result = await db.execute(select(Lecture).where(Lecture.pin_code == pin_code))
    lecture = result.scalar_one_or_none()
    
    if not lecture:
        return
    if lecture.status == LectureStatus.FINISHED:
        return
    
    # Сохраняем в аналитику
    new_analytics = Analytics(
        lecture_id=lecture.id,
        confusion_count=1
    )
    db.add(new_analytics)
    await db.commit()
    
    # Отправляем уведомление только преподавателю
    await manager.broadcast_to_teacher(pin_code, {
        "type": "CONFUSION_UPDATE",
        "data": {
            "confusion_count": 1,
            "lecture_id": lecture.id
        }
    })


async def handle_slide_change(pin_code: str, data: dict):
    """Обработка смены слайда (только от преподавателя)"""
    slide_number = data.get("slide_number")
    if slide_number is None:
        return
    
    # Рассылаем студентам номер слайда
    await manager.broadcast_to_room(pin_code, {
        "type": "SLIDE_CHANGE",
        "data": {"slide_number": slide_number}
    }, exclude_teacher=True)
