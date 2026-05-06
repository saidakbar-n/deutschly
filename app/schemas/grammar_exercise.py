from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GrammarExerciseBase(BaseModel):
    rule_id: int
    type: str
    prompt_text: str
    expected_answer: str
    native_sentence: Optional[str] = None
    infinitive_verb: Optional[str] = None
    difficulty: Optional[int] = None
    llm_prompt_used: Optional[str] = None

class GrammarExerciseCreate(GrammarExerciseBase):
    pass

class GrammarExerciseOut(GrammarExerciseBase):
    id: int
    created_at: str

    class Config:
        orm_mode = True
