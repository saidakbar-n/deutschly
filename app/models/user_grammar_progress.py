from sqlalchemy import Column, Integer, ForeignKey, Boolean, Text
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone

class UserGrammarProgress(Base):
    __tablename__ = "user_grammar_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(Integer, ForeignKey("grammar_rules.id", ondelete="CASCADE"), nullable=False)
    correct_attempts = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    last_practiced_at = Column(Text, default=str(datetime.now(timezone.utc)))
    streak_eligible_today = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint('user_id', 'rule_id', name='uq_user_rule'),)

    user = relationship("User", backref="grammar_progress")
    rule = relationship("GrammarRule", backref="user_progress")
