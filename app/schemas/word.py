from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserOut

class WordBase(BaseModel):
    term: str = Field(min_length=1, max_length=100)
    meaning: str = Field(min_length=1)
    note: Optional[str] = None

class WordCreate(WordBase):
    user_id: int

class WordOut(WordBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class WordFeedOut(WordOut):
    user: Optional[UserOut] = None
