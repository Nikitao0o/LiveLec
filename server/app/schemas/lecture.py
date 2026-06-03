from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from app.schemas.question import QuestionResponse

class LectureCreate(BaseModel):
    title: str
    discipline: Optional[str] = None

class LectureResponse(BaseModel):
    id: int
    teacher_id: int
    title: str
    discipline: Optional[str]
    pin_code: str
    status: str
    created_at: datetime

class LectureJoin(BaseModel):
    pin_code: str

class LectureJoinResponse(BaseModel):
    lecture_id: int
    title: str
    discipline: Optional[str]
    pin_code: str
    status: str
    slide_count: int = 0
    current_slide: int = 1
    questions: List[QuestionResponse] = []

class PresentationMeta(BaseModel):
    slide_count: int
    current_slide: int
