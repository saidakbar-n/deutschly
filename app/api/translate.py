from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/v1", tags=["translate"])

MYMEMORY_URL = "https://api.mymemory.translated.net/get"

class TranslationResult(BaseModel):
    original: str
    translated: str
    detected_language: str | None = None
    alternatives: list[str] = []

@router.get("/translate", response_model=TranslationResult)
async def translate_text(
    q: str = Query(..., min_length=1, max_length=500),
    source: str = Query(default="de"),
    target: str = Query(default="en"),
):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                MYMEMORY_URL,
                params={"q": q.strip(), "langpair": f"{source}|{target}"}
            )
            data = response.json()

        if data.get("responseStatus") != 200:
            raise HTTPException(status_code=502, detail="Translation service unavailable")

        translated = data["responseData"]["translatedText"]

        alternatives = []
        for match in data.get("matches", [])[:3]:
            alt = match.get("translation", "")
            if alt and alt != translated and alt not in alternatives:
                alternatives.append(alt)

        return TranslationResult(
            original=q.strip(),
            translated=translated,
            alternatives=alternatives[:2],
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Translation timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Translation failed: {str(e)}")
