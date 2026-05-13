from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import User
from app.core.streak import update_streak

router = APIRouter(prefix="/api/v1/progress", tags=["progress"])

POINTS_PER_TREE = 1900

TREE_LEVEL_THRESHOLDS = [0, 30, 80, 160, 280, 440, 660, 960, 1360, 1900]

TREE_LEVEL_NAMES = [
    "Seed",
    "Sprout",
    "Sapling",
    "Young Tree",
    "Blooming",
    "Flourishing",
    "Fruitful",
    "Majestic",
    "Enchanted",
    "Legendary",
]

ACTIVITY_POINTS = {
    "word": 10,
    "grammar": 15,
    "translate": 5,
    "note": 5,
}


def _get_tree_level(current_tree_points: int) -> int:
    for level, threshold in enumerate(TREE_LEVEL_THRESHOLDS):
        if current_tree_points < threshold:
            return max(0, level - 1)
    return len(TREE_LEVEL_THRESHOLDS) - 1


def _points_to_next(current_tree_points: int) -> int:
    for threshold in TREE_LEVEL_THRESHOLDS:
        if current_tree_points < threshold:
            return threshold - current_tree_points
    return 0


def _trees_grown(points: int) -> int:
    return points // POINTS_PER_TREE


def _current_tree_points(points: int) -> int:
    return points % POINTS_PER_TREE


@router.post("/log-activity")
def log_activity(user_id: int, activity_type: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if activity_type not in ACTIVITY_POINTS:
        raise HTTPException(status_code=400, detail=f"Unknown activity type. Valid: {list(ACTIVITY_POINTS.keys())}")

    was_active_yesterday = user.last_active_date == str(date.today() - timedelta(days=1))

    update_streak(user, db)

    base_points = ACTIVITY_POINTS[activity_type]
    multiplier = 1.5 if user.streak and user.streak >= 3 else 1.0
    if was_active_yesterday and user.streak and user.streak >= 7:
        multiplier = 2.0

    earned = int(base_points * multiplier)

    prev_trees = _trees_grown(user.tree_points or 0)
    user.tree_points = (user.tree_points or 0) + earned
    new_trees = _trees_grown(user.tree_points)

    current_pts = _current_tree_points(user.tree_points)
    current_level = _get_tree_level(current_pts)
    leveled_up = current_level > (user.tree_level or 0) or new_trees > prev_trees
    user.tree_level = current_level

    db.add(user)
    db.commit()
    db.refresh(user)

    current_pts = _current_tree_points(user.tree_points)
    current_level = _get_tree_level(current_pts)

    return {
        "points_earned": earned,
        "tree_points": user.tree_points,
        "tree_level": current_level,
        "trees_grown": _trees_grown(user.tree_points),
        "tree_stage": TREE_LEVEL_NAMES[current_level],
        "points_to_next": _points_to_next(current_pts),
        "streak": user.streak,
        "leveled_up": leveled_up,
        "multiplier": multiplier,
    }


@router.get("/{user_id}")
def get_progress(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    points = user.tree_points or 0
    trees = _trees_grown(points)
    current_pts = _current_tree_points(points)
    current_level = _get_tree_level(current_pts)

    return {
        "tree_points": points,
        "tree_level": current_level,
        "trees_grown": trees,
        "tree_stage": TREE_LEVEL_NAMES[current_level],
        "points_to_next": _points_to_next(current_pts),
        "points_for_current": TREE_LEVEL_THRESHOLDS[current_level] if current_level > 0 else 0,
        "points_for_next": TREE_LEVEL_THRESHOLDS[current_level + 1] if current_level < len(TREE_LEVEL_THRESHOLDS) - 1 else POINTS_PER_TREE,
        "next_stage": TREE_LEVEL_NAMES[current_level + 1] if current_level < len(TREE_LEVEL_NAMES) - 1 else "New Tree",
        "streak": user.streak or 0,
        "is_active_today": user.last_active_date == str(date.today()),
        "last_active_date": user.last_active_date,
    }
