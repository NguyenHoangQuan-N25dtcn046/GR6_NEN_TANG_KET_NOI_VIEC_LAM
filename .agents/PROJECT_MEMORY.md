# TV4 · Xem thử theo Figma

- Tinh chỉnh sau góp ý: Quản lý tin dùng các cột thao tác cố định từ 1024 px; menu có nền hover, trạng thái trang hiện tại và viền tiêu điểm; Hồ sơ công ty mở trống với gợi ý ở cả năm trường. Đã kiểm tra căn cột trước/sau khi đóng tin, hover và bàn phím, lỗi lưu và giữ dữ liệu trong phiên trên Chromium. Luồng TV4 cũng đạt trên WebKit iPhone.

- Worktree local `feat/tv4-figma-preview` tách từ `1109d4e` của Quân. Xem tại http://127.0.0.1:5175/__preview/tv4/jobs. Tuyến chỉ có trong Vite dev, dữ liệu mẫu nằm trong bộ nhớ và khôi phục khi tải lại.
- Frame Figma Jobs 25:6653 là trang công khai. DESIGN.md ghi kích thước ước lượng từ canvas và thông số chuyển thể TV4. Bản xem thử gồm Quản lý tin, Tạo/sửa tin, Hồ sơ công ty, Ứng viên theo tin, Duyệt tin và thống kê, Người dùng.
- Chromium đạt tại 320, 390, 768, 1023, 1024 và 1440 px. WebKit iPhone đạt tại 390 px. Đã thử đóng/hủy đóng, Esc, CV mẫu, cập nhật hồ sơ, tạo/sửa, lỗi lưu, duyệt/từ chối, khóa/mở, danh sách trống và giảm chuyển động. Build sạch, không chứa tuyến xem thử.
- Bước tích hợp dữ liệu và phân quyền thật thuộc đợt sau. Thử lỗi lưu bằng query `?scenario=save-error` trên form. Thử danh sách trống bằng `?scenario=empty` trên trang Quản lý tin.
