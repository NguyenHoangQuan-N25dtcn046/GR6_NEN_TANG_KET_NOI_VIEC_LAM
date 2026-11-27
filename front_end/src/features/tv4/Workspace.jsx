import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge, Confirm, Heading, Notice, workLabels } from '../tv4-preview/ui'
import '../tv4-preview/preview.css'
import './workspace.css'
import { request } from './api'

const pageSize = 20
const applicationStatuses = ['submitted', 'reviewing', 'accepted', 'rejected']
const applicationLabels = { submitted: 'Đã nộp', reviewing: 'Đang xét duyệt', accepted: 'Đã chấp nhận', rejected: 'Đã từ chối' }
const approvalLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã từ chối' }
const availabilityLabels = { open: 'Đang tuyển', closed: 'Đã đóng' }
const roleLabels = { candidate: 'Ứng viên', employer: 'Nhà tuyển dụng', admin: 'Quản trị viên' }
const salaryFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 2 })

function useAction() {
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState(null)
  async function run(action) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setMessage(null)
    try {
      const text = await action()
      if (text) setMessage({ text })
    } catch (error) {
      setMessage({ error: true, text: error.message })
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return { pending, message, run }
}

function useList(api, path) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    api(path, { signal: controller.signal })
      .then(items => {
        if (!controller.signal.aborted) setResult({ path, revision, items })
      })
      .catch(error => {
        if (!controller.signal.aborted) setResult({ path, revision, error: error.message })
      })
    return () => controller.abort()
  }, [api, path, revision])
  return {
    result: result?.path === path && result.revision === revision ? result : null,
    reload: () => setRevision(current => current + 1),
    replace: item => setResult(current => current?.items
      ? { ...current, items: current.items.map(row => row.id === item.id ? item : row) }
      : current),
  }
}

function Feedback({ action }) {
  return <Notice error={action.message?.error}>{action.message?.text}</Notice>
}

function ListFeedback({ list }) {
  if (!list.result) return <p role="status">Đang tải…</p>
  if (list.result.error) return <>
    <Notice error>{list.result.error}</Notice>
    <button type="button" onClick={list.reload}>Thử lại</button>
  </>
  return null
}

function Screen({ title, children, action }) {
  return <><Heading title={title} action={action} /><div className="tv-wrap tv-content">{children}</div></>
}

function ActionLink({ to, children }) {
  return <Link className="tv-button" to={to}>{children}</Link>
}

function SignIn({ role, onSession }) {
  const action = useAction()
  return <Screen title={'Đăng nhập · ' + roleLabels[role]}>
    <form className="tv-form tv-sign-in" aria-busy={action.pending} onSubmit={event => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(event.currentTarget))
      action.run(async () => {
        const { access_token: token } = await request('/auth/login', { method: 'POST', data })
        const user = await request('/auth/me', { token })
        if (user.role !== role) {
          await request('/auth/logout', { token, method: 'POST' }).catch(() => {})
          throw new Error('Vui lòng đăng nhập bằng tài khoản ' + roleLabels[role].toLocaleLowerCase('vi') + '.')
        }
        onSession({ token, user })
      })
    }}>
      <fieldset disabled={action.pending} className="tv-sign-in-fields">
        <label className="tv-field">Email <input name="email" type="email" autoComplete="username" required /></label>
        <label className="tv-field">Mật khẩu <input name="password" type="password" autoComplete="current-password" required /></label>
      </fieldset>
      <Feedback action={action} />
      <button className="tv-primary" disabled={action.pending}>{action.pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
  </Screen>
}

function MyJobs({ api }) {
  const { state } = useLocation()
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const list = useList(api, '/employer/jobs?limit=' + pageSize + '&offset=' + page * pageSize)
  const action = useAction()
  const jobs = list.result?.items
  return <Screen title="Tin tuyển dụng của tôi" action={<ActionLink to="/employer/jobs/new">Đăng tin tuyển dụng</ActionLink>}>
    {!action.message && <Notice>{state?.notice}</Notice>}
    <Feedback action={action} />
    <ListFeedback list={list} />
    {jobs?.length === 0 && <p className="tv-empty">Trang này chưa có tin tuyển dụng.</p>}
    {jobs && <ul className="tv-list">{jobs.map(job => {
      const moderation = job.approval_status
      const availability = job.job_status
      return <li className="tv-row" key={job.id}>
        <div><h3>{job.title}</h3><p>{job.location} · {workLabels[job.work_mode] || 'Chưa cập nhật hình thức làm việc'} · Mã tin {job.id}</p>
          {job.rejection_reason && <p className="tv-message">{job.rejection_reason}</p>}</div>
        <div className="tv-actions"><Badge tone={moderation === 'approved' ? 'active' : moderation}>{approvalLabels[moderation]}</Badge>
          <Badge tone={availability === 'open' ? 'active' : 'closed'}>{availabilityLabels[availability]}</Badge></div>
        <div className="tv-actions tv-live-job-actions">
          <ActionLink to={'/employer/jobs/' + job.id + '/applications'}>Xem ứng viên</ActionLink>
          <ActionLink to={'/employer/jobs/' + job.id + '/edit'}>Chỉnh sửa tin</ActionLink>
          {(availability === 'open' || moderation === 'approved') && <button type="button" disabled={action.pending}
            onClick={() => setSelected(job)}>{availability === 'open' ? 'Đóng tin' : 'Mở lại tin'}</button>}
        </div>
      </li>
    })}</ul>}
    {(page > 0 || jobs?.length === pageSize) && <div className="tv-actions">
      <button type="button" disabled={!page || action.pending} onClick={() => setPage(page - 1)}>Trang trước</button>
      <span>Trang {page + 1}</span>
      <button type="button" disabled={jobs?.length !== pageSize || action.pending} onClick={() => setPage(page + 1)}>Trang sau</button>
    </div>}
    {selected && <Confirm title={selected.job_status === 'open' ? 'Đóng tin tuyển dụng này?' : 'Mở lại tin tuyển dụng này?'}
      description={selected.title + ' · Mã tin ' + selected.id}
      label={selected.job_status === 'open' ? 'Đóng tin' : 'Mở lại tin'}
      onCancel={() => setSelected(null)} onConfirm={() => {
        const job = selected
        const job_status = job.job_status === 'open' ? 'closed' : 'open'
        setSelected(null)
        action.run(async () => {
          list.replace(await api('/jobs/' + job.id + '/status', { method: 'PATCH', data: { job_status } }))
          return job_status === 'closed' ? 'Đã đóng tin tuyển dụng.' : 'Đã mở lại tin tuyển dụng.'
        })
      }} />}
  </Screen>
}

function JobFields({ job, api }) {
  const action = useAction()
  const navigate = useNavigate()
  return <form className="tv-form" onSubmit={event => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const data = { title: values.get('title').trim(), description: values.get('description').trim() }
    if (!job) {
      data.location = values.get('location').trim()
      for (const field of ['salary_min', 'salary_max', 'deadline']) data[field] = values.get(field) || null
    }
    const mode = values.get('work_mode')
    if (!job) data.work_mode = mode || null
    else if (mode && mode !== job.work_mode) data.work_mode = mode
    action.run(async () => {
      if (!job && data.salary_min !== null && data.salary_max !== null && Number(data.salary_min) > Number(data.salary_max)) throw new Error('Mức lương tối thiểu không được vượt quá mức lương tối đa.')
      if (job && data.title === job.title && data.description === job.description && !data.work_mode) throw new Error('Hãy thay đổi tiêu đề, mô tả hoặc hình thức làm việc.')
      const saved = await api(job ? '/jobs/' + job.id : '/employer/jobs', { method: job ? 'PATCH' : 'POST', data })
      navigate('/employer/jobs', { replace: true, state: { notice: 'Đã gửi tin ' + saved.id + ' để duyệt.' } })
    })
  }}>
    <fieldset className="tv-grid" disabled={action.pending}>
      <label className="tv-field tv-wide">Tiêu đề tuyển dụng <input name="title" defaultValue={job?.title} minLength={3} maxLength={200} required /></label>
      <label className="tv-field tv-wide">Mô tả công việc <textarea name="description" defaultValue={job?.description} minLength={10} required rows={6} /></label>
      <label className="tv-field">Hình thức làm việc <select name="work_mode" defaultValue={job?.work_mode || ''}>
        <option value="" disabled={Boolean(job?.work_mode)}>Chưa cập nhật</option>
        {Object.entries(workLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      {!job && <>
        <label className="tv-field">Địa điểm <input name="location" maxLength={200} required /></label>
        <label className="tv-field">Hạn ứng tuyển <input name="deadline" type="date" /></label>
        <label className="tv-field">Mức lương tối thiểu (đồng) <input name="salary_min" type="number" min="0" step="0.01" /></label>
        <label className="tv-field">Mức lương tối đa (đồng) <input name="salary_max" type="number" min="0" step="0.01" /></label>
      </>}
    </fieldset>
    {job && <p>Quản trị viên sẽ duyệt lại tin sau khi bạn lưu chỉnh sửa.</p>}
    <Feedback action={action} />
    <button className="tv-primary" disabled={action.pending}>{action.pending ? 'Đang gửi…' : 'Gửi duyệt'}</button>
  </form>
}

function EditJob({ api }) {
  const { id } = useParams()
  return <Screen title="Chỉnh sửa tin" action={<ActionLink to="/employer/jobs">Về danh sách tin</ActionLink>}>
    {/^[1-9][0-9]*$/.test(id) ? <OwnedJobEditor key={id} api={api} id={id} /> : <Notice error>Mã tin không hợp lệ.</Notice>}
  </Screen>
}

function OwnedJobEditor({ api, id }) {
  // The public detail endpoint hides pending jobs. The employer list includes all owned jobs.
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      for (let offset = 0; !controller.signal.aborted; offset += 100) {
        const jobs = await api('/employer/jobs?limit=100&offset=' + offset, { signal: controller.signal })
        const job = jobs.find(item => String(item.id) === id)
        if (job || jobs.length < 100) return job
      }
    }
    load().then(job => {
      if (!controller.signal.aborted) setResult({ job })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ error: error.message })
    })
    return () => controller.abort()
  }, [api, id, attempt])
  if (!result) return <p role="status">Đang tải tin tuyển dụng…</p>
  if (result.error) return <><Notice error>{result.error}</Notice><button onClick={() => {
    setResult(null)
    setAttempt(current => current + 1)
  }}>Thử lại</button></>
  return result.job ? <JobFields job={result.job} api={api} /> : <Notice error>Không tìm thấy tin trong danh sách của bạn.</Notice>
}

function Applicants({ api }) {
  const { id } = useParams()
  if (!/^[1-9][0-9]*$/.test(id)) return <Unavailable title="Danh sách ứng viên">Mã tin không hợp lệ.</Unavailable>
  return <ApplicantList key={id} api={api} id={id} />
}

function ApplicantList({ api, id }) {
  const path = '/employer/jobs/' + id + '/applications'
  const list = useList(api, path)
  const action = useAction()
  return <Screen title={'Danh sách ứng viên · Mã tin ' + id} action={<ActionLink to="/employer/jobs">Về danh sách tin</ActionLink>}>
    <Feedback action={action} />
    <ListFeedback list={list} />
    {list.result?.items?.length === 0 && <p className="tv-empty">Tin này chưa có đơn ứng tuyển.</p>}
    <ul className="tv-list">{list.result?.items?.map(item => <li className="tv-row" key={item.id}>
      <div><h3>{item.candidate_name || 'Ứng viên ' + item.candidate_id}</h3>
        <p>{new Date(item.applied_at).toLocaleDateString('vi-VN')}</p>
        {item.cover_letter && <p className="tv-message">{item.cover_letter}</p>}</div>
      <label className="tv-field">Trạng thái ứng tuyển
        <select value={item.status} disabled={action.pending} onChange={event => {
          const status = event.target.value
          action.run(async () => {
            list.replace(await api(path + '/' + item.id, { method: 'PATCH', data: { status } }))
            return 'Đã cập nhật trạng thái ứng tuyển.'
          })
        }}>
          {applicationStatuses.map(status => <option key={status} disabled={status === 'submitted'} value={status}>{applicationLabels[status]}</option>)}
        </select>
      </label>
      <button type="button" disabled={action.pending} onClick={() => action.run(async () => {
        const file = await api(path + '/' + item.id + '/cv', { file: true })
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        const extension = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'docx'
          : 'pdf'
        link.download = 'cv-ung-tuyen-' + item.id + '.' + extension
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 30000)
        return 'Đang tải CV xuống.'
      })}>Tải CV</button>
    </li>)}</ul>
  </Screen>
}

function formatJobSalary({ salary_min: min, salary_max: max }) {
  if (min != null && max != null) return Number(min) === Number(max)
    ? salaryFormat.format(min)
    : salaryFormat.format(min) + ' – ' + salaryFormat.format(max)
  if (min != null) return 'Từ ' + salaryFormat.format(min)
  if (max != null) return 'Đến ' + salaryFormat.format(max)
  return 'Thỏa thuận'
}

function PendingJob({ job, pending, rejecting, onApprove, onReject, onCancelReject, onSubmitRejection }) {
  const rejectButton = useRef(null)
  const invalidReason = 'Hãy nhập lý do từ chối dài ít nhất 5 ký tự.'
  return <li className="tv-review tv-queue-card">
    <div className="tv-queue-card-heading">
      <div>
        <h3>{job.title}</h3>
        <p>{job.company_name || 'Chưa cập nhật tên công ty'} · {job.location} · Mã tin {job.id}</p>
      </div>
      <Badge tone="pending">{approvalLabels.pending}</Badge>
    </div>
    <details>
      <summary>Xem nội dung tin</summary>
      <dl className="tv-queue-facts">
        <div><dt>Hình thức làm việc</dt><dd>{workLabels[job.work_mode] || 'Chưa cập nhật'}</dd></div>
        <div><dt>Mức lương</dt><dd>{formatJobSalary(job)}</dd></div>
        <div><dt>Hạn ứng tuyển</dt><dd>{job.deadline
          ? <time dateTime={job.deadline}>{job.deadline.split('-').reverse().join('/')}</time>
          : 'Chưa cập nhật'}</dd></div>
        <div><dt>Trạng thái tuyển dụng</dt><dd>{availabilityLabels[job.job_status]}</dd></div>
      </dl>
      <h4>Mô tả công việc</h4>
      <p className="tv-message">{job.description}</p>
    </details>
    <div className="tv-actions">
      <button type="button" className="tv-primary" disabled={pending} onClick={onApprove}>Duyệt tin</button>
      <button type="button" className="tv-quiet-danger" ref={rejectButton} disabled={pending} aria-expanded={rejecting}
        onClick={onReject}>Từ chối tin</button>
    </div>
    {rejecting && <form className="tv-form tv-queue-reject" aria-busy={pending} onSubmit={event => {
      event.preventDefault()
      const input = event.currentTarget.elements.reason
      const reason = input.value.trim()
      if (reason.length < 5) {
        input.setCustomValidity(invalidReason)
        input.reportValidity()
        return
      }
      onSubmitRejection(reason)
    }}>
      <label className="tv-field">Lý do từ chối
        <textarea name="reason" rows={3} required minLength={5} maxLength={1000} autoFocus disabled={pending}
          onInput={event => event.currentTarget.setCustomValidity('')}
          onInvalid={event => event.currentTarget.setCustomValidity(invalidReason)} />
      </label>
      <div className="tv-actions">
        <button type="button" disabled={pending} onClick={() => {
          onCancelReject()
          rejectButton.current?.focus()
        }}>Hủy</button>
        <button type="submit" className="tv-danger" disabled={pending}>{pending ? 'Đang gửi…' : 'Xác nhận từ chối'}</button>
      </div>
    </form>}
  </li>
}

function Moderation({ api }) {
  const action = useAction()
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const reloadButton = useRef(null)
  const list = useList(api, '/admin/jobs/pending?limit=' + pageSize + '&offset=' + page * pageSize)
  const queue = list.result?.items
  const lastPage = queue ? Math.max(0, Math.ceil(queue.total / pageSize) - 1) : page

  useEffect(() => {
    if (page > lastPage) setPage(lastPage)
  }, [page, lastPage])

  function review(job, decision, reason) {
    action.run(async () => {
      try {
        await api('/admin/jobs/' + job.id + '/' + decision, { method: 'PATCH', data: reason ? { reason } : undefined })
      } catch (error) {
        if (error.status === 404 || error.status === 409) {
          setRejectingId(null)
          list.reload()
          reloadButton.current?.focus()
        }
        throw error
      }
      setRejectingId(null)
      list.reload()
      reloadButton.current?.focus()
      return (decision === 'approve' ? 'Đã duyệt tin “' : 'Đã từ chối tin “') + job.title + '”.'
    })
  }

  function goToPage(next) {
    setRejectingId(null)
    setPage(next)
  }

  return <Screen title="Duyệt tin tuyển dụng">
    <div className="tv-queue-heading">
      <h2>Tin chờ duyệt {queue && <span className="tv-queue-total">{queue.total.toLocaleString('vi-VN')}</span>}</h2>
      <button type="button" ref={reloadButton} aria-disabled={action.pending}
        onClick={() => {
          if (action.pending) return
          setRejectingId(null)
          list.reload()
        }}>Tải lại</button>
    </div>
    <Feedback action={action} />
    <ListFeedback list={list} />
    {queue && page <= lastPage && <>
      {queue.total === 0 && <p className="tv-empty">Hiện chưa có tin tuyển dụng chờ duyệt.</p>}
      <ul className="tv-list">{queue.items.map(job => <PendingJob key={job.id} job={job} pending={action.pending}
        rejecting={rejectingId === job.id}
        onApprove={() => setSelected(job)}
        onReject={() => setRejectingId(job.id)}
        onCancelReject={() => setRejectingId(null)}
        onSubmitRejection={reason => review(job, 'reject', reason)} />)}</ul>
      {lastPage > 0 && <div className="tv-actions">
        <button type="button" disabled={page === 0 || action.pending} onClick={() => goToPage(page - 1)}>Trang trước</button>
        <span>Trang {page + 1} / {lastPage + 1}</span>
        <button type="button" disabled={page === lastPage || action.pending} onClick={() => goToPage(page + 1)}>Trang sau</button>
      </div>}
    </>}
    {selected && <Confirm title="Duyệt tin tuyển dụng này?"
      description={'Ứng viên sẽ thấy tin “' + selected.title + '” trong danh sách việc làm khi tin ở trạng thái đang tuyển.'}
      label="Duyệt tin" confirmClassName="tv-primary" fallback={reloadButton} onCancel={() => setSelected(null)}
      onConfirm={() => {
        setSelected(null)
        review(selected, 'approve')
      }} />}
  </Screen>
}

function ManageUsers({ api }) {
  const [filters, setFilters] = useState({ q: '', role: '', is_active: '' })
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const action = useAction()
  const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize) })
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  const list = useList(api, '/admin/users?' + params.toString())
  const data = list.result?.items
  return <Screen title="Quản lý người dùng" action={<ActionLink to="/admin/jobs">Duyệt tin tuyển dụng</ActionLink>}>
    <p>Tra cứu và khóa hoặc mở khóa tài khoản ứng viên, nhà tuyển dụng vi phạm.</p>
    <form className="tv-form" onSubmit={event => {
      event.preventDefault()
      const fields = new FormData(event.currentTarget)
      setFilters({ q: String(fields.get('q')).trim(), role: String(fields.get('role')), is_active: String(fields.get('is_active')) })
      setPage(0)
      list.reload()
    }}>
      <fieldset className="tv-grid" disabled={action.pending}>
        <label className="tv-field">Tìm theo email<input name="q" type="search" maxLength={255} placeholder="Email người dùng" /></label>
        <label className="tv-field">Vai trò<select name="role"><option value="">Tất cả</option><option value="candidate">Ứng viên</option><option value="employer">Nhà tuyển dụng</option><option value="admin">Quản trị viên</option></select></label>
        <label className="tv-field">Trạng thái<select name="is_active"><option value="">Tất cả</option><option value="true">Hoạt động</option><option value="false">Đã khóa</option></select></label>
      </fieldset>
      <div className="tv-actions"><button className="tv-primary" disabled={action.pending}>Tìm kiếm / Lọc</button><button type="button" disabled={action.pending} onClick={list.reload}>Tải lại</button></div>
    </form>
    <Feedback action={action} />
    <ListFeedback list={list} />
    {data && <>
      <p role="status">Tổng số tài khoản phù hợp: <strong>{data.total}</strong></p>
      {!data.items.length && <p className="tv-empty">Không tìm thấy tài khoản trên trang này.</p>}
      <ul className="tv-list">{data.items.map(user => <li className="tv-row" key={user.id}>
        <div><h3>{user.email}</h3><p>Mã tài khoản {user.id} · {roleLabels[user.role] || 'Vai trò khác'}</p></div>
        <div className="tv-actions"><Badge tone={user.is_active ? 'active' : 'closed'}>{user.is_active ? 'Hoạt động' : 'Đã khóa'}</Badge></div>
        {['candidate', 'employer'].includes(user.role) ? <button type="button" disabled={action.pending} onClick={() => setSelected(user)}>{user.is_active ? 'Khóa tài khoản' : 'Mở khóa'}</button> : <span>Tài khoản được bảo vệ</span>}
      </li>)}</ul>
      <div className="tv-actions">
        <button type="button" disabled={page === 0 || action.pending} onClick={() => setPage(p => Math.max(0, p - 1))}>Trang trước</button>
        <span>Trang {page + 1} / {Math.max(1, Math.ceil(data.total / pageSize))}</span>
        <button type="button" disabled={(page + 1) * pageSize >= data.total || action.pending} onClick={() => setPage(p => p + 1)}>Trang sau</button>
      </div>
    </>}
    {selected && <Confirm title={selected.is_active ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'} description={selected.email + (selected.is_active ? ' sẽ không thể đăng nhập hoặc sử dụng API yêu cầu xác thực.' : ' sẽ được phép đăng nhập lại.')} label={selected.is_active ? 'Xác nhận khóa' : 'Xác nhận mở khóa'} onCancel={() => setSelected(null)} onConfirm={() => {
      const user = selected
      setSelected(null)
      action.run(async () => {
        await api('/admin/users/' + user.id + '/status', { method: 'PATCH', data: { is_active: !user.is_active } })
        setPage(0)
        list.reload()
        return user.is_active ? 'Đã khóa tài khoản ' + user.email : 'Đã mở khóa tài khoản ' + user.email
      })
    }} />}
  </Screen>
}

function Unavailable({ title, children }) {
  return <Screen title={title}><Notice>{children}</Notice></Screen>
}

export default function Workspace({ role }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const [session, setSession] = useState(null)
  const [expired, setExpired] = useState(false)
  const logout = useAction()
  useEffect(() => setMenuOpen(false), [pathname, session])
  const api = useCallback(async (path, options) => {
    try {
      return await request(path, { ...options, token: session.token })
    } catch (error) {
      if (error.status === 401) {
        setSession(current => current === session ? null : current)
        setExpired(true)
      }
      throw error
    }
  }, [session])

  return <main className="tv4-preview tv4-live">
    <div className="tv-nav"><nav className="tv-wrap tv-live-nav" aria-label="Điều hướng quản lý tuyển dụng" onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen && menuButton.current?.offsetWidth) {
        event.preventDefault()
        setMenuOpen(false)
        menuButton.current.focus()
      }
    }}>
      <Link className="tv-brand" to="/">JobLink</Link>
      <button type="button" className="tv-live-menu-toggle" ref={menuButton} aria-controls="tv4-live-menu"
        aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>Danh mục</button>
      <div id="tv4-live-menu" className={'tv-live-menu' + (menuOpen ? ' is-open' : '')}>
      <a href={import.meta.env.VITE_CANDIDATE_URL || "http://localhost:5174/"}>Ứng viên</a><NavLink to="/employer/jobs">Nhà tuyển dụng</NavLink><NavLink to="/admin/jobs">Quản trị</NavLink>
      {session && <>
        <NavLink to={role === 'employer' ? '/employer/company' : '/admin/users'}>{role === 'employer' ? 'Hồ sơ công ty' : 'Quản lý người dùng'}</NavLink>
        <button type="button" disabled={logout.pending} onClick={() => logout.run(async () => {
          await api('/auth/logout', { method: 'POST' })
          setSession(null)
        })}>{logout.pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
      </>}
      </div>
    </nav></div>
    <div className="tv-wrap"><Feedback action={logout} />{!session && expired && <Notice error>Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.</Notice>}</div>
    {!session ? <SignIn role={role} onSession={next => { setExpired(false); setSession(next) }} /> : <Routes>
      <Route index element={<Navigate to="jobs" replace />} />
      {role === 'employer' ? <>
        <Route path="jobs" element={<MyJobs api={api} />} />
        <Route path="jobs/new" element={<Screen title="Đăng tin tuyển dụng" action={<ActionLink to="/employer/jobs">Về danh sách tin</ActionLink>}><JobFields api={api} /></Screen>} />
        <Route path="jobs/:id/edit" element={<EditJob api={api} />} />
        <Route path="jobs/:id/applications" element={<Applicants api={api} />} />
        <Route path="applications" element={<Navigate to="/employer/jobs" replace />} />
        <Route path="company" element={<Unavailable title="Hồ sơ công ty">Tính năng chỉnh sửa hồ sơ công ty chưa có sẵn.</Unavailable>} />
      </> : <>
        <Route path="jobs" element={<Moderation api={api} />} />
        <Route path="users" element={<ManageUsers api={api} />} />
      </>}
      <Route path="*" element={<Unavailable title="Không tìm thấy trang">Hãy chọn một trang trong thanh điều hướng.</Unavailable>} />
    </Routes>}
  </main>
}
