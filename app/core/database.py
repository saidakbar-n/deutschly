import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to SQLite for development
    DATABASE_URL = "sqlite:///./deutschly.db"
    print("⚠️ WARNING: DATABASE_URL not set, using SQLite fallback")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Use pool_pre_ping to handle connection drops gracefully
# Don't fail on startup if DB is temporarily unavailable
pool_size = 5
max_overflow = 10
pool_timeout = 30
pool_recycle = 3600

engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    future=True, 
    connect_args=connect_args,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=pool_timeout,
    pool_recycle=pool_recycle,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)

class Base(DeclarativeBase):
    pass

@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
