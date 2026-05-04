from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class QuizBase(BaseModel):
    user_id: int
    total_questions: int
    correct_answers: int
    score_percentage: int
    word_ids: Optional[List[int]] = None
    duration_seconds: Optional[int] = None


class QuizCreate(QuizBase):
    pass


class QuizOut(QuizBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class QuizHistoryOut(QuizOut):
    pass
