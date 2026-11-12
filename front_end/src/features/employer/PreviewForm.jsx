import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { base, ButtonLink, Choice, Heading, Notice } from '../tv4-preview/ui'

const locations = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho']
const categories = ['Information Technology', 'Design', 'Human Resources', 'Business']
const types = [['onsite', 'On-site'], ['remote', 'Remote'], ['hybrid', 'Hybrid']]
const sizes = [['1-10', '1–10 employees'], ['11-50', '11–50 employees'], ['51-200', '51–200 employees'], ['201-500', '201–500 employees'], ['500+', 'More than 500 employees']]
const options = values => values.map(value => [value, value])
const emptyJob = { title: '', description: '', location: '', category: '', work_type: 'onsite', salary_min: '', salary_max: '' }

export default function PreviewForm({ record, company = false, save }) {
  const [form, setForm] = useState(record || emptyJob)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const navigate = useNavigate()
  const title = company ? 'Company Profile' : record ? 'Edit Job' : 'Post a Job'
  function change(key, value) {
    setForm(previous => ({ ...previous, [key]: value }))
    setErrors(previous => ({ ...previous, [key]: '' }))
  }
  function field(key, label, { type = 'text', multiline, wide, required, placeholder } = {}) {
    const props = { id: key, value: form[key] ?? '', disabled: pending, required, placeholder, 'aria-invalid': !!errors[key],
      'aria-describedby': errors[key] ? key + '-error' : undefined, onChange: event => change(key, event.target.value) }
    return <div className={'tv-field ' + (wide ? 'tv-wide' : '')}>
      <label htmlFor={key}>{label}{required && ' *'}</label>
      {multiline ? <textarea {...props} rows={7} /> : <input {...props} type={type} min={type === 'number' ? 0 : undefined} />}
      {errors[key] && <span className="tv-field-error" id={key + '-error'}>{errors[key]}</span>}
    </div>
  }
  async function submit(event) {
    event.preventDefault()
    if (saving.current) return
    const next = {}
    const required = company ? ['company_name'] : ['title', 'description', 'location']
    required.forEach(key => { if (!String(form[key] || '').trim()) next[key] = 'This field is required.' })
    const { salary_min: min, salary_max: max } = form
    if (!company && (Number(min) < 0 || Number(max) < 0 || (min !== '' && max !== '' && min != null && max != null && Number(min) > Number(max)))) {
      next.salary_max = 'Enter a valid salary range with the maximum at least equal to the minimum.'
    }
    if (company) for (const key of ['website', 'logo_url']) {
      if (form[key] && !/^https?:\/\/[^\s/]+/i.test(form[key])) next[key] = 'Enter a URL beginning with http:// or https://.'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      setMessage({ error: true, text: 'Check the highlighted fields.' })
      return
    }
    saving.current = true
    setPending(true)
    setMessage(null)
    try {
      await save(form)
      if (company) setMessage({ text: 'Company profile saved.' })
      else navigate(base + '/jobs', { state: { notice: 'Job saved and submitted for review.' } })
    } catch (error) {
      setMessage({ error: true, text: error.message })
    } finally {
      saving.current = false
      setPending(false)
    }
  }
  return <><Heading title={title} /><div className="tv-wrap tv-content">
    <ButtonLink to="/jobs">Back to My Jobs</ButtonLink>
    <form className="tv-form" noValidate onSubmit={submit} aria-busy={pending}>
      <h2>{company ? 'Company Information' : 'Job Information'}</h2>
      <fieldset disabled={pending} className="tv-grid">
        {company ? <>
          {field('company_name', 'Company Name', { required: true, wide: true, placeholder: 'Example: Acme Company' })}
          {field('website', 'Website', { type: 'url', placeholder: 'https://example.com' })}
          <Choice label="Company Size" value={form.size} options={sizes} placeholder="Select company size" onChange={value => change('size', value)} />
          {field('address', 'Address', { wide: true, placeholder: 'Example: District 1, Ho Chi Minh City' })}
          {field('logo_url', 'Logo URL', { type: 'url', wide: true, placeholder: 'https://example.com/logo.png' })}
        </> : <>
          {field('title', 'Job Title', { required: true, wide: true })}
          {field('description', 'Job Description', { required: true, wide: true, multiline: true })}
          <div><Choice label="Location *" value={form.location} options={options(locations)} invalid={!!errors.location} onChange={value => change('location', value)} />
          {errors.location && <span className="tv-field-error">{errors.location}</span>}</div>
          <Choice label="Category" value={form.category} options={options(categories)} onChange={value => change('category', value)} />
          <Choice label="Work Arrangement" value={form.work_type} options={types} onChange={value => change('work_type', value)} />
          <div className="tv-wide tv-grid">{field('salary_min', 'Minimum Salary (VND)', { type: 'number' })}{field('salary_max', 'Maximum Salary (VND)', { type: 'number' })}</div>
        </>}
      </fieldset>
      <Notice error={message?.error}>{message?.text}</Notice>
      <div className="tv-actions"><button className="tv-primary" disabled={pending}>{pending ? 'Saving…' : company ? 'Save Company Profile' : 'Save & Submit for Review'}</button></div>
    </form>
  </div></>
}
