import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge, Confirm, Heading, Notice } from '../tv4-preview/ui'
import '../tv4-preview/preview.css'
import './workspace.css'
import { request } from './api'

const pageSize = 20
const applicationStatuses = ['submitted', 'reviewing', 'accepted', 'rejected']
const titleCase = value => value[0].toUpperCase() + value.slice(1)

function useAction() {
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState(null)
  async function run(action) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setMessage(null)
    try {
      const text = await action()
      if (text) setMessage({ text })
    } catch (error) {
      setMessage({ error: true, text: error.message })
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return { pending, message, run }
}

function useList(api, path) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    api(path, { signal: controller.signal })
      .then(items => {
        if (!controller.signal.aborted) setResult({ path, revision, items })
      })
      .catch(error => {
        if (!controller.signal.aborted) setResult({ path, revision, error: error.message })
      })
    return () => controller.abort()
  }, [api, path, revision])
  return {
    result: result?.path === path && result.revision === revision ? result : null,
    reload: () => setRevision(current => current + 1),
    replace: item => setResult(current => current?.items
      ? { ...current, items: current.items.map(row => row.id === item.id ? item : row) }
      : current),
  }
}

function Feedback({ action }) {
  return <Notice error={action.message?.error}>{action.message?.text}</Notice>
}

function ListFeedback({ list }) {
  if (!list.result) return <p role="status">Loading…</p>
  if (list.result.error) return <>
    <Notice error>{list.result.error}</Notice>
    <button type="button" onClick={list.reload}>Retry</button>
  </>
  return null
}

function Screen({ title, children, action }) {
  return <><Heading title={title} action={action} /><div className="tv-wrap tv-content">{children}</div></>
}

function ActionLink({ to, children }) {
  return <Link className="tv-button" to={to}>{children}</Link>
}

function SignIn({ role, onSession }) {
  const action = useAction()
  return <Screen title={titleCase(role) + ' Sign In'}>
    <form className="tv-form tv-sign-in" aria-busy={action.pending} onSubmit={event => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      action.run(async () => {
        const { access_token: token } = await request('/auth/login', { method: 'POST', data })
        const user = await request('/auth/me', { token })
        if (user.role !== role) {
          await request('/auth/logout', { token, method: 'POST' }).catch(() => {})
          throw new Error('Sign in with a ' + role + ' account to access this workspace.')
        }
        onSession({ token, user })
      })
    }}>
      <fieldset disabled={action.pending} className="tv-sign-in-fields">
        <label className="tv-field">Email <input name="email" type="email" autoComplete="username" required /></label>
        <label className="tv-field">Password <input name="password" type="password" autoComplete="current-password" required /></label>
      </fieldset>
      <Feedback action={action} />
      <button className="tv-primary" disabled={action.pending}>{action.pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </Screen>
}

function MyJobs({ api }) {
  const { state } = useLocation()
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const list = useList(api, '/employer/jobs?limit=' + pageSize + '&offset=' + page * pageSize)
  const action = useAction()
  const jobs = list.result?.items
  return <Screen title="My Jobs" action={<ActionLink to="/employer/jobs/new">Post a Job</ActionLink>}>
    {!action.message && <Notice>{state?.notice}</Notice>}
    <Feedback action={action} />
    <ListFeedback list={list} />
    {jobs?.length === 0 && <p className="tv-empty">No jobs on this page.</p>}
    {jobs && <ul className="tv-list">{jobs.map(job => {
      const moderation = job.approval_status
      const availability = job.job_status
      return <li className="tv-row" key={job.id}>
        <div><h3>{job.title}</h3><p>{job.location} · Job ID {job.id}</p>
          {job.rejection_reason && <p className="tv-message">{job.rejection_reason}</p>}</div>
        <div className="tv-actions"><Badge tone={moderation === 'approved' ? 'active' : moderation}>{titleCase(moderation)}</Badge>
          <Badge tone={availability === 'open' ? 'active' : 'closed'}>{titleCase(availability)}</Badge></div>
        <div className="tv-actions tv-live-job-actions">
          <ActionLink to={'/employer/jobs/' + job.id + '/applications'}>View Applicants</ActionLink>
          <ActionLink to={'/employer/jobs/' + job.id + '/edit'}>Edit Job</ActionLink>
          {(availability === 'open' || moderation === 'approved') && <button type="button" disabled={action.pending}
            onClick={() => setSelected(job)}>{availability === 'open' ? 'Close Job' : 'Reopen Job'}</button>}
        </div>
      </li>
    })}</ul>}
    {(page > 0 || jobs?.length === pageSize) && <div className="tv-actions">
      <button type="button" disabled={!page || action.pending} onClick={() => setPage(page - 1)}>Previous Page</button>
      <span>Page {page + 1}</span>
      <button type="button" disabled={jobs?.length !== pageSize || action.pending} onClick={() => setPage(page + 1)}>Next Page</button>
    </div>}
    {selected && <Confirm title={selected.job_status === 'open' ? 'Close this job?' : 'Reopen this job?'}
      description={selected.title + ' · Job ID ' + selected.id}
      label={selected.job_status === 'open' ? 'Close Job' : 'Reopen Job'}
      onCancel={() => setSelected(null)} onConfirm={() => {
        const job = selected
        const job_status = job.job_status === 'open' ? 'closed' : 'open'
        setSelected(null)
        action.run(async () => {
          list.replace(await api('/jobs/' + job.id + '/status', { method: 'PATCH', data: { job_status } }))
          return job_status === 'closed' ? 'Job closed.' : 'Job reopened.'
        })
      }} />}
  </Screen>
}

function JobFields({ job, api }) {
  const action = useAction()
  const navigate = useNavigate()
  return <form className="tv-form" onSubmit={event => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const data = { title: values.get('title').trim(), description: values.get('description').trim() }
    if (!job) {
      data.location = values.get('location').trim()
      for (const field of ['salary_min', 'salary_max', 'deadline']) data[field] = values.get(field) || null
    }
    action.run(async () => {
      if (job && data.title === job.title && data.description === job.description) throw new Error('Change the title or description first.')
      const saved = await api(job ? '/jobs/' + job.id : '/employer/jobs', { method: job ? 'PATCH' : 'POST', data })
      navigate('/employer/jobs', { replace: true, state: { notice: 'Job ' + saved.id + ' submitted for review.' } })
    })
  }}>
    <fieldset className="tv-grid" disabled={action.pending}>
      <label className="tv-field tv-wide">Job Title <input name="title" defaultValue={job?.title} minLength={3} maxLength={200} required /></label>
      <label className="tv-field tv-wide">Job Description <textarea name="description" defaultValue={job?.description} minLength={10} required rows={6} /></label>
      {!job && <>
        <label className="tv-field">Location <input name="location" maxLength={200} required /></label>
        <label className="tv-field">Application Deadline <input name="deadline" type="date" /></label>
        <label className="tv-field">Minimum Salary (VND) <input name="salary_min" type="number" min="0" step="0.01" /></label>
        <label className="tv-field">Maximum Salary (VND) <input name="salary_max" type="number" min="0" step="0.01" /></label>
      </>}
    </fieldset>
    {job && <p>Saving changes sends this job back for Admin review. Its open or closed setting stays as it is.</p>}
    <Feedback action={action} />
    <button className="tv-primary" disabled={action.pending}>{action.pending ? 'Submitting…' : 'Submit for Review'}</button>
  </form>
}

function EditJob({ api }) {
  const { id } = useParams()
  return <Screen title="Edit Job" action={<ActionLink to="/employer/jobs">Back to My Jobs</ActionLink>}>
    {/^[1-9][0-9]*$/.test(id) ? <OwnedJobEditor key={id} api={api} id={id} /> : <Notice error>Invalid job ID.</Notice>}
  </Screen>
}

function OwnedJobEditor({ api, id }) {
  // The public detail endpoint hides pending jobs. The employer list includes all owned jobs.
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      for (let offset = 0; !controller.signal.aborted; offset += 100) {
        const jobs = await api('/employer/jobs?limit=100&offset=' + offset, { signal: controller.signal })
        const job = jobs.find(item => String(item.id) === id)
        if (job || jobs.length < 100) return job
      }
    }
    load().then(job => {
      if (!controller.signal.aborted) setResult({ job })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ error: error.message })
    })
    return () => controller.abort()
  }, [api, id, attempt])
  if (!result) return <p role="status">Loading job…</p>
  if (result.error) return <><Notice error>{result.error}</Notice><button onClick={() => {
    setResult(null)
    setAttempt(current => current + 1)
  }}>Retry</button></>
  return result.job ? <JobFields job={result.job} api={api} /> : <Notice error>Job not found in your own listings.</Notice>
}

function Applicants({ api }) {
  const { id } = useParams()
  if (!/^[1-9][0-9]*$/.test(id)) return <Unavailable title="Job Applicants">Invalid job ID.</Unavailable>
  return <ApplicantList key={id} api={api} id={id} />
}

function ApplicantList({ api, id }) {
  const path = '/employer/jobs/' + id + '/applications'
  const list = useList(api, path)
  const action = useAction()
  return <Screen title={'Job Applicants · Job ' + id} action={<ActionLink to="/employer/jobs">Back to My Jobs</ActionLink>}>
    <Feedback action={action} />
    <ListFeedback list={list} />
    {list.result?.items?.length === 0 && <p className="tv-empty">This job has no applications yet.</p>}
    <ul className="tv-list">{list.result?.items?.map(item => <li className="tv-row" key={item.id}>
      <div><h3>{item.candidate_name || 'Candidate ' + item.candidate_id}</h3>
        <p>{new Date(item.applied_at).toLocaleDateString()}</p>
        {item.cover_letter && <p className="tv-message">{item.cover_letter}</p>}</div>
      <label className="tv-field">Application status
        <select value={item.status} disabled={action.pending} onChange={event => {
          const status = event.target.value
          action.run(async () => {
            list.replace(await api(path + '/' + item.id, { method: 'PATCH', data: { status } }))
            return 'Application status updated.'
          })
        }}>
          {applicationStatuses.map(status => <option key={status} disabled={status === 'submitted'} value={status}>{titleCase(status)}</option>)}
        </select>
      </label>
      <button type="button" disabled={action.pending} onClick={() => action.run(async () => {
        const file = await api(path + '/' + item.id + '/cv', { file: true })
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        const extension = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'docx'
          : 'pdf'
        link.download = 'application-' + item.id + '-cv.' + extension
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 30000)
        return 'CV download started.'
      })}>Download CV</button>
    </li>)}</ul>
  </Screen>
}

function Moderation({ api }) {
  const action = useAction()
  const [selected, setSelected] = useState(null)
  const [decision, setDecision] = useState('approve')
  return <Screen title="Review Jobs">
    <p>The review queue is awaiting a backend endpoint. Use a job ID only after reviewing that listing with your team.</p>
    <form className="tv-form" onSubmit={event => {
      event.preventDefault()
      const fields = new FormData(event.currentTarget)
      const reason = String(fields.get('reason') || '').trim()
      if (decision === 'reject' && reason.length < 5) {
        action.run(() => { throw new Error('Enter a rejection reason of at least 5 characters.') })
        return
      }
      setSelected({ id: fields.get('id'), decision, reason })
    }}>
      <fieldset className="tv-grid" disabled={action.pending}>
        <label className="tv-field">Job ID <input name="id" type="text" inputMode="numeric" pattern="[1-9][0-9]*" required /></label>
        <label className="tv-field">Decision <select value={decision} onChange={event => setDecision(event.target.value)}>
          <option value="approve">Approve</option><option value="reject">Reject</option>
        </select></label>
        {decision === 'reject' && <label className="tv-field tv-wide">Rejection Reason <textarea name="reason" minLength={5} maxLength={1000} required /></label>}
      </fieldset>
      <Feedback action={action} />
      <button className="tv-primary" disabled={action.pending}>{action.pending ? 'Submitting…' : 'Review Decision'}</button>
    </form>
    {selected && <Confirm title={titleCase(selected.decision) + ' job ' + selected.id + '?'}
      description={selected.decision === 'reject' ? 'Reason: ' + selected.reason : 'An open job becomes visible to candidates.'}
      label={titleCase(selected.decision) + ' Job'} onCancel={() => setSelected(null)} onConfirm={() => {
        const { id, decision, reason } = selected
        setSelected(null)
        action.run(async () => {
          const job = await api('/admin/jobs/' + id + '/' + decision, { method: 'PATCH', data: decision === 'reject' ? { reason } : undefined })
          return job.title + ' · ' + titleCase(job.approval_status) + ' · ' + titleCase(job.job_status)
        })
      }} />}
  </Screen>
}

function Unavailable({ title, children }) {
  return <Screen title={title}><Notice>{children}</Notice></Screen>
}

export default function Workspace({ role }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const [session, setSession] = useState(null)
  const [expired, setExpired] = useState(false)
  const logout = useAction()
  useEffect(() => setMenuOpen(false), [pathname, session])
  const api = useCallback(async (path, options) => {
    try {
      return await request(path, { ...options, token: session.token })
    } catch (error) {
      if (error.status === 401) {
        setSession(current => current === session ? null : current)
        setExpired(true)
      }
      throw error
    }
  }, [session])

  return <main className="tv4-preview tv4-live">
    <div className="tv-nav"><nav className="tv-wrap tv-live-nav" aria-label="TV4 workspace" onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen && menuButton.current?.offsetWidth) {
        event.preventDefault()
        setMenuOpen(false)
        menuButton.current.focus()
      }
    }}>
      <Link className="tv-brand" to="/">JobLink</Link>
      <button type="button" className="tv-live-menu-toggle" ref={menuButton} aria-controls="tv4-live-menu"
        aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>Menu</button>
      <div id="tv4-live-menu" className={'tv-live-menu' + (menuOpen ? ' is-open' : '')}>
      <NavLink to="/employer/jobs">Employer</NavLink><NavLink to="/admin/jobs">Admin</NavLink>
      {session && <>
        <NavLink to={role === 'employer' ? '/employer/company' : '/admin/users'}>{role === 'employer' ? 'Company Profile' : 'Manage Users'}</NavLink>
        <button type="button" disabled={logout.pending} onClick={() => logout.run(async () => {
          await api('/auth/logout', { method: 'POST' })
          setSession(null)
        })}>{logout.pending ? 'Signing out…' : 'Sign out'}</button>
      </>}
      </div>
    </nav></div>
    <div className="tv-wrap"><Feedback action={logout} />{!session && expired && <Notice error>Session ended. Sign in again.</Notice>}</div>
    {!session ? <SignIn role={role} onSession={next => { setExpired(false); setSession(next) }} /> : <Routes>
      <Route index element={<Navigate to="jobs" replace />} />
      {role === 'employer' ? <>
        <Route path="jobs" element={<MyJobs api={api} />} />
        <Route path="jobs/new" element={<Screen title="Post a Job" action={<ActionLink to="/employer/jobs">Back to My Jobs</ActionLink>}><JobFields api={api} /></Screen>} />
        <Route path="jobs/:id/edit" element={<EditJob api={api} />} />
        <Route path="jobs/:id/applications" element={<Applicants api={api} />} />
        <Route path="applications" element={<Navigate to="/employer/jobs" replace />} />
        <Route path="company" element={<Unavailable title="Company Profile">Company profile editing is awaiting a backend endpoint.</Unavailable>} />
      </> : <>
        <Route path="jobs" element={<Moderation api={api} />} />
        <Route path="users" element={<Unavailable title="Manage Users">User listing and account lock or unlock are awaiting backend support.</Unavailable>} />
      </>}
      <Route path="*" element={<Unavailable title="Page Not Found">Use the workspace navigation to choose a page.</Unavailable>} />
    </Routes>}
  </main>
}
