import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { employerApi, jobsApi } from '../../api/client.js'
import { JobStatusBadge } from '../../components/StatusBadge.jsx'
import { Alert, Button, Spinner } from '../../components/ui.jsx'
import { formatDate, formatSalary } from '../../constants.js'

export default function EmployerDashboard() {
  const location = useLocation()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [closing, setClosing] = useState(null)
  const [confirmClose, setConfirmClose] = useState(null)
  const [notice, setNotice] = useState(location.state?.jobNotice || '')

  const load = async () => {
    setLoading(true)
    setError('')
    setLoadFailed(false)
    try {
      const res = await employerApi.jobs({ page_size: 100 })
      setJobs(res.items)
    } catch (e) {
      setLoadFailed(true)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const close = async (job) => {
    if (closing !== null || job.status !== 'active') return
    setClosing(job.id)
    setError('')
    setNotice('')
    try {
      await jobsApi.close(job.id)
      setJobs(items => items.map(item => item.id === job.id ? { ...item, status: 'closed' } : item))
      setConfirmClose(null)
      setNotice('Đã đóng tin. Tin này đã dừng nhận hồ sơ mới.')
    } catch (e) {
      setError(e.message)
    } finally {
      setClosing(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tin tuyển dụng</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý các bài đăng của công ty bạn.</p>
        </div>
        <Link
          to="/employer/jobs/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Đăng tin mới
        </Link>
      </div>

      {error && <div role="alert" className="mt-4"><Alert>{error}</Alert></div>}
      {notice && <div role="status" className="mt-4"><Alert type="success">{notice}</Alert></div>}

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-24 text-brand-700">
          <Spinner className="h-5 w-5" /> Đang tải tin tuyển dụng…
        </div>
      ) : loadFailed ? (
        <Button className="mt-4" onClick={load}>Tải lại danh sách tin</Button>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-400">
          Chưa có tin tuyển dụng nào. Hãy đăng tin đầu tiên.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" tabIndex={0} role="region" aria-label="Danh sách tin tuyển dụng">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Tiêu đề</th>
                <th className="px-5 py-3 font-medium">Lương</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Ngày đăng</th>
                <th className="px-5 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{job.title}</div>
                    <div className="text-xs text-slate-400">{job.location}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatSalary(job.salary_min, job.salary_max)}</td>
                  <td className="px-5 py-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(job.created_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-44 flex-wrap items-center justify-end gap-2">
                      <Link
                        to={`/employer/jobs/${job.id}/applicants`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Xem ứng viên
                      </Link>
                      <Link
                        to={`/employer/jobs/${job.id}/edit`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {job.status === 'closed' ? 'Sửa để gửi duyệt lại' : 'Sửa tin'}
                      </Link>
                      {job.status === 'active' && confirmClose !== job.id && (
                        <button
                          disabled={closing !== null}
                          onClick={() => setConfirmClose(job.id)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Đóng tin
                        </button>
                      )}
                      {confirmClose === job.id && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-xs text-slate-600">Dừng nhận hồ sơ mới?</span>
                          <Button variant="danger" disabled={closing !== null} onClick={() => close(job)}>
                            {closing === job.id ? 'Đang đóng…' : 'Xác nhận đóng tin'}
                          </Button>
                          <Button variant="secondary" disabled={closing !== null} onClick={() => setConfirmClose(null)}>Hủy</Button>
                        </div>
                      )}
                    </div>
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
