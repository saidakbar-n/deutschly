from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class GrammarChapter(Base):
    __tablename__ = "grammar_chapters"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("grammar_books.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    topic = Column(String(200))
    sort_order = Column(Integer, default=0)

    book = relationship("GrammarBook", back_populates="chapters")
    rules = relationship("GrammarRule", back_populates="chapter", order_by="GrammarRule.sort_order")
