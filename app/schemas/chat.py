from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ConversationOut(BaseModel):
    id: int
    other_user_id: int
    other_username: str
    other_profile_photo: Optional[str] = None
    other_level: Optional[str] = None
    last_message_text: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime

    class Config:
        orm_mode = True


class ConversationListItem(BaseModel):
    id: int
    other_user: dict
    last_message: Optional[dict] = None
    unread_count: int = 0
    created_at: datetime
    is_pending: bool = False


class ConversationCreate(BaseModel):
    user_id: int
    participant_id: int


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    text: str
    created_at: datetime

    class Config:
        orm_mode = True


class MessageSend(BaseModel):
    sender_id: int
    text: str


class UnreadCountResponse(BaseModel):
    unread_count: int
