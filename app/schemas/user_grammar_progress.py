from pydantic import BaseModel
from typing import Optional

class UserGrammarProgressBase(BaseModel):
    user_id: int
    rule_id: int
    correct_attempts: int = 0
    total_attempts: int = 0
    streak_eligible_today: bool = False

class UserGrammarProgressCreate(UserGrammarProgressBase):
    pass

class UserGrammarProgressUpdate(BaseModel):
    correct_attempts: Optional[int] = None
    total_attempts: Optional[int] = None
    last_practiced_at: Optional[str] = None
    streak_eligible_today: Optional[bool] = None

class UserGrammarProgressOut(UserGrammarProgressBase):
    id: int
    last_practiced_at: str

    class Config:
        orm_mode = True
