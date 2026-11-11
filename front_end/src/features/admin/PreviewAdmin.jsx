import { useState } from 'react'
import { Badge, Choice, Heading, Notice, workLabels } from '../tv4-preview/ui'

const roles = [['', 'Tất cả vai trò'], ['candidate', 'Ứng viên'], ['employer', 'Nhà tuyển dụng'], ['admin', 'Quản trị viên']]

export function PreviewReview({ jobs, users, applicants, review }) {
  const [notice, setNotice] = useState('')
  const pending = jobs.filter(job => job.status === 'pending')
  return <><Heading title="Kiểm duyệt tin tuyển dụng" /><div className="tv-wrap tv-content">
    <h2>Bài đăng chờ duyệt · {pending.length}</h2><Notice>{notice}</Notice>
    {!pending.length && <p className="tv-empty">Không còn tin chờ duyệt.</p>}
    <ul className="tv-list">{pending.map(job => <li className="tv-review" key={job.id}>
      <h3>{job.title}</h3><p>{job.location} · {workLabels[job.work_type]}</p>
      <details><summary>Xem nội dung tin</summary>
        <p className="tv-message">{job.description}</p>
        <p>{[job.category, job.salary_min && Number(job.salary_min).toLocaleString('vi-VN') + ' ₫', job.salary_max && Number(job.salary_max).toLocaleString('vi-VN') + ' ₫'].filter(Boolean).join(' · ')}</p>
        <div className="tv-actions">
          <button className="tv-primary" onClick={() => { review(job.id, 'active'); setNotice('Đã duyệt tin: ' + job.title) }}>Duyệt và công khai tin</button>
          <button className="tv-quiet-danger" onClick={() => { review(job.id, 'rejected'); setNotice('Đã từ chối tin: ' + job.title) }}>Từ chối tin</button>
        </div>
      </details>
    </li>)}</ul>
    <h2>Thống kê</h2><dl className="tv-stats">
      {[['Tin tuyển dụng', jobs.length], ['Hồ sơ nộp', applicants.length], ['Người dùng', users.length], ['Mới trong tháng', users.filter(user => user.newThisMonth).length]].map(([label, count]) =>
        <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
    </dl>
    <h3>Tin theo trạng thái</h3>
    <ul className="tv-bars">{[['active', 'Đang tuyển'], ['pending', 'Chờ duyệt'], ['rejected', 'Bị từ chối'], ['closed', 'Đã đóng']].map(([status, label]) => {
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
    {!visible.length && <p className="tv-empty">Không có người dùng phù hợp.</p>}
    <ul className="tv-list">{visible.map(user => <li className="tv-row" key={user.id}>
      <div><h3>{user.email}</h3><p>{roles.find(([key]) => key === user.role)?.[1]} · {user.created_at}</p></div>
      <Badge tone={user.is_active ? 'active' : 'closed'}>{user.is_active ? 'Đang hoạt động' : 'Đã khóa'}</Badge>
      {user.role !== 'admin' && <div className="tv-actions"><button className={user.is_active ? 'tv-quiet-danger' : 'tv-primary'} onClick={() => {
        toggle(user.id); setNotice(user.is_active ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      }}>{user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</button></div>}
    </li>)}</ul>
  </div></>
}
