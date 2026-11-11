# API contract dự kiến — `/api/v1`

| Method | Endpoint | Role | Trạng thái |
|---|---|---|---|
| GET | `/health` | Public | Đã có |
| GET | `/jobs?q=&limit=&offset=` | Public | Đã có (chỉ published) |
| POST | `/auth/register` | Public | TODO TV1 |
| POST | `/auth/login` | Public | TODO TV1 |
| GET/PATCH | `/candidate/profile` | Candidate | TODO TV2 |
| POST | `/candidate/cv` | Candidate | TODO TV2 |
| GET | `/candidate/applications` | Candidate | TODO TV2 |
| POST | `/jobs/{id}/applications` | Candidate | TODO TV2 |
| GET/POST | `/employer/jobs` | Employer | TODO TV2 |
| PATCH | `/employer/jobs/{id}` | Employer owner | TODO TV2 |
| GET/PATCH | `/employer/jobs/{id}/applications` | Employer owner | TODO TV2 |
| GET | `/admin/jobs` | Admin | TODO TV1 |
| PATCH | `/admin/jobs/{id}/moderation` | Admin | TODO TV1 |

**Chưa triển khai:** JWT, role guards, ownership, CV upload, các endpoint TODO. Không gọi endpoint TODO từ giao diện cho đến khi backend hoàn thành.
