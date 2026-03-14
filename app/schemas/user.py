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


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    level: Optional[str] = Field(default=None, regex=r"^(A1|A2|B1|B2|C1)$")
    city: Optional[str] = None
    interests: Optional[dict] = None
    profile_photo: Optional[str] = None
    words_count: Optional[int] = None


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: str
    level: str
    city: Optional[str]
    interests: Optional[dict]
    profile_photo: Optional[str]
    words_count: int
    created_at: datetime

    class Config:
        orm_mode = True


class UserList(BaseModel):
    results: List[UserOut]
    total: int
