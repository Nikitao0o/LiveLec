from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ConfusionSession(Base):
    __tablename__ = "confusion_sessions"
    __table_args__ = (
        UniqueConstraint("lecture_id", "session_id", name="uq_confusion_lecture_session"),
    )

    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    last_confusion_at = Column(DateTime(timezone=True), nullable=True)

    lecture = relationship("Lecture", backref="confusion_sessions")
