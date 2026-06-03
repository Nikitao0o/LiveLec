from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.responses import PlainTextResponse, FileResponse
from pathlib import Path
import shutil
import tempfile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.lecture import Lecture, LectureStatus
from app.models.question import Question
from app.models.analytics import Analytics
from app.models.transcript import TranscriptSegment
from app.models.user import User
from app.api.auth import get_current_user, get_optional_user
from app.schemas.lecture import (
    LectureCreate,
    LectureResponse,
    LectureJoin,
    LectureJoinResponse,
    PresentationMeta,
)
from app.services.presentation import process_presentation_file, lecture_slides_dir
from app.schemas.question import QuestionResponse
from app.ws.manager import manager
import random

router = APIRouter(prefix="/api/lectures", tags=["lectures"])

def generate_pin():
    return str(random.randint(100000, 999999))

async def generate_unique_pin(db: AsyncSession) -> str:
    for _ in range(10):
        pin = generate_pin()
        result = await db.execute(select(Lecture.id).where(Lecture.pin_code == pin))
        if result.scalar_one_or_none() is None:
            return pin
    raise HTTPException(status_code=503, detail="Could not allocate lecture PIN")

def serialize_lecture(lecture: Lecture) -> LectureResponse:
    return LectureResponse(
        id=lecture.id,
        teacher_id=lecture.teacher_id,
        title=lecture.title,
        discipline=lecture.discipline,
        pin_code=lecture.pin_code,
        status=lecture.status.value,
        created_at=lecture.created_at
    )

def serialize_question(question: Question) -> QuestionResponse:
    return QuestionResponse(
        id=question.id,
        lecture_id=question.lecture_id,
        content=question.content,
        likes_count=question.likes_count,
        is_answered=question.is_answered,
        created_at=question.created_at,
    )

async def get_owned_lecture(lecture_id: int, teacher_id: int, db: AsyncSession) -> Lecture:
    result = await db.execute(
        select(Lecture).where(
            Lecture.id == lecture_id,
            Lecture.teacher_id == teacher_id
        )
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture

@router.post("/", response_model=LectureResponse)
async def create_lecture(
    lecture_data: LectureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pin = await generate_unique_pin(db)
    new_lecture = Lecture(
        teacher_id=current_user.id,
        title=lecture_data.title,
        discipline=lecture_data.discipline,
        pin_code=pin,
        status=LectureStatus.WAITING
    )
    db.add(new_lecture)
    await db.commit()
    await db.refresh(new_lecture)
    return serialize_lecture(new_lecture)

@router.get("/", response_model=list[LectureResponse])
async def list_my_lectures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Lecture)
        .where(Lecture.teacher_id == current_user.id)
        .order_by(Lecture.created_at.desc())
    )
    return [serialize_lecture(lecture) for lecture in result.scalars().all()]

@router.post("/join", response_model=LectureJoinResponse)
async def join_lecture(join_data: LectureJoin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lecture).where(Lecture.pin_code == join_data.pin_code))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    questions_result = await db.execute(
        select(Question)
        .where(Question.lecture_id == lecture.id)
        .order_by(Question.likes_count.desc(), Question.created_at.asc())
    )
    questions = [
        serialize_question(question) for question in questions_result.scalars().all()
    ]

    return LectureJoinResponse(
        lecture_id=lecture.id,
        title=lecture.title,
        discipline=lecture.discipline,
        pin_code=lecture.pin_code,
        status=lecture.status.value,
        slide_count=lecture.slide_count or 0,
        current_slide=lecture.current_slide or 1,
        questions=questions,
    )

@router.post("/{lecture_id}/finish", response_model=LectureResponse)
async def finish_lecture(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    lecture.status = LectureStatus.FINISHED
    await db.commit()
    await db.refresh(lecture)
    return serialize_lecture(lecture)

@router.get("/{lecture_id}/analytics")
async def lecture_analytics(
    lecture_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    
    conf_res = await db.execute(select(func.coalesce(func.sum(Analytics.confusion_count), 0)).where(Analytics.lecture_id == lecture_id))
    confusion_sum = conf_res.scalar_one()

    q_res = await db.execute(select(func.count(Question.id)).where(Question.lecture_id == lecture_id))
    questions_count = q_res.scalar_one()

    analytics_entries = await db.execute(select(Analytics).where(Analytics.lecture_id == lecture_id).order_by(Analytics.minute_mark))
    chart_data = []
    for entry in analytics_entries.scalars().all():
        time_str = entry.minute_mark.strftime("%H:%M") if entry.minute_mark else "00:00"
        chart_data.append({"time": time_str, "confusion": entry.confusion_count})

    if not chart_data:
        chart_data = [{"time": "00:00", "confusion": 0}]

    return {
        "id": lecture.id,
        "title": lecture.title,
        "created_at": lecture.created_at.isoformat(),
        "confusion_sum": confusion_sum,
        "questions_count": questions_count,
        "students_count": lecture.peak_students or 0,
        "engagement": max(0, 100 - confusion_sum * 2),
        "chart_data": chart_data
    }

@router.get("/{lecture_id}/export")
async def export_lecture(
    lecture_id: int, 
    format: str = "txt", 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    segments = await db.execute(select(TranscriptSegment).where(TranscriptSegment.lecture_id == lecture_id).order_by(TranscriptSegment.start_ms))
    
    text_lines = []
    for seg in segments.scalars().all():
        text = seg.cleaned_text if seg.cleaned_text else seg.raw_text
        if text:
            text_lines.append(text)
            
    full_text = "\n".join(text_lines) if text_lines else "Текст лекции отсутствует (ASR не был запущен)."

    if format == "md":
        content = f"# Расшифровка лекции: {lecture.title}\n\n**Дата:** {lecture.created_at.strftime('%Y-%m-%d')}\n\n---\n\n{full_text}"
        media_type = "text/markdown"
        filename = f"lecture_{lecture_id}.md"
    else:
        content = f"Расшифровка лекции: {lecture.title}\nДата: {lecture.created_at.strftime('%Y-%m-%d')}\n\n{full_text}"
        media_type = "text/plain"
        filename = f"lecture_{lecture_id}.txt"

    return PlainTextResponse(
        content=content, 
        media_type=media_type, 
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{lecture_id}/presentation", response_model=PresentationMeta)
async def get_presentation_meta(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    return PresentationMeta(
        slide_count=lecture.slide_count or 0,
        current_slide=lecture.current_slide or 1,
    )

@router.post("/{lecture_id}/presentation", response_model=PresentationMeta)
async def upload_presentation(
    lecture_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()
    if extension not in {".pdf", ".pptx"}:
        raise HTTPException(status_code=400, detail="Supported formats: PDF, PPTX")

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        slide_count = process_presentation_file(lecture.id, tmp_path, extension)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    lecture.slide_count = slide_count
    lecture.current_slide = 1 if slide_count > 0 else 0
    await db.commit()
    await db.refresh(lecture)

    if lecture.slide_count > 0:
        await manager.broadcast_to_room(
            lecture.pin_code,
            {
                "type": "SLIDE_CHANGE",
                "data": {
                    "slide_number": lecture.current_slide,
                    "total_slides": lecture.slide_count,
                    "lecture_id": lecture.id,
                },
            },
            exclude_teacher=True,
        )

    return PresentationMeta(slide_count=lecture.slide_count, current_slide=lecture.current_slide)

@router.get("/{lecture_id}/slides/{slide_number}")
async def get_slide_image(
    lecture_id: int,
    slide_number: int,
    pin: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    allowed = False
    if current_user and lecture.teacher_id == current_user.id:
        allowed = True
    elif pin and pin == lecture.pin_code:
        allowed = True

    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied")

    if slide_number < 1 or slide_number > (lecture.slide_count or 0):
        raise HTTPException(status_code=404, detail="Slide not found")

    slide_path = lecture_slides_dir(lecture_id) / f"slide_{slide_number:03d}.png"
    if not slide_path.exists():
        raise HTTPException(status_code=404, detail="Slide file not found")

    return FileResponse(slide_path, media_type="image/png")