from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter(prefix="/api/v1", tags=["translate"])

MYMEMORY_URL = "https://api.mymemory.translated.net/get"

class TranslationResult(BaseModel):
    original: str
    translated: str
    detected_language: str | None = None
    alternatives: list[str] = []
    article: str | None = None
    term_with_article: str | None = None

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

        article = None
        term_with_article = None
        if source == 'de':
            first_word = q.strip().split()[0].lower()
            if first_word in ('der', 'die', 'das'):
                article = first_word
                term_with_article = q.strip()

        return TranslationResult(
            original=q.strip(),
            translated=translated,
            alternatives=alternatives[:2],
            article=article,
            term_with_article=term_with_article,
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Translation timed out")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Translation failed: {str(e)}")


class ArticleDetectionResult(BaseModel):
    article: Optional[str] = None
    term_with_article: Optional[str] = None
    method: Optional[str] = None


@router.get("/translate/detect-article", response_model=ArticleDetectionResult)
async def detect_article(
    word: str = Query(..., min_length=1, max_length=200),
    english_hint: str = Query(default=None, max_length=200),
):
    """Detect German article (der/die/das) for a noun using reverse translation."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try reverse: translate "the {english_hint}" from EN→DE
            query = f"the {english_hint}" if english_hint else f"the {word}"
            response = await client.get(
                MYMEMORY_URL,
                params={"q": query, "langpair": "en|de"}
            )
            data = response.json()

        if data.get("responseStatus") != 200:
            return ArticleDetectionResult()

        translated = data["responseData"]["translatedText"]
        first_word = translated.strip().split()[0].lower() if translated else ""

        if first_word in ("der", "die", "das"):
            term_with_article = f"{first_word} {word}"
            return ArticleDetectionResult(
                article=first_word,
                term_with_article=term_with_article,
                method="reverse_translate",
            )

        # Fallback: check matches for patterns
        for match in data.get("matches", []):
            source = (match.get("source", "") or "").strip().lower()
            if source.startswith(("der ", "die ", "das ")):
                article = source.split()[0]
                term_with_article = f"{article} {word}"
                return ArticleDetectionResult(
                    article=article,
                    term_with_article=term_with_article,
                    method="match_lookup",
                )

        return ArticleDetectionResult()

    except httpx.TimeoutException:
        return ArticleDetectionResult()
    except Exception:
        return ArticleDetectionResult()
