from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import Optional

from app.core.deps import get_db
from app.models.grammar_rule import GrammarRule
from app.models.grammar_exercise import GrammarExercise
from app.models.user_grammar_attempt import UserGrammarAttempt
from app.models.user_grammar_progress import UserGrammarProgress
from app.models.user import User
from app.schemas.grammar_rule import GrammarRuleOut
from app.schemas.grammar_exercise import GrammarExerciseOut
from app.schemas.user_grammar_attempt import UserGrammarAttemptOut
from app.schemas.user_grammar_progress import UserGrammarProgressOut
from app.schemas.grammar_submit import GrammarSubmitPayload
from app.core.llm_client import generate_exercise_content, analyze_grammar_feedback
from app.core.streak import update_streak

router = APIRouter(prefix="/api/v1", tags=["grammar"])

@router.get("/grammar/rules", response_model=list[GrammarRuleOut])
def list_grammar_rules(db: Session = Depends(get_db)):
    return db.query(GrammarRule).all()

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

    feedback = analyze_grammar_feedback(user_input, exercise.expected_answer, rule_name)

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

    if not progress:
        progress = UserGrammarProgress(
            user_id=user_id,
            rule_id=exercise.rule_id,
            correct_attempts=1 if feedback["is_correct"] else 0,
            total_attempts=1
        )
        db.add(progress)
    else:
        progress.total_attempts += 1
        if feedback["is_correct"]:
            progress.correct_attempts += 1
        progress.last_practiced_at = str(datetime.now(timezone.utc))

    db.commit()
    db.refresh(attempt)

    user = db.query(User).filter(User.id == user_id).first()
    if user and feedback["is_correct"]:
        update_streak(user, db)
        db.commit()

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
    five_days_ago = str(datetime.now(timezone.utc) - timedelta(days=5))

    missed_attempts = db.query(UserGrammarAttempt).filter(
        UserGrammarAttempt.user_id == user_id,
        UserGrammarAttempt.is_correct.is_(False),
        UserGrammarAttempt.attempt_timestamp >= five_days_ago
    ).all()

    rule_ids = set(a.rule_missed_id for a in missed_attempts if a.rule_missed_id)
    if not rule_ids:
        return []

    return db.query(GrammarExercise).filter(GrammarExercise.rule_id.in_(rule_ids)).limit(10).all()

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

    # Enhanced feedback for shadowing - includes word order analysis
    prompt = f"""As a German grammar expert, analyze this spoken German:
User said: {user_input}
Expected: {exercise.expected_answer}
Grammar rule: {rule_name}

Return ONLY a JSON object:
- "is_correct": boolean
- "correction": corrected sentence if wrong
- "explanation": English explanation focusing on word order and case usage
- "rule_missed_id": null or 1
"""
    feedback = analyze_grammar_feedback(user_input, exercise.expected_answer, rule_name)

    attempt = UserGrammarAttempt(
        user_id=user_id,
        exercise_id=exercise_id,
        user_input=user_input,
        is_correct=feedback["is_correct"],
        feedback_explanation=feedback["explanation"],
        rule_missed_id=feedback.get("rule_missed_id")
    )
    db.add(attempt)

    # Update progress
    progress = db.query(UserGrammarProgress).filter(
        UserGrammarProgress.user_id == user_id,
        UserGrammarProgress.rule_id == exercise.rule_id
    ).first()

    if not progress:
        progress = UserGrammarProgress(
            user_id=user_id,
            rule_id=exercise.rule_id,
            correct_attempts=1 if feedback["is_correct"] else 0,
            total_attempts=1
        )
        db.add(progress)
    else:
        progress.total_attempts += 1
        if feedback["is_correct"]:
            progress.correct_attempts += 1
        progress.last_practiced_at = str(datetime.now(timezone.utc))

    db.commit()
    db.refresh(attempt)

    user = db.query(User).filter(User.id == user_id).first()
    if user and feedback["is_correct"]:
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
