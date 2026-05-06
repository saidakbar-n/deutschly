from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class GrammarBook(Base):
    __tablename__ = "grammar_books"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(10), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    sort_order = Column(Integer, default=0)

    chapters = relationship("GrammarChapter", back_populates="book", order_by="GrammarChapter.sort_order")
