import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { base, ButtonLink, categoryLabels, Choice, Heading, locationLabels, Notice, workLabels } from '../tv4-preview/ui'

const locations = Object.entries(locationLabels)
const categories = Object.entries(categoryLabels)
const types = Object.entries(workLabels)
const sizes = [['1-10', '1–10 nhân viên'], ['11-50', '11–50 nhân viên'], ['51-200', '51–200 nhân viên'], ['201-500', '201–500 nhân viên'], ['500+', 'Trên 500 nhân viên']]
const emptyJob = { title: '', description: '', location: '', category: '', work_type: 'onsite', salary_min: '', salary_max: '' }

export default function PreviewForm({ record, company = false, save }) {
  const [form, setForm] = useState(record || emptyJob)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const navigate = useNavigate()
  const title = company ? 'Hồ sơ công ty' : record ? 'Sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'
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
    required.forEach(key => { if (!String(form[key] || '').trim()) next[key] = 'Vui lòng điền mục này.' })
    const { salary_min: min, salary_max: max } = form
    if (!company && (Number(min) < 0 || Number(max) < 0 || (min !== '' && max !== '' && min != null && max != null && Number(min) > Number(max)))) {
      next.salary_max = 'Mức lương phải từ 0 trở lên và mức tối đa phải bằng hoặc cao hơn mức tối thiểu.'
    }
    if (company) for (const key of ['website', 'logo_url']) {
      if (form[key] && !/^https?:\/\/[^\s/]+/i.test(form[key])) next[key] = 'Nhập đường dẫn bắt đầu bằng http:// hoặc https://.'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      setMessage({ error: true, text: 'Vui lòng kiểm tra các mục được đánh dấu.' })
      return
    }
    saving.current = true
    setPending(true)
    setMessage(null)
    try {
      await save(form)
      if (company) setMessage({ text: 'Đã lưu hồ sơ công ty.' })
      else navigate(base + '/jobs', { state: { notice: 'Đã lưu và gửi tin tuyển dụng để duyệt.' } })
    } catch (error) {
      setMessage({ error: true, text: error.message })
    } finally {
      saving.current = false
      setPending(false)
    }
  }
  return <><Heading title={title} /><div className="tv-wrap tv-content">
    <ButtonLink to="/jobs">Quay lại danh sách tin tuyển dụng</ButtonLink>
    <form className="tv-form" noValidate onSubmit={submit} aria-busy={pending}>
      <h2>{company ? 'Thông tin công ty' : 'Thông tin tuyển dụng'}</h2>
      <fieldset disabled={pending} className="tv-grid">
        {company ? <>
          {field('company_name', 'Tên công ty', { required: true, wide: true, placeholder: 'Ví dụ Công ty Acme' })}
          {field('website', 'Trang web', { type: 'url', placeholder: 'https://example.com' })}
          <Choice label="Quy mô công ty" value={form.size} options={sizes} placeholder="Chọn quy mô công ty" onChange={value => change('size', value)} />
          {field('address', 'Địa chỉ', { wide: true, placeholder: 'Ví dụ Thành phố Hồ Chí Minh' })}
          {field('logo_url', 'Đường dẫn logo', { type: 'url', wide: true, placeholder: 'https://example.com/logo.png' })}
        </> : <>
          {field('title', 'Tên vị trí', { required: true, wide: true })}
          {field('description', 'Mô tả công việc', { required: true, wide: true, multiline: true })}
          <div><Choice label="Địa điểm *" value={form.location} options={locations} placeholder="Chọn địa điểm" invalid={!!errors.location} onChange={value => change('location', value)} />
          {errors.location && <span className="tv-field-error">{errors.location}</span>}</div>
          <Choice label="Ngành nghề" value={form.category} options={categories} onChange={value => change('category', value)} />
          <Choice label="Hình thức làm việc" value={form.work_type} options={types} onChange={value => change('work_type', value)} />
          <div className="tv-wide tv-grid">{field('salary_min', 'Lương tối thiểu (₫)', { type: 'number' })}{field('salary_max', 'Lương tối đa (₫)', { type: 'number' })}</div>
        </>}
      </fieldset>
      <Notice error={message?.error}>{message?.text}</Notice>
      <div className="tv-actions"><button className="tv-primary" disabled={pending}>{pending ? 'Đang lưu…' : company ? 'Lưu hồ sơ công ty' : 'Lưu và gửi duyệt'}</button></div>
    </form>
  </div></>
}
