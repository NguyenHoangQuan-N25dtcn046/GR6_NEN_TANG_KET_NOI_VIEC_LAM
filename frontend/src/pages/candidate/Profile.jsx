import { useEffect, useState } from 'react'
import { candidateApi, authApi } from '../../api/client.js'
import { Alert, Button, Field, Spinner, inputCls } from '../../components/ui.jsx'

export default function CandidateProfile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', skills: '' })
  const [cv, setCv] = useState(null)
  const [msg, setMsg] = useState('')
  const [pwd, setPwd] = useState({ old_password: '', new_password: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const p = await candidateApi.profile()
      setProfile(p)
      setForm({ full_name: p.full_name, phone: p.phone || '', skills: (p.skills || []).join(', ') })
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const skills = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await candidateApi.updateProfile({ full_name: form.full_name, phone: form.phone, skills })
      setMsg('Cập nhật hồ sơ thành công')
      load()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await candidateApi.uploadCv(fd)
      setCv(null)
      setMsg('Tải CV lên thành công')
      load()
    } catch (err) {
      setMsg(err.message)
    }
  }

  const handleChangePwd = async (e) => {
    e.preventDefault()
    setPwdMsg('')
    try {
      await authApi.changePassword(pwd)
      setPwdMsg('Đổi mật khẩu thành công')
      setPwd({ old_password: '', new_password: '' })
    } catch (err) {
      setPwdMsg(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
      <p className="mt-1 text-sm text-slate-500">{profile?.email}</p>

      {msg && (
        <div className="mt-4">
          <Alert type={msg.includes('thành công') ? 'success' : 'error'}>{msg}</Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Thông tin cơ bản</h2>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <Field label="Họ và tên">
              <input
                className={inputCls}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Kỹ năng" hint="Phân cách bằng dấu phẩy">
              <input
                className={inputCls}
                value={form.skills}
                placeholder="React, Python, SQL"
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
            </Field>
            <Button type="submit">Lưu thay đổi</Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">CV của bạn</h2>
            {profile?.cv_url ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-slate-600">📄 CV đã tải lên</span>
                <a
                  href={`/uploads/${profile.cv_url.split('/uploads/')[1]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Xem CV
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Bạn chưa tải CV lên.</p>
            )}
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Tải CV mới (PDF/Docx ≤ 5MB)
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
            </label>
            {cv && <p className="mt-2 text-xs text-slate-400">{cv.name}</p>}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Đổi mật khẩu</h2>
            {pwdMsg && (
              <div className="mt-3">
                <Alert type={pwdMsg.includes('thành công') ? 'success' : 'error'}>{pwdMsg}</Alert>
              </div>
            )}
            <form onSubmit={handleChangePwd} className="mt-4 space-y-4">
              <Field label="Mật khẩu hiện tại">
                <input
                  type="password"
                  className={inputCls}
                  value={pwd.old_password}
                  onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })}
                />
              </Field>
              <Field label="Mật khẩu mới">
                <input
                  type="password"
                  className={inputCls}
                  value={pwd.new_password}
                  onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                />
              </Field>
              <Button type="submit" variant="secondary">
                Đổi mật khẩu
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
