# Job Portal — Dự án frontend dùng chung

**Stack:** HTML, CSS, JavaScript thuần (ES Modules).  
**Vai trò:** TV3 — Frontend Candidate.  
**Thiết kế:** Tham chiếu Figma Job Portal do nhóm cung cấp.

## Chạy bản hiện tại

Khởi động [backend](../README.md) rồi mở `http://localhost:8000/candidate-web/`,
hoặc chọn **Candidate** từ ứng dụng React. Các nghiệp vụ dùng API thật gồm
đăng ký, đăng nhập, đổi mật khẩu, hồ sơ, học vấn và kinh nghiệm, tải CV
PDF/DOCX, tìm việc, lưu việc và theo dõi ứng tuyển.

[Xem cấu hình và checklist](INTEGRATION.md).

## Ghi chú phát triển trước khi tích hợp API

Các mốc dưới đây mô tả các bản UI cũ. Hướng dẫn ở trên áp dụng cho bản hiện tại.

## Một project duy nhất cho mọi task
**Không tạo các thư mục `project-task2`, `project-task3` độc lập.**
Mỗi phiên bản ZIP chứa **đầy đủ project**, và bản mới thay thế bản cũ.

Nếu đã có thay đổi local, hãy **sao lưu hoặc commit Git trước**, rồi so sánh những file bị thay đổi. Không ghi đè toàn bộ thư mục nếu bạn đã tự viết code.

Khuyến nghị sử dụng Git: `main` -> các branch như `feature/ui-01`, `feature/search-04`, `feature/auth-04`; hợp nhất qua Pull Request. Đảm bảo thống nhất với Leader về repository và branch.

## Cách mở rộng
- Trang mới: `pages/*.html`
- Style dùng chung: `css/`
- JavaScript trang Jobs/chi tiết: `js/pages.js`
- Data mẫu, job card: `js/components/job-card.js`
- Header/Footer: `js/components/layout.js`

## Kiểm tra bộ lọc
1. Mở `pages/jobs.html`.
2. Tick **Thương mại**: hiển thị 2 công việc mẫu.
3. Tick thêm **Truyền thông**: hiển thị 3 công việc mẫu.
4. Chọn **Bán thời gian**: chỉ còn 1 công việc mẫu (Truyền thông).
5. Tick ngành **Viễn thông** một mình: hiện 0 kết quả (data mẫu chưa có việc làm này).
6. Nhấn **Xóa bộ lọc** để xem đủ 6 việc làm.

Số lượng trong mỗi loại phản ánh dữ liệu mẫu; không giữ số '10' giả từ Figma. Lọc theo kinh nghiệm/mức lương và API là phạm vi phát triển tiếp theo.


## AUTH-04 (bổ sung 11/11/2026)
- Hai trang `pages/login.html`, `pages/register.html` đã thay placeholder bằng form tiếng Việt, responsive.
- Validation: email, mật khẩu bắt buộc; đăng ký yêu cầu tối thiểu 8 ký tự, xác nhận mật khẩu và checkbox xác nhận.
- Có hiển thị/ẩn mật khẩu, thông báo lỗi, trạng thái gửi và xử lý timeout.
- REST endpoints theo SRS: `POST /api/auth/login`, `POST /api/auth/register`, role cố định `candidate` khi đăng ký.
- Muốn kết nối backend: sửa `API_BASE_URL` trong `js/config.js` sau khi xác nhận server và CORS.
- **Không giả lập thành công khi chưa có API.** Chưa tự lưu token hay điều hướng Profile vì SRS chưa chỉ rõ response shape/session contract.
- Chưa có màn hình khôi phục mật khẩu vì SRS chỉ nêu đổi mật khẩu, chưa nêu endpoint reset password.
- UI Auth không có frame gốc trong ảnh Figma đã cung cấp: giao diện được thiết kế đồng bộ màu và phong cách với trang chính, **không thể khẳng định pixel-perfect cho Auth**.
- Checklist nghiệm thu cuối cùng cần thử với backend thật; chưa thể đánh dấu "đã tích hợp API" trước khi chạy server.

## Bổ sung hành vi lọc (12/11/2026)
- Chọn/bỏ chọn checkbox không làm thay đổi danh sách ngay.
- Nhấn nút **Lọc việc làm** để áp dụng các điều kiện đã chọn.
- Nút **Xóa bộ lọc** làm sạch điều kiện và hiển thị lại tất cả việc làm demo.
- Đây vẫn là bộ lọc dữ liệu mẫu, chưa tích hợp API Jobs.

## PROF-02 (bản UI, 13/11/2026)
- `pages/profile.html`: hồ sơ Candidate responsive, điều hướng quản lý cá nhân, trạng thái hoàn thiện, giao diện xem/chỉnh sửa.
- `css/profile.css`: styling độc lập, nhất quán với UI-01.
- `js/profile.js`: dữ liệu mẫu, validation và cập nhật giao diện.
- Trường: họ tên, email (chỉ đọc), điện thoại, kỹ năng, kinh nghiệm, học vấn. Tải CV thuộc PROF-04, **không triển khai ở PROF-02**.
- Dữ liệu chỉ giữ **trong bộ nhớ của trang**. Tải lại sẽ trở về dữ liệu mẫu; không kết nối API hay tự xác thực đăng nhập.
- Backend hiện mới có dự kiến Base URL `http://localhost:8000/api/v1` và Swagger `http://localhost:8000/docs`. Chưa có hợp đồng endpoint GET/PUT profile. Chờ xác nhận cụ thể trước khi viết service thật.
- AUTH-04 vẫn chờ hợp đồng API; KHÔNG tự ghép `/api/v1` với `/api/auth/...` khi chưa xác minh.

### Test PROF-02
1. Mở `pages/profile.html` trên desktop và mobile.
2. Nhấn **Chỉnh sửa hồ sơ**; thử để trống họ tên và nhập số điện thoại sai.
3. Thử sửa thông tin và nhấn **Lưu thay đổi**; phần tóm tắt phải cập nhật.
4. Nhấn **Hủy** thì nội dung không bị thay đổi.
5. Tải lại trang và xác nhận trở về dữ liệu mẫu (vì API chưa có).


## SEARCH-03 – Danh sách và chi tiết việc làm (20/11/2026)
- Trang `pages/jobs.html`: danh sách 6 việc làm mẫu, phân trang (3/trang), sắp xếp mới nhất/cũ nhất/tên A–Z, hiển thị số kết quả, trạng thái rỗng.
- Trang `pages/job-detail.html?id=1` ... `?id=6`: hiển thị đúng vị trí, công ty, loại hình, ngành nghề, lương, địa điểm, kinh nghiệm và nội dung chi tiết theo công việc được chọn; việc làm liên quan.
- URL không hợp lệ hoặc thiếu `id` sẽ báo không tìm thấy thay vì lấy sai công việc.
- Giữ yêu cầu lọc: tick checkbox **chưa** áp dụng ngay, chỉ nhấn **Lọc việc làm** mới cập nhật danh sách. Nút **Xóa bộ lọc** trả về tất cả việc làm.
- Nút **Ứng tuyển** chuyển đến `pages/apply.html?jobId=...`; logic ứng tuyển thật thuộc APPLY-02.
- Mock data ở `js/components/job-card.js`, chưa có API thật. Theo SRS, backend dự kiến `GET /api/jobs` và `GET /api/jobs/{id}`; đợi API Contract và Swagger trước khi thay dữ liệu mẫu.
- Các task trước (UI-01, AUTH-04, PROF-02) được giữ trong project này. Không ghi đè chỉnh sửa local nếu chưa commit/backup.

### Kiểm tra nhanh SEARCH-03
1. Mở `pages/jobs.html`, có 3 thẻ trên trang 1, bấm trang 2 thấy 3 thẻ khác.
2. Tick ngành Thương mại, danh sách **không đổi** cho đến khi bấm Lọc việc làm; sau đó hiển thị 2 việc làm.
3. Chọn sắp xếp A–Z hoặc Cũ nhất; kết quả được sắp xếp và phân trang lại.
4. Bấm Xem chi tiết từng card: tiêu đề, công ty và thông số đúng với công việc đã bấm.
5. Mở `pages/job-detail.html?id=999`: hiện thông báo không tìm thấy.
6. Kiểm tra mobile, Header/Footer, Profile/Auth vẫn truy cập được.


## PROF-04 — Chọn và xem trước CV (chưa tích hợp API)
- Trang `pages/cv.html` với CSS `css/cv.css` và logic `js/cv.js`.
- Chọn hoặc kéo thả file PDF/DOCX tối đa 5 MiB (giới hạn demo 5×1024×1024 bytes). Kiểm tra phần mở rộng và MIME do trình duyệt cung cấp chỉ nhằm hỗ trợ UX; backend vẫn phải kiểm tra thật.
- PDF được xem trước trong iframe từ Blob URL. DOCX chỉ có nút mở file (không xem trước nhúng).
- Không gửi CV, không lưu vào localStorage, không cập nhật `cv_url` và không giả lập upload thành công. Khi backend có endpoint upload, phải thống nhất auth, multipart field name, response, URL và cơ chế thay thế/xóa CV.
- Test: không chọn file; PDF hợp lệ; DOCX hợp lệ; file `.txt`; file >5 MiB; bỏ file; chọn lại file; refresh trang; responsive; link Profile → CV.


## SEARCH-04 — Tìm kiếm & lọc việc làm (24/11/2026)
- Thêm lọc **kinh nghiệm**, **mức lương tối thiểu USD/năm** và **hình thức làm việc** (Onsite/Remote/Hybrid).
- Hoàn thiện danh sách địa điểm theo dữ liệu demo, tìm từ khóa không phân biệt dấu tiếng Việt.
- **Quan trọng:** việc tick checkbox hoặc đổi select **không** làm danh sách thay đổi; chỉ nhấn **Lọc việc làm** mới áp dụng. Nhấn **Xóa bộ lọc** để xem lại tất cả.
- Quy tắc: nhiều giá trị trong cùng một nhóm theo OR; giữa các nhóm theo AND. Mức lương so sánh với `salaryMin` trong dữ liệu mẫu.
- Dữ liệu trong `js/components/job-card.js` chỉ là **demo**. Các trường `salaryMin`, `experienceYears`, `workMode` được bổ sung minh họa để có thể thử lọc. **Chưa tích hợp GET /api/jobs**; khi có API Contract phải ánh xạ trường và quy tắc lọc lại với backend.
- Thử nghiệm: chọn "Bán thời gian" + "Truyền thông" rồi nhấn lọc (1 job), chọn "Từ 50.000 USD" (0 job), chọn "Tại văn phòng" (3 job), hoặc gõ "giam doc" (khớp tiêu đề có dấu).
- Mở `pages/jobs.html` với Live Server. Kiểm tra thêm trạng thái không có kết quả, phân trang sau lọc, nút Xóa bộ lọc, và responsive.


## APPLY-02 – Ứng tuyển việc làm (giao diện thử nghiệm)
- Mở Jobs → Xem chi tiết → **Ứng tuyển** để đến `pages/apply.html?jobId=<id>`.
- Hiển thị đúng công việc được chọn, hoặc báo lỗi nếu ID không hợp lệ.
- Nhập họ tên, email, điện thoại (không bắt buộc), chọn CV PDF/DOCX tối đa 5 MB, nhập Cover Letter tùy chọn.
- Bấm **Kiểm tra hồ sơ** để kiểm tra dữ liệu và xem file CV tại trình duyệt. **Chưa gửi API, chưa lưu ứng tuyển**.
- Endpoint trong SRS: `POST /api/jobs/{id}/apply`; chờ Backend Lead xác nhận URL thực tế (ví dụ API v1), multipart field name, token/session, response và quy trình upload CV.
- Backend phải kiểm tra xác thực Candidate, quyền ứng tuyển, CV và giới hạn dung lượng; frontend validation chỉ phục vụ UX.
- File mới: `pages/apply.html`, `css/apply.css`, `js/apply.js`. Không thay thế các trang cũ.

### Kiểm thử APPLY-02
1. Chọn một Job Card và xác nhận tiêu đề công việc trên form ứng tuyển đúng với công việc đã chọn.
2. Mở `pages/apply.html?jobId=999`: phải hiện không tìm thấy công việc.
3. Bấm Kiểm tra hồ sơ khi bỏ trống; xem lỗi từng trường.
4. Thử email sai, số điện thoại sai, CV .txt, CV > 5MB.
5. Chọn PDF hợp lệ và Cover Letter, thử xem trước.
6. Không có thông báo ứng tuyển thành công, không có request gửi lên backend.


### Sửa lỗi APPLY-02
Sửa truy vấn DOM của Job Overview nằm ngoài article chi tiết; link ứng tuyển nhận jobId đúng.

## APPLY-04 — Lịch sử ứng tuyển
- Mở Hồ sơ cá nhân → Lịch sử ứng tuyển (`pages/applications.html`).
- 5 đơn minh họa, thống kê toàn bộ, lọc theo tên công việc/công ty và trạng thái khi nhấn Lọc; Xóa lọc khôi phục danh sách. Liên kết về chi tiết dùng ID của dữ liệu Jobs hiện có.
- Các trạng thái UI: Đã nộp, Đã duyệt, Từ chối, Mời phỏng vấn, Đã chấp nhận. Cần thống nhất mapping với backend vì SRS mô tả trạng thái nghiệp vụ và schema không đồng nhất.
- Chưa kết nối API `GET /api/candidate/applications` trong SRS; cần xác nhận URL thực tế, xác thực và response. Không lưu thông tin thật, không tạo đơn từ form APPLY-02.
- Kiểm thử: 5 đơn ban đầu; lọc từng trạng thái; tìm kiếm có/không dấu; kết hợp trạng thái và từ khóa; kết quả rỗng; xóa lọc; xem chi tiết đúng ID; điều hướng sidebar; mobile 375px; Console; kiểm tra lại luồng APPLY-02.
