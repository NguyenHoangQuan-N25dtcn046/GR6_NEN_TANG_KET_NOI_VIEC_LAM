# Nền tảng kết nối việc làm — Nhóm 6

Monorepo MVP: React/Vite (`front_end`) + FastAPI/SQLAlchemy (`back_end`).

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
Web: http://localhost:5173

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
Đây là **khung khởi tạo chạy được** với health check và danh sách việc làm công khai. Các màn hình và endpoint nghiệp vụ khác là placeholder/TODO, không phải sản phẩm hoàn chỉnh.
