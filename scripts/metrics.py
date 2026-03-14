import argparse
from app.core.database import SessionLocal
from app.models import User, Post, Game, FeedEvent


def phase1_metrics(db):
    profiles = db.query(User).count()
    posts = db.query(Post).count()
    avg_posts = posts / profiles if profiles else 0
    return {
        "profiles": profiles,
        "posts": posts,
        "avg_posts_per_user": round(avg_posts, 2),
    }


def phase4_metrics(db):
    sessions = db.query(Game).count()
    return {"game_sessions": sessions}


def feed_metrics(db):
    total_impressions = db.query(FeedEvent).filter_by(event="impression").count()
    by_variant = (
        db.query(FeedEvent.variant, db.func.count())
        .filter_by(event="impression")
        .group_by(FeedEvent.variant)
        .all()
    )
    return {
        "impressions": total_impressions,
        "by_variant": {variant: count for variant, count in by_variant},
    }


def main(phase: int):
    with SessionLocal() as db:
        if phase == 1:
            data = phase1_metrics(db)
        elif phase == 4:
            data = phase4_metrics(db)
        elif phase == 3:
            data = feed_metrics(db)
        else:
            data = {"message": "Phase not tracked"}
    print(data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", type=int, default=1)
    args = parser.parse_args()
    main(args.phase)
