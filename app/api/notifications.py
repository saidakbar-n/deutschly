from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Notification, User
from app.schemas.notification import NotificationListResponse

router = APIRouter(prefix="/api/v1", tags=["notifications"])


@router.get("/notifications/{user_id}", response_model=NotificationListResponse)
def get_notifications(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get notifications for the user, ordered by newest first
    stmt = select(Notification).where(
        Notification.user_id == user_id
    ).order_by(desc(Notification.created_at)).limit(limit).offset(offset)

    notifications = db.scalars(stmt).all()

    # Count unread notifications
    unread_stmt = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read == 0,
    )
    unread_count = db.scalars(select([unread_stmt.subquery().c.id])).count()

    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
    )


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = 1
    db.commit()
    return {"status": "ok", "is_read": 1}


@router.post("/notifications/read-all/{user_id}")
def mark_all_read(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == 0,
    ).update({"is_read": 1})
    db.commit()
    return {"status": "ok"}
