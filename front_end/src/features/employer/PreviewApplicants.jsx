import { useState } from 'react'
import { Badge, ButtonLink, Choice, Heading, Notice } from '../tv4-preview/ui'

const statuses = [['submitted', 'Submitted'], ['shortlisted', 'Shortlisted'], ['accepted', 'Interview'], ['rejected', 'Rejected']]

export default function PreviewApplicants({ job, applicants, update }) {
  const [notice, setNotice] = useState('')
  return <><Heading title="Job Applicants" /><div className="tv-wrap tv-content">
    <ButtonLink to="/jobs">Back to My Jobs</ButtonLink>
    <h2>{job.title}</h2><Notice>{notice}</Notice>
    {!applicants.length && <p className="tv-empty">This job has not received any applications yet.</p>}
    <ul className="tv-list">{applicants.map(app => <li className="tv-row" key={app.id}>
      <div><h3>{app.name}</h3><p>{app.email}</p><p className="tv-message">{app.message}</p></div>
      <Badge tone={app.status}>{statuses.find(([key]) => key === app.status)?.[1]}</Badge>
      <div className="tv-actions">
        <ButtonLink to={'/cv/' + app.id}>View Sample Resume</ButtonLink>
        <Choice label="Application Status" options={statuses} value={app.status} onChange={status => {
          update(app.id, status); setNotice('Application status updated.')
        }} />
      </div>
    </li>)}</ul>
  </div></>
}
