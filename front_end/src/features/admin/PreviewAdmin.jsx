import { useState } from 'react'
import { Badge, categoryLabels, Choice, Heading, jobLabels, locationLabels, Notice, workLabels } from '../tv4-preview/ui'

const roles = [['', 'Tất cả vai trò'], ['candidate', 'Ứng viên'], ['employer', 'Nhà tuyển dụng'], ['admin', 'Quản trị viên']]

export function PreviewReview({ jobs, users, applicants, review }) {
  const [notice, setNotice] = useState('')
  const [noticeKey, setNoticeKey] = useState(0)
  const pending = jobs.filter(job => job.status === 'pending')
  return <><Heading title="Duyệt tin tuyển dụng" /><div className="tv-wrap tv-content">
    <h2>Tin chờ duyệt · {pending.length}</h2><Notice key={noticeKey} className={notice ? 'tv-result-notice' : ''}>{notice}</Notice>
    {!pending.length && <p className="tv-empty">Hiện chưa có tin tuyển dụng chờ duyệt.</p>}
    <ul className="tv-list">{pending.map(job => <li className="tv-review" key={job.id}>
      <h3>{job.title}</h3><p>{locationLabels[job.location] || job.location} · {workLabels[job.work_type]}</p>
      <details><summary>Xem chi tiết tin</summary>
        <p className="tv-message">{job.description}</p>
        <p>{[categoryLabels[job.category] || job.category, job.salary_min && Number(job.salary_min).toLocaleString('vi-VN') + ' ₫', job.salary_max && Number(job.salary_max).toLocaleString('vi-VN') + ' ₫'].filter(Boolean).join(' · ')}</p>
        <div className="tv-actions">
          <button className="tv-primary" onClick={() => { review(job.id, 'active'); setNotice('Đã duyệt tin “' + job.title + '”.'); setNoticeKey(key => key + 1) }}>Duyệt và đăng tin</button>
          <button className="tv-quiet-danger" onClick={() => { review(job.id, 'rejected'); setNotice('Đã từ chối tin “' + job.title + '”.'); setNoticeKey(key => key + 1) }}>Từ chối tin</button>
        </div>
      </details>
    </li>)}</ul>
    <h2>Tổng quan</h2><dl className="tv-stats">
      {[['Tin tuyển dụng', jobs.length], ['Hồ sơ ứng tuyển', applicants.length], ['Người dùng', users.length], ['Người dùng mới trong tháng', users.filter(user => user.newThisMonth).length]].map(([label, count]) =>
        <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
    </dl>
    <h3>Tin tuyển dụng theo trạng thái</h3>
    <ul className="tv-bars">{Object.entries(jobLabels).map(([status, label]) => {
      const count = jobs.filter(job => job.status === status).length
      return <li key={status}><span>{label}</span><span className="tv-bar" aria-hidden="true"><span style={{ width: (count / Math.max(jobs.length, 1) * 100) + '%' }} /></span><strong>{count}</strong></li>
    })}</ul>
  </div></>
}

export function PreviewUsers({ users, toggle }) {
  const [role, setRole] = useState('')
  const [notice, setNotice] = useState('')
  const visible = users.filter(user => !role || user.role === role)
  return <><Heading title="Quản lý người dùng" /><div className="tv-wrap tv-content">
    <div className="tv-filter"><Choice label="Lọc theo vai trò" value={role} options={roles} onChange={setRole} /></div>
    <h2>{visible.length} người dùng</h2><Notice>{notice}</Notice>
    {!visible.length && <p className="tv-empty">Không tìm thấy người dùng phù hợp.</p>}
    <ul className="tv-list">{visible.map(user => <li className="tv-row" key={user.id}>
      <div><h3>{user.email}</h3><p>{roles.find(([key]) => key === user.role)?.[1]} · {user.created_at}</p></div>
      <Badge tone={user.is_active ? 'active' : 'closed'}>{user.is_active ? 'Hoạt động' : 'Đã khóa'}</Badge>
      {user.role !== 'admin' && <div className="tv-actions"><button className={user.is_active ? 'tv-quiet-danger' : 'tv-primary'} onClick={() => {
        toggle(user.id); setNotice(user.is_active ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      }}>{user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</button></div>}
    </li>)}</ul>
  </div></>
}
