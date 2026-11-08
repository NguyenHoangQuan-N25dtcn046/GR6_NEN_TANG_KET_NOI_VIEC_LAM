import { useEffect, useState } from 'react'
import { adminApi } from '../../api/client.js'
import StatsChart from '../../components/StatsChart.jsx'
import { JobStatusBadge } from '../../components/StatusBadge.jsx'
import { Alert, Button, Spinner } from '../../components/ui.jsx'
import { formatDate, formatSalary } from '../../constants.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statsError, setStatsError] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reviewing, setReviewing] = useState(null)
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    setLoadFailed(false)
    setStatsError(false)
    void adminApi.stats().then(setStats).catch(() => setStatsError(true))
    try {
      const page = await adminApi.jobs({ status: 'pending', page_size: 50 })
      setPending(page.items)
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

  const review = async (job, status) => {
    if (reviewing !== null) return
    setReviewing({ id: job.id, status })
    setError('')
    setNotice('')
    try {
      await adminApi.reviewJob(job.id, status)
      setNotice(status === 'active' ? 'Đã duyệt tin. Ứng viên có thể tìm thấy tin này.' : 'Đã từ chối tin tuyển dụng.')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setReviewing(null)
    }
  }

  const chartData = stats
    ? [
        { label: 'Việc làm', value: stats.total_jobs },
        { label: 'Hồ sơ nộp', value: stats.total_applications },
        { label: 'Người dùng', value: stats.total_users },
        { label: 'Mới/tháng', value: stats.new_users_this_month },
      ]
    : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>

      {error && <div role="alert" className="mt-4"><Alert>{error}</Alert></div>}
      {notice && <div role="status" className="mt-4"><Alert type="success">{notice}</Alert></div>}
      {statsError && <p role="status" className="mt-4 text-sm text-slate-600">Chưa tải được thống kê.</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {chartData.map((c, i) => (
          <StatCard key={c.label} label={c.label} value={c.value} index={i} />
        ))}
      </div>

      {stats && <div className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-semibold text-slate-900">Thống kê</h2>
        <StatsChart data={chartData} />
      </div>}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Bài đăng chờ duyệt
        </h2>

        {loading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
            <Spinner className="h-5 w-5" /> Đang tải danh sách chờ duyệt…
          </p>
        ) : loadFailed ? (
          <Button onClick={load}>Tải lại danh sách chờ duyệt</Button>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            Không có bài đăng nào đang chờ duyệt.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 break-words">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <div className="text-sm text-slate-500">
                      {job.company?.company_name} · {job.location} · {formatSalary(job.salary_min, job.salary_max)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <JobStatusBadge status={job.status} />
                      <span>Đăng {formatDate(job.created_at)}</span>
                    </div>
                  </div>
                </div>
                <details className="mt-3 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-brand-700">Xem nội dung để xét duyệt</summary>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button disabled={reviewing !== null} onClick={() => review(job, 'active')}>
                      {reviewing?.id === job.id && reviewing.status === 'active' ? 'Đang duyệt…' : 'Duyệt và công khai tin'}
                    </Button>
                    <Button variant="secondary" disabled={reviewing !== null} onClick={() => review(job, 'rejected')}>
                      {reviewing?.id === job.id && reviewing.status === 'rejected' ? 'Đang từ chối…' : 'Từ chối tin'}
                    </Button>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const cardColors = [
  'bg-brand-50 text-brand-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-pink-50 text-pink-600',
]

function StatCard({ label, value, index }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${cardColors[index % cardColors.length]}`}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  )
}
