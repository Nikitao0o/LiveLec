from pydantic import BaseModel
from datetime import datetime

class QuestionCreate(BaseModel):
    lecture_id: int
    content: str

class QuestionResponse(BaseModel):
    id: int
    lecture_id: int
    content: str
    likes_count: int
    is_answered: bool
    created_at: datetime
