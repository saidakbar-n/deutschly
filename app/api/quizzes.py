from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Quiz, User
from app.schemas.quiz import QuizCreate, QuizOut

router = APIRouter(prefix="/api/v1", tags=["quizzes"])


@router.post("/quizzes", response_model=QuizOut)
def create_quiz(payload: QuizCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    quiz = Quiz(**payload.dict())
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/quizzes/{user_id}", response_model=list[QuizOut])
def list_quizzes(user_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    quizzes = db.scalars(
        select(Quiz)
        .where(Quiz.user_id == user_id)
        .order_by(Quiz.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return quizzes


@router.get("/quizzes/{user_id}/latest", response_model=Optional[QuizOut])
def get_latest_quiz(user_id: int, db: Session = Depends(get_db)):
    quiz = db.scalar(
        select(Quiz)
        .where(Quiz.user_id == user_id)
        .order_by(Quiz.created_at.desc())
    )
    return quiz
