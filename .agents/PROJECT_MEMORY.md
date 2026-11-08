# Bộ nhớ dự án

- Đây là bản nền mới của nhóm 6, được tách từ mã nguồn cục bộ. Thư mục chứa bản TV4 hiện có là `C:/Re/job-matching-platform`.
- Giữ API và giao diện ứng viên. Các màn hình Employer và màn hình duyệt Admin là trang chờ tích hợp, có kiểm tra vai trò như tuyến thật. Đưa các màn hình TV4, thay đổi điều hướng và bộ demo lên nhánh riêng.
- Khóa JWT lấy từ biến môi trường. Admin thử là tùy chọn. SQLite là cấu hình mẫu và MySQL vẫn được hỗ trợ.
- Cần chốt lỗi quyền duyệt và quyền tải CV trước khi dùng dữ liệu thật.
- Xác minh cài đặt mới trên Python 3.12 và npm lockfile, build Vite, khởi động FastAPI với SQLite, health, OpenAPI, từ chối khóa JWT ngắn và cấu hình Admin thiếu một trường. Tạo commit nền cục bộ trên `main` để nhóm review trước lần push đầu.

## Nhánh TV4

- Tích hợp màn hình Employer và kiểm duyệt Admin vào các tuyến đã có phân quyền. Chuyển hướng sau đăng nhập và bổ sung menu quản lý trên mobile.
- [Hướng dẫn nghiệm thu TV4](../frontend/TV4-DEMO.md) có script tạo dữ liệu giả, kiểm thử API và Chrome. CV mẫu chỉ được mở bằng tùy chọn demo trên máy cục bộ. Còn lỗi backend về kiểm duyệt và tải CV có xác thực.
