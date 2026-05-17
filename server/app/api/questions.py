from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.lecture import Lecture, LectureStatus
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionResponse
from app.ws.manager import manager

router = APIRouter(prefix="/api/questions", tags=["questions"])

def serialize_question(question: Question) -> QuestionResponse:
    return QuestionResponse(
        id=question.id,
        lecture_id=question.lecture_id,
        content=question.content,
        likes_count=question.likes_count,
        is_answered=question.is_answered,
        created_at=question.created_at
    )

@router.post("/", response_model=QuestionResponse)
async def create_question(q_data: QuestionCreate, db: AsyncSession = Depends(get_db)):
    lecture = await db.get(Lecture, q_data.lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if lecture.status == LectureStatus.FINISHED:
        raise HTTPException(status_code=409, detail="Lecture is finished")

    new_question = Question(
        lecture_id=q_data.lecture_id,
        content=q_data.content
    )
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    question_response = serialize_question(new_question)
    await manager.broadcast_to_room(lecture.pin_code, {
        "type": "NEW_QUESTION",
        "data": question_response.model_dump(mode="json")
    })
    return question_response

@router.get("/lecture/{lecture_id}", response_model=list[QuestionResponse])
async def list_questions(lecture_id: int, db: AsyncSession = Depends(get_db)):
    lecture = await db.get(Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    result = await db.execute(
        select(Question)
        .where(Question.lecture_id == lecture_id)
        .order_by(Question.likes_count.desc(), Question.created_at.asc())
    )
    return [serialize_question(question) for question in result.scalars().all()]

@router.post("/{question_id}/like")
async def like_question(question_id: int, db: AsyncSession = Depends(get_db)):
    question = await db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    lecture = await db.get(Lecture, question.lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if lecture.status == LectureStatus.FINISHED:
        raise HTTPException(status_code=409, detail="Lecture is finished")
    
    question.likes_count += 1
    await db.commit()
    await db.refresh(question)
    await manager.broadcast_to_room(lecture.pin_code, {
        "type": "LIKE_UPDATE",
        "data": {
            "question_id": question.id,
            "likes_count": question.likes_count
        }
    })
    
    return {"question_id": question.id, "likes_count": question.likes_count}
