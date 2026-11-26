from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy import String, Text, ForeignKey, DateTime, Date, Numeric, Boolean, UniqueConstraint, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))  # candidate/employer/admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(String(20))
    skills: Mapped[str | None] = mapped_column(Text)
    cv_url: Mapped[str | None] = mapped_column(String(500))

class EmployerProfile(Base):
    __tablename__ = "employer_profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    company_name: Mapped[str] = mapped_column(String(200))
    company_website: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)

class JobCategory(Base):
    __tablename__ = "job_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employer_id: Mapped[int] = mapped_column(Integer, ForeignKey("employer_profiles.id"), index=True)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("job_categories.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(200))
    salary_min: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    salary_max: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    deadline: Mapped[date | None] = mapped_column(Date)
    work_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)  # onsite/remote/hybrid
    job_status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    approval_status: Mapped[str] = mapped_column("approval", String(20), nullable=False, default="pending")
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    employer = relationship("EmployerProfile", lazy="joined")

    @property
    def company_name(self) -> str | None:
        return self.employer.company_name if self.employer else None

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "candidate_id", name="uq_application_job_candidate"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate_profiles.id"), index=True)
    cv_url: Mapped[str | None] = mapped_column(String(500))
    cover_letter: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="submitted")
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("Job", lazy="joined")
    candidate = relationship("CandidateProfile", lazy="joined")

    @property
    def job_title(self) -> str | None:
        return self.job.title if self.job else None

    @property
    def candidate_name(self) -> str | None:
        return self.candidate.full_name if self.candidate else None

    @property
    def company_name(self) -> str | None:
        return self.job.employer.company_name if self.job and self.job.employer else None

class RevokedToken(Base):
    __tablename__ = "revoked_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    jti: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    revoke_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CandidateExperience(Base):
    """Kinh nghiệm làm việc của ứng viên."""
    __tablename__ = "candidate_experiences"
    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate_profiles.id"), index=True)
    company: Mapped[str] = mapped_column(String(200))
    position: Mapped[str] = mapped_column(String(200))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)  # None = hiện tại
    description: Mapped[str | None] = mapped_column(Text)


class CandidateEducation(Base):
    """Học vấn của ứng viên."""
    __tablename__ = "candidate_educations"
    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate_profiles.id"), index=True)
    school: Mapped[str] = mapped_column(String(200))
    major: Mapped[str] = mapped_column(String(200))
    degree: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
