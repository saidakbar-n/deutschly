from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Post, User, Like, Comment
from app.schemas.post import PostCreate, PostOut
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(prefix="/api/v1", tags=["posts"])


def _decorate_post(db: Session, post: Post, viewer_id: int | None = None) -> PostOut:
    liked = False
    if viewer_id:
        liked = db.scalar(
            select(Like).where(Like.post_id == post.id, Like.user_id == viewer_id)
        ) is not None
    comments_count = db.scalar(select(func.count()).where(Comment.post_id == post.id)) or 0
    return PostOut.from_orm(post).copy(update={"comments_count": comments_count, "liked_by_me": liked})


@router.post("/posts", response_model=PostOut)
def create_post(payload: PostCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    post = Post(**payload.dict(exclude={"expires_in_hours"}))
    # auto-expire stories
    if post.type == "story":
        hours = payload.expires_in_hours or 24
        post.expires_at = datetime.utcnow() + timedelta(hours=hours)
    post.ensure_expiry()
    db.add(post)
    db.commit()
    db.refresh(post)
    return _decorate_post(db, post, viewer_id=user.id)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: int, viewer_id: int | None = None, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # Hide expired stories
    if post.type == "story" and post.expires_at and post.expires_at < datetime.utcnow():
        raise HTTPException(status_code=404, detail="Post expired")
    return _decorate_post(db, post, viewer_id=viewer_id or 0)


@router.post("/posts/{post_id}/like")
def like_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.scalar(select(Like).where(Like.post_id == post_id, Like.user_id == user_id))
    if existing:
        db.delete(existing)
        post.likes = max(0, (post.likes or 0) - 1)
        db.commit()
        return {"detail": "unliked"}

    like = Like(post_id=post_id, user_id=user_id)
    db.add(like)
    post.likes = (post.likes or 0) + 1
    db.commit()
    return {"detail": "liked"}


@router.post("/posts/{post_id}/comment", response_model=CommentOut)
def comment_post(post_id: int, payload: CommentCreate, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    comment = Comment(post_id=post_id, user_id=payload.user_id, text=payload.text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def list_comments(post_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comments = db.scalars(
        select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.desc()).offset(offset).limit(limit)
    ).all()
    return comments
