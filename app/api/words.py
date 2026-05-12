from datetime import date
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db
from app.core.streak import update_streak
from app.models import Word, User, WordFolder, WordReview
from app.schemas.word import WordCreate, WordOut, WordUpdate, WordBatchCreate

router = APIRouter(prefix="/api/v1", tags=["words"])


@router.get("/words/feed")
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
            "is_singular": w.is_singular,
            "saved_from_id": w.saved_from_id,
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


@router.post("/words", response_model=WordOut)
def create_word(payload: WordCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    word = Word(**payload.dict())
    db.add(word)
    user.words_count = (user.words_count or 0) + 1
    db.add(user)
    update_streak(user, db)
    db.commit()
    db.refresh(word)
    return word


@router.post("/words/{word_id}/save", response_model=WordOut)
def save_word(word_id: int, user_id: int, db: Session = Depends(get_db)):
    original = db.get(Word, word_id)
    if not original:
        raise HTTPException(status_code=404, detail="Word not found")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if original.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot save your own word")
    existing = db.scalar(
        select(Word).where(Word.user_id == user_id, Word.saved_from_id == word_id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already saved")
    saved = Word(
        user_id=user_id,
        term=original.term,
        meaning=original.meaning,
        note=original.note,
        is_singular=original.is_singular,
        saved_from_id=word_id,
    )
    db.add(saved)
    user.words_count = (user.words_count or 0) + 1
    db.add(user)
    db.commit()
    db.refresh(saved)
    return saved


@router.delete("/words/{word_id}")
def delete_word(word_id: int, user_id: int, db: Session = Depends(get_db)):
    word = db.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    if word.user_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot delete others' words")
    db.delete(word)
    user = db.get(User, user_id)
    if user:
        user.words_count = max(0, (user.words_count or 0) - 1)
        db.add(user)
    db.commit()
    return {"detail": "deleted"}


@router.get("/words/word-of-the-day")
def word_of_the_day(db: Session = Depends(get_db)):
    count = db.scalar(select(func.count(Word.id)))
    if not count:
        return None
    seed = int(hashlib.md5(str(date.today()).encode()).hexdigest(), 16)
    offset = seed % count
    word = db.scalars(
        select(Word).options(joinedload(Word.user)).offset(offset).limit(1)
    ).first()
    if not word:
        return None
    return {
        "id": word.id,
        "term": word.term,
        "meaning": word.meaning,
        "note": word.note,
        "user_id": word.user_id,
        "user": {"id": word.user.id, "username": word.user.username} if word.user else None,
    }


@router.get("/words/{user_id}", response_model=list[WordOut])
def list_words(user_id: int, limit: int = 50, offset: int = 0, folder_id: int | None = None, db: Session = Depends(get_db)):
    """List words for a user, optionally filtered by folder."""
    stmt = select(Word).where(Word.user_id == user_id)
    if folder_id is not None:
        stmt = stmt.where(Word.folder_id == folder_id)
    words = db.scalars(
        stmt.order_by(Word.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return words


@router.put("/words/{word_id}", response_model=WordOut)
def update_word(word_id: int, payload: WordUpdate, user_id: int, db: Session = Depends(get_db)):
    """Update a word (e.g., move to different folder)."""
    word = db.get(Word, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    if word.user_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot update others' words")
    
    # If changing folder, validate it belongs to user
    if payload.folder_id is not None:
        folder = db.get(WordFolder, payload.folder_id)
        if folder and folder.user_id != user_id:
            raise HTTPException(status_code=403, detail="Cannot use another user's folder")
    
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(word, field, value)
    
    db.add(word)
    db.commit()
    db.refresh(word)
    return word


@router.get("/words/{user_id}/by-folder")
def list_words_by_folder(user_id: int, db: Session = Depends(get_db)):
    """List all words for a user grouped by folder."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all folders for this user
    folders = db.scalars(
        select(WordFolder)
        .where(WordFolder.user_id == user_id)
        .order_by(WordFolder.sort_order, WordFolder.created_at)
    ).all()
    
    # Get words without folder (uncategorized)
    uncategorized = db.scalars(
        select(Word)
        .where(Word.user_id == user_id, Word.folder_id == None)
        .order_by(Word.created_at.desc())
    ).all()
    
    # Get words by folder
    words_by_folder = {}
    for folder in folders:
        folder_words = db.scalars(
            select(Word)
            .where(Word.user_id == user_id, Word.folder_id == folder.id)
            .order_by(Word.created_at.desc())
        ).all()
        words_by_folder[folder.id] = {
            "folder": {
                "id": folder.id,
                "name": folder.name,
                "color": folder.color,
                "icon": folder.icon,
                "sort_order": folder.sort_order,
            },
            "words": folder_words
        }
    
    return {
        "uncategorized": uncategorized,
        "folders": words_by_folder
    }


@router.post("/words/batch")
def create_words_batch(payload: WordBatchCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.folder_id is not None:
        folder = db.get(WordFolder, payload.folder_id)
        if not folder or folder.user_id != payload.user_id:
            raise HTTPException(status_code=403, detail="Invalid folder")

    created = []
    for item in payload.words:
        word = Word(
            user_id=payload.user_id,
            folder_id=payload.folder_id,
            term=item.term,
            meaning=item.meaning,
            note=item.note,
            is_singular=item.is_singular,
        )
        db.add(word)
        created.append(word)
        user.words_count = (user.words_count or 0) + 1

    update_streak(user, db)
    db.commit()
    for w in created:
        db.refresh(w)

    return {"created": len(created), "words": created}
