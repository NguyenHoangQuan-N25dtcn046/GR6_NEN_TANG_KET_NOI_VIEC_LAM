import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import CanvasBackground from '../components/CanvasBackground.jsx'
import { Alert, Button, Field, inputCls } from '../components/ui.jsx'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'candidate',
    full_name: '',
    company_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === 'candidate'
          ? { full_name: form.full_name }
          : { company_name: form.company_name }),
      }
      const data = await authApi.register(payload)
      login(data.access_token, data.role)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <CanvasBackground />
      <div className="relative mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">Bạn là ứng viên hay nhà tuyển dụng?</p>

          {error && (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Bạn là">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'candidate', label: 'Ứng viên', icon: '👤' },
                  { value: 'employer', label: 'Nhà tuyển dụng', icon: '🏢' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      form.role === r.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Email">
              <input
                type="email"
                required
                className={inputCls}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            {form.role === 'candidate' ? (
              <Field label="Họ và tên">
                <input
                  required
                  className={inputCls}
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>
            ) : (
              <Field label="Tên công ty">
                <input
                  required
                  className={inputCls}
                  placeholder="Công ty ABC"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </Field>
            )}

            <Field label="Mật khẩu" hint="Tối thiểu 6 ký tự">
              <input
                type="password"
                required
                minLength={6}
                className={inputCls}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Đang tạo…' : 'Đăng ký'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
