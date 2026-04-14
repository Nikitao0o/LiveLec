from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class CleanMethod(str, enum.Enum):
    LLM = "llm"
    REGEX = "regex"

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    start_ms = Column(Integer, nullable=False)
    end_ms = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=True)
    cleaned_text = Column(Text, nullable=True)
    clean_method = Column(Enum(CleanMethod), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связь с лекцией
    lecture = relationship("Lecture", backref="transcript_segments")

    def __repr__(self):
        return f"<TranscriptSegment(lecture={self.lecture_id}, start={self.start_ms}, end={self.end_ms})>"