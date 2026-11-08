import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { employerApi } from '../../api/client.js'
import { ApplicationStatusBadge } from '../../components/StatusBadge.jsx'
import { Alert, Button, Spinner } from '../../components/ui.jsx'
import { APPLICATION_STATUS, formatDate } from '../../constants.js'

function demoCvLink(cvUrl) {
  const demoBackend = import.meta.env.VITE_API_URL
  if (!import.meta.env.DEV || import.meta.env.VITE_TV4_DEMO_CV !== '1'
    || !['localhost', '127.0.0.1'].includes(window.location.hostname)
    || demoBackend !== 'http://127.0.0.1:18000') return null
  const match = /^\/uploads\/cv\/([a-f0-9]{32}\.(?:pdf|docx?))$/i.exec(cvUrl)
  return match ? `${demoBackend}/uploads/${match[1]}` : null
}

export default function Applicants() {
  const { id } = useParams()
  return <ApplicantList key={id} id={id} />
}

function ApplicantList({ id }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    setLoadFailed(false)
    try {
      const res = await employerApi.applications(id)
      setApps(res.items)
    } catch (e) {
      setLoadFailed(true)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const updateStatus = async (app, status) => {
    if (updating !== null) return
    setUpdating({ id: app.id, status })
    setError('')
    setNotice('')
    try {
      const updated = await employerApi.updateApplicationStatus(app.id, status)
      setApps(items => items.map(item => item.id === app.id ? updated : item))
      setNotice('Đã cập nhật trạng thái hồ sơ.')
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/employer/dashboard" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Quay lại
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Danh sách ứng viên</h1>

      {error && <div role="alert" className="mt-4"><Alert>{error}</Alert></div>}
      {notice && <div role="status" className="mt-4"><Alert type="success">{notice}</Alert></div>}

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-24 text-brand-700">
          <Spinner className="h-5 w-5" /> Đang tải hồ sơ ứng viên…
        </div>
      ) : loadFailed ? (
        <Button className="mt-4" onClick={load}>Tải lại danh sách ứng viên</Button>
      ) : apps.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-400">
          Chưa có ứng viên nộp hồ sơ.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {apps.map((app) => {
            const demoLink = demoCvLink(app.candidate?.cv_url)
            return (
            <div
              key={app.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-600">
                    {(app.candidate?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 break-words">
                    <div className="font-semibold text-slate-900">{app.candidate?.full_name}</div>
                    <div className="text-sm text-slate-500">
                      {app.candidate?.email} · {app.candidate?.phone || 'Không có SĐT'}
                    </div>
                    {app.candidate?.skills?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {app.candidate.skills.map((s) => (
                          <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:text-right">
                  <ApplicationStatusBadge status={app.status} />
                  <div className="mt-1 text-xs text-slate-400">Nộp {formatDate(app.applied_at)}</div>
                </div>
              </div>

              {app.cover_letter && (
                <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium">Lời nhắn:</span> {app.cover_letter}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {demoLink ? (
                  <a
                    href={demoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Mở CV mẫu (demo)
                  </a>
                ) : (
                  <span className="text-sm text-slate-600">
                    {app.candidate?.cv_url ? 'Chưa có đường tải CV xác thực.' : 'Ứng viên chưa có CV.'}
                  </span>
                )}
                <div className="ml-auto flex flex-wrap gap-2">
                  {Object.entries(APPLICATION_STATUS)
                    .filter(([k]) => k !== app.status)
                    .map(([k, v]) => (
                      <button
                        key={k}
                        disabled={updating !== null}
                        onClick={() => updateStatus(app, k)}
                        className="min-h-9 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        {updating?.id === app.id && updating.status === k ? 'Đang cập nhật…' : v.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
