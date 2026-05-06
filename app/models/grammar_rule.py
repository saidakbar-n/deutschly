from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class GrammarRule(Base):
    __tablename__ = "grammar_rules"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("grammar_chapters.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    level = Column(String(10))
    category = Column(String(50))
    sort_order = Column(Integer, default=0)

    chapter = relationship("GrammarChapter", back_populates="rules")
