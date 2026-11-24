# API contract dự kiến — `/api/v1`

| Method | Endpoint | Role | Trạng thái |
|---|---|---|---|
| GET | `/health` | Public | Đã có |
| GET | `/jobs?q=&location=&category_id=&limit=&offset=` | Public | Đã có (chỉ published, phân trang + tìm kiếm) |
| POST | `/auth/register` | Public | Đã có (TV1) |
| POST | `/auth/login` | Public | Đã có (TV1) |
| GET/PATCH | `/candidate/profile` | Candidate | Đã có (TV2) |
| POST | `/candidate/cv` | Candidate | Đã có (TV2) |
| GET | `/candidate/applications` | Candidate | Đã có (TV2) |
| POST | `/jobs/{id}/applications` | Candidate | Đã có (TV2) |
| GET/POST | `/employer/jobs` | Employer | Đã có (TV2) |
| PATCH/DELETE | `/employer/jobs/{id}` | Employer owner | Đã có (TV2) |
| GET | `/employer/jobs/{id}/applications` | Employer owner | Đã có (TV2) |
| PATCH | `/employer/jobs/{id}/applications/{application_id}` | Employer owner | Đã có (TV2) |
| GET | `/admin/jobs` | Admin | TODO TV1 |
| PATCH | `/admin/jobs/{id}/moderation` | Admin | TODO TV1 |

**Đã triển khai (TV2):** CRUD hồ sơ ứng viên, upload CV (kiểm tra MIME/kích thước/magic bytes), tạo tin tuyển dụng + sửa/xóa/đóng, tạo đơn ứng tuyển (chống gửi trùng, chỉ tin `published` chưa hết hạn), lịch sử đơn của ứng viên, xem/xử lý đơn của employer (chỉ tin sở hữu), danh sách tin + tìm kiếm/phân trang.

**Chưa triển khai:** admin moderation (TV1).
