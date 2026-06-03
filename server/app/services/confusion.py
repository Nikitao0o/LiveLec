from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.confusion_session import ConfusionSession

CONFUSION_COOLDOWN_SECONDS = 60


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def confusion_cooldown_remaining(last_click: datetime | None, now: datetime | None = None) -> int:
    if not last_click:
        return 0
    now = now or _utc_now()
    if last_click.tzinfo is None:
        last_click = last_click.replace(tzinfo=timezone.utc)
    elapsed = (now - last_click).total_seconds()
    if elapsed >= CONFUSION_COOLDOWN_SECONDS:
        return 0
    return int(CONFUSION_COOLDOWN_SECONDS - elapsed)


async def get_confusion_session(
    db: AsyncSession, lecture_id: int, session_id: str
) -> ConfusionSession | None:
    result = await db.execute(
        select(ConfusionSession).where(
            ConfusionSession.lecture_id == lecture_id,
            ConfusionSession.session_id == session_id,
        )
    )
    return result.scalar_one_or_none()


async def get_confusion_cooldown_remaining(
    db: AsyncSession, lecture_id: int, session_id: str
) -> int:
    row = await get_confusion_session(db, lecture_id, session_id)
    if not row:
        return 0
    return confusion_cooldown_remaining(row.last_confusion_at)
