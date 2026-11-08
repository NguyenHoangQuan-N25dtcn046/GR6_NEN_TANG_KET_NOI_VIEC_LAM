import { useEffect, useRef, useState } from 'react'
import { employerApi } from '../../api/client.js'
import { Alert, Button, Field, Spinner, inputCls } from '../../components/ui.jsx'

export default function CompanyProfile() {
  const [form, setForm] = useState({
    company_name: '',
    website: '',
    address: '',
    size: '',
  })
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [logo, setLogo] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const submitting = useRef(false)

  useEffect(() => {
    let cancelled = false
    employerApi
      .company()
      .then((c) => {
        if (cancelled) return
        setForm({
          company_name: c.company_name,
          website: c.website || '',
          address: c.address || '',
          size: c.size || '',
        })
        setLogo(c.logo_url || '')
        setLoaded(true)
      })
      .catch((e) => { if (!cancelled) setFeedback({ type: 'error', text: e.message }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [attempt])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!loaded || submitting.current) return
    const company_name = form.company_name.trim()
    if (!company_name) {
      setFeedback({ type: 'error', text: 'Nhập tên công ty.' })
      return
    }
    submitting.current = true
    setSaving(true)
    setFeedback(null)
    try {
      await employerApi.updateCompany({ ...form, company_name })
      setForm({ ...form, company_name })
      setFeedback({ type: 'success', text: 'Đã lưu hồ sơ công ty.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center gap-2 py-32 text-brand-700">
        <Spinner className="h-5 w-5" /> Đang tải hồ sơ công ty…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Hồ sơ công ty</h1>
      <p className="mt-1 text-sm text-slate-500">Thông tin hiển thị cho ứng viên.</p>

      {feedback && (
        <div role={feedback.type === 'success' ? 'status' : 'alert'} className="mt-4">
          <Alert type={feedback.type}>{feedback.text}</Alert>
        </div>
      )}

      {!loaded ? (
        <Button className="mt-4" onClick={() => {
          setLoading(true)
          setFeedback(null)
          setAttempt(n => n + 1)
        }}>Tải lại hồ sơ công ty</Button>
      ) : (
      <form onSubmit={handleSubmit} aria-busy={saving} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <fieldset disabled={saving} className="min-w-0 space-y-4">
        <div className="space-y-1 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Logo công ty</p>
          {/^(https?:\/\/|\/(?!\/))/i.test(logo) && <img src={logo} alt="Logo hiện tại" className="h-12 w-12 rounded-lg object-contain" />}
          <p>Đổi logo chưa khả dụng.</p>
        </div>
        <Field label="Tên công ty">
          <input
            required
            maxLength={150}
            className={inputCls}
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            maxLength={100}
            className={inputCls}
            placeholder="https://company.com"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </Field>
        <Field label="Địa chỉ">
          <input
            maxLength={255}
            className={inputCls}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Quy mô">
          <select
            className={inputCls}
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
          >
            <option value="">Chọn…</option>
            <option value="1-10">1 - 10 nhân viên</option>
            <option value="11-50">11 - 50 nhân viên</option>
            <option value="51-200">51 - 200 nhân viên</option>
            <option value="201-500">201 - 500 nhân viên</option>
            <option value="500+">Trên 500 nhân viên</option>
          </select>
        </Field>
        <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu hồ sơ công ty'}</Button>
        </fieldset>
      </form>
      )}
    </div>
  )
}
