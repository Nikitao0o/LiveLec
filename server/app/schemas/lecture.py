from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LectureCreate(BaseModel):
    title: str
    discipline: Optional[str] = None

class LectureResponse(BaseModel):
    id: int
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
    status: str