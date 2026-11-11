import { useRef, useState } from 'react'
import { Badge, ButtonLink, Confirm, Heading, jobLabels, Notice, workLabels } from '../tv4-preview/ui'

export default function PreviewJobs({ jobs, closeJob, initialNotice }) {
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState(initialNotice || '')
  const list = useRef(null)
  return <>
    <Heading title="Quản lý tin tuyển dụng" action={<ButtonLink to="/jobs/new" primary>Đăng tin mới</ButtonLink>} />
    <div className="tv-wrap tv-content">
      <Notice>{notice}</Notice>
      <h2 tabIndex={-1} ref={list}>{jobs.length} tin tuyển dụng</h2>
      {!jobs.length && <div className="tv-empty"><p>Bạn chưa có tin tuyển dụng.</p><ButtonLink to="/jobs/new" primary>Đăng tin đầu tiên</ButtonLink></div>}
      <ul className="tv-list">{jobs.map(job => <li className="tv-row tv-job-row" key={job.id}>
        <div><h3>{job.title}</h3><p>{[job.location, workLabels[job.work_type], job.category].filter(Boolean).join(' · ')}</p>
          <p>{job.salary_min || job.salary_max ? [job.salary_min, job.salary_max].filter(Boolean).map(value => Number(value).toLocaleString('vi-VN')).join(' – ') + ' ₫' : 'Lương thỏa thuận'} · {job.created_at}</p></div>
        <Badge tone={job.status}>{jobLabels[job.status]}</Badge>
        <div className="tv-actions tv-job-actions">
          <ButtonLink to={'/jobs/' + job.id + '/applicants'} primary>Xem ứng viên</ButtonLink>
          <ButtonLink to={'/jobs/' + job.id + '/edit'}>{job.status === 'closed' ? 'Sửa để gửi duyệt lại' : 'Sửa tin'}</ButtonLink>
          {job.status === 'active' && <button className="tv-quiet-danger" onClick={event => {
            event.currentTarget.focus()
            setSelected(job)
          }}>Đóng tin</button>}
        </div>
      </li>)}</ul>
    </div>
    {selected && <Confirm title="Đóng tin tuyển dụng?" description={selected.title + ' sẽ dừng nhận hồ sơ mới.'} label="Đóng tin" fallback={list}
      onCancel={() => setSelected(null)} onConfirm={() => { closeJob(selected.id); setNotice('Đã đóng tin tuyển dụng.'); setSelected(null) }} />}
  </>
}
