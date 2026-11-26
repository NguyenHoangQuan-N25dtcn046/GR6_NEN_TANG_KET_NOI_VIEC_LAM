import { useEffect, useRef, useState } from 'react'
import { Badge, ButtonLink, Confirm, Heading, jobLabels, Notice, workLabels } from '../tv4-preview/ui'

export default function PreviewJobs({ jobs, closeJob, initialNotice }) {
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState(initialNotice || '')
  const [recentlyClosed, setRecentlyClosed] = useState(null)
  const list = useRef(null)
  useEffect(() => {
    if (!recentlyClosed) return
    const timeout = setTimeout(() => setRecentlyClosed(null), 500)
    return () => clearTimeout(timeout)
  }, [recentlyClosed])
  return <>
    <Heading title="My Jobs" action={<ButtonLink to="/jobs/new" primary>Post a Job</ButtonLink>} />
    <div className="tv-wrap tv-content">
      <Notice>{notice}</Notice>
      <h2 tabIndex={-1} ref={list}>{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</h2>
      {!jobs.length && <div className="tv-empty"><p>You have not posted any jobs yet.</p><ButtonLink to="/jobs/new" primary>Post Your First Job</ButtonLink></div>}
      <ul className="tv-list">{jobs.map(job => <li className="tv-row tv-job-row" key={job.id}>
        <div><h3>{job.title}</h3><p>{[job.location, workLabels[job.work_type], job.category].filter(Boolean).join(' · ')}</p>
          <p>{job.salary_min || job.salary_max ? [job.salary_min, job.salary_max].filter(Boolean).map(value => Number(value).toLocaleString('en-US')).join(' – ') + ' VND' : 'Salary negotiable'} · {job.created_at}</p></div>
        <span key={recentlyClosed?.key && recentlyClosed.id === job.id ? recentlyClosed.key : job.id}
          className={recentlyClosed?.id === job.id ? 'tv-result-flash' : ''}>
          <Badge tone={job.status}>{jobLabels[job.status]}</Badge>
        </span>
        <div className="tv-actions tv-job-actions">
          <ButtonLink to={'/jobs/' + job.id + '/applicants'} primary>View Applicants</ButtonLink>
          <ButtonLink to={'/jobs/' + job.id + '/edit'}>{job.status === 'closed' ? 'Edit & Resubmit' : 'Edit Job'}</ButtonLink>
          {job.status === 'active' && <button className="tv-quiet-danger" onClick={event => {
            event.currentTarget.focus()
            setSelected(job)
          }}>Close Job</button>}
        </div>
      </li>)}</ul>
    </div>
    {selected && <Confirm title="Close this job?" description={selected.title + ' will stop accepting new applications.'} label="Close Job" fallback={list}
      onCancel={() => setSelected(null)} onConfirm={() => {
        closeJob(selected.id)
        setRecentlyClosed({ id: selected.id, key: Date.now() })
        setNotice('The job has been closed.')
        setSelected(null)
      }} />}
  </>
}
