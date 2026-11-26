import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge, Confirm, Heading, Notice } from '../tv4-preview/ui'
import '../tv4-preview/preview.css'
import './workspace.css'
import { request } from './api'

const pageSize = 20
const applicationStatuses = ['submitted', 'reviewing', 'accepted', 'rejected']
const workModes = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }
const jobTypes = { 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract', internship: 'Internship' }
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
  const [registering, setRegistering] = useState(false)
  return <Screen title={registering ? 'Create Employer Account' : titleCase(role) + ' Sign In'}>
    <form key={registering} className="tv-form tv-sign-in" aria-busy={action.pending} onSubmit={event => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      action.run(async () => {
        if (registering) {
          await request('/auth/register', { method: 'POST', data: { ...data, role: 'employer' } })
        }
        const { access_token: token } = await request('/auth/login', {
          method: 'POST', data: { email: data.email, password: data.password },
        })
        const user = await request('/auth/me', { token })
        if (user.role !== role) {
          await request('/auth/logout', { token, method: 'POST' }).catch(() => {})
          throw new Error('Sign in with a ' + role + ' account to access this workspace.')
        }
        onSession({ token, user })
      })
    }}>
      <fieldset disabled={action.pending} className="tv-sign-in-fields">
        {registering && <label className="tv-field">Company Name <input name="company_name" maxLength={200} required /></label>}
        <label className="tv-field">Email <input name="email" type="email" autoComplete="username" required /></label>
        <label className="tv-field">Password <input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'}
          minLength={registering ? 8 : undefined} maxLength={128} required /></label>
      </fieldset>
      <Feedback action={action} />
      <div className="tv-actions">
        <button className="tv-primary" disabled={action.pending}>{registering ? 'Create Account' : 'Sign in'}</button>
        {role === 'employer' && <button type="button" disabled={action.pending} onClick={() => setRegistering(value => !value)}>
          {registering ? 'Back to Sign In' : 'Register as Employer'}
        </button>}
      </div>
    </form>
  </Screen>
}

function Pager({ page, onPage, items, disabled }) {
  if (!page && items?.length !== pageSize) return null
  return <div className="tv-actions">
    <button type="button" disabled={!page || disabled} onClick={() => onPage(page - 1)}>Previous Page</button>
    <span>Page {page + 1}</span>
    <button type="button" disabled={items?.length !== pageSize || disabled} onClick={() => onPage(page + 1)}>Next Page</button>
  </div>
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
            onClick={() => setSelected({ job, operation: availability === 'open' ? 'close' : 'reopen' })}>{availability === 'open' ? 'Close Job' : 'Reopen Job'}</button>}
          <button type="button" disabled={action.pending}
            onClick={() => setSelected({ job, operation: 'delete' })}>Delete Job</button>
        </div>
      </li>
    })}</ul>}
    <Pager page={page} onPage={setPage} items={jobs} disabled={action.pending} />
    {selected && <Confirm title={titleCase(selected.operation) + ' this job?'}
      description={selected.job.title + ' · Job ID ' + selected.job.id}
      label={titleCase(selected.operation) + ' Job'}
      onCancel={() => setSelected(null)} onConfirm={() => {
        const { job, operation } = selected
        setSelected(null)
        action.run(async () => {
          if (operation === 'delete') {
            await api('/employer/jobs/' + job.id, { method: 'DELETE' })
            if (page > 0 && jobs.length === 1) setPage(page - 1)
            else list.reload()
            return 'Job deleted.'
          }
          const job_status = operation === 'close' ? 'closed' : 'open'
          list.replace(await api('/jobs/' + job.id + '/status', { method: 'PATCH', data: { job_status } }))
          return job_status === 'closed' ? 'Job closed.' : 'Job reopened.'
        })
      }} />}
  </Screen>
}

function JobFields({ job, api }) {
  const action = useAction()
  const navigate = useNavigate()
  const categories = useList(api, '/jobs/categories')
  function normalized(field, value) {
    if (value === '' || value == null) return null
    if (['category_id', 'experience_years', 'salary_min', 'salary_max'].includes(field)) return Number(value)
    return value
  }
  return <form className="tv-form" onSubmit={event => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    for (const field of ['title', 'description', 'location']) values[field] = values[field].trim()
    const data = Object.fromEntries(Object.entries(values)
      .filter(([field, value]) => !job || normalized(field, value) !== normalized(field, job[field]))
      .map(([field, value]) => [field, ['salary_min', 'salary_max'].includes(field) ? value || null : normalized(field, value)]))
    action.run(async () => {
      if (job && !Object.keys(data).length) throw new Error('Make a change before saving.')
      const saved = await api(job ? '/jobs/' + job.id : '/employer/jobs', { method: job ? 'PATCH' : 'POST', data })
      navigate('/employer/jobs', { replace: true, state: { notice: 'Job ' + saved.id + ' submitted for review.' } })
    })
  }}>
    <ListFeedback list={categories} />
    <fieldset className="tv-grid" disabled={action.pending || !categories.result?.items}>
      <label className="tv-field tv-wide">Job Title <input name="title" defaultValue={job?.title} minLength={3} maxLength={200} required /></label>
      <label className="tv-field tv-wide">Job Description <textarea name="description" defaultValue={job?.description} minLength={10} maxLength={10000} required rows={6} /></label>
      <label className="tv-field">Location <input name="location" defaultValue={job?.location} maxLength={200} required /></label>
      {categories.result?.items && <label className="tv-field">Category <select name="category_id" aria-label="Category" defaultValue={job?.category_id ?? ''}>
        <option value="">Uncategorized</option>
        {categories.result?.items?.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
      </select></label>}
      <label className="tv-field">Work Mode <select name="work_mode" aria-label="Work Mode" defaultValue={job?.work_mode ?? ''}>
        <option value="">Unspecified</option>
        {Object.entries(workModes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="tv-field">Job Type <select name="job_type" aria-label="Job Type" defaultValue={job?.job_type ?? ''}>
        <option value="">Unspecified</option>
        {Object.entries(jobTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="tv-field">Years of Experience <input name="experience_years" defaultValue={job?.experience_years ?? ''} type="number" min="0" max="50" /></label>
      <label className="tv-field">Application Deadline <input name="deadline" defaultValue={job?.deadline ?? ''} type="date" /></label>
      <label className="tv-field">Minimum Salary (VND) <input name="salary_min" defaultValue={job?.salary_min ?? ''} type="number" min="0" max="999999999999.99" step="0.01" /></label>
      <label className="tv-field">Maximum Salary (VND) <input name="salary_max" defaultValue={job?.salary_max ?? ''} type="number" min="0" max="999999999999.99" step="0.01" /></label>
    </fieldset>
    {job && <p>Saving changes sends this job back for Admin review. Its open or closed setting stays as it is.</p>}
    <Feedback action={action} />
    <button className="tv-primary" disabled={action.pending || !categories.result?.items}>{action.pending ? 'Submitting…' : 'Submit for Review'}</button>
  </form>
}

function EditJob({ api }) {
  const { id } = useParams()
  return <Screen title="Edit Job" action={<ActionLink to="/employer/jobs">Back to My Jobs</ActionLink>}>
    {/^[1-9][0-9]*$/.test(id) ? <OwnedJobEditor key={id} api={api} id={id} /> : <Notice error>Invalid job ID.</Notice>}
  </Screen>
}

function OwnedJobEditor({ api, id }) {
  const job = useList(api, '/employer/jobs/' + id)
  return <><ListFeedback list={job} />
    {job.result?.items && <JobFields job={job.result.items} api={api} />}
  </>
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
  const [approval, setApproval] = useState('pending')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const list = useList(api, '/admin/jobs?' + new URLSearchParams({
    ...(approval && { approval_status: approval }), limit: pageSize, offset: page * pageSize,
  }))
  const jobs = list.result?.items

  function decide(job, decision) {
    setReason('')
    setSelected({ job, decision })
  }

  function confirmDecision() {
    const { job, decision } = selected
    if (decision === 'reject' && reason.trim().length < 5) return
    setSelected(null)
    action.run(async () => {
      await api('/admin/jobs/' + job.id + '/' + decision, {
        method: 'PATCH', data: decision === 'reject' ? { reason: reason.trim() } : undefined,
      })
      if (approval === 'pending' && page > 0 && jobs.length === 1) setPage(page - 1)
      else list.reload()
      return decision === 'approve' ? 'Job approved.' : 'Job rejected.'
    })
  }

  return <Screen title="Review Jobs">
    <label className="tv-field">Approval Status
      <select value={approval} disabled={action.pending} onChange={event => { setPage(0); setApproval(event.target.value) }}>
        <option value="">All jobs</option><option value="pending">Pending</option>
        <option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>
    </label>
    <Feedback action={action} />
    <ListFeedback list={list} />
    {jobs?.length === 0 && <p className="tv-empty">No jobs match this status.</p>}
    {jobs?.length > 0 && <ul className="tv-list">{jobs.map(job => <li className="tv-row" key={job.id}>
      <div>
        <h3>{job.title}</h3>
        <p>{[job.company_name, job.location, 'Job ID ' + job.id].filter(Boolean).join(' · ')}</p>
        <details><summary>Job details</summary><p>{job.description}</p>
          <p>{[
            job.job_type && jobTypes[job.job_type], job.work_mode && workModes[job.work_mode],
            job.experience_years != null && job.experience_years + ' years of experience',
            job.deadline && 'Deadline ' + job.deadline,
          ].filter(Boolean).join(' · ')}</p>
          {(job.salary_min != null || job.salary_max != null) &&
            <p>Salary {[job.salary_min, job.salary_max].filter(value => value != null).join(' – ')} VND</p>}
          {job.rejection_reason && <p>{job.rejection_reason}</p>}
        </details>
      </div>
      <Badge tone={job.approval_status === 'approved' ? 'active' : job.approval_status}>{titleCase(job.approval_status)}</Badge>
      {job.approval_status === 'pending' && <div className="tv-actions">
        <button type="button" disabled={action.pending} onClick={() => decide(job, 'approve')}>Approve Job</button>
        <button type="button" disabled={action.pending} onClick={() => decide(job, 'reject')}>Reject Job</button>
      </div>}
    </li>)}</ul>}
    <Pager page={page} onPage={setPage} items={jobs} disabled={action.pending} />
    {selected?.decision === 'reject' && <form className="tv-form" onSubmit={event => { event.preventDefault(); confirmDecision() }}>
      <h2>Reject {selected.job.title}</h2>
      <label className="tv-field">Rejection Reason
        <textarea value={reason} onChange={event => setReason(event.target.value)} minLength={5} maxLength={1000} required autoFocus />
      </label>
      <div className="tv-actions">
        <button type="button" onClick={() => setSelected(null)}>Cancel</button>
        <button className="tv-primary" disabled={reason.trim().length < 5}>Confirm Rejection</button>
      </div>
    </form>}
    {selected?.decision === 'approve' && <Confirm title="Approve this job?"
      description={selected.job.title} label="Approve Job" onCancel={() => setSelected(null)} onConfirm={confirmDecision} />}
  </Screen>
}

function ManageUsers({ api }) {
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const action = useAction()
  const listUsers = useCallback((path, options) => api(path, options).then(result => result.data), [api])
  const list = useList(listUsers, '/admin/users?' + new URLSearchParams({
    ...(role && { role }), ...(status && { is_active: status }), limit: pageSize, offset: page * pageSize,
  }))
  const users = list.result?.items

  return <Screen title="Manage Users">
    <div className="tv-actions">
      <label className="tv-field">Role <select value={role} disabled={action.pending} onChange={event => { setPage(0); setRole(event.target.value) }}>
        <option value="">All roles</option><option value="candidate">Candidate</option>
        <option value="employer">Employer</option><option value="admin">Admin</option>
      </select></label>
      <label className="tv-field">Account Status <select value={status} disabled={action.pending} onChange={event => { setPage(0); setStatus(event.target.value) }}>
        <option value="">All statuses</option><option value="true">Active</option><option value="false">Locked</option>
      </select></label>
    </div>
    <Feedback action={action} /><ListFeedback list={list} />
    {users?.length === 0 && <p className="tv-empty">No accounts match these filters.</p>}
    {users?.length > 0 && <ul className="tv-list">{users.map(user => <li className="tv-row" key={user.id}>
      <div><h3>{user.email}</h3><p>{titleCase(user.role)}</p></div>
      <Badge tone={user.is_active ? 'active' : 'closed'}>{user.is_active ? 'Active' : 'Locked'}</Badge>
      {user.role !== 'admin' && <button type="button" disabled={action.pending} onClick={() => setSelected(user)}>
        {user.is_active ? 'Lock Account' : 'Unlock Account'}
      </button>}
    </li>)}</ul>}
    <Pager page={page} onPage={setPage} items={users} disabled={action.pending} />
    {selected && <Confirm title={selected.is_active ? 'Lock this account?' : 'Unlock this account?'}
      description={selected.email} label={selected.is_active ? 'Lock Account' : 'Unlock Account'}
      onCancel={() => setSelected(null)} onConfirm={() => {
        const user = selected
        setSelected(null)
        action.run(async () => {
          const updated = await api('/admin/users/' + user.id, { method: 'PATCH', data: { is_active: !user.is_active } })
          if (!status) list.replace(updated)
          else if (page > 0 && users.length === 1) setPage(page - 1)
          else list.reload()
          return updated.is_active ? 'Account unlocked.' : 'Account locked.'
        })
      }} />}
  </Screen>
}

function CompanyProfile({ api }) {
  const list = useList(api, '/employer/profile')
  const action = useAction()
  const company = list.result?.items
  return <Screen title="Company Profile">
    <ListFeedback list={list} />
    {company && <form className="tv-form" onSubmit={event => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      data.company_name = data.company_name.trim()
      data.company_website = data.company_website.trim() || null
      data.description = data.description.trim() || null
      action.run(async () => {
        await api('/employer/profile', { method: 'PATCH', data })
        return 'Company profile saved.'
      })
    }}>
      <fieldset className="tv-grid" disabled={action.pending}>
        <label className="tv-field">Company Name <input name="company_name" defaultValue={company.company_name} maxLength={200} required /></label>
        <label className="tv-field">Website <input name="company_website" type="url" defaultValue={company.company_website ?? ''} maxLength={255} /></label>
        <label className="tv-field tv-wide">Description <textarea name="description" defaultValue={company.description ?? ''} maxLength={10000} rows={6} /></label>
      </fieldset>
      <Feedback action={action} />
      <button className="tv-primary" disabled={action.pending}>Save Company Profile</button>
    </form>}
  </Screen>
}

function Categories({ api }) {
  const list = useList(api, '/jobs/categories')
  const action = useAction()
  return <Screen title="Job Categories">
    <form className="tv-form" onSubmit={event => {
      event.preventDefault()
      const form = event.currentTarget
      const name = new FormData(form).get('name').trim()
      action.run(async () => {
        await api('/admin/categories', { method: 'POST', data: { name } })
        form.reset()
        list.reload()
        return 'Category added.'
      })
    }}>
      <label className="tv-field">Category Name <input name="name" required maxLength={100} /></label>
      <Feedback action={action} />
      <button className="tv-primary" disabled={action.pending}>Add Category</button>
    </form>
    <ListFeedback list={list} />
    {list.result?.items?.length === 0 && <p>No categories yet.</p>}
    <ul>{list.result?.items?.map(category => <li key={category.id}>{category.name}</li>)}</ul>
  </Screen>
}

function AccountPassword({ api, onChanged }) {
  const action = useAction()
  return <Screen title="Change Password">
    <form className="tv-form" onSubmit={event => {
      event.preventDefault()
      const { current_password, new_password, confirmation } = Object.fromEntries(new FormData(event.currentTarget))
      action.run(async () => {
        if (new_password !== confirmation) throw new Error('Passwords do not match.')
        await api('/auth/password', { method: 'PATCH', data: { current_password, new_password } })
        onChanged()
      })
    }}>
      <fieldset className="tv-grid" disabled={action.pending}>
        <label className="tv-field tv-wide">Current Password <input type="password" name="current_password" autoComplete="current-password" maxLength={128} required /></label>
        <label className="tv-field">New Password <input type="password" name="new_password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
        <label className="tv-field">Confirm New Password <input type="password" name="confirmation" autoComplete="new-password" minLength={8} maxLength={128} required /></label>
      </fieldset>
      <Feedback action={action} />
      <button className="tv-primary" disabled={action.pending}>Change Password</button>
    </form>
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
  const [passwordChanged, setPasswordChanged] = useState(false)
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
        {role === 'admin' && <NavLink to="/admin/categories">Categories</NavLink>}
        <NavLink to={'/' + role + '/password'}>Change Password</NavLink>
        <button type="button" disabled={logout.pending} onClick={() => logout.run(async () => {
          try {
            await api('/auth/logout', { method: 'POST' })
          } finally {
            setSession(null)
          }
        })}>{logout.pending ? 'Signing out…' : 'Sign out'}</button>
      </>}
      </div>
    </nav></div>
    <div className="tv-wrap"><Feedback action={logout} />{!session && expired && <Notice error>Session ended. Sign in again.</Notice>}{passwordChanged && <Notice>Password changed. Sign in again.</Notice>}</div>
    {!session ? <SignIn role={role} onSession={next => { setExpired(false); setPasswordChanged(false); setSession(next) }} /> : <Routes>
      <Route index element={<Navigate to="jobs" replace />} />
      <Route path="password" element={<AccountPassword api={api} onChanged={() => {
        setSession(null)
        setPasswordChanged(true)
      }} />} />
      {role === 'employer' ? <>
        <Route path="jobs" element={<MyJobs api={api} />} />
        <Route path="jobs/new" element={<Screen title="Post a Job" action={<ActionLink to="/employer/jobs">Back to My Jobs</ActionLink>}><JobFields api={api} /></Screen>} />
        <Route path="jobs/:id/edit" element={<EditJob api={api} />} />
        <Route path="jobs/:id/applications" element={<Applicants api={api} />} />
        <Route path="applications" element={<Navigate to="/employer/jobs" replace />} />
        <Route path="company" element={<CompanyProfile api={api} />} />
      </> : <>
        <Route path="jobs" element={<Moderation api={api} />} />
        <Route path="users" element={<ManageUsers api={api} />} />
        <Route path="categories" element={<Categories api={api} />} />
      </>}
      <Route path="*" element={<Unavailable title="Page Not Found">Use the workspace navigation to choose a page.</Unavailable>} />
    </Routes>}
  </main>
}
