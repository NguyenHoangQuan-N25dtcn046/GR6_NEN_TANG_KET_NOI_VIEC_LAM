import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const base = 'http://127.0.0.1:18000'
const password = 'DemoOnly2026!'
const run = randomUUID().slice(0, 8)

async function request(path, { method = 'GET', token, body, expected = 200 } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }
  const response = await fetch(base + path, { method, headers, body, signal: AbortSignal.timeout(8000) })
  const text = await response.text()
  if (expected !== null) assert.equal(response.status, expected, `${method} ${path}: ${text}`)
  return { status: response.status, data: response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text }
}

await request('/api/health')
const accounts = { admin: 'admin@example.com', employer: `employer-${run}@example.com`, other: `other-${run}@example.com`, candidate: `candidate-${run}@example.com` }
for (const name of ['employer', 'other', 'candidate']) {
  await request('/api/auth/register', { method: 'POST', expected: 201, body: {
    email: accounts[name], password, role: name === 'candidate' ? 'candidate' : 'employer',
    full_name: 'Ứng viên thử', company_name: `Công ty thử ${name}`,
  } })
}
const tokens = {}
for (const [name, email] of Object.entries(accounts)) {
  tokens[name] = (await request('/api/auth/login', { method: 'POST', body: { email, password } })).data.access_token
}
const { employer, other, candidate, admin } = tokens
const company = { company_name: 'Công ty thử TV4', website: 'https://example.com', address: 'Hà Nội', size: '11-50' }
await request('/api/employer/company', { method: 'PUT', token: employer, body: company })
assert.equal((await request('/api/employer/company', { token: employer })).data.size, company.size)
await request('/api/admin/jobs', { token: employer, expected: 403 })
const job = { title: `TV4 ${run}`, location: 'Hà Nội', description: 'Tin tuyển dụng thử cho Sprint 2', salary_min: 100, salary_max: 200 }
async function create(suffix) {
  const { data } = await request('/api/jobs', { method: 'POST', token: employer, expected: 201, body: { ...job, title: `${job.title} ${suffix}` } })
  assert.equal(data.status, 'pending')
  return data.id
}
const id = await create('luồng chính')
const pending = await create('chờ duyệt')
const active = await create('đang tuyển')
const rejected = await create('bị từ chối')
const review = (jobId, status) => request(`/api/admin/jobs/${jobId}/status`, { method: 'PATCH', token: admin, body: { status } })
await review(active, 'active')
await review(rejected, 'rejected')
const ownJobs = (await request('/api/employer/jobs', { token: employer })).data.items
assert(ownJobs.some(job => job.id === rejected && job.status === 'rejected'))
await request(`/api/jobs/${rejected}`, { token: employer, expected: 404 })
await request(`/api/jobs/${rejected}`, { method: 'PUT', token: other, body: job, expected: 403 })
const resubmit = await create('sửa và gửi lại')
await review(resubmit, 'rejected')
assert.equal((await request(`/api/jobs/${resubmit}`, { method: 'PUT', token: employer, body: job })).data.status, 'pending')
assert(!(await request('/api/jobs')).data.items.some(job => job.id === id))
const pendingDetail = await request(`/api/jobs/${id}`, { expected: null })
if (pendingDetail.status === 200) console.log('BLOCKED ADMIN-02: chi tiết công khai trả nội dung tin chờ duyệt.')
else assert([401, 403, 404].includes(pendingDetail.status))

const bypass = await request(`/api/employer/jobs/${pending}/status`, { method: 'PATCH', token: employer, body: { status: 'active' }, expected: null })
if (bypass.status === 200) {
  console.log('BLOCKED JOB-05: Employer có thể tự chuyển tin chờ duyệt thành đang tuyển.')
  await request(`/api/jobs/${pending}`, { method: 'PUT', token: employer, body: { title: `${job.title} chờ duyệt` } })
} else assert([400, 403, 409, 422].includes(bypass.status))

await review(id, 'active')
assert((await request('/api/jobs')).data.items.some(job => job.id === id))
const form = new FormData()
const pdfStream = 'BT /F1 18 Tf 40 740 Td (CV mau TV4 - Du lieu gia) Tj ET\n'
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${pdfStream.length} >>\nstream\n${pdfStream}endstream`,
]
let pdf = '%PDF-1.4\n'
const offsets = objects.map((object, index) => {
  const offset = pdf.length
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  return offset
})
const xref = pdf.length
pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'tv4-demo.pdf')
await request('/api/candidate/cv', { method: 'POST', token: candidate, body: form })
await request(`/api/jobs/${id}/apply`, { method: 'POST', token: candidate, body: { cover_letter: 'Hồ sơ thử TV4' }, expected: 201 })
await request(`/api/employer/jobs/${id}/applications`, { token: other, expected: 403 })
const [application] = (await request(`/api/employer/jobs/${id}/applications`, { token: employer })).data.items
assert.equal(application.cover_letter, 'Hồ sơ thử TV4')
const cv = await request(application.candidate.cv_url, { token: employer, expected: null })
const anonymousCv = await request(application.candidate.cv_url, { expected: null })
const publicCv = await request(application.candidate.cv_url.replace('/uploads/cv/', '/uploads/'), { expected: null })
if (cv.status !== 200 || anonymousCv.status === 200 || publicCv.status === 200) {
  console.log(`BLOCKED APPLY-06: đường CV trả về HTTP ${cv.status}; đường tệp tĩnh không xác thực HTTP ${publicCv.status}.`)
}
await request(`/api/applications/${application.id}/status`, { method: 'PATCH', token: employer, body: { status: 'shortlisted' } })
assert.equal((await request('/api/candidate/applications', { token: candidate })).data.items[0].status, 'shortlisted')
await request(`/api/jobs/${id}/close`, { method: 'PATCH', token: employer })
const closedApply = await request(`/api/jobs/${id}/apply`, { method: 'POST', token: candidate, body: {}, expected: null })
assert([400, 404, 409].includes(closedApply.status), `Tin đóng trả HTTP ${closedApply.status}`)
assert(!(await request('/api/jobs')).data.items.some(job => job.id === id))
assert.equal((await request(`/api/employer/jobs/${id}/applications`, { token: employer })).data.items.length, 1)
console.log('PASS: hồ sơ công ty, phân quyền, tạo/duyệt/từ chối, nộp hồ sơ, đổi trạng thái và đóng tin.')
console.log('Tài khoản demo:', accounts)
console.log('Mật khẩu demo:', password)
console.log('Tin demo:', { closed: id, pending, active, rejected })
console.log('TV4_DEMO=' + JSON.stringify({ ...accounts, closed: id, rejected }))
