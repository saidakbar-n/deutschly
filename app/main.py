import os
import typing

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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.database import Base, engine
from app import models  # noqa: F401 ensures models are registered

# Create tables on startup for quick local dev
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Deutschly Social API", version="1.0.0")

# CORS configuration - allow frontend domains and Railway domains
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://localhost:5173",
    "https://127.0.0.1:5173",
]

# Add production frontend domain from environment variable
frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    allowed_origins.append(frontend_origin)
    # Also allow the domain without https:// prefix if provided with it
    if frontend_origin.startswith("https://"):
        allowed_origins.append(frontend_origin[8:])  # Remove https://
    elif frontend_origin.startswith("http://"):
        allowed_origins.append(frontend_origin[7:])  # Remove http://

# Allow Railway.app domains by default for both web and API
allowed_origins.extend([
    "https://*.up.railway.app",
    "https://*.railway.app",
    "http://*.up.railway.app",
    "http://*.railway.app",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*\.(up\.railway\.app|railway\.app)",
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

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "Deutschly Social API v1.0 - Social-first German learning"}
