from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class WordReview(Base):
    __tablename__ = "word_reviews"

    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_reviewed = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    word = relationship("Word", backref="reviews")
    user = relationship("User", backref="word_reviews")
