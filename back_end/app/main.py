from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.models import entities  # register models
from app.api.v1.jobs import router as jobs_router
from app.api.v1.auth import router as auth_router

app = FastAPI(title="Job Connection Platform API")
app.add_middleware(CORSMiddleware, allow_origins=[s.strip() for s in settings.CORS_ORIGINS.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def initialize_local_db():
    # Local bootstrap only; use Alembic migrations for production.
    Base.metadata.create_all(bind=engine)

@app.get("/api/v1/health", tags=["system"])
def health():
    return {"status": "ok"}

app.include_router(jobs_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")