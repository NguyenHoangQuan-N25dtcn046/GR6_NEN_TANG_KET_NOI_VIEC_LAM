import { lazy, Suspense } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import JobsPage from './features/candidate/JobsPage.jsx'
import Placeholder from './components/Placeholder.jsx'
const Tv4Preview = import.meta.env.DEV ? lazy(() => import('./features/tv4-preview/Preview.jsx')) : null

export default function App() {
  if (!Tv4Preview) return <PublicApp />
  return <Routes>
    <Route path="/__preview/tv4/*" element={<Suspense fallback={<p role="status">Đang tải bản xem thử…</p>}><Tv4Preview /></Suspense>} />
    <Route path="*" element={<PublicApp />} />
  </Routes>
}

function PublicApp() {
  return <><header><strong>JobConnect MVP</strong><nav><Link to="/">Việc làm</Link><Link to="/candidate/profile">Ứng viên</Link><Link to="/employer/jobs">Nhà tuyển dụng</Link><Link to="/admin/jobs">Admin</Link></nav></header><main><Routes>
    <Route path="/" element={<JobsPage/>}/>
    <Route path="/candidate/profile" element={<Placeholder title="Hồ sơ ứng viên" owner="TV3"/>}/>
    <Route path="/candidate/applications" element={<Placeholder title="Đơn ứng tuyển" owner="TV3"/>}/>
    <Route path="/employer/jobs" element={<Placeholder title="Quản lý tin tuyển dụng" owner="TV4"/>}/>
    <Route path="/employer/applications" element={<Placeholder title="Quản lý ứng viên" owner="TV4"/>}/>
    <Route path="/admin/jobs" element={<Placeholder title="Duyệt tin tuyển dụng" owner="TV4"/>}/>
    <Route path="*" element={<Placeholder title="Không tìm thấy trang" owner="Cả nhóm"/>}/>
  </Routes></main></>
}
