# ERD — Nền tảng kết nối việc làm (MVP)

```mermaid
erDiagram
  USERS ||--o| CANDIDATE_PROFILES : has
  USERS ||--o| EMPLOYER_PROFILES : has
  EMPLOYER_PROFILES ||--o{ JOBS : posts
  JOB_CATEGORIES ||--o{ JOBS : categorizes
  CANDIDATE_PROFILES ||--o{ APPLICATIONS : submits
  JOBS ||--o{ APPLICATIONS : receives
  USERS {
    int id PK
    varchar email UK
    varchar password_hash
    varchar role
    boolean is_active
    datetime created_at
  }
  CANDIDATE_PROFILES {
    int id PK
    int user_id FK,UK
    varchar full_name
    varchar phone
    text skills
    varchar cv_url
  }
  EMPLOYER_PROFILES {
    int id PK
    int user_id FK,UK
    varchar company_name
    varchar company_website
    text description
  }
  JOB_CATEGORIES {
    int id PK
    varchar name UK
  }
  JOBS {
    int id PK
    int employer_id FK
    int category_id FK
    varchar title
    text description
    varchar location
    decimal salary_min
    decimal salary_max
    varchar status
    date deadline
  }
  APPLICATIONS {
    int id PK
    int job_id FK
    int candidate_id FK
    varchar cv_url
    text cover_letter
    varchar status
    datetime applied_at
  }
```

## Ràng buộc nghiệp vụ
- `users.role` thuộc `candidate`, `employer`, `admin`; mỗi user chỉ có tối đa một hồ sơ tương ứng.
- `applications` UNIQUE(job_id, candidate_id): ứng viên không gửi trùng đơn.
- Tin mới `pending`, admin chuyển sang `published`/`rejected`; employer có thể đóng tin (`closed`).
- Đơn mới `submitted`, có thể chuyển `reviewing`, `accepted`, `rejected`.
- Chỉ tin `published` chưa hết hạn mới được ứng tuyển (phải kiểm tra tại service layer).
- Phân quyền và ownership bắt buộc kiểm tra ở API; frontend không thay thế kiểm tra backend.
- `cv_url` là tham chiếu file, không lưu nhị phân trong DB. Kiểm tra MIME, kích thước và quyền truy cập file.
