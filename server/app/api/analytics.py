from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.database import get_db
from app.models.analytics import Analytics
from app.models.lecture import Lecture
from app.models.question import Question
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/global")
async def global_analytics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    l_res = await db.execute(select(func.count(Lecture.id)).where(Lecture.teacher_id == current_user.id))
    total_lectures = l_res.scalar_one()

    d_res = await db.execute(select(func.count(func.distinct(Lecture.discipline))).where(Lecture.teacher_id == current_user.id))
    total_disciplines = d_res.scalar_one()

    lectures_query = await db.execute(select(Lecture).where(Lecture.teacher_id == current_user.id).order_by(Lecture.created_at))
    lectures = lectures_query.scalars().all()

    chart_data = []
    total_engagement_sum = 0

    for lec in lectures:
        conf_sum_res = await db.execute(select(func.coalesce(func.sum(Analytics.confusion_count), 0)).where(Analytics.lecture_id == lec.id))
        conf_sum = conf_sum_res.scalar_one()
        eng = max(0, 100 - conf_sum * 2)
        total_engagement_sum += eng
        chart_data.append({
            "name": lec.created_at.strftime("%d.%m"),
            "engagement": eng
        })

    if not chart_data:
        chart_data = [{"name": "Нет данных", "engagement": 0}]

    avg_engagement = (total_engagement_sum // len(lectures)) if lectures else 0

    students_res = await db.execute(
        select(func.coalesce(func.sum(Lecture.peak_students), 0)).where(
            Lecture.teacher_id == current_user.id
        )
    )
    active_students = students_res.scalar_one()

    return {
        "total_lectures": total_lectures,
        "active_students": active_students,
        "total_disciplines": total_disciplines,
        "engagement_growth": f"{avg_engagement}%",
        "chart_data": chart_data
    }