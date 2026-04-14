from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    minute_mark = Column(DateTime(timezone=True), server_default=func.now())
    confusion_count = Column(Integer, default=0)
    
    # Связь с лекцией
    lecture = relationship("Lecture", backref="analytics")

    def __repr__(self):
        return f"<Analytics(lecture={self.lecture_id}, minute={self.minute_mark}, confusion={self.confusion_count})>"