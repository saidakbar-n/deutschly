from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class WordReviewOut(BaseModel):
    id: int
    word_id: int
    user_id: int
    ease_factor: float
    interval: int
    repetitions: int
    next_review: datetime
    last_reviewed: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True


class ReviewSubmit(BaseModel):
    user_id: int
    rating: int = Field(..., ge=0, le=3, description="0=Again, 1=Hard, 2=Good, 3=Easy")


class DueCardOut(BaseModel):
    id: int
    word_id: int
    term: str
    meaning: str
    note: Optional[str] = None
    is_singular: Optional[bool] = True
    folder_id: Optional[int] = None
    review: WordReviewOut

    class Config:
        orm_mode = True
