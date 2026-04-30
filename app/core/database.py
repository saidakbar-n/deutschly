import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to SQLite for development
    DATABASE_URL = "sqlite:///./deutschly.db"
    print("WARNING: DATABASE_URL not set, using SQLite fallback")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Lazy engine initialization - don't create until first use
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        print(f"Creating database engine for: {DATABASE_URL[:50]}...")
        _engine = create_engine(
            DATABASE_URL,
            echo=False,
            future=True,
            connect_args=connect_args,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=3600,
            pool_pre_ping=True,
        )
        print("Database engine created successfully")
    return _engine

# For backward compatibility, create engine eagerly but wrapped in try/except
try:
    engine = get_engine()
except Exception as e:
    print(f"WARNING: Could not create database engine: {e}")
    # Create a dummy engine to avoid import errors
    engine = None

SessionLocal = sessionmaker(autoflush=False, autocommit=False, expire_on_commit=False, future=True)

class Base(DeclarativeBase):
    pass

@contextmanager
def get_session():
    # Bind the session maker to the engine at first use
    if not SessionLocal.kw.get('bind'):
        SessionLocal.configure(bind=get_engine())
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
