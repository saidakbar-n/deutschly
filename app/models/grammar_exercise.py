from sqlalchemy import Column, Integer, Text, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class GrammarExercise(Base):
    __tablename__ = "grammar_exercises"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("grammar_rules.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    prompt_text = Column(Text, nullable=False)
    expected_answer = Column(Text, nullable=False)
    native_sentence = Column(Text)
    infinitive_verb = Column(String(50))
    difficulty = Column(Integer)
    llm_prompt_used = Column(Text)
    created_at = Column(Text, default=str(datetime.datetime.now(datetime.UTC)))

    rule = relationship("GrammarRule", backref="exercises")
