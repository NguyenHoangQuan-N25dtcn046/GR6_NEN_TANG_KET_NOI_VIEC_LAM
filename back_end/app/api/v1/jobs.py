from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Job
from app.schemas.job import JobPublic

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=list[JobPublic])
def list_jobs(q: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    stmt = select(Job).where(Job.status == "published")
    if q:
        stmt = stmt.where(or_(Job.title.ilike(f"%{q}%"), Job.location.ilike(f"%{q}%")))
    return db.scalars(stmt.order_by(Job.id.desc()).offset(offset).limit(limit)).all()
