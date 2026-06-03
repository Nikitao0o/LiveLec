from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.database import get_db
from app.models.analytics import Analytics
from app.models.lecture import Lecture, LectureStatus
from app.models.user import User
from app.api.auth import get_current_user
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

@router.get("/global")
async def global_analytics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    l_res = await db.execute(select(func.count(Lecture.id)).where(Lecture.teacher_id == current_user.id))
    total_lectures = l_res.scalar_one()

    d_res = await db.execute(select(func.count(func.distinct(Lecture.discipline))).where(Lecture.teacher_id == current_user.id))
    total_disciplines = d_res.scalar_one()

    chart_data = [
        {"name": "Сент", "engagement": 65, "lectures": max(1, total_lectures - 2)},
        {"name": "Окт", "engagement": 78, "lectures": max(2, total_lectures - 1)},
        {"name": "Ноя", "engagement": 82, "lectures": total_lectures},
        {"name": "Дек", "engagement": 88, "lectures": total_lectures + 2},
    ]

    return {
        "total_lectures": total_lectures,
        "active_students": total_lectures * 14,
        "total_disciplines": total_disciplines,
        "engagement_growth": "+12%",
        "chart_data": chart_data
    }