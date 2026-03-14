from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExperimentAssignment(Base):
    __tablename__ = "experiment_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    experiment_key = Column(String(50), nullable=False)
    variant = Column(String(50), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

    __table_args__ = (UniqueConstraint("user_id", "experiment_key", name="uq_user_experiment"),)


class FeedEvent(Base):
    __tablename__ = "feed_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    event = Column(String(30), nullable=False)  # impression, like, comment, open
    variant = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    post = relationship("Post")
