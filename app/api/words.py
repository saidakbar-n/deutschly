from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db
from app.models import Word, User
from app.schemas.word import WordCreate, WordOut, WordFeedOut

router = APIRouter(prefix="/api/v1/words", tags=["words"])

@router.get("/feed")
def list_words_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    words = db.scalars(
        select(Word)
        .options(joinedload(Word.user))
        .order_by(Word.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return [
        {
            "id": w.id,
            "term": w.term,
            "meaning": w.meaning,
            "note": w.note,
            "created_at": w.created_at,
            "user_id": w.user_id,
            "user": {
                "id": w.user.id,
                "username": w.user.username,
                "city": w.user.city,
                "level": w.user.level,
                "profile_photo": w.user.profile_photo,
            } if w.user else None,
        }
        for w in words
    ]

@router.post("/", response_model=WordOut)
def create_word(payload: WordCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    word = Word(**payload.dict())
    db.add(word)
    # bump progress counter
    user.words_count = (user.words_count or 0) + 1
    db.add(user)
    db.commit()
    db.refresh(word)
    return word

@router.get("/{user_id}", response_model=list[WordOut])
def list_words(user_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    words = db.scalars(select(Word).where(Word.user_id == user_id).order_by(Word.created_at.desc()).offset(offset).limit(limit)).all()
    return words
