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

app = FastAPI(title="Deutschly Social API", version="1.1.0")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
extra_origin = os.getenv("FRONTEND_ORIGIN")
if extra_origin:
    allowed_origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://localhost(:\\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "Deutschly Social Platform v1.1 - Social-first German learning"}
