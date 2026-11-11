import { useState } from 'react'
import { Badge, ButtonLink, Choice, Heading, Notice } from '../tv4-preview/ui'

const statuses = [['submitted', 'Đã nộp'], ['shortlisted', 'Đã duyệt'], ['accepted', 'Mời phỏng vấn'], ['rejected', 'Từ chối']]

export default function PreviewApplicants({ job, applicants, update }) {
  const [notice, setNotice] = useState('')
  return <><Heading title="Ứng viên theo tin" /><div className="tv-wrap tv-content">
    <ButtonLink to="/jobs">Về quản lý tin</ButtonLink>
    <h2>{job.title}</h2><Notice>{notice}</Notice>
    {!applicants.length && <p className="tv-empty">Tin này chưa nhận được hồ sơ ứng tuyển.</p>}
    <ul className="tv-list">{applicants.map(app => <li className="tv-row" key={app.id}>
      <div><h3>{app.name}</h3><p>{app.email}</p><p className="tv-message">{app.message}</p></div>
      <Badge tone={app.status}>{statuses.find(([key]) => key === app.status)?.[1]}</Badge>
      <div className="tv-actions">
        <ButtonLink to={'/cv/' + app.id}>Mở CV mẫu</ButtonLink>
        <Choice label="Trạng thái hồ sơ" options={statuses} value={app.status} onChange={status => {
          update(app.id, status); setNotice('Đã cập nhật trạng thái hồ sơ.')
        }} />
      </div>
    </li>)}</ul>
  </div></>
}
