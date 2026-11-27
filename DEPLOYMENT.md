# Triển khai GR6 trên cloud Linux

Bản source này không có trang điều hướng hoặc script khởi chạy trình diễn. Backend bổ sung API quản lý người dùng Admin. Mẫu cấu hình dành cho Ubuntu, Nginx và FastAPI, giả định source ở `/opt/gr6`. Điều chỉnh theo máy chủ thực tế; chưa kiểm thử trên VPS.

## Cấu hình
- Cài Git, Python 3.11+ và venv, Node.js tương thích Vite 6 (ví dụ Node 22), Nginx.
- Backend: tạo môi trường ảo, cài `requirements.txt`, tạo `.env` từ `.env.example` và đặt JWT_SECRET_KEY ngẫu nhiên mạnh (`python3 -c 'import secrets; print(secrets.token_hex(32))'`). Không công khai secret. DATABASE_URL và UPLOAD_DIR nên trỏ vào thư mục dữ liệu bền vững ngoài web root, chỉ tài khoản dịch vụ backend được ghi. Giới hạn CORS theo origin HTTPS thực tế.
- Frontend React: `cd /opt/gr6/front_end && npm ci && npm run build`. `.env.production` dùng `/api/v1` và `/` cùng origin. Không cần chạy Vite dev server trên VPS.
- Candidate: phục vụ trực tiếp `front_end_candidate/`. Cấu hình JS chọn API cùng origin khi deploy.
- Chạy backend từ `back_end` bằng `.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`. Thiết lập systemd với tài khoản không phải root, WorkingDirectory đúng, tự khởi động lại và quyền thư mục dữ liệu phù hợp.
- Mẫu Nginx ở `deploy/nginx-gr6.conf`: thay đường dẫn và server_name, kiểm tra `nginx -t` trước khi bật. Cho phép Nginx đọc frontend, không cấp quyền truy cập thư mục backend qua web. Nginx chuyển API tới 127.0.0.1:8000. Cấu hình HTTPS bằng chứng chỉ hợp lệ trước khi sử dụng tài khoản/CV thật. Mở SSH, HTTP, HTTPS trong firewall phù hợp; không mở 8000 ra Internet.
- Không chạy `back_end/scripts/seed.py` trên database thật: script xóa dữ liệu và tạo tài khoản mật khẩu mẫu. File là công cụ dev sẵn có của nhóm, không được gọi khi triển khai. Nhờ backend lead tạo tài khoản Admin và ngành nghề ban đầu an toàn trên database mới. Sao lưu database, CV và thực hiện migration nếu cập nhật database đã tồn tại.

## Kiểm tra
`/` (Candidate), `/employer/jobs`, `/admin/jobs`, `/api/v1/health`. Kiểm thử đăng nhập, upload, ứng tuyển và cập nhật trạng thái bằng dữ liệu kiểm thử trước khi mở quyền truy cập. Admin duyệt tin theo ID; quản lý người dùng tại `/admin/users`. Kiểm tra quyền Admin và khóa/mở khóa theo `docs/ADMIN_USERS.md`. Các chức năng khác chưa hỗ trợ xem INTEGRATION.md. Đây không phải xác nhận production-ready.
