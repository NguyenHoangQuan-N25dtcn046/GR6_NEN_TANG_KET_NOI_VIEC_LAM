const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

const fieldLabels = {
  email: 'Email', password: 'Mật khẩu', title: 'Tiêu đề tuyển dụng', description: 'Mô tả công việc',
  location: 'Địa điểm', work_mode: 'Hình thức làm việc', deadline: 'Hạn ứng tuyển',
  salary_min: 'Mức lương tối thiểu', salary_max: 'Mức lương tối đa', reason: 'Lý do từ chối',
  id: 'Mã', job_id: 'Mã tin', user_id: 'Mã tài khoản', application_id: 'Mã đơn ứng tuyển',
  status: 'Trạng thái ứng tuyển', job_status: 'Trạng thái tin', is_active: 'Trạng thái tài khoản',
}
const validationMessages = {
  missing: 'là thông tin bắt buộc',
  string_too_short: 'quá ngắn',
  string_too_long: 'quá dài',
  greater_than_equal: 'nhỏ hơn giá trị cho phép',
  less_than_equal: 'vượt quá giá trị cho phép',
  int_parsing: 'phải là số nguyên',
  decimal_parsing: 'phải là số',
  date_from_datetime_parsing: 'không đúng định dạng ngày',
}
const httpMessages = {
  'Not Found': 'Không tìm thấy tài nguyên.',
  'Method Not Allowed': 'Thao tác này chưa được hỗ trợ.',
  'Unauthorized': 'Vui lòng đăng nhập.',
  'Forbidden': 'Bạn không có quyền thực hiện thao tác này.',
}

export async function request(path, { token, method = 'GET', data, signal, file = false } = {}) {
  const headers = {}
  if (token) headers.Authorization = 'Bearer ' + token
  if (data !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(base + path, { method, headers, signal, body: JSON.stringify(data) }).catch(error => {
    if (signal?.aborted) throw error
    throw new Error('Không thể kết nối với máy chủ.')
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    const fields = problem.errors?.map(({ location, code }) => {
      const label = fieldLabels[location?.at(-1)] || 'Dữ liệu'
      return `${label} ${validationMessages[code] || 'không hợp lệ'}.`
    })
    const detail = httpMessages[problem.detail] || problem.detail || `Không thể thực hiện yêu cầu (HTTP ${response.status}).`
    const error = new Error(fields?.length ? fields.join(' ') : detail)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return
  return file ? response.blob() : response.json()
}
