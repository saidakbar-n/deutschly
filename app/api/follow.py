from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Follow, User

router = APIRouter(prefix="/api/v1", tags=["social"])


@router.post("/follow/{target_user_id}")
def follow_user(target_user_id: int, follower_id: int, db: Session = Depends(get_db)):
    if target_user_id == follower_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.get(User, target_user_id)
    follower = db.get(User, follower_id)
    if not target or not follower:
        raise HTTPException(status_code=404, detail="User not found")

    exists = db.scalar(
        select(Follow).where(
            Follow.follower_id == follower_id, Follow.following_id == target_user_id
        )
    )
    if exists:
        return {"detail": "Already following"}

    link = Follow(follower_id=follower_id, following_id=target_user_id)
    db.add(link)
    db.commit()
    return {"detail": "Followed"}
