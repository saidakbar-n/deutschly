from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base

class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    folder_id = Column(Integer, ForeignKey("word_folders.id", ondelete="SET NULL"), nullable=True, default=None)
    term = Column(String(100), nullable=False)
    meaning = Column(Text, nullable=False)
    note = Column(Text)
    saved_from_id = Column(Integer, nullable=True)
    is_singular = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="words")
    folder = relationship("WordFolder", back_populates="words")
