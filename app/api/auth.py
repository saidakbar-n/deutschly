import hmac
import hashlib
import time
import os
from random import randint
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.hash import pbkdf2_sha256

from app.core.deps import get_db
from app.models import User
from app.schemas.user import UserOut, WebSignup, LoginRequest, TelegramLogin

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def verify_telegram_hash(data: TelegramLogin) -> bool:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        return False

    params = data.dict(exclude={"hash"})
    # Filter out None values and convert to string
    params_list = []
    for k, v in params.items():
        if v is not None:
            params_list.append(f"{k}={v}")
    
    data_check_string = "\n".join(sorted(params_list))

    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if calculated_hash != data.hash:
        return False

    if time.time() - data.auth_date > 86400:
        return False

    return True


def _next_telegram_like_id(db: Session) -> int:
    """Generate a unique numeric id to satisfy the existing telegram_id column."""
    # keep it in a safe web-only range to avoid collisions with real Telegram ids
    lower, upper = 9_000_000_000, 9_999_999_999
    candidate = randint(lower, upper)
    while db.scalar(select(User).where(User.telegram_id == candidate)):
        candidate = randint(lower, upper)
    return candidate


def _generate_recovery_codes() -> list[int]:
    return [randint(10000, 99999) for _ in range(5)]


@router.post("/web", response_model=UserOut)
def signup_or_login_web(payload: WebSignup, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.username == payload.username))
    if existing:
        for field, value in payload.dict(exclude_unset=True, exclude_none=True, exclude={"password"}).items():
            setattr(existing, field, value)
        if payload.password:
            existing.password_hash = pbkdf2_sha256.hash(payload.password)
        if not existing.recovery_codes:
            existing.recovery_codes = _generate_recovery_codes()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    user = User(
        telegram_id=_next_telegram_like_id(db),
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
    user = db.scalar(select(User).where(User.username == payload.username))
    if not user or not user.password_hash or not pbkdf2_sha256.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


@router.post("/telegram", response_model=UserOut)
def login_telegram(payload: TelegramLogin, db: Session = Depends(get_db)):
    if not verify_telegram_hash(payload):
        raise HTTPException(status_code=401, detail="Invalid Telegram hash")

    user = db.scalar(select(User).where(User.telegram_id == payload.id))
    if not user:
        # Create user if it doesn't exist
        user = User(
            telegram_id=payload.id,
            username=payload.username or f"user_{payload.id}",
            full_name=f"{payload.first_name or ''} {payload.last_name or ''}".strip() or None,
            profile_photo=payload.photo_url,
            level="A1",  # Default level
            recovery_codes=_generate_recovery_codes(),
            city=payload.city if hasattr(payload, 'city') else None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user profile if changed
        updated = False
        if payload.photo_url and user.profile_photo != payload.photo_url:
            user.profile_photo = payload.photo_url
            updated = True
        
        new_username = payload.username or f"user_{payload.id}"
        if user.username != new_username:
            user.username = new_username
            updated = True
            
        new_full_name = f"{payload.first_name or ''} {payload.last_name or ''}".strip() or None
        if user.full_name != new_full_name:
            user.full_name = new_full_name
            updated = True
            
        if hasattr(payload, 'city') and payload.city and user.city != payload.city:
            user.city = payload.city
            updated = True
        
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)

    return user
