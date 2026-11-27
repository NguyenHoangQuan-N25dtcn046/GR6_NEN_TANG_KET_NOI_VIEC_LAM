# Candidate API Integration — bản cập nhật 27/11/2026

Chạy theo `README.md` ở thư mục gốc; triển khai máy chủ theo `DEPLOYMENT.md`. Candidate cổng 5174, React cổng 5173, FastAPI cổng 8000. CORS cần cho phép cả hai origin. Không dùng 127.0.0.1 thay localhost nếu chưa cấu hình CORS.

## Contract
- Auth: register/login/me/logout; JWT Bearer trong sessionStorage.
- Hồ sơ: GET/PATCH `/candidate/profile`, email từ `/auth/me`.
- Kinh nghiệm: GET/POST `/candidate/experiences`, PATCH/DELETE `/candidate/experiences/{id}`.
- Học vấn: GET/POST `/candidate/educations`, PATCH/DELETE `/candidate/educations/{id}`.
- Công việc: GET `/jobs`, `/jobs/{id}`. Lọc địa điểm, ID ngành, khoảng lương qua API; một work mode qua API, nhiều work mode theo OR tại client. Từ khóa tìm tên công việc, công ty, mô tả, địa điểm trên các trang dữ liệu API đã tải. Chỉ lọc khi nhấn nút. Đơn vị VNĐ theo dữ liệu seed và UI Employer; API schema không khai báo tiền tệ.
- CV: POST/GET `/candidate/cv`, PDF/DOCX tối đa 5 MiB.
- Ứng tuyển: POST `/jobs/{id}/applications` với `cover_letter`, `cv_url`. Có thể dùng CV đã lưu hoặc upload mới; upload và gửi đơn là hai thao tác riêng.
- Lịch sử: GET `/candidate/applications`, submitted/reviewing/accepted/rejected.

## Giới hạn
Backend chưa cung cấp danh mục tên ngành, loại hình toàn thời gian/bán thời gian, yêu cầu kinh nghiệm, trạng thái interview, bookmark, contact/newsletter. Không giả lập API. Admin duyệt theo ID. Chưa kiểm thử E2E trên Windows.

## Git
Chỉ đưa `front_end_candidate/` vào nhánh TV3 sau khi kiểm thử. Hai file React và `.env.example` thuộc TV4, cần thống nhất trước khi đưa vào master. Không commit dữ liệu, secret, môi trường ảo hay node_modules.
