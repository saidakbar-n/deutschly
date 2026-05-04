from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Integer, nullable=False)  # 0-100
    word_ids = Column(JSON, nullable=True)  # List of word IDs used in the quiz
    duration_seconds = Column(Integer, nullable=True)  # Optional: quiz duration
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="quizzes")
