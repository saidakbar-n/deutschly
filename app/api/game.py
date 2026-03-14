from fastapi import APIRouter, HTTPException, Query
from typing import List

router = APIRouter(prefix="/api/v1/game", tags=["game"])

SAMPLE_WORDS = {
    "A1": ["hallo", "tschuss", "danke", "bitte", "ja", "nein", "schule", "haus"],
    "A2": ["reisen", "sprache", "freund", "familie", "arbeit"],
    "B1": ["verstehen", "entwickeln", "universitat", "gesprach"],
    "B2": ["gesellschaft", "kultur", "diskussion", "politik"],
    "C1": ["philosophie", "wissenschaft", "innovation", "nachhaltigkeit"],
}


@router.get("/words/{level}")
def get_words(level: str, count: int = Query(36, le=60)):
    words = SAMPLE_WORDS.get(level.upper())
    if not words:
        raise HTTPException(status_code=404, detail="Level not found")
    # Repeat cycle to reach desired count
    repeated: List[str] = (words * ((count // len(words)) + 1))[:count]
    return {"level": level.upper(), "words": repeated}


@router.post("/move")
def submit_move(move: dict):
    # Placeholder for future validation/scoring
    return {"status": "received", "move": move}
