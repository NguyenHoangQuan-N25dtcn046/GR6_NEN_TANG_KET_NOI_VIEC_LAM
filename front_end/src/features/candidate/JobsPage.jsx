import { useEffect, useState } from 'react'
import { apiGet } from '../../services/api.js'
export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    apiGet(`/jobs?q=${encodeURIComponent(q)}`)
      .then(data => { if (active) { setJobs(data); setError('') } })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [q])
  return <section><h1>Find Jobs</h1><input aria-label="Search jobs" placeholder="Search by job title or location" value={q} onChange={e=>setQ(e.target.value)}/>
    {loading && <p>Loading...</p>}{error && <p role="alert">Unable to connect to the API: {error}</p>}
    {!loading && !error && jobs.length === 0 && <p>No public jobs are available yet.</p>}
    {jobs.map(job=><article key={job.id}><h2>{job.title}</h2><p>{job.location}</p><p>{job.description}</p></article>)}
  </section>
}
