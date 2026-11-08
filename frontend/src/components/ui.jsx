export function Spinner({ className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-rose-50 text-rose-700 ring-rose-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }
  return (
    <div className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${styles[type]}`}>
      {children}
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
    secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  }
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200'
