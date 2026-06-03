from pydantic import BaseModel, Field
from datetime import datetime


class DisciplineCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class DisciplineResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
