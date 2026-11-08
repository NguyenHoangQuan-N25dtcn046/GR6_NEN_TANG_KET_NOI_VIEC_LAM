import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { employerApi, jobsApi } from '../../api/client.js'
import { findOwnedJob } from './ownedJob.js'
import { Alert, Button, Field, Spinner, inputCls } from '../../components/ui.jsx'
import { CATEGORIES, PROVINCES } from '../../constants.js'

const WORK_TYPES = ['onsite', 'remote', 'hybrid']
const EMPTY_FORM = {
  title: '', description: '', location: '', category: '', work_type: 'onsite', salary_min: '', salary_max: '',
}

export default function JobForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [loaded, setLoaded] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoaded(null)
    setLoadError('')
    setError('')
    setForm(EMPTY_FORM)
    if (isEdit) {
      findOwnedJob(employerApi.jobs, id, () => cancelled)
        .then((j) => {
          if (cancelled) return
          setForm({
            title: j.title,
            description: j.description,
            location: j.location,
            category: j.category || '',
            work_type: j.work_type,
            salary_min: j.salary_min ?? '',
            salary_max: j.salary_max ?? '',
          })
          setLoaded(id)
        })
        .catch((e) => {
          if (!cancelled) setLoadError(e.message)
        })
    }
    return () => { cancelled = true }
  }, [id, isEdit, attempt])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting.current || (isEdit && loaded !== id)) return
    setError('')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location,
      category: form.category || null,
      work_type: form.work_type,
      salary_min: form.salary_min === '' ? null : Number(form.salary_min),
      salary_max: form.salary_max === '' ? null : Number(form.salary_max),
    }
    if (!payload.title || !payload.description) {
      setError('Nhập tiêu đề và mô tả công việc.')
      return
    }
    if (payload.salary_min !== null && payload.salary_max !== null && payload.salary_min > payload.salary_max) {
      setError('Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.')
      return
    }
    submitting.current = true
    setSaving(true)
    try {
      if (isEdit) await jobsApi.update(id, payload)
      else await jobsApi.create(payload)
      navigate('/employer/dashboard', { state: { jobNotice: 'Đã gửi tin cho quản trị viên duyệt.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  if (isEdit && loaded !== id && !loadError) {
    return (
      <div role="status" className="flex items-center justify-center gap-2 py-32 text-brand-700">
        <Spinner className="h-5 w-5" /> Đang tải nội dung tin…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Tin mới và tin đã chỉnh sửa cần được quản trị viên duyệt trước khi hiển thị công khai.
      </p>

      {(loadError || error) && (
        <div role="alert" className="mt-4">
          <Alert>{loadError || error}</Alert>
        </div>
      )}

      {loadError && isEdit ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => { setLoadError(''); setAttempt(n => n + 1) }}>Tải lại nội dung tin</Button>
          <Button variant="secondary" onClick={() => navigate('/employer/dashboard')}>Về danh sách tin</Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} aria-busy={saving} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <fieldset disabled={saving} className="min-w-0 space-y-4">
        <Field label="Tiêu đề công việc">
          <input
            required
            maxLength={150}
            className={inputCls}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>

        <Field label="Mô tả công việc">
          <textarea
            required
            rows={8}
            className={inputCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tỉnh/Thành">
            <select
              required
              className={inputCls}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option value="">Chọn…</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngành nghề">
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Chọn…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Hình thức làm việc">
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={form.work_type === w}
                onClick={() => setForm({ ...form, work_type: w })}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                  form.work_type === w
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lương tối thiểu (VNĐ)">
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.salary_min}
              onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
            />
          </Field>
          <Field label="Lương tối đa (VNĐ)">
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.salary_max}
              onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Đang gửi…' : isEdit ? 'Lưu và gửi duyệt lại' : 'Gửi tin để duyệt'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/employer/dashboard')}>
            Hủy
          </Button>
        </div>
        </fieldset>
      </form>
      )}
    </div>
  )
}
