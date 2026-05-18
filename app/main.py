from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db, seed_from_json
from app.routers import categories, phrases, progress, stats, audio


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_from_json()
    yield


app = FastAPI(title="英语学习系统 V4", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api")
app.include_router(phrases.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(audio.router, prefix="/api")

public_path = Path(__file__).resolve().parent.parent / "public"
if public_path.exists():
    app.mount("/", StaticFiles(directory=str(public_path), html=True), name="public")
