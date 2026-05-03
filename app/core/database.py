import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./deutschly.db")

IS_SQLITE = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if IS_SQLITE else {}

_engine = None

def get_engine():
    global _engine
    if _engine is None:
        kwargs = dict(echo=False, future=True, connect_args=connect_args)
        # SQLite does not support connection pool settings
        if not IS_SQLITE:
            kwargs.update(pool_size=5, max_overflow=10, pool_timeout=30, pool_recycle=3600, pool_pre_ping=True)
        _engine = create_engine(DATABASE_URL, **kwargs)
        print(f"✅ DB engine created: {'SQLite (local)' if IS_SQLITE else DATABASE_URL[:40]}")
    return _engine

try:
    engine = get_engine()
except Exception as e:
    print(f"WARNING: Could not create database engine: {e}")
    engine = None

SessionLocal = sessionmaker(autoflush=False, autocommit=False, expire_on_commit=False, future=True)

class Base(DeclarativeBase):
    pass

@contextmanager
def get_session():
    if not SessionLocal.kw.get('bind'):
        SessionLocal.configure(bind=get_engine())
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
