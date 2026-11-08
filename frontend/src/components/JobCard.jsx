import { Link } from 'react-router-dom'
import { formatSalary } from '../constants.js'
import { WorkTypeBadge } from './StatusBadge.jsx'

export default function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg font-semibold text-brand-600">
          {(job.company?.company_name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
            {job.title}
          </h3>
          <p className="truncate text-sm text-slate-500">{job.company?.company_name}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">📍 {job.location}</span>
        {job.work_type && <WorkTypeBadge type={job.work_type} />}
        {job.category && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{job.category}</span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="font-semibold text-emerald-600">
          {formatSalary(job.salary_min, job.salary_max)}
        </span>
        <span className="text-xs text-slate-400">{new Date(job.created_at).toLocaleDateString('vi-VN')}</span>
      </div>
    </Link>
  )
}
