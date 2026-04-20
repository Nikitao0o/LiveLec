from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.analytics import Analytics
from app.schemas.analytics import ConfusionCreate, ConfusionResponse

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.post("/confusion", response_model=ConfusionResponse)
async def add_confusion(data: ConfusionCreate, db: AsyncSession = Depends(get_db)):
    new_entry = Analytics(lecture_id=data.lecture_id, confusion_count=1)
    db.add(new_entry)
    await db.commit()
    return ConfusionResponse()