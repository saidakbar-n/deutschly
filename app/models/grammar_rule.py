from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base

class GrammarRule(Base):
    __tablename__ = "grammar_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    level = Column(String(10))
    category = Column(String(50))
