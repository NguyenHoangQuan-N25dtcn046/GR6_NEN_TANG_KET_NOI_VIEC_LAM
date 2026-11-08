# TV4 — Demo và nghiệm thu Employer/Admin

## Chuẩn bị môi trường thử

Dùng Node.js 20+ và môi trường Python có các gói trong `backend/requirements.txt`. Môi trường thử dùng SQLite và thư mục CV riêng. Chỉ tải dữ liệu giả lên phiên demo.

Trong PowerShell tại thư mục `backend`:

```powershell
$tv4DemoDir = New-Item -ItemType Directory (Join-Path ([IO.Path]::GetTempPath()) ('joblink-tv4-' + [guid]::NewGuid()))
$env:DATABASE_URL = 'sqlite:///' + $tv4DemoDir.FullName.Replace('\', '/') + '/demo.db'
$env:UPLOAD_DIR = Join-Path $tv4DemoDir.FullName 'uploads'
$env:JWT_SECRET_KEY = [guid]::NewGuid().ToString('N')
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'DemoOnly2026!'
python -m uvicorn app.main:app --host 127.0.0.1 --port 18000
```

Trong cửa sổ khác tại thư mục `frontend`:

```powershell
$env:VITE_API_URL = 'http://127.0.0.1:18000'
$env:VITE_TV4_DEMO_CV = '1'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

`VITE_TV4_DEMO_CV` chỉ dùng cho dữ liệu giả trong môi trường phát triển cục bộ trên hai cổng trên. Chế độ này cung cấp liên kết tệp mẫu qua máy chủ thử nghiệm. Bản build production ẩn liên kết này. Để đặt lại dữ liệu, dừng hai tiến trình và tạo thư mục thử mới bằng lệnh trên.

## Tạo dữ liệu và chạy kiểm tra

Trong cửa sổ thứ ba, tại `frontend`:

```powershell
node --test src/pages/employer/ownedJob.test.js
node scripts/tv4-smoke.mjs
npm run build
```

Lệnh smoke tạo 1 Admin có sẵn, 2 tài khoản Employer, 1 Candidate, tin ở bốn trạng thái và CV giả. Lệnh in các tài khoản, ID tin, kết quả API và dòng `TV4_DEMO={...}`. Mỗi lần chạy thêm một bộ dữ liệu mới. Chỉ chạy lệnh với backend thử trên cổng 18000.

Kiểm thử Chrome cần Playwright có thể được Node tải. Nếu Playwright nằm trong một runtime riêng, đặt `TV4_PLAYWRIGHT_MODULE` thành URL tệp tới `playwright/index.mjs`. Lưu phần JSON sau `TV4_DEMO=` vào biến môi trường rồi chạy:

```powershell
$env:TV4_DEMO = '<JSON từ dòng kết quả smoke>'
node scripts/tv4-browser.mjs
```

Chạy seed mới trước mỗi lần chạy kiểm thử Chrome vì bài kiểm tra thay đổi trạng thái dữ liệu.

## Kịch bản trình bày

1. **Employer** đăng nhập, mở **Công ty**, lưu hồ sơ và tải lại. Mở **Tin tuyển dụng**, tạo một tin. Tin hiển thị **Chờ duyệt**.
2. **Admin** mở **Kiểm duyệt**, mở **Xem nội dung để xét duyệt**, đọc mô tả rồi chọn **Duyệt và công khai tin**. Thử từ chối một tin khác.
3. **Candidate** tìm tin đã duyệt, tải CV PDF/DOCX mẫu rồi nộp hồ sơ với lời nhắn. Với phần demo ngắn, có thể dùng hồ sơ có sẵn trên tin `closed` do smoke tạo.
4. **Employer** chọn **Xem ứng viên**, đọc lời nhắn, mở **CV mẫu (demo)** rồi chọn **Mời phỏng vấn**. **Candidate** tải lại lịch sử và đối chiếu nhãn trạng thái.
5. **Employer** đóng tin đang tuyển. **Candidate** thử dùng lại đường dẫn cũ để ứng tuyển. Hệ thống phải từ chối đơn mới. Dùng Employer thứ hai mở đường sửa và danh sách ứng viên của tin để kiểm tra quyền sở hữu.

## Kết quả và việc bàn giao

| Mã | Ca còn vướng | Chủ trì đề xuất |
| --- | --- | --- |
| JOB-05 / ADMIN-02 | Gọi PATCH đổi trạng thái Employer với tin chờ duyệt trả HTTP 200. Backend cần buộc duyệt trước khi công khai và kiểm tra điều kiện mở lại tin. UI cho gửi duyệt lại từ tin đã đóng. | Quân và Quốc Anh chốt |
| JOB-02 / ADMIN-02 | Trang chi tiết công khai có thể trả nội dung tin chưa duyệt khi biết ID. UI sửa tin đang dùng danh sách theo chủ sở hữu để hỗ trợ tin bị từ chối. Sau khi có đường đọc riêng theo chủ tin, dùng đường đó cho form. | Quốc Anh |
| APPLY-06 | URL CV trả HTTP 404, còn URL tệp tĩnh đã sửa đường dẫn trả HTTP 200 khi không xác thực. Cần endpoint trả tệp có kiểm tra quyền sở hữu hồ sơ và kiểm thử tải trực tiếp bằng tài khoản khác. | Quốc Anh |
| Hồ sơ công ty | API đọc có `logo_url`. API cập nhật chưa nhận trường này, nên màn hình chỉ hiển thị logo hiện có. | Quân chốt phạm vi |

Thống kê, khóa/mở tài khoản và phân trang hồ sơ nằm trong lượt nghiệm thu sau khi chốt phạm vi. Báo nhóm các dòng `BLOCKED` của lệnh smoke trước khi đánh dấu Done. Điều kiện bàn giao gồm chạy lại với backend đã xử lý lỗi, kiểm tra trên môi trường nhóm và merge vào repository chính.
