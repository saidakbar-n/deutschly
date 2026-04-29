import os
from random import randint
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.hash import pbkdf2_sha256

from app.core.deps import get_db
from app.models import User
from app.schemas.user import UserOut, WebSignup, LoginRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _generate_recovery_codes() -> list[int]:
    return [randint(10000, 99999) for _ in range(5)]


@router.get("/check")
def check_user(username: str, db: Session = Depends(get_db)):
    """Check if a username exists."""
    user = db.scalar(select(User).where(User.username == username))
    return {"exists": user is not None}


@router.post("/signup", response_model=UserOut)
def signup(payload: WebSignup, db: Session = Depends(get_db)):
    """User signup with web-based authentication."""
    existing = db.scalar(select(User).where(User.username == payload.username))
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user = User(
        username=payload.username,
        level=payload.level,
        city=payload.city,
        interests=payload.interests,
        profile_photo=payload.profile_photo,
        password_hash=pbkdf2_sha256.hash(payload.password),
        recovery_codes=payload.recovery_codes or _generate_recovery_codes(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """User login with web-based authentication."""
    user = db.scalar(select(User).where(User.username == payload.username))
    if not user or not user.password_hash or not pbkdf2_sha256.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user
