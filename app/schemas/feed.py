from typing import List
from pydantic import BaseModel
from app.schemas.post import PostOut
from app.schemas.user import UserOut


class FeedItem(BaseModel):
    post: PostOut
    author: UserOut


class FeedResponse(BaseModel):
    items: List[FeedItem]
    total: int
    variant: str
