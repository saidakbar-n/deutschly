from app.core.database import SessionLocal
from app.models import User, Post, Follow, FeedEvent


def main():
    with SessionLocal() as db:
        profiles = db.query(User).count()
        posts = db.query(Post).count()
        follows = db.query(Follow).count()
        impressions = db.query(FeedEvent).filter_by(event="impression").count()
    print(
        {
            "profiles": profiles,
            "posts": posts,
            "follows": follows,
            "feed_impressions": impressions,
        }
    )


if __name__ == "__main__":
    main()
