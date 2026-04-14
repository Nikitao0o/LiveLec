from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class LectureStatus(str, enum.Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"

class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    discipline = Column(String, nullable=True)
    pin_code = Column(String(6), unique=True, index=True, nullable=False)
    status = Column(Enum(LectureStatus), default=LectureStatus.WAITING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связь с преподавателем
    teacher = relationship("User", backref="lectures")

    def __repr__(self):
        return f"<Lecture(id={self.id}, title={self.title}, pin={self.pin_code}, status={self.status})>"