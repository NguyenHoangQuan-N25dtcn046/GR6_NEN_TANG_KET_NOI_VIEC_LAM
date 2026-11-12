import { useState } from 'react'
import { Badge, Choice, Heading, Notice, workLabels } from '../tv4-preview/ui'

const roles = [['', 'All roles'], ['candidate', 'Candidate'], ['employer', 'Employer'], ['admin', 'Administrator']]

export function PreviewReview({ jobs, users, applicants, review }) {
  const [notice, setNotice] = useState('')
  const [noticeKey, setNoticeKey] = useState(0)
  const pending = jobs.filter(job => job.status === 'pending')
  return <><Heading title="Review Jobs" /><div className="tv-wrap tv-content">
    <h2>Pending Jobs · {pending.length}</h2><Notice key={noticeKey} className={notice ? 'tv-result-notice' : ''}>{notice}</Notice>
    {!pending.length && <p className="tv-empty">There are no jobs waiting for review.</p>}
    <ul className="tv-list">{pending.map(job => <li className="tv-review" key={job.id}>
      <h3>{job.title}</h3><p>{job.location} · {workLabels[job.work_type]}</p>
      <details><summary>View Job Details</summary>
        <p className="tv-message">{job.description}</p>
        <p>{[job.category, job.salary_min && Number(job.salary_min).toLocaleString('en-US') + ' VND', job.salary_max && Number(job.salary_max).toLocaleString('en-US') + ' VND'].filter(Boolean).join(' · ')}</p>
        <div className="tv-actions">
          <button className="tv-primary" onClick={() => { review(job.id, 'active'); setNotice('Job approved: ' + job.title); setNoticeKey(key => key + 1) }}>Approve & Publish</button>
          <button className="tv-quiet-danger" onClick={() => { review(job.id, 'rejected'); setNotice('Job rejected: ' + job.title); setNoticeKey(key => key + 1) }}>Reject Job</button>
        </div>
      </details>
    </li>)}</ul>
    <h2>Overview</h2><dl className="tv-stats">
      {[['Jobs', jobs.length], ['Applications', applicants.length], ['Users', users.length], ['New This Month', users.filter(user => user.newThisMonth).length]].map(([label, count]) =>
        <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
    </dl>
    <h3>Jobs by Status</h3>
    <ul className="tv-bars">{[['active', 'Active'], ['pending', 'Pending'], ['rejected', 'Rejected'], ['closed', 'Closed']].map(([status, label]) => {
      const count = jobs.filter(job => job.status === status).length
      return <li key={status}><span>{label}</span><span className="tv-bar" aria-hidden="true"><span style={{ width: (count / Math.max(jobs.length, 1) * 100) + '%' }} /></span><strong>{count}</strong></li>
    })}</ul>
  </div></>
}

export function PreviewUsers({ users, toggle }) {
  const [role, setRole] = useState('')
  const [notice, setNotice] = useState('')
  const visible = users.filter(user => !role || user.role === role)
  return <><Heading title="Manage Users" /><div className="tv-wrap tv-content">
    <div className="tv-filter"><Choice label="Filter by Role" value={role} options={roles} onChange={setRole} /></div>
    <h2>{visible.length} {visible.length === 1 ? 'user' : 'users'}</h2><Notice>{notice}</Notice>
    {!visible.length && <p className="tv-empty">No users match this filter.</p>}
    <ul className="tv-list">{visible.map(user => <li className="tv-row" key={user.id}>
      <div><h3>{user.email}</h3><p>{roles.find(([key]) => key === user.role)?.[1]} · {user.created_at}</p></div>
      <Badge tone={user.is_active ? 'active' : 'closed'}>{user.is_active ? 'Active' : 'Locked'}</Badge>
      {user.role !== 'admin' && <div className="tv-actions"><button className={user.is_active ? 'tv-quiet-danger' : 'tv-primary'} onClick={() => {
        toggle(user.id); setNotice(user.is_active ? 'Account locked.' : 'Account unlocked.')
      }}>{user.is_active ? 'Lock Account' : 'Unlock Account'}</button></div>}
    </li>)}</ul>
  </div></>
}
