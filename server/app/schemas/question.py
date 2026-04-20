from pydantic import BaseModel
from datetime import datetime

class QuestionCreate(BaseModel):
    lecture_id: int
    content: str

class QuestionResponse(BaseModel):
    id: int
    content: str
    likes_count: int
    created_at: datetime