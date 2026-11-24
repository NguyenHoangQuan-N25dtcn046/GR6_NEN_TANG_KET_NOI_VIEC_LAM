# Checklist kiểm thử — Backend TV2 (Nền tảng kết nối việc làm)

> Chạy tự động: `pytest -q` (18 test, trong `tests/`). ⭐ = kịch bản regression cho bug đã sửa.

## 🩺 Health
- [ ] **TC-001** `GET /health` → `200` `{"status":"ok"}`

## 📋 Tin tuyển dụng (public)
- [ ] **TC-002** `GET /jobs` chỉ trả tin `published` (ẩn pending/closed/rejected)
- [ ] **TC-003** Tìm kiếm theo từ khóa `?q=` (title/description/location)
- [ ] **TC-004** Lọc theo địa điểm `?location=`
- [ ] **TC-005** Lọc theo loại hình (ngành nghề) `?category_id=`
- [ ] **TC-006** Phân trang `?limit=&offset=`

## 👤 Hồ sơ ứng viên
- [ ] **TC-007** `GET /candidate/profile` → `200` hồ sơ của chính mình
- [ ] **TC-008** `PATCH /candidate/profile` → `200` cập nhật phone/skills
- [ ] **TC-009** Employer gọi `/candidate/profile` → `403` (sai role)

## 📢 Tin tuyển dụng (employer)
- [ ] **TC-010** `POST /employer/jobs` → `201`, status mặc định `pending`
- [ ] **TC-011** `GET /employer/jobs` chỉ trả tin của chính mình
- [ ] **TC-012** `PATCH /employer/jobs/{id}` sửa + đóng tin (`closed`) → `200`
- [ ] **TC-013** `DELETE /employer/jobs/{id}` → `204`
- [ ] **TC-014** Sửa tin của employer khác → `403`
- [ ] **TC-015** Xóa tin của employer khác → `403`
- [ ] **TC-016** ⭐ Employer tự duyệt `published` → `422` (chỉ admin được duyệt)
- [ ] **TC-017** Tạo tin với `category_id` không tồn tại → `400`

## 📝 Đơn ứng tuyển
- [ ] **TC-018** `POST /jobs/{id}/applications` → `201`, status `submitted`
- [ ] **TC-019** ⭐ Ứng tuyển trùng (job, candidate) → `409`
- [ ] **TC-020** Ứng tuyển tin chưa `published` → `400`
- [ ] **TC-021** Ứng tuyển tin hết hạn (deadline < hôm nay) → `400`
- [ ] **TC-022** `GET /candidate/applications` chỉ thấy đơn của chính mình
- [ ] **TC-023** `GET /employer/jobs/{id}/applications` chủ tin xem được → `200`
- [ ] **TC-024** Employer khác xem đơn → `403`
- [ ] **TC-025** `PATCH .../applications/{id}` xử lý đơn (`accepted`) → `200`

## 📎 Upload CV
- [ ] **TC-026** Upload PDF hợp lệ → `200`, `cv_url` bắt đầu `/uploads/cv/`
- [ ] **TC-027** Upload sai đuôi file (`.txt`) → `415`
- [ ] **TC-028** ⭐ Upload file giả mạo (MIME đúng, magic bytes sai) → `415`
- [ ] **TC-029** Upload vượt kích thước → `413`

---
> Khi hoàn thành: 29/29 pass = phần backend TV2 sẵn sàng demo & vấn đáp.
> Ghi nhớ các bug đã chặn: chống gửi trùng (UNIQUE + check trước), chặn tự duyệt tin, kiểm tra file PDF thật (magic bytes).
