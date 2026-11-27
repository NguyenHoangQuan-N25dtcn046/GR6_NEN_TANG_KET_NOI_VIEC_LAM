import { lazy, Suspense, useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import JobsPage from './features/candidate/JobsPage.jsx'
import Placeholder from './components/Placeholder.jsx'
import Tv4 from './features/tv4/Workspace.jsx'
const Tv4Preview = import.meta.env.DEV ? lazy(() => import('./features/tv4-preview/Preview.jsx')) : null

export default function App() {
  return <Routes>
    {Tv4Preview && <Route path="/__preview/tv4/*" element={<Suspense fallback={<p role="status">Đang tải bản xem trước…</p>}><Tv4Preview /></Suspense>} />}
    <Route path="/employer/*" element={<Tv4 key="employer" role="employer" />} />
    <Route path="/admin/*" element={<Tv4 key="admin" role="admin" />} />
    <Route path="*" element={<PublicApp />} />
  </Routes>
}

const candidateBase = (import.meta.env.VITE_CANDIDATE_URL || 'http://localhost:5174/').replace(/\/$/, '')
function CandidateRedirect({ page }) {
  const url = candidateBase + '/pages/' + page + '.html'
  useEffect(() => { window.location.replace(url) }, [url])
  return <p>Đang chuyển đến trang ứng viên… <a href={url}>Tiếp tục</a></p>
}
function PublicApp() {
  return <><header><strong>JobLink</strong><nav><Link to="/">Việc làm</Link><Link to="/candidate/profile">Ứng viên</Link><Link to="/employer/jobs">Nhà tuyển dụng</Link><Link to="/admin/jobs">Quản trị</Link></nav></header><main><Routes>
    <Route path="/" element={<JobsPage/>}/>
    <Route path="/candidate/profile" element={<CandidateRedirect page="profile"/>}/>
    <Route path="/candidate/applications" element={<CandidateRedirect page="applications"/>}/>
    <Route path="*" element={<Placeholder title="Không tìm thấy trang" owner="nhóm dự án"/>}/>
  </Routes></main></>
}
