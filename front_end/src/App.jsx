import { lazy, Suspense } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import JobsPage from './features/candidate/JobsPage.jsx'
import Placeholder from './components/Placeholder.jsx'
import Tv4 from './features/tv4/Workspace.jsx'
const Tv4Preview = import.meta.env.DEV ? lazy(() => import('./features/tv4-preview/Preview.jsx')) : null

export default function App() {
  return <Routes>
    {Tv4Preview && <Route path="/__preview/tv4/*" element={<Suspense fallback={<p role="status">Loading preview…</p>}><Tv4Preview /></Suspense>} />}
    <Route path="/employer/*" element={<Tv4 key="employer" role="employer" />} />
    <Route path="/admin/*" element={<Tv4 key="admin" role="admin" />} />
    <Route path="*" element={<PublicApp />} />
  </Routes>
}

function PublicApp() {
  return <><header><strong>JobLink</strong><nav><Link to="/">Jobs</Link><Link to="/candidate/profile">Candidate</Link><Link to="/employer/jobs">Employer</Link><Link to="/admin/jobs">Admin</Link></nav></header><main><Routes>
    <Route path="/" element={<JobsPage/>}/>
    <Route path="/candidate/profile" element={<Placeholder title="Candidate Profile" owner="TV3"/>}/>
    <Route path="/candidate/applications" element={<Placeholder title="My Applications" owner="TV3"/>}/>
    <Route path="*" element={<Placeholder title="Page Not Found" owner="Team"/>}/>
  </Routes></main></>
}
