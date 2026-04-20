from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.lecture import Lecture, LectureStatus
from app.schemas.lecture import LectureCreate, LectureResponse, LectureJoin, LectureJoinResponse
import random

router = APIRouter(prefix="/api/lectures", tags=["lectures"])

def generate_pin():
    return str(random.randint(100000, 999999))

@router.post("/", response_model=LectureResponse)
async def create_lecture(lecture_data: LectureCreate, db: AsyncSession = Depends(get_db)):
    pin = generate_pin()
    new_lecture = Lecture(
        teacher_id=1,
        title=lecture_data.title,
        discipline=lecture_data.discipline,
        pin_code=pin,
        status=LectureStatus.WAITING
    )
    db.add(new_lecture)
    await db.commit()
    await db.refresh(new_lecture)
    
    return LectureResponse(
        id=new_lecture.id,
        title=new_lecture.title,
        discipline=new_lecture.discipline,
        pin_code=new_lecture.pin_code,
        status=new_lecture.status.value,
        created_at=new_lecture.created_at
    )

@router.post("/join", response_model=LectureJoinResponse)
async def join_lecture(join_data: LectureJoin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lecture).where(Lecture.pin_code == join_data.pin_code))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    return LectureJoinResponse(
        lecture_id=lecture.id,
        title=lecture.title,
        status=lecture.status.value
    )