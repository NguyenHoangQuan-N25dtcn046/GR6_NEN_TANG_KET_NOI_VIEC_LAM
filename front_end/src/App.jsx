import { lazy, Suspense, useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import JobsPage from './features/candidate/JobsPage.jsx'
import Placeholder from './components/Placeholder.jsx'
import Tv4 from './features/tv4/Workspace.jsx'
const Tv4Preview = import.meta.env.DEV ? lazy(() => import('./features/tv4-preview/Preview.jsx')) : null
const apiOrigin = new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1', window.location.origin).origin
const candidateHome = new URL('/candidate-web/', apiOrigin)

function CandidatePage({ path }) {
  const destination = new URL(path, candidateHome).href
  useEffect(() => { window.location.replace(destination) }, [destination])
  return <p><a href={destination}>Open Candidate Workspace</a></p>
}

export default function App() {
  return <Routes>
    {Tv4Preview && <Route path="/__preview/tv4/*" element={<Suspense fallback={<p role="status">Loading preview…</p>}><Tv4Preview /></Suspense>} />}
    <Route path="/employer/*" element={<Tv4 key="employer" role="employer" />} />
    <Route path="/admin/*" element={<Tv4 key="admin" role="admin" />} />
    <Route path="*" element={<PublicApp />} />
  </Routes>
}

function PublicApp() {
  return <><header><strong>JobLink</strong><nav><Link to="/">Jobs</Link><a href={candidateHome.href}>Candidate</a><Link to="/employer/jobs">Employer</Link><Link to="/admin/jobs">Admin</Link></nav></header><main><Routes>
    <Route path="/" element={<JobsPage/>}/>
    <Route path="/candidate/profile" element={<CandidatePage path="pages/profile.html"/>}/>
    <Route path="/candidate/applications" element={<CandidatePage path="pages/applications.html"/>}/>
    <Route path="*" element={<Placeholder title="Page Not Found" owner="Team"/>}/>
  </Routes></main></>
}
