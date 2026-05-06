from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String(20), nullable=False)
    text = Column(Text)
    image_url = Column(Text)
    level_tag = Column(String(10))
    word_id = Column(Integer, ForeignKey("words.id"), nullable=True)
    likes = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="posts")
    likes_rel = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    word = relationship("Word", backref="posts")

    def ensure_expiry(self):
        if self.type == "story" and not self.expires_at:
            self.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
