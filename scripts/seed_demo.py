"""Seed demo data: users, posts, likes, comments.
Run: python -m scripts.seed_demo
"""
import random
from datetime import datetime, timedelta

from app.core.database import SessionLocal, Base, engine
from app.models import User, Post, Like, Comment

Base.metadata.create_all(bind=engine)

USERS = [
    {"username": "anna", "level": "A2", "city": "Berlin"},
    {"username": "max", "level": "B1", "city": "Munich"},
    {"username": "sophie", "level": "A1", "city": "Hamburg"},
    {"username": "paul", "level": "B2", "city": "Cologne"},
]

POST_TEXTS = [
    ("story", "Just finished a 20-word drill, feeling great!"),
    ("achievement", "Passed my B1 mock exam today!"),
    ("tip", "Tip: review verbs with flashcards before bed."),
]

COMMENTS = ["Super!", "Glückwunsch!", "Danke für den Tipp", "Weiter so!", "Cool!"]


def main():
    with SessionLocal() as db:
        # Clear existing demo data (optional)
        # db.query(Like).delete()
        # db.query(Comment).delete()
        # db.query(Post).delete()
        # db.query(User).delete()
        # db.commit()

        users = []
        for u in USERS:
            user = db.query(User).filter_by(username=u["username"]).first()
            if not user:
                user = User(**u)
                db.add(user)
                db.commit()
                db.refresh(user)
            users.append(user)

        posts = []
        for user in users:
            for kind, text in POST_TEXTS:
                post = Post(
                    user_id=user.id,
                    type=kind,
                    text=f"{text} ({user.username})",
                    level_tag=user.level,
                    timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                )
                db.add(post)
                posts.append(post)
        db.commit()
        for p in posts:
            db.refresh(p)

        # Add likes
        for post in posts:
            likers = random.sample(users, k=random.randint(1, len(users)))
            for liker in likers:
                if not db.query(Like).filter_by(post_id=post.id, user_id=liker.id).first():
                    db.add(Like(post_id=post.id, user_id=liker.id))
            post.likes = len(likers)
        db.commit()

        # Add comments
        for post in posts:
            for _ in range(random.randint(1, 3)):
                commenter = random.choice(users)
                db.add(
                    Comment(
                        post_id=post.id,
                        user_id=commenter.id,
                        text=random.choice(COMMENTS),
                    )
                )
        db.commit()

        print(f"Seeded {len(users)} users, {len(posts)} posts with likes/comments.")


if __name__ == "__main__":
    main()
