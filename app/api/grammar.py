from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    query = db.query(GrammarExercise)

    if rule_id:
        query = query.filter(GrammarExercise.rule_id == rule_id)
    if exercise_type:
        query = query.filter(GrammarExercise.type == exercise_type)
    if difficulty:
        query = query.filter(GrammarExercise.difficulty == difficulty)

    return query.limit(limit).all()

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
        progress.last_practiced_at = str(__import__('datetime').datetime.now(__import__('datetime').UTC))

    db.commit()
    db.refresh(attempt)

    user = db.query(User).filter(User.id == user_id).first()
    if user and feedback["is_correct"]:
        update_streak(user, db)
        db.commit()

    return attempt

@router.get("/grammar/progress/{user_id}", response_model=list[UserGrammarProgressOut])
def fetch_progress(user_id: int, db: Session = Depends(get_db)):
    return db.query(UserGrammarProgress).filter(UserGrammarProgress.user_id == user_id).all()

@router.get("/grammar/mistake-replay/{user_id}", response_model=list[GrammarExerciseOut])
def mistake_replay(user_id: int, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    five_days_ago = str(datetime.now(datetime.UTC) - timedelta(days=5))

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
        progress.last_practiced_at = str(datetime.now(datetime.UTC))

    db.commit()
    db.refresh(attempt)

    user = db.query(User).filter(User.id == user_id).first()
    if user and feedback["is_correct"]:
        update_streak(user, db)
        db.commit()

    return attempt
