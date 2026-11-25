# Kiểm thử và response API

Chạy từ thư mục gốc repository bằng PowerShell:

```powershell
.\.job_connect_venv\Scripts\python.exe -m pip install -r back_end/requirements-dev.txt
.\.job_connect_venv\Scripts\python.exe -m pytest back_end/tests -q
```

Test dùng SQLite trong bộ nhớ, bật kiểm tra foreign key, ghi đè dependency DB và không chạy startup trên DB cấu hình trong `.env`. Mỗi test có dữ liệu riêng. Không thay đổi dữ liệu thật.

## Quy ước response

Các API auth và job đã triển khai trả tài nguyên trực tiếp; không bọc thành `{message, data}`. Giữ nguyên URL hiện tại để tránh thay đổi client không cần thiết.

| Thao tác | HTTP status | Body thành công |
|---|---|---|
| POST `/api/v1/auth/register` | 201 | User: `id`, `email`, `role`, `is_active` |
| POST `/api/v1/auth/login` | 200 | `access_token`, `token_type` |
| GET `/api/v1/auth/me` | 200 | User |
| POST `/api/v1/auth/logout` | 204 | Không có body |
| GET `/api/v1/jobs` | 200 | Mảng tin đã duyệt và đang mở |
| PATCH `/api/v1/jobs/{id}` | 200 | Job sau cập nhật |
| PATCH `/api/v1/jobs/{id}/status` | 200 | Job sau cập nhật |
| PATCH `/api/v1/admin/jobs/{id}/approve` | 200 | Job sau duyệt |
| PATCH `/api/v1/admin/jobs/{id}/reject` | 200 | Job sau từ chối |

Job trả về các trường công khai cùng `employer_id`, `approval_status`, `job_status`, `rejection_reason`. `employer_id` là ID hồ sơ doanh nghiệp, không phải ID tài khoản.

Lỗi dùng `Content-Type: application/problem+json`, áp dụng cả lỗi routing và validation:

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "Bạn không sở hữu tin tuyển dụng này",
  "instance": "/api/v1/jobs/2"
}
```

- `400`: PATCH không có trường cần cập nhật.
- `401`: thiếu/sai/hết hạn/đã thu hồi JWT hoặc sai thông tin đăng nhập; có header `WWW-Authenticate: Bearer`.
- `403`: sai vai trò, không sở hữu tin hoặc tài khoản bị vô hiệu hóa.
- `404`: tài nguyên/đường dẫn không tồn tại.
- `405`: sai HTTP method, giữ header `Allow`.
- `409`: email trùng hoặc trạng thái không cho phép thao tác.
- `422`: dữ liệu không hợp lệ; lỗi validation có thêm `errors` chứa `location`, `message`, `code`, không trả lại input nhạy cảm.
- `500`: thông báo chung, chi tiết exception chỉ được log ở server.

Frontend cần đọc `id` thay cho `job_id`, `rejection_reason` thay cho `reason` trong response job; không gọi `response.json()` khi logout trả `204`. Request từ chối vẫn gửi `{ "reason": "..." }`. Response lỗi có `detail` dạng chuỗi và `errors` riêng cho validation.

Các endpoint dashboard/danh sách người dùng/ứng tuyển/tạo tin đang là placeholder từ source ban đầu; thay đổi này không triển khai nghiệp vụ còn thiếu ở các endpoint đó.

## Database cũ

`create_all()` không thay đổi cột đã tồn tại. Đã cung cấp migration tường minh cho bảng `jobs`:

1. Sao lưu database và dừng ứng dụng đang ghi dữ liệu.
2. Cài dependencies mới bằng lệnh phía trên.
3. Kiểm tra `DATABASE_URL` trong `back_end/.env` đúng database cần nâng cấp.
4. Chạy từ thư mục `back_end`:

```powershell
..\.job_connect_venv\Scripts\python.exe -m scripts.migrate_job_fields
```

Migration đổi cột `True` thành `rejection_reason`, cho phép NULL; bổ sung `approval`/`job_status` nếu thiếu và chuyển trạng thái cũ khi bổ sung. Model dùng thuộc tính Python `approval_status` ánh xạ tới cột DB `approval`. Nếu đã có `approval`, giữ nguyên quyết định duyệt hiện có. Nếu đồng thời có cả tên cột cũ và mới, migration dừng để tránh mất dữ liệu.

Migration đã được kiểm tra trên SQLite với schema cũ và schema lỗi, bao gồm chạy hai lần. Chưa chạy trên DB thực tế hoặc kiểm thử tích hợp MySQL. Script chỉ nâng cấp các trường job; không thay thế hệ thống migration đầy đủ cho mọi khác biệt schema cũ.
