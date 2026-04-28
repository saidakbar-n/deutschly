from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.user import UserOut


class CommentCreate(BaseModel):
    user_id: int
    text: str = Field(min_length=1, max_length=500)


class CommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    text: str
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        orm_mode = True
