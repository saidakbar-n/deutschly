from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserStars(Base):
    __tablename__ = "user_stars"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    balance = Column(Integer, default=0, nullable=False)
    total_earned = Column(Integer, default=0)
    total_spent = Column(Integer, default=0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user = relationship("User", backref="stars_wallet")


class StarTransaction(Base):
    __tablename__ = "star_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String(50))
    reference_id = Column(Integer, nullable=True)
    note = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
