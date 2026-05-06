from pydantic import BaseModel
from typing import Optional

class UserGrammarAttemptBase(BaseModel):
    user_id: int
    exercise_id: int
    user_input: str
    is_correct: bool
    feedback_explanation: Optional[str] = None
    rule_missed_id: Optional[int] = None

class UserGrammarAttemptCreate(UserGrammarAttemptBase):
    pass

class UserGrammarAttemptOut(UserGrammarAttemptBase):
    id: int
    attempt_timestamp: str

    class Config:
        orm_mode = True
