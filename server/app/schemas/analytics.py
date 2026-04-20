from pydantic import BaseModel

class ConfusionCreate(BaseModel):
    lecture_id: int

class ConfusionResponse(BaseModel):
    status: str = "recorded"