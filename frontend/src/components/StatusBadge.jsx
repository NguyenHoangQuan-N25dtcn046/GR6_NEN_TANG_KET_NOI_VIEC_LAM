import { APPLICATION_STATUS, JOB_STATUS, WORK_TYPE } from '../constants.js'

export function JobStatusBadge({ status }) {
  const s = JOB_STATUS[status] || JOB_STATUS.pending
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}

export function ApplicationStatusBadge({ status }) {
  const s = APPLICATION_STATUS[status] || APPLICATION_STATUS.submitted
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}

export function WorkTypeBadge({ type }) {
  const w = WORK_TYPE[type] || { label: type, icon: '' }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <span>{w.icon}</span>
      {w.label}
    </span>
  )
}
