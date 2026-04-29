import argparse
import random
import string

from app.core.database import Base, engine, SessionLocal
from app.models import User

Base.metadata.create_all(bind=engine)

USERNAMES = [
    "anna", "max", "lena", "paul", "sophie", "felix", "mia", "jonas", "luca", "lara",
]
CITIES = ["Berlin", "Munich", "Hamburg", "Cologne", "Leipzig", "Tashkent"]
LEVELS = ["A1", "A2", "B1", "B2", "C1"]


def random_username():
    suffix = "".join(random.choices(string.ascii_lowercase, k=4))
    return f"{random.choice(USERNAMES)}_{suffix}"


def main(count: int):
    created = 0
    with SessionLocal() as db:
        for _ in range(count):
            username = random_username()
            user = User(
                username=username,
                level=random.choice(LEVELS),
                city=random.choice(CITIES),
                interests={"topics": ["vocabulary", "speaking"]},
            )
            db.add(user)
            created += 1
        db.commit()
    print(f"Created {created} users")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create sample users")
    parser.add_argument("--count", type=int, default=20)
    args = parser.parse_args()
    main(args.count)
