from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import User, Word, Post, Follow
from app.schemas.user import UserCreate, UserOut, UserUpdate, UserList
from app.core.chapter_unlock import ensure_user_level_progress
from app.models.grammar_book import GrammarBook
from passlib.hash import pbkdf2_sha256

router = APIRouter(prefix="/api/v1/users", tags=["users"])


# Helper to attach computed counts to user
def _attach_counts(user: User, db: Session) -> User:
    user_id = user.id
    actual_words = db.scalar(select(func.count()).select_from(Word).where(Word.user_id == user_id)) or 0
    actual_posts = db.scalar(select(func.count()).select_from(Post).where(Post.user_id == user_id)) or 0
    followers = db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == user_id)) or 0
    following = db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)) or 0

    user.words_count = actual_words
    db.add(user)
    db.commit()
    db.refresh(user)

    # Attach computed fields (not stored in DB)
    user.__dict__['posts_count'] = actual_posts
    user.__dict__['followers_count'] = followers
    user.__dict__['following_count'] = following
    return user


@router.post("/profile", response_model=UserOut)
def upsert_profile(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.username == payload.username))
    if existing:
        for field, value in payload.dict().items():
            if field == "password":
                existing.password_hash = pbkdf2_sha256.hash(value)
            else:
                setattr(existing, field, value)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return _attach_counts(existing, db)

    data = payload.dict()
    password = data.pop("password", None)
    if password:
        data["password_hash"] = pbkdf2_sha256.hash(password)
    user = User(**data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _attach_counts(user, db)


@router.get("/search", response_model=UserList)
def search_users(
    q: str | None = Query(None, description="Search by city or username"),
    level: str | None = Query(None, description="Level filter (A1-C1)"),
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    if level == "":
        level = None
    if level:
        level = level.upper()
        if level not in {"A1", "A2", "B1", "B2", "C1"}:
            raise HTTPException(status_code=400, detail="Invalid level")
    stmt = select(User)
    if q:
        prefix = f"{q.lower()}%"
        like = f"%{q.lower()}%"
        stmt = stmt.where((User.city.ilike(like)) | (User.username.ilike(prefix)))
    if level:
        stmt = stmt.where(User.level == level)

    count_stmt = select(func.count()).select_from(User)
    if q:
        like = f"%{q.lower()}%"
        count_stmt = count_stmt.where((User.city.ilike(like)) | (User.username.ilike(like)))
    if level:
        count_stmt = count_stmt.where(User.level == level)
    total = db.scalar(count_stmt) or 0
    users = db.scalars(stmt.offset(offset).limit(limit)).all()
    return UserList(results=users, total=total)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _attach_counts(user, db)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.dict(exclude_unset=True).items():
        if field == "password":
            user.password_hash = pbkdf2_sha256.hash(value)
        else:
            setattr(user, field, value)

    if payload.level:
        book = db.query(GrammarBook).filter_by(level=payload.level).first()
        if book:
            ensure_user_level_progress(user.id, book.id, db)

    return _attach_counts(user, db)
