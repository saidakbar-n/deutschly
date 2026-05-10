from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import Optional

from app.core.deps import get_db
from app.models.grammar_book import GrammarBook
from app.models.grammar_chapter import GrammarChapter
from app.models.grammar_rule import GrammarRule
from app.models.grammar_exercise import GrammarExercise
from app.models.user_grammar_attempt import UserGrammarAttempt
from app.models.user_grammar_progress import UserGrammarProgress
from app.models.user_chapter_progress import UserChapterProgress
from app.models.user import User
from app.schemas.grammar_rule import GrammarRuleOut
from app.schemas.grammar_exercise import GrammarExerciseOut
from app.schemas.user_grammar_attempt import UserGrammarAttemptOut
from app.schemas.user_grammar_progress import UserGrammarProgressOut
from app.schemas.grammar_submit import GrammarSubmitPayload
from app.core.llm_client import generate_exercise_content, analyze_grammar_feedback
from app.core.streak import update_streak
from app.core.chapter_unlock import update_chapter_progress, get_or_create_user_chapter_progress, unlock_chapters_for_level, ensure_user_level_progress
from app.core.whisper_stt import transcribe_audio, WHISPER_AVAILABLE

router = APIRouter(prefix="/api/v1", tags=["grammar"])

@router.get("/grammar/rules", response_model=list[GrammarRuleOut])
def list_grammar_rules(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    return db.query(GrammarRule).offset(offset).limit(limit).all()

@router.get("/grammar/exercises/{user_id}", response_model=list[GrammarExerciseOut])
def fetch_exercises(
    user_id: int,
    rule_id: Optional[int] = None,
    exercise_type: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    LEVEL_ORDER = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5}
    LEVEL_FROM_INT = {1: "A1", 2: "A2", 3: "B1", 4: "B2", 5: "C1"}

    user = db.get(User, user_id)
    user_level_int = LEVEL_ORDER.get(user.level if user else "A1", 1)

    allowed_levels = [LEVEL_FROM_INT[i] for i in range(1, user_level_int + 1)]

    allowed_rule_ids = db.scalars(
        select(GrammarRule.id).where(GrammarRule.level.in_(allowed_levels))
    ).all()

    query = db.query(GrammarExercise).filter(
        GrammarExercise.rule_id.in_(allowed_rule_ids)
    )

    if rule_id:
        query = query.filter(GrammarExercise.rule_id == rule_id)
    if exercise_type:
        query = query.filter(GrammarExercise.type == exercise_type)
    if difficulty:
        query = query.filter(GrammarExercise.difficulty == difficulty)

    struggled_rule_ids = db.scalars(
        select(UserGrammarProgress.rule_id)
        .where(
            UserGrammarProgress.user_id == user_id,
            UserGrammarProgress.total_attempts > 0,
            (UserGrammarProgress.correct_attempts * 1.0 / UserGrammarProgress.total_attempts) < 0.6
        )
    ).all()

    if struggled_rule_ids:
        priority_exercises = query.filter(
            GrammarExercise.rule_id.in_(struggled_rule_ids)
        ).order_by(func.random()).limit(limit // 2 + 1).all()

        remaining_limit = max(0, limit - len(priority_exercises))
        other_exercises = query.filter(
            GrammarExercise.rule_id.notin_(struggled_rule_ids)
        ).order_by(func.random()).limit(remaining_limit).all()

        results = priority_exercises + other_exercises
    else:
        results = query.order_by(func.random()).limit(limit).all()

    return results

@router.post("/grammar/submit/{exercise_id}", response_model=UserGrammarAttemptOut)
def submit_answer(
    exercise_id: int,
    payload: GrammarSubmitPayload,
    db: Session = Depends(get_db)
):
    user_id = payload.user_id
    user_input = payload.user_input
    exercise = db.query(GrammarExercise).filter(GrammarExercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    rule = db.query(GrammarRule).filter(GrammarRule.id == exercise.rule_id).first()
    rule_name = rule.name if rule else "Unknown"
    rule_description = rule.description if rule else ""

    user = db.query(User).filter(User.id == user_id).first()
    user_level = user.level if user and user.level else "A1"

    feedback = analyze_grammar_feedback(
        user_input, exercise.expected_answer, rule_name,
        user_level=user_level,
        exercise_type=exercise.type,
        rule_description=rule_description,
        infinitive_verb=exercise.infinitive_verb or ""
    )

    attempt = UserGrammarAttempt(
        user_id=user_id,
        exercise_id=exercise_id,
        user_input=user_input,
        is_correct=feedback["is_correct"],
        feedback_explanation=feedback["explanation"],
        rule_missed_id=feedback.get("rule_missed_id")
    )
    db.add(attempt)

    progress = db.query(UserGrammarProgress).filter(
        UserGrammarProgress.user_id == user_id,
        UserGrammarProgress.rule_id == exercise.rule_id
    ).first()

    now = str(datetime.now(timezone.utc))
    if not progress:
        progress = UserGrammarProgress(
            user_id=user_id,
            rule_id=exercise.rule_id,
            correct_attempts=1 if feedback["is_correct"] else 0,
            total_attempts=1,
            last_practiced_at=now,
            streak_eligible_today=True,
        )
        db.add(progress)
    else:
        progress.total_attempts += 1
        if feedback["is_correct"]:
            progress.correct_attempts += 1
        progress.last_practiced_at = now
        progress.streak_eligible_today = True

    db.commit()
    db.refresh(attempt)

    if user:
        update_streak(user, db)
        db.commit()

    if rule and rule.chapter_id:
        update_chapter_progress(user_id, rule.chapter_id, db)

    return attempt

@router.get("/grammar/progress/{user_id}")
def fetch_progress(user_id: int, db: Session = Depends(get_db)):
    progress_rows = db.query(UserGrammarProgress).filter(
        UserGrammarProgress.user_id == user_id
    ).all()

    result = []
    for p in progress_rows:
        rule = db.get(GrammarRule, p.rule_id)
        accuracy = round((p.correct_attempts / p.total_attempts) * 100) if p.total_attempts > 0 else 0
        result.append({
            "id": p.id,
            "rule_id": p.rule_id,
            "rule_name": rule.name if rule else "Unknown",
            "rule_category": rule.category if rule else None,
            "rule_level": rule.level if rule else None,
            "correct_attempts": p.correct_attempts,
            "total_attempts": p.total_attempts,
            "accuracy": accuracy,
            "last_practiced_at": p.last_practiced_at,
            "streak_eligible_today": p.streak_eligible_today,
        })

    return sorted(result, key=lambda x: x["accuracy"])

@router.get("/grammar/mistake-replay/{user_id}", response_model=list[GrammarExerciseOut])
def mistake_replay(user_id: int, db: Session = Depends(get_db)):
    missed_attempts = db.query(UserGrammarAttempt).filter(
        UserGrammarAttempt.user_id == user_id,
        UserGrammarAttempt.is_correct.is_(False),
    ).order_by(UserGrammarAttempt.attempt_timestamp.desc()).limit(50).all()

    rule_ids = list(set(a.rule_missed_id for a in missed_attempts if a.rule_missed_id))
    if not rule_ids:
        return []

    return db.query(GrammarExercise).filter(
        GrammarExercise.rule_id.in_(rule_ids)
    ).order_by(func.random()).limit(10).all()

@router.post("/grammar/shadowing-feedback/{exercise_id}", response_model=UserGrammarAttemptOut)
def shadowing_feedback(
    exercise_id: int,
    payload: GrammarSubmitPayload,
    db: Session = Depends(get_db)
):
    """Analyze spoken German with speech-to-text transcription"""
    user_id = payload.user_id
    user_input = payload.user_input

    exercise = db.query(GrammarExercise).filter(GrammarExercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    rule = db.query(GrammarRule).filter(GrammarRule.id == exercise.rule_id).first()
    rule_name = rule.name if rule else "Unknown"
    rule_description = rule.description if rule else ""

    user = db.query(User).filter(User.id == user_id).first()
    user_level = user.level if user and user.level else "A1"

    feedback = analyze_grammar_feedback(
        user_input, exercise.expected_answer, rule_name,
        user_level=user_level,
        exercise_type=exercise.type,
        rule_description=rule_description,
        infinitive_verb=exercise.infinitive_verb or ""
    )

    attempt = UserGrammarAttempt(
        user_id=user_id,
        exercise_id=exercise_id,
        user_input=user_input,
        is_correct=feedback["is_correct"],
        feedback_explanation=feedback["explanation"],
        rule_missed_id=feedback.get("rule_missed_id")
    )
    db.add(attempt)

    now = str(datetime.now(timezone.utc))
    progress = db.query(UserGrammarProgress).filter(
        UserGrammarProgress.user_id == user_id,
        UserGrammarProgress.rule_id == exercise.rule_id
    ).first()

    if not progress:
        progress = UserGrammarProgress(
            user_id=user_id,
            rule_id=exercise.rule_id,
            correct_attempts=1 if feedback["is_correct"] else 0,
            total_attempts=1,
            last_practiced_at=now,
            streak_eligible_today=True,
        )
        db.add(progress)
    else:
        progress.total_attempts += 1
        if feedback["is_correct"]:
            progress.correct_attempts += 1
        progress.last_practiced_at = now
        progress.streak_eligible_today = True

    db.commit()
    db.refresh(attempt)

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        update_streak(user, db)
        db.commit()

    return attempt

@router.post("/grammar/generate-exercise", response_model=GrammarExerciseOut)
def generate_exercise(
    rule_id: int,
    exercise_type: str,
    db: Session = Depends(get_db)
):
    rule = db.get(GrammarRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    valid_types = ["cloze", "blurting", "reverse_translation"]
    if exercise_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid exercise type. Must be one of: {valid_types}"
        )

    content = generate_exercise_content(rule.name, exercise_type, rule.level or "A1")

    if not content.get("prompt_text") or not content.get("expected_answer"):
        raise HTTPException(
            status_code=422,
            detail="LLM returned incomplete exercise content. Try again."
        )

    exercise = GrammarExercise(
        rule_id=rule_id,
        type=exercise_type,
        prompt_text=content["prompt_text"],
        expected_answer=content["expected_answer"],
        native_sentence=content.get("native_sentence"),
        infinitive_verb=content.get("infinitive_verb"),
        difficulty=2,
        llm_prompt_used=content.get("llm_prompt_used"),
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise

@router.get("/grammar/books")
def list_books(db: Session = Depends(get_db)):
    books = db.query(GrammarBook).order_by(GrammarBook.sort_order).all()
    return [{
        "id": b.id,
        "level": b.level,
        "title": b.title,
        "description": b.description,
        "sort_order": b.sort_order,
        "chapter_count": len(b.chapters) if b.chapters else 0,
    } for b in books]

@router.get("/grammar/quick-start/{user_id}")
def quick_start(user_id: int, level: Optional[str] = None, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    user_level = level or (user.level if user else "A1")
    book = db.query(GrammarBook).filter_by(level=user_level).first()
    if not book:
        book = db.query(GrammarBook).order_by(GrammarBook.sort_order).first()
    if not book:
        return None
    ensure_user_level_progress(user_id, book.id, db)
    chapters = db.query(GrammarChapter).filter_by(book_id=book.id).order_by(GrammarChapter.sort_order).all()
    for ch in chapters:
        progress = db.query(UserChapterProgress).filter_by(
            user_id=user_id, chapter_id=ch.id
        ).first()
        if progress and progress.status in ("unlocked", "in_progress"):
            ex_count = 0
            if ch.rules:
                rule_ids = [r.id for r in ch.rules]
                ex_count = db.query(GrammarExercise).filter(
                    GrammarExercise.rule_id.in_(rule_ids)
                ).count()
            return {
                "book": {
                    "id": book.id,
                    "level": book.level,
                    "title": book.title,
                },
                "chapter": {
                    "id": ch.id,
                    "number": ch.number,
                    "title": ch.title,
                    "topic": ch.topic,
                    "exercise_count": ex_count,
                },
                "progress": {
                    "status": progress.status,
                    "exercises_done": progress.exercises_done,
                    "exercises_total": progress.exercises_total or ex_count,
                    "score_pct": progress.score_pct or 0,
                },
            }
    return None

@router.get("/grammar/books/{book_id}/chapters")
def list_chapters(book_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    user_level = user.level if user else "A1"
    ensure_user_level_progress(user_id, book_id, db)
    chapters = db.query(GrammarChapter).filter_by(book_id=book_id).order_by(GrammarChapter.sort_order).all()
    result = []
    for ch in chapters:
        progress = db.query(UserChapterProgress).filter_by(
            user_id=user_id, chapter_id=ch.id
        ).first()
        rule_ids = [r.id for r in ch.rules]
        ex_count = db.query(GrammarExercise).filter(
            GrammarExercise.rule_id.in_(rule_ids)
        ).count() if ch.rules else 0
        p = {
            "status": "locked",
            "exercises_done": 0,
            "exercises_total": ex_count,
            "score_pct": 0,
        }
        if progress:
            p = {
                "status": progress.status,
                "exercises_done": progress.exercises_done,
                "exercises_total": ex_count,
                "score_pct": progress.score_pct or 0,
            }
        result.append({
            "id": ch.id,
            "book_id": ch.book_id,
            "number": ch.number,
            "title": ch.title,
            "topic": ch.topic,
            "sort_order": ch.sort_order,
            "exercise_count": ex_count,
            "progress": p,
        })
    return result

@router.get("/grammar/chapters/{chapter_id}/exercises")
def chapter_exercises(chapter_id: int, user_id: int, limit: int = 25, db: Session = Depends(get_db)):
    rules = db.query(GrammarRule).filter_by(chapter_id=chapter_id).all()
    if not rules:
        return []
    rule_ids = [r.id for r in rules]
    all_exercises = db.query(GrammarExercise).filter(
        GrammarExercise.rule_id.in_(rule_ids)
    ).all()

    attempted_ids = {
        row[0] for row in db.query(UserGrammarAttempt.exercise_id).filter(
            UserGrammarAttempt.user_id == user_id,
            UserGrammarAttempt.exercise_id.in_([e.id for e in all_exercises]),
        ).distinct().all()
    }

    remaining = [e for e in all_exercises if e.id not in attempted_ids]

    if not remaining:
        return []

    import random
    random.shuffle(remaining)
    return remaining[:limit]

@router.get("/grammar/chapters/{chapter_id}/progress/{user_id}")
def chapter_progress(chapter_id: int, user_id: int, db: Session = Depends(get_db)):
    progress = get_or_create_user_chapter_progress(user_id, chapter_id, db)
    chapter = db.get(GrammarChapter, chapter_id)
    ex_count = 0
    if chapter:
        rule_ids = [r.id for r in chapter.rules]
        ex_count = db.query(GrammarExercise).filter(
            GrammarExercise.rule_id.in_(rule_ids)
        ).count()
    return {
        "id": progress.id,
        "user_id": progress.user_id,
        "chapter_id": progress.chapter_id,
        "status": progress.status,
        "exercises_done": progress.exercises_done,
        "exercises_total": progress.exercises_total or ex_count,
        "score_pct": progress.score_pct or 0,
        "unlocked_at": progress.unlocked_at,
        "completed_at": progress.completed_at,
    }

@router.post("/grammar/chapters/{chapter_id}/reset-progress/{user_id}")
def reset_chapter_progress(chapter_id: int, user_id: int, db: Session = Depends(get_db)):
    chapter = db.get(GrammarChapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    rule_ids = [r.id for r in chapter.rules]
    db.query(UserGrammarProgress).filter(
        UserGrammarProgress.rule_id.in_(rule_ids),
        UserGrammarProgress.user_id == user_id,
    ).delete()

    progress = db.query(UserChapterProgress).filter_by(
        user_id=user_id, chapter_id=chapter_id
    ).first()
    if progress:
        progress.status = "in_progress"
        progress.exercises_done = 0
        progress.score_pct = 0
        progress.completed_at = None

    db.commit()
    return {"status": "reset"}


@router.post("/grammar/chapters/{chapter_id}/sync-progress/{user_id}")
def sync_chapter_progress(chapter_id: int, user_id: int, db: Session = Depends(get_db)):
    update_chapter_progress(user_id, chapter_id, db)
    progress = db.query(UserChapterProgress).filter_by(
        user_id=user_id, chapter_id=chapter_id
    ).first()
    return {
        "status": progress.status if progress else "unlocked",
        "exercises_done": progress.exercises_done if progress else 0,
        "score_pct": progress.score_pct if progress else 0,
    }

@router.post("/grammar/transcribe")
async def transcribe_voice(audio: UploadFile = File(...), language: str = "de"):
    if not WHISPER_AVAILABLE:
        raise HTTPException(status_code=503, detail="Whisper not installed. Run: pip install openai-whisper")
    
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio data received")
    
    try:
        text = transcribe_audio(audio_bytes, language=language)
        if not text:
            return {"text": "", "confidence": 0}
        return {"text": text, "confidence": 1}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
