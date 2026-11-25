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
    CandidateProfile,
    EmployerProfile,
    Job,
    JobCategory,
    RevokedToken,
    User,
)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Xóa dữ liệu cũ (thứ tự: con trước, cha sau)
    for model in [Application, Job, CandidateProfile, EmployerProfile, JobCategory, RevokedToken, User]:
        db.query(model).delete()
    db.commit()
    print("Da xoa du lieu cu.")

    # 2. Admin
    admin = User(
        email="admin@example.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
        is_active=True,
    )
    db.add(admin)

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
        user = User(
            email=f"employer{i}@example.com",
            password_hash=hash_password("Employer@123"),
            role="employer",
            is_active=True,
        )
        db.add(user)
        db.flush()
        profile = EmployerProfile(
            user_id=user.id,
            company_name=f"Công ty {i}",
            company_website=f"https://company{i}.example.com",
            description=f"Mô tả công ty {i}",
        )
        db.add(profile)
        employers.append(profile)

    # 5. Candidate + hồ sơ
    candidates = []
    for i in range(1, 3):
        user = User(
            email=f"candidate{i}@example.com",
            password_hash=hash_password("Candidate@123"),
            role="candidate",
            is_active=True,
        )
        db.add(user)
        db.flush()
        profile = CandidateProfile(
            user_id=user.id,
            full_name=f"Ứng viên {i}",
            phone="0900000000",
            skills="Python, FastAPI, SQL",
        )
        db.add(profile)
        candidates.append(profile)

    db.flush()

    # 6. Tin tuyển dụng (đủ 4 trạng thái)
    job_specs = [
        (employers[0], "Kỹ sư Backend Python", "published", "Công nghệ thông tin", "Hà Nội"),
        (employers[0], "Nhân viên Marketing", "pending", "Marketing / Truyền thông", "Hà Nội"),
        (employers[1], "Kế toán viên", "published", "Kế toán / Tài chính", "Đà Nẵng"),
        (employers[1], "Nhân viên kinh doanh", "closed", "Kinh doanh / Bán hàng", "Hà Nội"),
    ]
    jobs = []
    for emp, title, status, cat, location in job_specs:
        job = Job(
            employer_id=emp.id,
            category_id=categories[cat].id,
            title=title,
            description=f"Mô tả công việc: {title}.",
            location=location,
            salary_min=10000000,
            salary_max=25000000,
            status=status,
        )
        db.add(job)
        jobs.append(job)

    db.flush()

    # 7. Đơn ứng tuyển (candidate 1 ứng tuyển tin published đầu tiên)
    db.add(
        Application(
            job_id=jobs[0].id,
            candidate_id=candidates[0].id,
            cover_letter="Xin chào, tôi rất mong muốn ứng tuyển vị trí này.",
            cv_url=None,
        )
    )

    db.commit()
    db.close()

    print("\n=== Seed xong. Tài khoản demo ===")
    print("Admin     : admin@example.com     / Admin@123")
    print("Employer  : employer1@example.com / Employer@123")
    print("Employer  : employer2@example.com / Employer@123")
    print("Candidate : candidate1@example.com / Candidate@123")
    print("Candidate : candidate2@example.com / Candidate@123")


if __name__ == "__main__":
    seed()
