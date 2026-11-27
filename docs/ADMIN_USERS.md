# Admin — Quản lý người dùng

Phạm vi SRS 2.4: khóa/mở khóa tài khoản ứng viên hoặc nhà tuyển dụng vi phạm. Bổ sung danh sách có phân trang, tìm email, lọc vai trò/trạng thái và xác nhận thao tác. Không xóa tài khoản, không đổi vai trò, không sửa mật khẩu hoặc khóa Admin. Không thay đổi schema database: dùng `users.is_active` hiện có. Không cần migration riêng cho module này.

## API (tiền tố `/api/v1`)

Cả hai endpoint yêu cầu JWT Bearer của Admin đang hoạt động. Không có token: 401; không đủ quyền hoặc tài khoản bị khóa: 403.

- `GET /admin/users?q=abc&role=candidate&is_active=true&limit=20&offset=0`: tham số tùy chọn, limit từ 1 đến 100, offset không âm. `q` tìm email không phân biệt hoa thường; lọc role `candidate`, `employer`, `admin`; trạng thái `true` hoặc `false`. Trả object `{items, total, limit, offset}`; items gồm `id`, `email`, `role`, `is_active`, `created_at`, không có password_hash/token. Sắp xếp ID giảm dần.
- `PATCH /admin/users/{user_id}/status` với JSON `{"is_active": false}` để khóa, `true` để mở. Trả thông tin tài khoản đã cập nhật. Không tồn tại: 404; tài khoản Admin: 403; body không hợp lệ: 422. Thao tác lặp lại cùng trạng thái không xóa dữ liệu.

Auth hiện tại kiểm tra `is_active` khi đăng nhập và mỗi request cần xác thực. Khi khóa, các access token hiện có cũng bị từ chối trong thời gian tài khoản bị khóa. Khi mở khóa, access token cũ chưa hết hạn và chưa bị thu hồi có thể dùng lại; module này không triển khai thu hồi vĩnh viễn toàn bộ phiên. Không tự động ẩn các tin tuyển dụng đã đăng hoặc xóa hồ sơ/đơn ứng tuyển của tài khoản bị khóa.

## Giao diện

Local: `http://localhost:5173/admin/users`. Cloud: `https://<domain>/admin/users`. Đăng nhập Admin, dùng mục Quản lý người dùng. Chọn bộ lọc và bấm Tìm kiếm / Lọc. Nhấn Khóa hoặc Mở khóa, xác nhận; danh sách được tải lại từ server. Không sử dụng dữ liệu giả.

## Kiểm thử

Trong `back_end`, sau khi cài dependencies từ requirements.txt:

```bash
python -m pytest -q tests/test_admin_users.py
python -m pytest -q
```

Ở frontend chạy `npm ci` và `npm run build` trong `front_end`. Kiểm tra thực tế bằng tài khoản Admin đã được tạo an toàn và hai tài khoản thử Candidate/Employer. Không chạy seed trên database thật, không sử dụng mật khẩu mẫu public.

1. Admin thấy danh sách, tìm email, lọc vai trò/trạng thái và phân trang.
2. Khóa Candidate; đăng nhập Candidate bị từ chối, JWT đã cấp gọi `/auth/me` trả 403.
3. Mở khóa; Candidate đăng nhập lại thành công. Lặp lại với Employer.
4. Candidate và Employer gọi API Admin bị 403; không token bị 401.
5. Không khóa được Admin; ID không tồn tại trả 404; payload sai trả 422. Không có password_hash trong response.

## Giới hạn

Chưa bổ sung audit log, thu hồi vĩnh viễn tất cả phiên, thống kê dashboard, đổi mật khẩu hoặc trang quản lý công ty. Bản cập nhật không thay thế kiểm thử hồi quy, HTTPS và rà soát bảo mật trước khi vận hành thật.
