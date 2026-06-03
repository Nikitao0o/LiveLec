from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class TeacherDiscipline(Base):
    __tablename__ = "teacher_disciplines"
    __table_args__ = (
        UniqueConstraint("teacher_id", "name", name="uq_teacher_discipline_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
