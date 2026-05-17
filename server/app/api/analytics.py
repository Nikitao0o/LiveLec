from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.database import get_db
from app.models.analytics import Analytics
from app.models.lecture import Lecture, LectureStatus
from app.schemas.analytics import ConfusionCreate, ConfusionResponse
from app.ws.manager import manager

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.post("/confusion", response_model=ConfusionResponse)
async def add_confusion(data: ConfusionCreate, db: AsyncSession = Depends(get_db)):
    lecture = await db.get(Lecture, data.lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if lecture.status == LectureStatus.FINISHED:
        raise HTTPException(status_code=409, detail="Lecture is finished")

    new_entry = Analytics(lecture_id=data.lecture_id, confusion_count=1)
    db.add(new_entry)
    await db.commit()

    total_result = await db.execute(
        select(func.coalesce(func.sum(Analytics.confusion_count), 0))
        .where(Analytics.lecture_id == data.lecture_id)
    )
    total = total_result.scalar_one()
    await manager.broadcast_to_teacher(lecture.pin_code, {
        "type": "CONFUSION_UPDATE",
        "data": {
            "lecture_id": lecture.id,
            "confusion_count": 1,
            "total_confusion_count": total
        }
    })
    return ConfusionResponse(total_confusion_count=total)
