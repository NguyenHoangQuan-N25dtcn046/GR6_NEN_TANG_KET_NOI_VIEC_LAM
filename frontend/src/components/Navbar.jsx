import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navLinkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth()
  const navigate = useNavigate()

  const links = [
    { to: '/', label: 'Việc làm', show: true },
    ...(role === 'candidate'
      ? [
          { to: '/candidate/applications', label: 'Ứng tuyển của tôi', show: true },
          { to: '/candidate/profile', label: 'Hồ sơ', show: true },
        ]
      : []),
    ...(role === 'employer'
      ? [
          { to: '/employer/dashboard', label: 'Tin tuyển dụng', show: true },
          { to: '/employer/company', label: 'Công ty', show: true },
        ]
      : []),
    ...(role === 'admin'
      ? [
          { to: '/admin', label: 'Kiểm duyệt', show: true },
          { to: '/admin/users', label: 'Người dùng', show: true },
        ]
      : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 7h14M5 12h14M5 17h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-lg tracking-tight text-slate-900">
            Job<span className="text-brand-600">Link</span>
          </span>
        </Link>

        <div className="ml-6 hidden items-center gap-1 md:flex">
          {links.filter((l) => l.show).map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkCls} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm capitalize text-slate-500 sm:inline">
                {role === 'candidate' ? 'Ứng viên' : role === 'employer' ? 'Nhà tuyển dụng' : 'Quản trị viên'}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
