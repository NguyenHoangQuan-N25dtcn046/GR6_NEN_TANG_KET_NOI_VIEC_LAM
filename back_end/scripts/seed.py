"""Nạp dữ liệu mẫu (seed) cho demo — chạy từ thư mục back_end:

    python scripts/seed.py

Tạo: 1 admin, 2 employer, 2 candidate, 4 ngành nghề, 4 tin (đủ trạng thái), 1 đơn ứng tuyển.
Chú ý: script XÓA toàn bộ dữ liệu cũ trước khi nạp lại (chỉ dùng cho môi trường demo/dev).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.entities import (
    Application,
    CandidateEducation,
    CandidateExperience,
    CandidateProfile,
    EmployerProfile,
    Job,
    JobCategory,
    RevokedToken,
    SavedJob,
    User,
)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Xóa dữ liệu cũ (thứ tự: con trước, cha sau)
    for model in [
        Application, SavedJob, CandidateEducation, CandidateExperience, Job,
        CandidateProfile, EmployerProfile, JobCategory, RevokedToken, User,
    ]:
        db.query(model).delete()
    db.commit()
    print("Da xoa du lieu cu.")

    # 2. Admin
    db.add(User(email="admin@example.com", password_hash=hash_password("Admin@123"), role="admin", is_active=True))

    # 3. Ngành nghề
    category_names = [
        "Công nghệ thông tin",
        "Kinh doanh / Bán hàng",
        "Marketing / Truyền thông",
        "Kế toán / Tài chính",
    ]
    categories = {name: JobCategory(name=name) for name in category_names}
    db.add_all(categories.values())

    # 4. Employer + hồ sơ
    employers = []
    for i in range(1, 3):
        user = User(email=f"employer{i}@example.com", password_hash=hash_password("Employer@123"), role="employer", is_active=True)
        db.add(user)
        db.flush()
        profile = EmployerProfile(user_id=user.id, company_name=f"Công ty {i}", company_website=f"https://company{i}.example.com", description=f"Mô tả công ty {i}")
        db.add(profile)
        employers.append(profile)

    # 5. Candidate + hồ sơ
    candidates = []
    for i in range(1, 3):
        user = User(email=f"candidate{i}@example.com", password_hash=hash_password("Candidate@123"), role="candidate", is_active=True)
        db.add(user)
        db.flush()
        profile = CandidateProfile(user_id=user.id, full_name=f"Ứng viên {i}", phone="0900000000", skills="Python, FastAPI, SQL")
        db.add(profile)
        candidates.append(profile)

    db.flush()

    # 6. Tin tuyển dụng (đủ trạng thái: công khai / chờ duyệt / đóng)
    def make_job(emp, title, cat, location, approval_status, job_status, work_mode, job_type, experience_years):
        status = "published" if (approval_status == "approved" and job_status == "open") else \
                 "closed" if job_status == "closed" else \
                 "rejected" if approval_status == "rejected" else "pending"
        return Job(
            employer_id=emp.id, category_id=categories[cat].id, title=title,
            description=f"Mô tả công việc: {title}.", location=location,
            salary_min=10000000, salary_max=25000000,
            status=status, approval_status=approval_status, job_status=job_status,
            work_mode=work_mode, job_type=job_type, experience_years=experience_years,
        )

    jobs = [
        make_job(employers[0], "Kỹ sư Backend Python", "Công nghệ thông tin", "Hà Nội", "approved", "open", "remote", "full-time", 3),
        make_job(employers[0], "Nhân viên Marketing", "Marketing / Truyền thông", "Hà Nội", "pending", "open", "hybrid", "full-time", 1),
        make_job(employers[1], "Kế toán viên", "Kế toán / Tài chính", "Đà Nẵng", "approved", "open", "onsite", "full-time", 2),
        make_job(employers[1], "Nhân viên kinh doanh", "Kinh doanh / Bán hàng", "Hà Nội", "approved", "closed", "onsite", "contract", 0),
    ]
    db.add_all(jobs)
    db.flush()

    # 7. Đơn ứng tuyển (candidate 1 ứng tuyển tin công khai đầu tiên)
    db.add(Application(job_id=jobs[0].id, candidate_id=candidates[0].id, cover_letter="Xin chào, tôi rất mong muốn ứng tuyển vị trí này."))

    db.commit()
    db.close()

    print("\n=== Seed xong. Tai khoan demo ===")
    print("Admin     : admin@example.com     / Admin@123")
    print("Employer  : employer1@example.com / Employer@123")
    print("Employer  : employer2@example.com / Employer@123")
    print("Candidate : candidate1@example.com / Candidate@123")
    print("Candidate : candidate2@example.com / Candidate@123")


if __name__ == "__main__":
    seed()
