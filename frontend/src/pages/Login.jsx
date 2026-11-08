import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import CanvasBackground from '../components/CanvasBackground.jsx'
import { Alert, Button, Field, inputCls } from '../components/ui.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(form)
      login(data.access_token, data.role)
      const home = data.role === 'employer' ? '/employer/dashboard' : data.role === 'admin' ? '/admin' : '/'
      const from = location.state?.from?.pathname || home
      navigate(from, { replace: true })
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
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-slate-500">Chào mừng bạn quay trở lại</p>

          {error && (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <Field label="Mật khẩu">
              <input
                type="password"
                required
                className={inputCls}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
