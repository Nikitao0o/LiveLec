from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.lecture import Lecture, LectureStatus
from app.models.question import Question
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.lecture import LectureCreate, LectureResponse, LectureJoin, LectureJoinResponse
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
        created_at=question.created_at
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
    
    return LectureJoinResponse(
        lecture_id=lecture.id,
        title=lecture.title,
        discipline=lecture.discipline,
        pin_code=lecture.pin_code,
        status=lecture.status.value,
        questions=[serialize_question(question) for question in questions_result.scalars().all()]
    )

@router.get("/{lecture_id}", response_model=LectureResponse)
async def get_lecture(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    return serialize_lecture(lecture)

@router.post("/{lecture_id}/start", response_model=LectureResponse)
async def start_lecture(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lecture = await get_owned_lecture(lecture_id, current_user.id, db)
    if lecture.status == LectureStatus.FINISHED:
        raise HTTPException(status_code=409, detail="Finished lecture cannot be started")

    lecture.status = LectureStatus.ACTIVE
    await db.commit()
    await db.refresh(lecture)
    await manager.broadcast_to_room(lecture.pin_code, {
        "type": "LECTURE_STATUS",
        "data": {"lecture_id": lecture.id, "status": lecture.status.value}
    })
    return serialize_lecture(lecture)

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
    await manager.broadcast_to_room(lecture.pin_code, {
        "type": "LECTURE_STATUS",
        "data": {"lecture_id": lecture.id, "status": lecture.status.value}
    })
    return serialize_lecture(lecture)
