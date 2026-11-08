import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client.js'
import { Spinner } from '../../components/ui.jsx'
import { formatDate } from '../../constants.js'

const ROLE_LABEL = { candidate: 'Ứng viên', employer: 'Nhà tuyển dụng', admin: 'Admin' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = { page_size: 100 }
      if (role) params.role = role
      const res = await adminApi.users(params)
      setUsers(res.items)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const toggle = async (u) => {
    try {
      if (u.is_active) await adminApi.lockUser(u.id)
      else await adminApi.unlockUser(u.id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>

      <div className="mt-4 flex gap-2">
        {['', 'candidate', 'employer'].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              role === r
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r === '' ? 'Tất cả' : ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-24 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Vai trò</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">{u.email}</td>
                  <td className="px-5 py-4 text-slate-600">{ROLE_LABEL[u.role] || u.role}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        u.is_active
                          ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                          : 'bg-rose-100 text-rose-700 ring-rose-200'
                      }`}
                    >
                      {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggle(u)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          u.is_active
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
