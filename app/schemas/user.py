from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    telegram_id: int
    username: str = Field(min_length=3, max_length=50)
    level: str = Field(regex=r"^(A1|A2|B1|B2|C1)$")
    city: Optional[str] = None
    interests: Optional[dict] = None
    profile_photo: Optional[str] = None
    words_count: Optional[int] = 0
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    level: Optional[str] = Field(default=None, regex=r"^(A1|A2|B1|B2|C1)$")
    city: Optional[str] = None
    interests: Optional[dict] = None
    profile_photo: Optional[str] = None
    words_count: Optional[int] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)
    notify_likes: Optional[int] = None
    notify_follows: Optional[int] = None
    notify_comments: Optional[int] = None


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: str
    level: str
    city: Optional[str]
    interests: Optional[dict]
    profile_photo: Optional[str]
    words_count: int
    notify_likes: int
    notify_follows: int
    notify_comments: int
    recovery_codes: Optional[list[int]] = None
    created_at: datetime

    class Config:
        orm_mode = True


class UserList(BaseModel):
    results: List[UserOut]
    total: int


class WebSignup(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    level: str = Field(regex=r"^(A1|A2|B1|B2|C1)$")
    city: Optional[str] = None
    interests: Optional[dict] = None
    profile_photo: Optional[str] = None
    password: str = Field(min_length=6, max_length=128)
    recovery_codes: Optional[list[int]] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TelegramLogin(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str
