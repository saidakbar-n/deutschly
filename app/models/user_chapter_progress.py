from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserChapterProgress(Base):
    __tablename__ = "user_chapter_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("grammar_chapters.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="locked")
    exercises_done = Column(Integer, default=0)
    exercises_total = Column(Integer, default=0)
    score_pct = Column(Float, default=0.0)
    unlocked_at = Column(String(30), nullable=True)
    completed_at = Column(String(30), nullable=True)

    __table_args__ = (UniqueConstraint("user_id", "chapter_id", name="uq_user_chapter"),)

    user = relationship("User", backref="chapter_progress")
    chapter = relationship("GrammarChapter", backref="user_progress")
