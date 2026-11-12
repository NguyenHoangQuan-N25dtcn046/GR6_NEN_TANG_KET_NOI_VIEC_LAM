import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export const base = '/__preview/tv4'
export const workLabels = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }
export const jobLabels = { active: 'Active', pending: 'Pending Review', rejected: 'Rejected', closed: 'Closed' }
export const ButtonLink = ({ to, children, primary }) => <Link className={'tv-button ' + (primary ? 'tv-primary' : '')} to={base + to}>{children}</Link>
export const Badge = ({ tone, children }) => <span className={'tv-badge tv-' + tone}>{children}</span>
export const Notice = ({ error, children, className = '' }) => children && <p className={'tv-notice ' + (error ? 'tv-error ' : '') + className} role={error ? 'alert' : 'status'}>{children}</p>

export function Heading({ title, action }) {
  const mast = useRef(null)
  const [active, setActive] = useState(true)
  useEffect(() => {
    const element = mast.current
    const update = visible => setActive(visible && !document.hidden)
    const isVisible = () => {
      const box = element.getBoundingClientRect()
      return box.bottom > 0 && box.top < innerHeight
    }
    const observer = new IntersectionObserver(([entry]) => update(entry.isIntersecting), { threshold: 0.05 })
    const onVisibility = () => update(isVisible())
    observer.observe(element)
    document.addEventListener('visibilitychange', onVisibility)
    addEventListener('scroll', onVisibility, { passive: true })
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      removeEventListener('scroll', onVisibility)
    }
  }, [])
  return <div ref={mast} className={'tv-mast ' + (active ? 'tv-motion-active' : 'tv-motion-paused')}>
    <div className="tv-tech-grid" aria-hidden="true" />
    <div className="tv-tech-scan" aria-hidden="true" />
    <div className="tv-wrap tv-title"><h1>{title}</h1>{action}</div>
  </div>
}

export function Confirm({ title, description, label, onCancel, onConfirm, fallback }) {
  const ref = useRef(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    const trigger = document.activeElement
    dialog.showModal()
    dialog.querySelector('button').focus()
    return () => {
      dialog.close()
      requestAnimationFrame(() => (trigger?.isConnected ? trigger : fallback?.current)?.focus())
    }
  }, [fallback])
  return <dialog ref={ref} aria-labelledby={id} aria-describedby={id + '-description'}
    onCancel={event => { event.preventDefault(); onCancel() }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return
      const buttons = Array.from(event.currentTarget.querySelectorAll('button'))
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target.focus()
      }
    }}>
    <h2 id={id}>{title}</h2><p id={id + '-description'}>{description}</p>
    <div className="tv-actions"><button onClick={onCancel}>Cancel</button><button className="tv-danger" onClick={onConfirm}>{label}</button></div>
  </dialog>
}

export function Choice({ label, value, options, onChange, invalid, placeholder }) {
  const selectedLabel = options.find(([key]) => key === value)?.[1]
  const [open, setOpen] = useState(false)
  const id = useId()
  const trigger = useRef(null)
  const first = useRef(null)
  useEffect(() => { if (open) first.current?.focus() }, [open])
  function choose(next) {
    onChange(next)
    setOpen(false)
    trigger.current.focus()
  }
  return <div className="tv-field tv-choice" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); trigger.current.focus() }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const items = Array.from(event.currentTarget.querySelectorAll('[role=option]'))
      const index = items.indexOf(document.activeElement)
      const step = event.key === 'ArrowDown' ? 1 : -1
      items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + step + items.length) % items.length]?.focus()
    }
  }}>
    <label id={id}>{label}</label>
    <button type="button" ref={trigger} aria-labelledby={id + ' ' + id + '-value'} aria-haspopup="listbox" aria-expanded={open} aria-invalid={invalid || undefined}
      onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}
      onClick={() => open ? setOpen(false) : setOpen(true)}>
      <span id={id + '-value'} className={placeholder && !selectedLabel ? 'tv-placeholder' : undefined}>
        {selectedLabel || placeholder || 'Select ' + label.toLowerCase()}
      </span><span aria-hidden="true">⌄</span>
    </button>
    {open && <div role="listbox" aria-labelledby={id} className="tv-options">{options.map(([key, name], i) =>
      <button key={key} ref={i === 0 ? first : null} role="option" aria-selected={key === value} type="button"
        onMouseDown={event => event.preventDefault()} onClick={() => choose(key)}>{name}</button>)}</div>}
  </div>
}
