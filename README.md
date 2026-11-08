# GR6 — Nền tảng kết nối việc làm

Bản nền phát triển cho nhóm 6, gồm API FastAPI, giao diện React/Vite, phân quyền Ứng viên/Nhà tuyển dụng/Admin và các màn hình Ứng viên. Các tuyến giao diện TV4 đã có kiểm tra vai trò và sẽ nhận phần triển khai từ nhánh `feat/tv4-employer-admin`.

## Chạy trên Windows

Yêu cầu Python 3.12+, Node.js 22 LTS và npm. Chạy hai cửa sổ PowerShell từ thư mục dự án.

**Cửa sổ 1 — Backend**

```powershell
Set-Location backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(32))"
```

Mở `backend/.env`, điền khóa vừa sinh vào `JWT_SECRET_KEY`. Mẫu dùng SQLite cục bộ, không cần cài máy chủ cơ sở dữ liệu. Để dùng MySQL hoặc tạo tài khoản Admin thử, xem [hướng dẫn backend](backend/README.md).

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Kiểm tra [API health](http://localhost:8000/api/health) và [Swagger](http://localhost:8000/docs).

**Cửa sổ 2 — Frontend**

```powershell
Set-Location frontend
npm ci
npm run dev
```

Mở [giao diện cục bộ](http://localhost:5173). Chạy `npm run build` trong `frontend` để kiểm tra bản build trước khi gửi Pull Request.

## Làm việc nhóm

- Tạo nhánh công việc từ `main`. Push nhánh và mở Pull Request vào `main`.
- Giữ `.env`, tệp CV, dữ liệu SQLite, thư mục môi trường và bản build trên máy. Chỉ chia sẻ mẫu cấu hình qua `.env.example`.
- Đây là bản nền phát triển cục bộ. Chỉ dùng CV giả. API hiện còn các lỗi về quyền duyệt tin, truy cập chi tiết tin chưa duyệt và phân quyền tải CV. Xử lý các lỗi này trước khi đưa hệ thống lên môi trường công khai hoặc nhập dữ liệu thật.
