from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class UserGrammarAttempt(Base):
    __tablename__ = "user_grammar_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("grammar_exercises.id", ondelete="CASCADE"), nullable=False)
    user_input = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    feedback_explanation = Column(Text)
    attempt_timestamp = Column(Text, default=str(datetime.datetime.now(datetime.UTC)))
    rule_missed_id = Column(Integer, ForeignKey("grammar_rules.id", ondelete="SET NULL"))

    user = relationship("User", backref="grammar_attempts")
    exercise = relationship("GrammarExercise", backref="attempts")
    rule_missed = relationship("GrammarRule", backref="missed_attempts")
