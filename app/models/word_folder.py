from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class WordFolder(Base):
    __tablename__ = "word_folders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    color = Column(String(20), default="#6366f1")  # Default indigo color
    icon = Column(String(50))  # Optional icon identifier
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="word_folders")
    words = relationship("Word", back_populates="folder", foreign_keys="Word.folder_id")
