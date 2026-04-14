from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    content = Column(String, nullable=False)
    likes_count = Column(Integer, default=0)
    is_answered = Column(Boolean, default=False)
    cluster_id = Column(Integer, nullable=True)  # Для AI-дедупликации
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связь с лекцией
    lecture = relationship("Lecture", backref="questions")

    def __repr__(self):
        return f"<Question(id={self.id}, content={self.content[:50]}, likes={self.likes_count})>"