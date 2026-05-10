import os
import typing
import asyncio

# Compatibility patch: Python 3.12 changed ForwardRef._evaluate signature; pydantic v1 still
# calls it without the new keyword-only argument. Patch to keep FastAPI startup working.
if hasattr(typing, "ForwardRef") and hasattr(typing.ForwardRef, "_evaluate"):
    _orig_forward_ref_evaluate = typing.ForwardRef._evaluate

    def _patched_forward_ref_evaluate(self, *args, **kwargs):
        # typing.ForwardRef._evaluate in Python 3.12 adds keyword-only recursive_guard.
        # Pydantic v1 sometimes passes it positionally; ensure it exists exactly once.
        if "recursive_guard" not in kwargs:
            kwargs["recursive_guard"] = set()
        return _orig_forward_ref_evaluate(self, *args, **kwargs)

    typing.ForwardRef._evaluate = _patched_forward_ref_evaluate

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import api_router
from app.api.chat_ws import manager
from app.core.database import Base, SessionLocal
from app import models  # noqa: F401 ensures models are registered
from app.core.seed_grammar import seed_grammar
from app.services.notification_scheduler import generate_grammar_notifications
from sqlalchemy.orm import Session
from app.core.deps import get_db
from fastapi import WebSocket, WebSocketDisconnect
from apscheduler.schedulers.asyncio import AsyncIOScheduler

BASE_DIR = Path(__file__).resolve().parent.parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.core.database import get_engine, DATABASE_URL
    from app.core.deps import get_db
    db_url = os.getenv("DATABASE_URL", DATABASE_URL)
    if db_url.startswith("sqlite"):
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_grammar(db)
    finally:
        db.close()

    scheduler = AsyncIOScheduler()

    def run_notifications():
        db = SessionLocal()
        try:
            generate_grammar_notifications(db)
        finally:
            db.close()

    scheduler.add_job(run_notifications, "cron", hour=9, minute=0)
    scheduler.start()

    print("Application started successfully")
    yield
    # Shutdown
    scheduler.shutdown()
    print("Application shutting down")

app = FastAPI(title="Deutschly Social API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^http://192\.168\.\d+\.\d+:\d+$",  # allows any local network IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Global OPTIONS handler for preflight requests
@app.options("/api/v1/{path:path}")
async def handle_api_options(path: str):
    return {"status": "ok"}

@app.options("/{path:path}")
async def handle_root_options(path: str):
    return {"status": "ok"}

# Serve uploaded files
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(api_router)


@app.websocket("/api/v1/ws/chat/{user_id}")
async def chat_ws(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await asyncio.wait_for(websocket.receive_text(), timeout=60)
    except (WebSocketDisconnect, asyncio.TimeoutError, Exception):
        manager.disconnect(user_id, websocket)


@app.get("/api/v1/admin/run-notifications")
def run_notifications(db: Session = Depends(get_db)):
    count = generate_grammar_notifications(db)
    return {"notifications_created": count}


@app.get("/")
async def root():
    return {"message": "Deutschly Social API v1.0 - Social-first German learning"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health")
async def api_health():
    return {"status": "ok"}
