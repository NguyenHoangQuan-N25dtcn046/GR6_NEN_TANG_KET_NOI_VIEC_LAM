# Nền tảng kết nối việc làm — Nhóm 6

Monorepo MVP: Candidate HTML/CSS/JS (`front_end_candidate`), Employer/Admin React/Vite (`front_end`) và FastAPI/SQLAlchemy (`back_end`).

## Chạy nhanh (SQLite cho phát triển)

### Backend
```bash
cd back_end
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Windows: copy .env.example .env
uvicorn app.main:app --reload
```
API: http://localhost:8000/docs ; Health: http://localhost:8000/api/v1/health

### Frontend
```bash
cd front_end
npm install
cp .env.example .env  # Windows: copy .env.example .env
npm run dev
```
Web Employer/Admin: http://localhost:5173

### Candidate
```bash
cd front_end_candidate
python -m http.server 5174 --bind localhost
```
Web Candidate: http://localhost:5174. Cấu hình backend `CORS_ORIGINS=http://localhost:5173,http://localhost:5174` cho local.

Triển khai cloud Linux: xem `DEPLOYMENT.md`.

## Nâng cấp database đã dùng

Phiên bản này thêm cột `jobs.work_mode` và hai bảng hồ sơ ứng viên.
Với database hiện có, sao lưu và dừng backend trước khi cập nhật. Chạy lệnh
sau từ thư mục `back_end` với cùng `DATABASE_URL` cấu hình cho backend:

```bash
python -m scripts.migrate_job_fields
```

Sau đó khởi động lại backend để tạo hai bảng mới. Có thể chạy migration
nhiều lần. Với database mới, backend tạo đầy đủ bảng khi khởi động.

## Database MySQL
Mặc định backend dùng SQLite để có thể chạy ngay. Khi dùng MySQL, tạo database `job_platform`, cài MySQL server và sửa `DATABASE_URL` trong `back_end/.env`:
`mysql+pymysql://root:password@localhost:3306/job_platform?charset=utf8mb4`

**Lưu ý:** `Base.metadata.create_all()` trong starter chỉ dành cho local development. Trước khi triển khai thật cần Alembic migrations, JWT auth, RBAC, validation nghiệp vụ, upload CV an toàn, test và CI.

## Phân công
- TV1 Scrum Master & Backend Lead: architecture, auth/RBAC, review, migrations, CI.
- TV2 Backend Developer: profile, jobs, search, applications API.
- TV3 Frontend Lead (Candidate): đăng ký/đăng nhập, hồ sơ, tìm việc, ứng tuyển.
- TV4 Frontend Developer (Employer & Admin): đăng tin, quản lý tin, quản lý ứng viên, admin.

## Cấu trúc
`docs/ERD.md` sơ đồ Mermaid; `docs/SCHEMA.sql` DDL MySQL; `docs/API_CONTRACT.md` API dự kiến; `docs/TEAM_WORKFLOW.md` workflow.

## Trạng thái
MVP đã có các luồng Auth, Candidate, Employer, Admin duyệt tin. Admin quản lý người dùng đã có danh sách, lọc và khóa/mở khóa Candidate/Employer tại `/admin/users`. Một số tính năng khác theo SRS vẫn chưa hoàn thiện; cần kiểm thử tích hợp trước khi bàn giao. Xem `docs/ADMIN_USERS.md`.
