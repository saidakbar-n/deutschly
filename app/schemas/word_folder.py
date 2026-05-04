from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class WordFolderBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = None
    sort_order: Optional[int] = 0


class WordFolderCreate(WordFolderBase):
    user_id: int


class WordFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class WordFolderOut(WordFolderBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class WordFolderWithWordsCount(WordFolderOut):
    words_count: int = 0
