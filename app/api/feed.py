from datetime import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Post, Follow, User, ExperimentAssignment, FeedEvent
from app.schemas.feed import FeedItem, FeedResponse
from app.api.posts import _decorate_post

router = APIRouter(prefix="/api/v1", tags=["feed"])


def _score_post(post: Post, user: User, followed_ids: set[int], variant: str) -> float:
    score = 0.0
    if post.user_id in followed_ids:
        score += 3
    # level match
    if post.level_tag and user.level and post.level_tag == user.level:
        score += 1.5
    # interests match
    if user.interests and isinstance(user.interests, dict):
        topics = set(map(str.lower, user.interests.get("topics", [])))
        text = (post.text or "").lower()
        if any(t in text for t in topics):
            score += 2
    # recency (newer is better)
    age_hours = (datetime.utcnow() - post.timestamp).total_seconds() / 3600
    score += max(0, 3 - (age_hours / 6))  # decay over time

    if variant == "recency":
        return -post.timestamp.timestamp()
    return score


def _get_or_assign_variant(db: Session, user_id: int) -> str:
    assignment = db.scalar(
        select(ExperimentAssignment).where(
            ExperimentAssignment.user_id == user_id,
            ExperimentAssignment.experiment_key == "feed_variant",
        )
    )
    if assignment:
        return assignment.variant
    variant = random.choice(["control", "recency"])
    assignment = ExperimentAssignment(user_id=user_id, experiment_key="feed_variant", variant=variant)
    db.add(assignment)
    db.commit()
    return variant


@router.get("/feed/{user_id}", response_model=FeedResponse)
def get_feed(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    variant: str | None = Query(None, regex="^(control|recency)$"),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    variant = variant or _get_or_assign_variant(db, user_id)

    followed_ids = set(
        db.scalars(select(Follow.following_id).where(Follow.follower_id == user_id)).all()
    )

    # base query with story TTL filter
    stmt = select(Post).where(
        (Post.type != "story")
        | (Post.expires_at.is_(None))
        | (Post.expires_at > datetime.utcnow())
    )

    candidates = db.scalars(stmt).all()
    scored = []
    for post in candidates:
        score = _score_post(post, user, followed_ids, variant)
        scored.append((score, post))

    # sort descending by score, then recency
    scored.sort(key=lambda x: (x[0], x[1].timestamp), reverse=True)
    selected = [p for _, p in scored[offset : offset + limit]]

    items = [
        FeedItem(
            post=_decorate_post(db, post, viewer_id=user_id),
            author=db.get(User, post.user_id),
        )
        for post in selected
    ]

    # log impressions
    for post in selected:
        db.add(FeedEvent(user_id=user_id, post_id=post.id, event="impression", variant=variant))
    db.commit()

    return FeedResponse(items=items, total=len(candidates), variant=variant)


@router.get("/feed/{user_id}/discover", response_model=FeedResponse)
def get_discover_feed(user_id: int, limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    followed_ids = set(db.scalars(select(Follow.following_id).where(Follow.follower_id == user_id)).all())
    followed_ids.add(user_id)  # exclude own posts too
    
    stmt = select(Post).where(
        Post.user_id.not_in(followed_ids),
        (Post.type != "story") | (Post.expires_at.is_(None)) | (Post.expires_at > datetime.utcnow())
    )
    if user.level:
        stmt = stmt.where(Post.level_tag == user.level)
    
    posts = db.scalars(stmt.order_by(Post.timestamp.desc()).offset(offset).limit(limit)).all()
    items = [FeedItem(post=_decorate_post(db, p, viewer_id=user_id), author=db.get(User, p.user_id)) for p in posts]
    return FeedResponse(items=items, total=len(posts), variant="discover")
