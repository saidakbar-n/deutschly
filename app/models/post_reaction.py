from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

VALID_REACTIONS = ["⚡️", "❤️", "💘", "🐝", "★", "🧸", "💎", "🍻", "👑"]
STAR_COST_PER_REACTION = 1


class PostReaction(Base):
    __tablename__ = "post_reactions"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", "emoji", name="uq_post_user_emoji"),
    )
