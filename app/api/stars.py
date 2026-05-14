from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.core.deps import get_db
from app.models import User
from app.models.user_stars import UserStars, StarTransaction
from app.models.post_reaction import PostReaction, VALID_REACTIONS, STAR_COST_PER_REACTION
from app.models.post import Post

router = APIRouter(prefix="/api/v1/stars", tags=["stars"])

STAR_PACKAGES = [
    {"id": "pack_50",  "stars": 50,  "price_usd": 0.99,  "label": "50 Stars"},
    {"id": "pack_100", "stars": 100, "price_usd": 1.99,  "label": "100 Stars"},
    {"id": "pack_250", "stars": 250, "price_usd": 3.99,  "label": "250 Stars"},
    {"id": "pack_500", "stars": 500, "price_usd": 6.99,  "label": "500 Stars"},
]

PREMIUM_STATUSES = ["⚡️", "❤️", "💘", "🐝", "★", "🧸", "💎", "🍻", "👑"]
PREMIUM_COST_STARS = 100
PREMIUM_DAYS = 30


def _get_or_create_wallet(user_id: int, db: Session) -> UserStars:
    wallet = db.scalar(select(UserStars).where(UserStars.user_id == user_id))
    if not wallet:
        wallet = UserStars(user_id=user_id, balance=0)
        db.add(wallet)
        db.flush()
    return wallet


@router.get("/wallet/{user_id}")
def get_wallet(user_id: int, db: Session = Depends(get_db)):
    wallet = _get_or_create_wallet(user_id, db)
    db.commit()
    user = db.get(User, user_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return {
        "balance": wallet.balance,
        "total_earned": wallet.total_earned,
        "total_spent": wallet.total_spent,
        "premium_status": user.premium_status if user else None,
        "premium_expires_at": user.premium_expires_at.isoformat() if user and user.premium_expires_at else None,
        "is_premium": bool(
            user and user.premium_status and
            user.premium_expires_at and
            user.premium_expires_at > now
        ),
    }


@router.get("/packages")
def get_packages():
    return STAR_PACKAGES


class PurchasePayload(BaseModel):
    user_id: int
    package_id: str


@router.post("/purchase")
def purchase_stars(payload: PurchasePayload, db: Session = Depends(get_db)):
    package = next((p for p in STAR_PACKAGES if p["id"] == payload.package_id), None)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    wallet = _get_or_create_wallet(payload.user_id, db)
    wallet.balance += package["stars"]
    wallet.total_earned += package["stars"]
    wallet.updated_at = datetime.now(timezone.utc)

    db.add(StarTransaction(
        user_id=payload.user_id,
        amount=package["stars"],
        transaction_type="purchase",
        note=f"Purchased {package['label']}",
    ))
    db.commit()
    return {"balance": wallet.balance, "earned": package["stars"]}


class ReactionPayload(BaseModel):
    user_id: int
    emoji: str


@router.post("/react/{post_id}")
def react_to_post(post_id: int, payload: ReactionPayload, db: Session = Depends(get_db)):
    if payload.emoji not in VALID_REACTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid emoji. Valid: {VALID_REACTIONS}")

    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id == payload.user_id:
        raise HTTPException(status_code=400, detail="Cannot react to your own post")

    existing = db.scalar(
        select(PostReaction).where(
            PostReaction.post_id == post_id,
            PostReaction.user_id == payload.user_id,
            PostReaction.emoji == payload.emoji,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already reacted with this emoji")

    wallet = _get_or_create_wallet(payload.user_id, db)
    if wallet.balance < STAR_COST_PER_REACTION:
        raise HTTPException(status_code=402, detail="Insufficient stars")

    wallet.balance -= STAR_COST_PER_REACTION
    wallet.total_spent += STAR_COST_PER_REACTION
    wallet.updated_at = datetime.now(timezone.utc)

    author_wallet = _get_or_create_wallet(post.user_id, db)
    author_wallet.balance += STAR_COST_PER_REACTION
    author_wallet.total_earned += STAR_COST_PER_REACTION
    author_wallet.updated_at = datetime.now(timezone.utc)

    reaction = PostReaction(
        post_id=post_id,
        user_id=payload.user_id,
        emoji=payload.emoji,
    )
    db.add(reaction)

    db.add(StarTransaction(
        user_id=payload.user_id, amount=-STAR_COST_PER_REACTION,
        transaction_type="reaction_sent", reference_id=post_id,
        note=f"Sent {payload.emoji} reaction",
    ))
    db.add(StarTransaction(
        user_id=post.user_id, amount=STAR_COST_PER_REACTION,
        transaction_type="reaction_received", reference_id=post_id,
        note=f"Received {payload.emoji} reaction",
    ))
    db.commit()

    reactions = db.scalars(
        select(PostReaction).where(PostReaction.post_id == post_id)
    ).all()
    return {
        "success": True,
        "balance": wallet.balance,
        "reactions": _group_reactions(reactions),
    }


@router.get("/reactions/{post_id}")
def get_reactions(post_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    reactions = db.scalars(
        select(PostReaction).where(PostReaction.post_id == post_id)
    ).all()
    my_reactions = set()
    if user_id:
        my_reactions = {r.emoji for r in reactions if r.user_id == user_id}
    return {
        "reactions": _group_reactions(reactions),
        "my_reactions": list(my_reactions),
    }


def _group_reactions(reactions) -> dict:
    counts: dict[str, int] = {}
    for r in reactions:
        counts[r.emoji] = counts.get(r.emoji, 0) + 1
    return counts


class PremiumPayload(BaseModel):
    user_id: int
    status_emoji: str


@router.post("/premium/activate")
def activate_premium(payload: PremiumPayload, db: Session = Depends(get_db)):
    if payload.status_emoji not in PREMIUM_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {PREMIUM_STATUSES}")

    wallet = _get_or_create_wallet(payload.user_id, db)
    if wallet.balance < PREMIUM_COST_STARS:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient stars. Need {PREMIUM_COST_STARS}, have {wallet.balance}"
        )

    wallet.balance -= PREMIUM_COST_STARS
    wallet.total_spent += PREMIUM_COST_STARS
    wallet.updated_at = datetime.now(timezone.utc)

    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404)

    now = datetime.now(timezone.utc)
    now_naive = now.replace(tzinfo=None)
    current_expiry = user.premium_expires_at
    if current_expiry and current_expiry > now_naive:
        user.premium_expires_at = current_expiry + timedelta(days=PREMIUM_DAYS)
    else:
        user.premium_expires_at = (now + timedelta(days=PREMIUM_DAYS)).replace(tzinfo=None)

    user.premium_status = payload.status_emoji
    db.add(user)

    db.add(StarTransaction(
        user_id=payload.user_id,
        amount=-PREMIUM_COST_STARS,
        transaction_type="premium_purchase",
        note=f"Premium status {payload.status_emoji} — 30 days",
    ))
    db.commit()

    return {
        "premium_status": user.premium_status,
        "premium_expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        "balance": wallet.balance,
    }


@router.post("/premium/change-status")
def change_premium_status(payload: PremiumPayload, db: Session = Depends(get_db)):
    if payload.status_emoji not in PREMIUM_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status emoji")

    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if not user.premium_expires_at or user.premium_expires_at <= now:
        raise HTTPException(status_code=403, detail="No active premium subscription")

    user.premium_status = payload.status_emoji
    db.add(user)
    db.commit()
    return {"premium_status": user.premium_status}
