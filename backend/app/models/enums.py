import enum


class UserRole(str, enum.Enum):
    candidate = "candidate"
    employer = "employer"
    admin = "admin"


class JobStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"
    closed = "closed"


class WorkType(str, enum.Enum):
    onsite = "onsite"
    remote = "remote"
    hybrid = "hybrid"


class ApplicationStatus(str, enum.Enum):
    submitted = "submitted"
    shortlisted = "shortlisted"
    rejected = "rejected"
    accepted = "accepted"
