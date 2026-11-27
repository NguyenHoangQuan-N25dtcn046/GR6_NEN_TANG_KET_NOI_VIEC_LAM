import { useEffect, useRef, useState } from 'react'
import { Badge, ButtonLink, categoryLabels, Confirm, Heading, jobLabels, locationLabels, Notice, workLabels } from '../tv4-preview/ui'

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
    <Heading title="Tin tuyển dụng của tôi" action={<ButtonLink to="/jobs/new" primary>Đăng tin tuyển dụng</ButtonLink>} />
    <div className="tv-wrap tv-content">
      <Notice>{notice}</Notice>
      <h2 tabIndex={-1} ref={list}>{jobs.length} tin tuyển dụng</h2>
      {!jobs.length && <div className="tv-empty"><p>Bạn chưa đăng tin tuyển dụng nào.</p><ButtonLink to="/jobs/new" primary>Đăng tin tuyển dụng đầu tiên</ButtonLink></div>}
      <ul className="tv-list">{jobs.map(job => <li className="tv-row tv-job-row" key={job.id}>
        <div><h3>{job.title}</h3><p>{[locationLabels[job.location] || job.location, workLabels[job.work_type], categoryLabels[job.category] || job.category].filter(Boolean).join(' · ')}</p>
          <p>{job.salary_min || job.salary_max ? [job.salary_min, job.salary_max].filter(Boolean).map(value => Number(value).toLocaleString('vi-VN')).join(' – ') + ' ₫' : 'Lương thỏa thuận'} · {job.created_at}</p></div>
        <span key={recentlyClosed?.key && recentlyClosed.id === job.id ? recentlyClosed.key : job.id}
          className={recentlyClosed?.id === job.id ? 'tv-result-flash' : ''}>
          <Badge tone={job.status}>{jobLabels[job.status]}</Badge>
        </span>
        <div className="tv-actions tv-job-actions">
          <ButtonLink to={'/jobs/' + job.id + '/applicants'} primary>Xem ứng viên</ButtonLink>
          <ButtonLink to={'/jobs/' + job.id + '/edit'}>{job.status === 'closed' ? 'Sửa và gửi duyệt lại' : 'Sửa tin'}</ButtonLink>
          {job.status === 'active' && <button className="tv-quiet-danger" onClick={event => {
            event.currentTarget.focus()
            setSelected(job)
          }}>Đóng tin</button>}
        </div>
      </li>)}</ul>
    </div>
    {selected && <Confirm title="Đóng tin tuyển dụng này?" description={'Tin tuyển dụng “' + selected.title + '” sẽ ngừng nhận hồ sơ mới.'} label="Đóng tin" fallback={list}
      onCancel={() => setSelected(null)} onConfirm={() => {
        closeJob(selected.id)
        setRecentlyClosed({ id: selected.id, key: Date.now() })
        setNotice('Đã đóng tin tuyển dụng.')
        setSelected(null)
      }} />}
  </>
}
