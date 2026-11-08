# Job Matching Platform — Backend (FastAPI + MySQL)

RESTful API kết nối Ứng viên và Nhà tuyển dụng.

## Tech stack
- Python 3.12+ / FastAPI
- SQLAlchemy 2.0 + MySQL (PyMySQL)
- JWT (PyJWT) + Bcrypt

## Cài đặt

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Cấu hình

```bash
copy .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

## Chạy

```bash
uvicorn app.main:app --reload
```

Docs: http://localhost:8000/docs

Điền khóa vừa tạo vào `JWT_SECRET_KEY` trong `.env`. Cấu hình mẫu dùng SQLite để chạy trên máy cá nhân. Với MySQL, tạo cơ sở dữ liệu trước, để trống `DATABASE_URL` và điền nhóm `DB_*`.

## Tài khoản Admin cho môi trường thử

Điền cả `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env` nếu cần khởi tạo Admin. Mật khẩu phải có ít nhất 12 ký tự và tối đa 72 byte UTF-8. Bỏ trống cả hai để chạy mà không tạo Admin. Thay đổi các biến này không đổi mật khẩu của tài khoản đã tồn tại.

## Cấu trúc mô-đun

```
app/
  core/        config, database, security (JWT + bcrypt)
  models/      users, candidates, companies, jobs, applications
  schemas/     Pydantic request/response
  api/
    deps.py    get_current_user, require_role (JWT middleware)
    routes/    auth, jobs, candidate, employer, admin
  services/    cv_service (upload/validate CV)
```

## Các API chính

| Method | Path | Vai trò | Mô tả |
|---|---|---|---|
| POST | /api/auth/register | public | Đăng ký (candidate/employer) |
| POST | /api/auth/login | public | Đăng nhập → JWT |
| POST | /api/auth/change-password | all | Đổi mật khẩu |
| GET | /api/jobs | public | Danh sách việc làm + lọc |
| GET | /api/jobs/{id} | public | Chi tiết việc làm |
| POST | /api/jobs | employer | Đăng tin |
| PUT | /api/jobs/{id} | employer | Sửa tin |
| POST | /api/jobs/{id}/apply | candidate | Nộp CV |
| GET | /api/candidate/applications | candidate | Lịch sử ứng tuyển |
| GET/PUT | /api/candidate/profile | candidate | Hồ sơ ứng viên |
| POST | /api/candidate/cv | candidate | Upload CV (PDF/Docx ≤ 5MB) |
| GET/PUT | /api/employer/company | employer | Hồ sơ công ty |
| GET | /api/employer/jobs | employer | Việc làm của tôi |
| GET | /api/employer/jobs/{id}/applications | employer | DS ứng viên |
| PATCH | /api/applications/{id}/status | employer | Cập nhật trạng thái |
| PATCH | /api/admin/jobs/{id}/status | admin | Duyệt / từ chối bài |
| PATCH | /api/admin/users/{id}/lock | admin | Khóa tài khoản |
| GET | /api/admin/stats | admin | Thống kê |
