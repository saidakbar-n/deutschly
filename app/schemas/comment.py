from datetime import datetime
from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    user_id: int
    text: str = Field(min_length=1, max_length=500)


class CommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    text: str
    created_at: datetime

    class Config:
        orm_mode = True
