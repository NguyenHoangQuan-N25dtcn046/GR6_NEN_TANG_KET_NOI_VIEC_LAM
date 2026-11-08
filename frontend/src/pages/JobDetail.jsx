import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { jobsApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner, Alert, Button, Field, inputCls } from '../components/ui.jsx'
import { WorkTypeBadge } from '../components/StatusBadge.jsx'
import { formatDate, formatSalary } from '../constants.js'

export default function JobDetail() {
  const { id } = useParams()
  const { isAuthenticated, isCandidate } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applyState, setApplyState] = useState({ loading: false, message: '', ok: false })

  useEffect(() => {
    jobsApi
      .detail(id)
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } })
      return
    }
    setApplyState({ loading: true, message: '', ok: false })
    try {
      await jobsApi.apply(id, { cover_letter: coverLetter })
      setApplyState({ loading: false, message: 'Nộp hồ sơ thành công!', ok: true })
    } catch (err) {
      setApplyState({ loading: false, message: err.message, ok: false })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-400">
        {error || 'Không tìm thấy việc làm'}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Quay lại danh sách
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl font-bold text-brand-600">
              {(job.company?.company_name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <p className="text-slate-500">{job.company?.company_name}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">📍 {job.location}</span>
            {job.work_type && <WorkTypeBadge type={job.work_type} />}
            {job.category && (
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">{job.category}</span>
            )}
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Mô tả công việc</h2>
            <p className="whitespace-pre-wrap text-slate-600">{job.description}</p>
          </div>

          <p className="mt-8 border-t border-slate-100 pt-4 text-sm text-slate-400">
            Đăng ngày {formatDate(job.created_at)}
          </p>
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ứng tuyển ngay</h2>

          {isCandidate || !isAuthenticated ? (
            <form onSubmit={handleApply} className="mt-4 space-y-4">
              <Field label="Lời nhắn (Cover Letter)">
                <textarea
                  rows={5}
                  className={inputCls}
                  placeholder="Giới thiệu ngắn về bản thân và lý do bạn phù hợp…"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </Field>
              {applyState.message && (
                <Alert type={applyState.ok ? 'success' : 'error'}>{applyState.message}</Alert>
              )}
              <Button type="submit" disabled={applyState.loading} className="w-full">
                {applyState.loading ? 'Đang nộp…' : 'Nộp hồ sơ'}
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Đăng nhập bằng tài khoản ứng viên để nộp hồ sơ.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
