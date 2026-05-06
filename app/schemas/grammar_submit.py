from pydantic import BaseModel

class GrammarSubmitPayload(BaseModel):
    user_id: int
    user_input: str
