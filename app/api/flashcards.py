from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db
from app.models import Word, WordReview
from app.schemas.word_review import ReviewSubmit, DueCardOut

router = APIRouter(prefix="/api/v1", tags=["flashcards"])


def calculate_next_review(rating: int, ease_factor: float, interval: int, repetitions: int):
    if rating == 0:
        return ease_factor, 0, 0, datetime.now(timezone.utc) + timedelta(minutes=1)
    elif rating == 1:
        new_ease = max(1.3, ease_factor - 0.15)
        new_interval = max(1, int(interval * 1.2))
        return new_ease, new_interval, repetitions, datetime.now(timezone.utc) + timedelta(days=new_interval)
    elif rating == 2:
        new_ease = ease_factor
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 3
        else:
            new_interval = int(interval * ease_factor)
        return new_ease, new_interval, repetitions + 1, datetime.now(timezone.utc) + timedelta(days=new_interval)
    else:
        new_ease = ease_factor + 0.15
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 7
        else:
            new_interval = int(interval * new_ease)
        return new_ease, new_interval, repetitions + 1, datetime.now(timezone.utc) + timedelta(days=new_interval)


@router.get("/flashcards/due/{user_id}")
def get_due_cards(user_id: int, folder_id: int | None = None, limit: int = 20, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    query = (
        select(WordReview)
        .options(joinedload(WordReview.word))
        .where(
            WordReview.user_id == user_id,
            WordReview.next_review <= now,
        )
    )
    if folder_id is not None:
        query = query.where(WordReview.word.has(folder_id=folder_id))
    
    reviews = db.scalars(query.order_by(WordReview.next_review).limit(limit)).all()
    
    result = []
    for r in reviews:
        w = r.word
        result.append({
            "id": r.id,
            "word_id": w.id,
            "term": w.term,
            "meaning": w.meaning,
            "note": w.note,
            "is_singular": w.is_singular,
            "folder_id": w.folder_id,
            "review": {
                "id": r.id,
                "word_id": r.word_id,
                "user_id": r.user_id,
                "ease_factor": r.ease_factor,
                "interval": r.interval,
                "repetitions": r.repetitions,
                "next_review": r.next_review,
                "last_reviewed": r.last_reviewed,
                "created_at": r.created_at,
            }
        })
    
    return result


@router.get("/flashcards/stats/{user_id}")
def get_flashcard_stats(user_id: int, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    total = db.scalar(select(func.count()).select_from(WordReview).where(WordReview.user_id == user_id))
    due = db.scalar(
        select(func.count()).select_from(WordReview).where(
            WordReview.user_id == user_id,
            WordReview.next_review <= now,
        )
    )
    reviewed = db.scalar(
        select(func.count()).select_from(WordReview).where(
            WordReview.user_id == user_id,
            WordReview.last_reviewed.isnot(None),
        )
    )
    return {"total": total or 0, "due": due or 0, "reviewed": reviewed or 0}


@router.post("/flashcards/review/{review_id}")
def submit_review(review_id: int, payload: ReviewSubmit, db: Session = Depends(get_db)):
    review = db.get(WordReview, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Review does not belong to user")

    new_ease, new_interval, new_reps, new_next = calculate_next_review(
        payload.rating, review.ease_factor, review.interval, review.repetitions
    )

    review.ease_factor = round(new_ease, 2)
    review.interval = new_interval
    review.repetitions = new_reps
    review.next_review = new_next
    review.last_reviewed = datetime.now(timezone.utc)

    db.add(review)
    db.commit()
    db.refresh(review)

    return {"status": "ok", "next_review": review.next_review}


@router.post("/flashcards/setup/{user_id}/{word_id}")
def setup_review(user_id: int, word_id: int, db: Session = Depends(get_db)):
    existing = db.scalar(
        select(WordReview).where(
            WordReview.user_id == user_id,
            WordReview.word_id == word_id,
        )
    )
    if existing:
        return {"status": "exists", "review_id": existing.id}

    review = WordReview(
        word_id=word_id,
        user_id=user_id,
        next_review=datetime.now(timezone.utc),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"status": "created", "review_id": review.id}


@router.post("/flashcards/setup-folder/{user_id}/{folder_id}")
def setup_folder_reviews(user_id: int, folder_id: int, db: Session = Depends(get_db)):
    words = db.scalars(
        select(Word).where(
            Word.user_id == user_id,
            Word.folder_id == folder_id,
        )
    ).all()

    created = 0
    for w in words:
        existing = db.scalar(
            select(WordReview).where(
                WordReview.user_id == user_id,
                WordReview.word_id == w.id,
            )
        )
        if not existing:
            review = WordReview(word_id=w.id, user_id=user_id, next_review=datetime.now(timezone.utc))
            db.add(review)
            created += 1

    db.commit()
    return {"status": "ok", "created": created, "total": len(words)}
