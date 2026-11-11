# Quy trình nhóm 4 thành viên

- `main`: nhánh ổn định; merge qua Pull Request.
- `develop`: nhánh tích hợp nếu nhóm cần; tránh làm phức tạp quy trình nếu thời gian gấp.
- Nhánh công việc: `feature/AUTH-01-register`, `feature/JOB-01-crud`, `fix/...`.
- PR ghi Task ID, mô tả, ảnh chụp UI hoặc kết quả API, checklist test.
- TV1 review backend và điều phối; TV3 review Candidate UI; TV4 review Employer/Admin UI.
- Daily sync 10–15 phút; tích hợp API mỗi ngày; không chờ đến ngày cuối.
- Sprint 1: ngày 1–5 (auth/profile/job); Sprint 2: ngày 6–11 (search/apply/admin/test/demo).
- Quy tắc: `.env` không commit; không lưu JWT trong mã nguồn; secrets chỉ trong môi trường.
