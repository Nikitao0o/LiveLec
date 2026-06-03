from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.discipline import TeacherDiscipline
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.discipline import DisciplineCreate, DisciplineResponse

router = APIRouter(prefix="/api/disciplines", tags=["disciplines"])


@router.get("/", response_model=list[DisciplineResponse])
async def list_disciplines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TeacherDiscipline)
        .where(TeacherDiscipline.teacher_id == current_user.id)
        .order_by(TeacherDiscipline.name.asc())
    )
    return [
        DisciplineResponse(id=item.id, name=item.name, created_at=item.created_at)
        for item in result.scalars().all()
    ]


@router.post("/", response_model=DisciplineResponse)
async def create_discipline(
    payload: DisciplineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Discipline name cannot be empty")

    existing = await db.execute(
        select(TeacherDiscipline).where(
            TeacherDiscipline.teacher_id == current_user.id,
            TeacherDiscipline.name == name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Discipline already exists")

    item = TeacherDiscipline(teacher_id=current_user.id, name=name)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return DisciplineResponse(id=item.id, name=item.name, created_at=item.created_at)


@router.delete("/{discipline_id}")
async def delete_discipline(
    discipline_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TeacherDiscipline).where(
            TeacherDiscipline.id == discipline_id,
            TeacherDiscipline.teacher_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Discipline not found")

    await db.delete(item)
    await db.commit()
    return {"message": "Discipline deleted"}
