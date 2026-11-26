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
# Đặt JWT_SECRET_KEY thành một khóa ngẫu nhiên trong .env
uvicorn app.main:app --reload
```
Swagger http://localhost:8000/docs · Ứng viên http://localhost:8000/candidate-web/

### Frontend
```bash
cd front_end
npm install
cp .env.example .env  # Windows: copy .env.example .env
npm run dev
```
Web http://localhost:5173 · Nhà tuyển dụng và quản trị mở từ menu. Nút Candidate mở giao diện phục vụ bởi FastAPI.

## Nâng cấp database đã dùng

Migration bổ sung các cột việc làm còn thiếu và `users.auth_version`.
Với database hiện có, sao lưu và dừng backend trước khi cập nhật. Chạy lệnh
sau từ thư mục `back_end` với cùng `DATABASE_URL` cấu hình cho backend:

```bash
python -m scripts.migrate_job_fields
```

Sau đó khởi động lại backend để tạo các bảng còn thiếu. Có thể chạy migration
nhiều lần. Với database mới, backend tạo đầy đủ bảng khi khởi động.

## Database MySQL
Mặc định backend dùng SQLite để có thể chạy ngay. Khi dùng MySQL, tạo database `job_platform`, cài MySQL server và sửa `DATABASE_URL` trong `back_end/.env`:
`mysql+pymysql://job_app:<mat-khau>@localhost:3306/job_platform?charset=utf8mb4`

Tạo tài khoản MySQL riêng cho ứng dụng. Khi nâng cấp, chạy migration trên
database đã sao lưu. Cấu hình `UPLOAD_DIR` trên ổ lưu trữ bền vững và sao lưu
cả thư mục CV cùng database.

## Tạo tài khoản quản trị

Từ `back_end`, chạy `python -m scripts.create_admin admin@example.com` và
nhập mật khẩu khi được nhắc. Lệnh thêm tài khoản vào database được cấu hình.
Dùng màn hình quản trị để thêm ngành nghề và duyệt tin. Nhà tuyển dụng tự
đăng ký từ màn hình đăng nhập.

Khi triển khai chung tên miền, build React với `VITE_API_BASE_URL=/api/v1`
và chuyển tiếp cả `/api/v1/` và `/candidate-web/` đến FastAPI. Giữ
`front_end_candidate/` cạnh `back_end/` trên máy chủ.

## Phân công
- TV1 Scrum Master & Backend Lead: architecture, auth/RBAC, review, migrations, CI.
- TV2 Backend Developer: profile, jobs, search, applications API.
- TV3 Frontend Lead (Candidate): đăng ký/đăng nhập, hồ sơ, tìm việc, ứng tuyển.
- TV4 Frontend Developer (Employer & Admin): đăng tin, quản lý tin, quản lý ứng viên, admin.

## Cấu trúc
`docs/ERD.md` sơ đồ Mermaid; `docs/SCHEMA.sql` DDL MySQL; `docs/API_CONTRACT.md` API dự kiến; `docs/TEAM_WORKFLOW.md` workflow.

## Nghiệp vụ MVP

Ứng viên quản lý hồ sơ, học vấn, kinh nghiệm và CV, tìm việc, lưu việc và
theo dõi đơn. Nhà tuyển dụng cập nhật công ty, đăng tin và xử lý hồ sơ ứng
tuyển. Quản trị viên quản lý ngành nghề, duyệt tin và khóa hoặc mở khóa tài
khoản. Swagger mô tả các endpoint và quyền truy cập.
