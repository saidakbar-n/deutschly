from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationBase(BaseModel):
    type: str
    text: Optional[str] = None
    is_read: int = 0


class NotificationCreate(NotificationBase):
    user_id: int
    from_user_id: Optional[int] = None
    post_id: Optional[int] = None


class NotificationOut(NotificationBase):
    id: int
    user_id: int
    from_user_id: Optional[int]
    post_id: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationOut]
    unread_count: int
