from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PostBase(BaseModel):
    user_id: int
    type: str = Field(regex=r"^(story|achievement|tip|question)$")
    text: Optional[str] = None
    image_url: Optional[str] = None
    level_tag: Optional[str] = None
    word_id: Optional[int] = None
    expires_in_hours: Optional[int] = Field(default=None, ge=1, le=72)


class PostCreate(PostBase):
    pass


class PostOut(BaseModel):
    id: int
    user_id: int
    type: str
    text: Optional[str]
    image_url: Optional[str]
    level_tag: Optional[str]
    likes: int
    timestamp: datetime
    expires_at: Optional[datetime]
    comments_count: int = 0
    liked_by_me: bool = False
    word_id: Optional[int] = None
    word: Optional[dict] = None

    class Config:
        orm_mode = True
