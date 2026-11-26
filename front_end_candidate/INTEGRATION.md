# Candidate API Integration — TV3
Nguồn backend: master 3cd7382b53c0e3a701610ca9a919dccf6e944fec; nguồn Candidate: origin/feat/tv3-frontend 9206a272e9eaba1921f04b6227c91b1ffd866118 trong ZIP người dùng gửi. Chỉ sửa front_end_candidate.

## Chạy local (Windows PowerShell)
Tại thư mục repository có back_end và front_end_candidate, terminal 1:
```
cd back_end
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# Chỉ tạo .env nếu chưa tồn tại
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Đổi JWT_SECRET_KEY trong .env thành chuỗi ngẫu nhiên riêng; không commit .env.
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host localhost --port 8000
```
Terminal 2, từ thư mục repository:
```
cd front_end_candidate
python -m http.server 5173 --bind localhost
```
Mở http://localhost:5173/ (không dùng 127.0.0.1 hay Live Server 5500 nếu CORS chưa thêm origin). Swagger http://localhost:8000/docs. Health http://localhost:8000/api/v1/health. Không chạy React/Vite cùng cổng 5173.

## Contract đã dùng
- POST /auth/register: email, password, role=candidate, full_name. POST /auth/login: email/password; access_token. GET /auth/me; POST /auth/logout.
- GET/PATCH /candidate/profile: full_name, phone, skills (chuỗi). Email từ /auth/me. Học vấn/kinh nghiệm chưa có schema, khóa chỉnh sửa.
- GET /jobs?q=&location=&category_id=&limit=&offset=; GET /jobs/{id}. Lọc lương phía client; không có đơn vị lương trong schema. Không có tên ngành, loại hình, kinh nghiệm, work mode; lọc ID ngành thay cho checkbox tên ngành; các trường không hỗ trợ bị khóa. API q tìm title/description/location, không tìm tên công ty.
- POST /candidate/cv: multipart file, PDF tối đa 5 MiB; GET /candidate/cv: PDF có Bearer token.
- POST /jobs/{id}/applications: JSON cover_letter, CV lấy từ hồ sơ. Form hiện upload PDF mới trước khi gửi; thao tác này thay CV hồ sơ và không có transaction chung với gửi đơn. Thông báo rõ nếu upload thành công nhưng gửi đơn lỗi.
- GET /candidate/applications: submitted, reviewing, accepted, rejected. Không có interview trong schema cập nhật trạng thái.
- JWT lưu sessionStorage theo tab để giữ phiên qua MPA, không lưu mật khẩu; cần đánh giá XSS và cơ chế bảo mật production với nhóm.
- Không fallback dữ liệu mẫu khi API lỗi. Các phần marketing, liên hệ, newsletter vẫn là giao diện minh họa ngoài phạm vi API Candidate.

## Checklist tích hợp (chưa xác nhận E2E)
1. Health OK, Swagger mở, không lỗi CORS.
2. Đăng ký email mới + họ tên; thử trùng email; đăng nhập sai/đúng; kiểm tra tài khoản employer bị từ chối.
3. Xem profile, lưu tên/phone/skills, reload kiểm tra lưu thật.
4. Upload PDF hợp lệ, xem CV đã lưu sau reload; từ chối DOCX, file >5 MiB.
5. Backend cần có job approved/open; danh sách và chi tiết đúng ID; thử ID sai.
6. Chọn từ khóa, địa điểm, ID ngành và lương; chỉ áp dụng khi bấm lọc; xóa lọc, phân trang.
7. Chọn job, ứng tuyển PDF + lời nhắn; xác nhận mã đơn thật; thử gửi trùng (409).
8. Mở lịch sử, xem đơn mới; nhờ Employer chuyển reviewing/accepted/rejected rồi tải lại.
9. Logout; thử mở trang riêng tư, hết hạn token; xác nhận API từ chối.
10. Kiểm tra mobile, Console, Network; chạy lại các test giao diện còn phù hợp. Test DOCX và trạng thái interview cũ phải cập nhật theo contract mới.

## Git
Chỉ copy thư mục front_end_candidate từ ZIP vào clone nhánh TV3 đã có. Backup/commit trước khi thay. git add front_end_candidate/; git diff --cached --stat; git commit; git push origin feat/tv3-frontend. PR #8 nếu còn mở sẽ tự cập nhật. Không ghi đè back_end/front_end; không force push.
