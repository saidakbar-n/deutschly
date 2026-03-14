import argparse
import random

from app.core.database import Base, engine, SessionLocal
from app.models import Post, User

Base.metadata.create_all(bind=engine)

TYPES = ["story", "achievement", "tip"]
TEXTS = [
    "Heute habe ich 20 neue Wörter gelernt!",
    "Kurzer Tipp: Wiederhole Verben jeden Morgen.",
    "Mein Lieblingswort ist Abenteuer.",
]


def main(count: int):
    with SessionLocal() as db:
        users = db.query(User).all()
        if not users:
            print("No users found. Run create_sample_users first.")
            return
        created = 0
        for _ in range(count):
            user = random.choice(users)
            post = Post(
                user_id=user.id,
                type=random.choice(TYPES),
                text=random.choice(TEXTS),
                level_tag=user.level,
            )
            db.add(post)
            created += 1
        db.commit()
    print(f"Created {created} posts")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create sample posts")
    parser.add_argument("--count", type=int, default=50)
    args = parser.parse_args()
    main(args.count)
