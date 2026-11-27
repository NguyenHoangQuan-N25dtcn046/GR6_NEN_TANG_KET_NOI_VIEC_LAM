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
  return <section><h1>Tìm việc làm</h1><input aria-label="Tìm việc làm" placeholder="Tìm theo vị trí hoặc địa điểm" value={q} onChange={e=>setQ(e.target.value)}/>
    {loading && <p role="status">Đang tải…</p>}{error && <p role="alert">{error}</p>}
    {!loading && !error && jobs.length === 0 && <p>Chưa có tin tuyển dụng công khai.</p>}
    {jobs.map(job=><article key={job.id}><h2>{job.title}</h2><p>{job.location}</p><p>{job.description}</p></article>)}
  </section>
}
