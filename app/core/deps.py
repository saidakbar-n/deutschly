from typing import Generator
from app.core.database import get_engine, SessionLocal


def get_db() -> Generator:
    # Ensure SessionLocal is bound to the engine
    if not SessionLocal.kw.get('bind'):
        SessionLocal.configure(bind=get_engine())
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
