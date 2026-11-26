# API hiện hành dưới /api/v1

Swagger tại `/docs` mô tả payload và response chi tiết. Các API có vai trò
yêu cầu Bearer JWT. Phản hồi lỗi dùng `application/problem+json`.

| Method | Endpoint | Quyền | Nghiệp vụ |
|---|---|---|---|
| GET | `/health` | Công khai | Sức khỏe API |
| POST | `/auth/register`, `/auth/login` | Công khai | Đăng ký ứng viên hoặc nhà tuyển dụng, đăng nhập |
| GET, POST, PATCH | `/auth/me`, `/auth/logout`, `/auth/password` | Đã đăng nhập | Phiên và đổi mật khẩu |
| GET | `/jobs`, `/jobs/categories`, `/jobs/{id}` | Công khai | Tìm kiếm, ngành nghề và chi tiết tin đã duyệt |
| GET, PATCH | `/candidate/profile` | Ứng viên | Hồ sơ cá nhân |
| GET, POST | `/candidate/cv` | Ứng viên | Tải xuống và tải lên PDF hoặc DOCX |
| GET, POST | `/candidate/experiences`, `/candidate/educations` | Ứng viên | Xem và thêm thông tin hồ sơ |
| PATCH, DELETE | `/candidate/experiences/{id}`, `/candidate/educations/{id}` | Ứng viên sở hữu | Sửa và xóa thông tin hồ sơ |
| POST | `/jobs/{id}/applications` | Ứng viên | Nộp đơn với CV trong hồ sơ |
| GET | `/candidate/applications`, `/candidate/applications/{id}` | Ứng viên sở hữu | Lịch sử và chi tiết đơn |
| GET, PUT, DELETE | `/candidate/saved-jobs` và `/candidate/saved-jobs/{id}` | Ứng viên | Xem, lưu và bỏ lưu tin |
| GET, PATCH | `/employer/profile` | Nhà tuyển dụng | Hồ sơ công ty |
| GET, POST | `/employer/jobs` | Nhà tuyển dụng | Danh sách tin của mình và tạo tin |
| GET, DELETE | `/employer/jobs/{id}` | Nhà tuyển dụng sở hữu | Xem hoặc xóa tin chưa có đơn |
| PATCH | `/jobs/{id}`, `/jobs/{id}/status` | Nhà tuyển dụng sở hữu | Sửa và đóng hoặc mở tin |
| GET | `/employer/jobs/{id}/applications` | Nhà tuyển dụng sở hữu | Danh sách đơn |
| PATCH | `/employer/jobs/{id}/applications/{application_id}` | Nhà tuyển dụng sở hữu | Đổi trạng thái đơn |
| GET | `/employer/jobs/{id}/applications/{application_id}/cv` | Nhà tuyển dụng sở hữu | Tải CV đã nộp |
| GET | `/admin/jobs`, `/admin/jobs/{id}` | Quản trị | Danh sách, hàng chờ và chi tiết |
| PATCH | `/admin/jobs/{id}/approve`, `/admin/jobs/{id}/reject` | Quản trị | Duyệt hoặc từ chối tin |
| GET, PATCH | `/admin/users`, `/admin/users/{id}` | Quản trị | Xem danh sách, khóa hoặc mở khóa tài khoản |
| POST | `/admin/categories` | Quản trị | Thêm ngành nghề |

`GET /jobs` hỗ trợ `q`, `location`, `category_id`, `salary_min` và
`salary_max`, cùng `work_mode`, `job_type` và `experience` có thể lặp
trong query để chọn nhiều giá trị. `experience` nhận `0-1`, `2-3` hoặc
`4+`. Các danh sách phân trang dùng `limit` và `offset`.

Tin đã nộp đơn chỉ có thể đóng, API xóa trả `409`. Đơn trùng cũng trả
`409`. Đổi mật khẩu và thay đổi trạng thái tài khoản làm phiên cũ mất
hiệu lực. Admin được tạo từ máy chủ bằng `python -m scripts.create_admin`.
