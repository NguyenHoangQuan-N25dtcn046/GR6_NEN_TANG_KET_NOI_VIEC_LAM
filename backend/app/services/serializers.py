from app.models import Application, Candidate, Job
from app.schemas.application import ApplicationResponse, CandidateBrief
from app.services.cv_service import skills_from_json


def candidate_brief(candidate: Candidate | None) -> CandidateBrief | None:
    if candidate is None:
        return None
    return CandidateBrief(
        id=candidate.id,
        full_name=candidate.full_name,
        phone=candidate.phone,
        email=candidate.user.email if candidate.user else None,
        cv_url=candidate.cv_url,
        skills=skills_from_json(candidate.skills),
    )


def application_response(app: Application) -> ApplicationResponse:
    job: Job | None = app.job
    company_name = job.company.company_name if job and job.company else None
    return ApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        cover_letter=app.cover_letter,
        status=app.status,
        applied_at=app.applied_at,
        candidate=candidate_brief(app.candidate),
        job=(
            {
                "id": job.id,
                "title": job.title,
                "location": job.location,
                "company_name": company_name,
            }
            if job
            else None
        ),
    )
