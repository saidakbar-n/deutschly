from datetime import datetime
from sqlalchemy import BigInteger, CheckConstraint, Column, DateTime, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=True)
    level = Column(String(10), nullable=False)
    city = Column(String(50))
    interests = Column(JSON)
    profile_photo = Column(Text)
    full_name = Column(String(120))
    about = Column(Text)
    age = Column(Integer)
    words = relationship("Word", back_populates="user", cascade="all, delete-orphan")
    words_count = Column(Integer, default=0)
    notify_likes = Column(Integer, default=1)
    notify_follows = Column(Integer, default=1)
    notify_comments = Column(Integer, default=1)
    recovery_codes = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    word_folders = relationship("WordFolder", back_populates="user", cascade="all, delete-orphan")
    followers = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following",
        cascade="all, delete-orphan",
    )
    following = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("level in ('A1','A2','B1','B2','C1')", name="ck_user_level"),
    )
