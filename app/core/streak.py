from datetime import date, timedelta
from app.models.user import User


def update_streak(user: User, db) -> None:
    """Call after any user activity (post, word). Updates streak and last_active_date."""
    today = str(date.today())
    yesterday = str(date.today() - timedelta(days=1))

    if user.last_active_date == today:
        return  # already active today, nothing to update

    if user.last_active_date == yesterday:
        user.streak = (user.streak or 0) + 1
    else:
        user.streak = 1  # gap in activity, reset to 1

    user.last_active_date = today
    db.add(user)
    # caller is responsible for db.commit()
