from app.schemas.admin import AdminStats, UserAdminResponse
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    CandidateBrief,
    JobBrief,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.candidate import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
)
from app.schemas.common import Message, Page
from app.schemas.company import CompanyProfileResponse, CompanyProfileUpdate
from app.schemas.job import (
    CompanyBrief,
    JobCreate,
    JobResponse,
    JobStatusUpdate,
    JobUpdate,
)

__all__ = [
    "AdminStats",
    "UserAdminResponse",
    "ApplicationCreate",
    "ApplicationResponse",
    "ApplicationStatusUpdate",
    "CandidateBrief",
    "JobBrief",
    "ChangePasswordRequest",
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "CandidateProfileResponse",
    "CandidateProfileUpdate",
    "Message",
    "Page",
    "CompanyProfileResponse",
    "CompanyProfileUpdate",
    "CompanyBrief",
    "JobCreate",
    "JobResponse",
    "JobStatusUpdate",
    "JobUpdate",
]
