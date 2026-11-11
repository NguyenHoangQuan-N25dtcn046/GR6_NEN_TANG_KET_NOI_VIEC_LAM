import { useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import PreviewJobs from '../employer/PreviewJobs'
import PreviewForm from '../employer/PreviewForm'
import PreviewApplicants from '../employer/PreviewApplicants'
import { PreviewReview, PreviewUsers } from '../admin/PreviewAdmin'
import { base, ButtonLink, Heading } from './ui'
import './preview.css'

const initialJobs = [
  { id: 1, title: 'Nhân viên thiết kế sản phẩm', location: 'TP. Hồ Chí Minh', work_type: 'hybrid', category: 'Thiết kế', salary_min: 16000000, salary_max: 24000000, status: 'active' },
  { id: 2, title: 'Chuyên viên tuyển dụng và phát triển thương hiệu Nhà tuyển dụng cho thị trường miền Trung', location: 'Đà Nẵng', work_type: 'onsite', category: 'Nhân sự', status: 'pending' },
  { id: 3, title: 'Kỹ sư phần mềm', location: 'Hà Nội', work_type: 'remote', category: 'Công nghệ thông tin', status: 'rejected' },
  { id: 4, title: 'Chuyên viên chăm sóc khách hàng', location: 'Cần Thơ', work_type: 'onsite', category: 'Kinh doanh', status: 'closed' },
].map(job => ({ ...job, created_at: '11/11/2026', description: 'Phối hợp với nhóm để lập kế hoạch, thực hiện công việc và báo cáo kết quả theo tuần. Trao đổi cụ thể về phạm vi công việc trong buổi phỏng vấn.' }))

const initialApplicants = [{
  id: 1, job_id: 1, name: 'Nguyễn Minh Anh', email: 'minh.anh.thiet.ke.san.pham.demo@example.com', status: 'submitted',
  message: 'Tôi có kinh nghiệm thiết kế sản phẩm và nghiên cứu người dùng. Tôi muốn trao đổi thêm về cách đội ngũ phối hợp với kỹ sư trong quá trình phát triển sản phẩm.',
}]

const initialUsers = [
  { id: 1, role: 'candidate', email: initialApplicants[0].email, is_active: true, newThisMonth: true },
  { id: 2, role: 'employer', email: 'tuyen.dung@example.com', is_active: false },
  { id: 3, role: 'admin', email: 'quan.tri@example.com', is_active: true },
].map(user => ({ ...user, created_at: '11/11/2026' }))

function Missing() {
  return <><Heading title="Không tìm thấy nội dung" /><div className="tv-wrap tv-content"><ButtonLink to="/jobs">Về quản lý tin</ButtonLink></div></>
}

function JobRoute({ jobs, render }) {
  const { id } = useParams()
  const job = jobs.find(item => String(item.id) === id)
  return job ? render(job) : <Missing />
}

function SampleCv({ applicants }) {
  const { id } = useParams()
  const applicant = applicants.find(item => String(item.id) === id)
  if (!applicant) return <Missing />
  return <><Heading title="CV mẫu" /><div className="tv-wrap tv-content">
    <ButtonLink to={'/jobs/' + applicant.job_id + '/applicants'}>Về danh sách ứng viên</ButtonLink>
    <h2>{applicant.name}</h2><p>{applicant.email}</p>
    <h3>Kinh nghiệm</h3><p>Thiết kế giao diện, xây dựng mẫu thử và nghiên cứu người dùng.</p>
  </div></>
}

export default function Preview() {
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const scenario = query.get('scenario')
  const [jobs, setJobs] = useState(initialJobs)
  const [users, setUsers] = useState(initialUsers)
  const [applicants, setApplicants] = useState(initialApplicants)
  const [company, setCompany] = useState({ company_name: '', website: '', size: '', address: '', logo_url: '' })
  const [failed, setFailed] = useState(false)
  async function save(change) {
    await new Promise(resolve => setTimeout(resolve, 450))
    if (scenario === 'save-error' && !failed) {
      setFailed(true)
      throw new Error('Không thể lưu dữ liệu mẫu. Vui lòng thử lại.')
    }
    change()
  }
  const patchJob = (id, changes) => setJobs(items => items.map(job => job.id === id ? { ...job, ...changes } : job))
  const links = [['/jobs', 'Tin tuyển dụng'], ['/company', 'Hồ sơ công ty'], ['/review', 'Kiểm duyệt'], ['/users', 'Người dùng']]
  return <main className="tv4-preview">
    <div className="tv-nav"><div className="tv-wrap tv-nav-inner">
      <Link className="tv-brand" to={base + '/jobs'}><span aria-hidden="true">JL</span> JobLink</Link>
      <nav aria-label="Bản xem thử TV4">{links.map(([path, label]) => <NavLink key={path} to={base + path}>{label}</NavLink>)}</nav>
      <span className="tv-preview-label">Bản xem thử · Dữ liệu mẫu</span>
    </div></div>
    <Routes>
      <Route index element={<Navigate to="jobs" replace />} />
      <Route path="jobs" element={<PreviewJobs initialNotice={location.state?.notice} jobs={scenario === 'empty' ? [] : jobs} closeJob={id => patchJob(id, { status: 'closed' })} />} />
      <Route path="jobs/new" element={<PreviewForm key="new" save={form => save(() => setJobs(items => [
        { ...form, id: Date.now(), status: 'pending', created_at: new Date().toLocaleDateString('vi-VN') }, ...items,
      ]))} />} />
      <Route path="jobs/:id/edit" element={<JobRoute jobs={jobs} render={job => <PreviewForm key={job.id} record={job} save={form => save(() => patchJob(job.id, { ...form, status: 'pending' }))} />} />} />
      <Route path="jobs/:id/applicants" element={<JobRoute jobs={jobs} render={job => <PreviewApplicants job={job}
        applicants={applicants.filter(app => app.job_id === job.id)} update={(id, status) => setApplicants(items => items.map(app => app.id === id ? { ...app, status } : app))} />} />} />
      <Route path="company" element={<PreviewForm key="company" company record={company} save={form => save(() => setCompany(form))} />} />
      <Route path="review" element={<PreviewReview jobs={jobs} users={users} applicants={applicants} review={(id, status) => patchJob(id, { status })} />} />
      <Route path="users" element={<PreviewUsers users={users} toggle={id => setUsers(items => items.map(user => user.id === id ? { ...user, is_active: !user.is_active } : user))} />} />
      <Route path="cv/:id" element={<SampleCv applicants={applicants} />} />
      <Route path="*" element={<Missing />} />
    </Routes>
  </main>
}
