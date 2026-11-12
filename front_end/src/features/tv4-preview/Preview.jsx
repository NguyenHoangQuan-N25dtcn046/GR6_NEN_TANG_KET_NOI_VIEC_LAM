import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import PreviewJobs from '../employer/PreviewJobs'
import PreviewForm from '../employer/PreviewForm'
import PreviewApplicants from '../employer/PreviewApplicants'
import { PreviewReview, PreviewUsers } from '../admin/PreviewAdmin'
import { base, ButtonLink, Heading } from './ui'
import './preview.css'

const initialJobs = [
  { id: 1, title: 'Product Designer', location: 'Ho Chi Minh City', work_type: 'hybrid', category: 'Design', salary_min: 16000000, salary_max: 24000000, status: 'active' },
  { id: 2, title: 'Talent Acquisition and Employer Branding Specialist for Central Vietnam', location: 'Da Nang', work_type: 'onsite', category: 'Human Resources', status: 'pending' },
  { id: 3, title: 'Software Engineer', location: 'Hanoi', work_type: 'remote', category: 'Information Technology', status: 'rejected' },
  { id: 4, title: 'Customer Support Specialist', location: 'Can Tho', work_type: 'onsite', category: 'Business', status: 'closed' },
].map(job => ({ ...job, created_at: 'Nov 11, 2026', description: 'Work with the team to plan and deliver projects, then report progress each week. The detailed scope will be discussed during the interview.' }))

const initialApplicants = [{
  id: 1, job_id: 1, name: 'Minh Anh Nguyen', email: 'minh.anh.product.design.demo@example.com', status: 'submitted',
  message: 'I have experience in product design and user research. I would like to learn more about how the design and engineering teams work together.',
}]

const initialUsers = [
  { id: 1, role: 'candidate', email: initialApplicants[0].email, is_active: true, newThisMonth: true },
  { id: 2, role: 'employer', email: 'tuyen.dung@example.com', is_active: false },
  { id: 3, role: 'admin', email: 'quan.tri@example.com', is_active: true },
].map(user => ({ ...user, created_at: '11/11/2026' }))

function Missing() {
  return <><Heading title="Page not found" /><div className="tv-wrap tv-content"><ButtonLink to="/jobs">Back to My Jobs</ButtonLink></div></>
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
  return <><Heading title="Sample Resume" /><div className="tv-wrap tv-content">
    <ButtonLink to={'/jobs/' + applicant.job_id + '/applicants'}>Back to Applicants</ButtonLink>
    <h2>{applicant.name}</h2><p>{applicant.email}</p>
    <h3>Experience</h3><p>Interface design, interactive prototyping, and user research.</p>
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  async function save(change) {
    await new Promise(resolve => setTimeout(resolve, 450))
    if (scenario === 'save-error' && !failed) {
      setFailed(true)
      throw new Error('Unable to save the sample data. Please try again.')
    }
    change()
  }
  const patchJob = (id, changes) => setJobs(items => items.map(job => job.id === id ? { ...job, ...changes } : job))
  const links = [['/jobs', 'My Jobs'], ['/company', 'Company Profile'], ['/review', 'Review Jobs'], ['/users', 'Users']]
  const nav = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  useLayoutEffect(() => {
    const element = nav.current
    const update = () => {
      const active = element.querySelector('[aria-current="page"]')
      if (!active) return
      const navBox = element.getBoundingClientRect()
      const activeBox = active.getBoundingClientRect()
      setIndicator({ left: activeBox.left - navBox.left, width: activeBox.width, ready: true })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [location.pathname, menuOpen])
  useEffect(() => setMenuOpen(false), [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])
  return <main className="tv4-preview">
    <div className="tv-nav"><div className="tv-wrap tv-nav-inner">
      <Link className="tv-brand" to={base + '/jobs'} onClick={() => setMenuOpen(false)}><span aria-hidden="true">JL</span> JobLink</Link>
      <button ref={menuButton} className="tv-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="tv4-navigation"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(open => !open)}>
        <span className="tv-menu-icon" aria-hidden="true"><i /><i /><i /></span><span>{menuOpen ? 'Close' : 'Menu'}</span>
      </button>
      <nav id="tv4-navigation" ref={nav} className={menuOpen ? 'tv-mobile-open' : ''} aria-label="TV4 preview navigation">
        {links.map(([path, label]) => <NavLink key={path} to={base + path} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
        <span className={'tv-nav-indicator ' + (indicator.ready ? 'tv-indicator-ready' : '')}
          style={{ '--indicator-x': indicator.left + 'px', '--indicator-width': indicator.width + 'px' }} aria-hidden="true" />
      </nav>
      <span className={'tv-preview-label ' + (menuOpen ? 'tv-mobile-open' : '')}>Preview · Sample data</span>
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
