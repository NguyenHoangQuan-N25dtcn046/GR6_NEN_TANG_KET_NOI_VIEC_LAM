import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { base, ButtonLink, Choice, Heading, Notice } from '../tv4-preview/ui'

const locations = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ']
const categories = ['Công nghệ thông tin', 'Thiết kế', 'Nhân sự', 'Kinh doanh']
const types = [['onsite', 'Tại văn phòng'], ['remote', 'Từ xa'], ['hybrid', 'Kết hợp']]
const sizes = [['1-10', '1–10'], ['11-50', '11–50'], ['51-200', '51–200'], ['201-500', '201–500'], ['500+', 'Trên 500']]
const options = values => values.map(value => [value, value])
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
    required.forEach(key => { if (!String(form[key] || '').trim()) next[key] = 'Vui lòng điền trường này.' })
    const { salary_min: min, salary_max: max } = form
    if (!company && (Number(min) < 0 || Number(max) < 0 || (min !== '' && max !== '' && min != null && max != null && Number(min) > Number(max)))) {
      next.salary_max = 'Khoảng lương phải hợp lệ và lương tối đa không thấp hơn tối thiểu.'
    }
    if (company) for (const key of ['website', 'logo_url']) {
      if (form[key] && !/^https?:\/\/[^\s/]+/i.test(form[key])) next[key] = 'Nhập đường dẫn bắt đầu bằng http:// hoặc https://.'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      setMessage({ error: true, text: 'Kiểm tra các trường được đánh dấu.' })
      return
    }
    saving.current = true
    setPending(true)
    setMessage(null)
    try {
      await save(form)
      if (company) setMessage({ text: 'Đã lưu hồ sơ công ty.' })
      else navigate(base + '/jobs', { state: { notice: 'Đã lưu tin và gửi duyệt.' } })
    } catch (error) {
      setMessage({ error: true, text: error.message })
    } finally {
      saving.current = false
      setPending(false)
    }
  }
  return <><Heading title={title} /><div className="tv-wrap tv-content">
    <ButtonLink to="/jobs">Về quản lý tin</ButtonLink>
    <form className="tv-form" noValidate onSubmit={submit} aria-busy={pending}>
      <h2>{company ? 'Thông tin công ty' : 'Thông tin công việc'}</h2>
      <fieldset disabled={pending} className="tv-grid">
        {company ? <>
          {field('company_name', 'Tên công ty', { required: true, wide: true, placeholder: 'Ví dụ: Công ty ABC' })}
          {field('website', 'Website', { type: 'url', placeholder: 'https://example.com' })}
          <Choice label="Quy mô" value={form.size} options={sizes} placeholder="Chọn quy mô công ty" onChange={value => change('size', value)} />
          {field('address', 'Địa chỉ', { wide: true, placeholder: 'Ví dụ: Quận 1, TP. Hồ Chí Minh' })}
          {field('logo_url', 'Đường dẫn logo', { type: 'url', wide: true, placeholder: 'https://example.com/logo.png' })}
        </> : <>
          {field('title', 'Tiêu đề công việc', { required: true, wide: true })}
          {field('description', 'Mô tả công việc', { required: true, wide: true, multiline: true })}
          <div><Choice label="Tỉnh/Thành *" value={form.location} options={options(locations)} invalid={!!errors.location} onChange={value => change('location', value)} />
          {errors.location && <span className="tv-field-error">{errors.location}</span>}</div>
          <Choice label="Ngành nghề" value={form.category} options={options(categories)} onChange={value => change('category', value)} />
          <Choice label="Hình thức làm việc" value={form.work_type} options={types} onChange={value => change('work_type', value)} />
          <div className="tv-wide tv-grid">{field('salary_min', 'Lương tối thiểu (VNĐ)', { type: 'number' })}{field('salary_max', 'Lương tối đa (VNĐ)', { type: 'number' })}</div>
        </>}
      </fieldset>
      <Notice error={message?.error}>{message?.text}</Notice>
      <div className="tv-actions"><button className="tv-primary" disabled={pending}>{pending ? 'Đang lưu…' : company ? 'Lưu hồ sơ công ty' : 'Lưu và gửi duyệt'}</button></div>
    </form>
  </div></>
}
