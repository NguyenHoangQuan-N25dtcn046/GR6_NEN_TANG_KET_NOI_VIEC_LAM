import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { candidateApi } from '../../api/client.js'
import { ApplicationStatusBadge } from '../../components/StatusBadge.jsx'
import { Spinner } from '../../components/ui.jsx'
import { formatDate } from '../../constants.js'

export default function CandidateApplications() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (page = 1) => {
    setLoading(true)
    try {
      setData(await candidateApi.applications({ page, page_size: 10 }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Lịch sử ứng tuyển</h1>
      <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái hồ sơ của bạn.</p>

      {loading ? (
        <div className="flex justify-center py-24 text-brand-600">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl bg-rose-50 p-6 text-center text-rose-600">{error}</div>
      ) : data.items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-400">
          Bạn chưa nộp hồ sơ nào.{' '}
          <Link to="/" className="font-medium text-brand-600">
            Tìm việc ngay
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data.items.map((app) => (
            <div
              key={app.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link to={`/jobs/${app.job_id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {app.job?.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {app.job?.company_name} · {app.job?.location}
                </p>
                <p className="mt-1 text-xs text-slate-400">Nộp ngày {formatDate(app.applied_at)}</p>
              </div>
              <ApplicationStatusBadge status={app.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
