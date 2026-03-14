from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.database import Base, engine
from app import models  # noqa: F401 ensures models are registered

# Create tables on startup for quick local dev
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Deutschly Social API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "Deutschly Social Platform v1.1 - Social-first German learning"}
