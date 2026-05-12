from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.grammar_chapter import GrammarChapter
from app.models.grammar_book import GrammarBook
from app.models.grammar_exercise import GrammarExercise
from app.models.grammar_rule import GrammarRule
from app.models.user_chapter_progress import UserChapterProgress
from app.models.user_grammar_progress import UserGrammarProgress
from app.models.user_grammar_attempt import UserGrammarAttempt

UNLOCK_THRESHOLD_PCT = 100
UNLOCK_ACCURACY_PCT = 0


def get_or_create_user_chapter_progress(
    user_id: int, chapter_id: int, db: Session, default_status: str = "locked"
) -> UserChapterProgress:
    progress = db.query(UserChapterProgress).filter_by(
        user_id=user_id, chapter_id=chapter_id
    ).first()

    if not progress:
        progress = UserChapterProgress(
            user_id=user_id,
            chapter_id=chapter_id,
            status=default_status,
            unlocked_at=str(datetime.now(timezone.utc)) if default_status == "unlocked" else None,
        )
        db.add(progress)
        db.flush()

    return progress


def update_chapter_progress(user_id: int, chapter_id: int, db: Session):
    progress = get_or_create_user_chapter_progress(user_id, chapter_id, db, default_status="in_progress")
    chapter = db.query(GrammarChapter).filter_by(id=chapter_id).first()

    if not chapter:
        db.commit()
        return

    rule_ids = [r.id for r in chapter.rules]

    progress.exercises_total = db.query(GrammarExercise).filter(
        GrammarExercise.rule_id.in_(rule_ids)
    ).count()

    chapter_exercise_ids = [
        row[0] for row in db.query(GrammarExercise.id).filter(
            GrammarExercise.rule_id.in_(rule_ids)
        ).all()
    ]

    exercises_done = db.query(UserGrammarAttempt.exercise_id).filter(
        UserGrammarAttempt.user_id == user_id,
        UserGrammarAttempt.exercise_id.in_(chapter_exercise_ids)
    ).distinct().count()
    progress.exercises_done = min(exercises_done, progress.exercises_total)

    user_progress = db.query(UserGrammarProgress).filter(
        UserGrammarProgress.rule_id.in_(rule_ids),
        UserGrammarProgress.user_id == user_id
    ).all()

    correct = sum(p.correct_attempts for p in user_progress)
    attempted = sum(p.total_attempts for p in user_progress)
    progress.score_pct = round((correct / attempted) * 100, 1) if attempted > 0 else 0

    if progress.exercises_done > 0 and progress.status == "locked":
        progress.status = "in_progress"

    db.commit()
    check_and_unlock_next_chapter(user_id, chapter_id, db)


def check_and_unlock_next_chapter(user_id: int, chapter_id: int, db: Session):
    progress = db.query(UserChapterProgress).filter_by(
        user_id=user_id, chapter_id=chapter_id
    ).first()

    if not progress or progress.exercises_total == 0:
        return

    completion_pct = (progress.exercises_done / progress.exercises_total) * 100

    if completion_pct < UNLOCK_THRESHOLD_PCT or progress.score_pct < UNLOCK_ACCURACY_PCT:
        return

    if progress.status == "completed":
        return

    progress.status = "completed"
    progress.completed_at = str(datetime.now(timezone.utc))

    chapter = db.query(GrammarChapter).filter_by(id=chapter_id).first()
    if not chapter:
        db.commit()
        return

    next_chapter = db.query(GrammarChapter).filter(
        GrammarChapter.book_id == chapter.book_id,
        GrammarChapter.sort_order == chapter.sort_order + 1
    ).first()

    if next_chapter:
        next_progress = get_or_create_user_chapter_progress(user_id, next_chapter.id, db, default_status="locked")
        if next_progress.status == "locked":
            next_progress.status = "unlocked"
            next_progress.unlocked_at = str(datetime.now(timezone.utc))

    db.commit()


def unlock_chapters_for_level(user_id: int, level: str, db: Session):
    books = db.query(GrammarBook).filter_by(level=level).all()
    for book in books:
        chapters = db.query(GrammarChapter).filter_by(book_id=book.id).order_by(GrammarChapter.sort_order).all()
        if chapters:
            first = chapters[0]
            for ch in chapters:
                progress = get_or_create_user_chapter_progress(user_id, ch.id, db, default_status="locked")
                if ch.id == first.id:
                    if progress.status == "locked":
                        progress.status = "unlocked"
                        progress.unlocked_at = str(datetime.now(timezone.utc))
                else:
                    if progress.status not in ("in_progress", "completed"):
                        progress.status = "locked"
    db.commit()


def ensure_user_level_progress(user_id: int, book_id: int, db: Session):
    chapters = db.query(GrammarChapter).filter_by(book_id=book_id).order_by(GrammarChapter.sort_order).all()
    if not chapters:
        return

    existing_for_book = db.query(UserChapterProgress).filter(
        UserChapterProgress.user_id == user_id,
        UserChapterProgress.chapter_id.in_([c.id for c in chapters])
    ).count()

    if existing_for_book > 0:
        return

    first = chapters[0]
    for ch in chapters:
        progress = UserChapterProgress(
            user_id=user_id,
            chapter_id=ch.id,
            status="unlocked" if ch.id == first.id else "locked",
            unlocked_at=str(datetime.now(timezone.utc)) if ch.id == first.id else None,
        )
        db.add(progress)
    db.commit()
