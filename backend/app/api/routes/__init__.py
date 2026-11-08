from fastapi import APIRouter

from app.api.routes import admin, auth, candidate, employer, jobs

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(candidate.router)
api_router.include_router(employer.router)
api_router.include_router(admin.router)
