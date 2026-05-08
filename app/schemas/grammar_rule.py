from pydantic import BaseModel
from datetime import datetime

class GrammarRuleBase(BaseModel):
    name: str
    description: str | None = None
    level: str | None = None
    category: str | None = None

class GrammarRuleCreate(GrammarRuleBase):
    pass

class GrammarRuleOut(GrammarRuleBase):
    id: int
    chapter_id: int | None = None

    class Config:
        orm_mode = True
