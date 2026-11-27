from fastapi import FastAPI
from app.core.errors import PROBLEM_RESPONSES, register_error_handlers
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine, db_init
from app.models import entities  # register models
from app.api.v1.jobs import router as jobs_router
from app.api.v1.auth import router as auth_router
from app.api.v1.candidate import router as candidate_router
from app.api.v1.employer import router as employer_router
from app.api.v1.admin import router as admin_router
from app.api.v1.admin_job import router as admin_job_router


app = FastAPI(title="Job Connection Platform API", responses=PROBLEM_RESPONSES)
register_error_handlers(app)
app.add_middleware(CORSMiddleware, allow_origins=[s.strip() for s in settings.CORS_ORIGINS.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def initialize_local_db():
    db_init()
    Base.metadata.create_all(bind=engine)

@app.get("/api/v1/health", tags=["system"])
def health():
    return {"status": "ok"}

app.include_router(jobs_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(candidate_router, prefix="/api/v1")
app.include_router(employer_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(admin_job_router, prefix="/api/v1")
