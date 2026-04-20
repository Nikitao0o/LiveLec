from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionResponse

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.post("/", response_model=QuestionResponse)
async def create_question(q_data: QuestionCreate, db: AsyncSession = Depends(get_db)):
    new_question = Question(
        lecture_id=q_data.lecture_id,
        content=q_data.content
    )
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    
    return QuestionResponse(
        id=new_question.id,
        content=new_question.content,
        likes_count=new_question.likes_count,
        created_at=new_question.created_at
    )

@router.post("/{question_id}/like")
async def like_question(question_id: int, db: AsyncSession = Depends(get_db)):
    question = await db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question.likes_count += 1
    await db.commit()
    await db.refresh(question)
    
    return {"likes_count": question.likes_count}