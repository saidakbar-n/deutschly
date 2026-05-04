from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserOut

class WordBase(BaseModel):
    term: str = Field(min_length=1, max_length=100)
    meaning: str = Field(min_length=1)
    note: Optional[str] = None
    is_singular: Optional[bool] = True
    folder_id: Optional[int] = None

class WordCreate(WordBase):
    user_id: int

class WordUpdate(BaseModel):
    term: Optional[str] = Field(None, min_length=1, max_length=100)
    meaning: Optional[str] = Field(None, min_length=1)
    note: Optional[str] = None
    is_singular: Optional[bool] = None
    folder_id: Optional[int] = None

class WordOut(WordBase):
    id: int
    user_id: int
    folder_id: Optional[int] = None
    saved_from_id: Optional[int] = None
    is_singular: Optional[bool] = True
    created_at: datetime

    class Config:
        orm_mode = True


class WordFeedOut(WordOut):
    user: Optional[UserOut] = None
