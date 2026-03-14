from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import User
from app.schemas.user import UserCreate, UserOut, UserUpdate, UserList

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/profile", response_model=UserOut)
def upsert_profile(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.telegram_id == payload.telegram_id))
    if existing:
        for field, value in payload.dict().items():
            setattr(existing, field, value)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    user = User(**payload.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/search", response_model=UserList)
def search_users(
    q: str | None = Query(None, description="Search by city or username"),
    level: str | None = Query(None, regex=r"^(A1|A2|B1|B2|C1)$"),
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(User)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where((User.city.ilike(like)) | (User.username.ilike(like)))
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
