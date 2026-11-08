import assert from 'node:assert/strict'

const { chromium } = await import(process.env.TV4_PLAYWRIGHT_MODULE || 'playwright')
const demo = JSON.parse(process.env.TV4_DEMO || '{}')
assert(demo.employer && demo.other && demo.candidate && demo.closed && demo.rejected,
  'TV4_DEMO phải chứa employer, other, candidate, closed và rejected từ lệnh seed.')
const base = 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const url = path => base + path
const title = `TV4 trình duyệt ${Date.now()}`

async function login(email, destination, width) {
  const page = await browser.newPage({ viewport: { width, height: 850 } })
  page.setDefaultTimeout(6000)
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url('/login'))
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu').fill('DemoOnly2026!')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.waitForURL(url(destination), { timeout: 6000 })
  return page
}

async function noHorizontalOverflow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    `Nội dung tràn ngang tại ${page.url()}`)
}

try {
  const employer = await login(demo.employer, '/employer/dashboard', 320)
  await employer.getByRole('heading', { name: 'Tin tuyển dụng' }).waitFor()
  await noHorizontalOverflow(employer)
  await employer.getByRole('link', { name: 'Công ty', exact: true }).click()
  await employer.getByLabel('Tên công ty').fill('Công ty thử trên trình duyệt')
  await employer.getByRole('button', { name: 'Lưu hồ sơ công ty' }).click()
  await employer.getByText('Đã lưu hồ sơ công ty.').waitFor()
  await employer.reload()
  assert.equal(await employer.getByLabel('Tên công ty').inputValue(), 'Công ty thử trên trình duyệt')
  await noHorizontalOverflow(employer)

  await employer.goto(url('/employer/jobs/new'))
  await employer.getByLabel('Tiêu đề công việc').fill(title)
  await employer.getByLabel('Mô tả công việc').fill('Nội dung kiểm thử trước khi duyệt.')
  await employer.getByLabel('Tỉnh/Thành').selectOption('Hà Nội')
  const jobsUrl = 'http://127.0.0.1:18000/api/jobs'
  await employer.route(jobsUrl, route => route.abort())
  await employer.getByRole('button', { name: 'Gửi tin để duyệt' }).click()
  await employer.getByRole('alert').waitFor()
  assert.equal(await employer.getByLabel('Tiêu đề công việc').inputValue(), title)
  await employer.unroute(jobsUrl)
  await employer.getByRole('button', { name: 'Gửi tin để duyệt' }).click()
  await employer.getByRole('row').filter({ hasText: title }).getByText('Chờ duyệt').waitFor()

  await employer.goto(url(`/employer/jobs/${demo.rejected}/edit`))
  await employer.getByLabel('Tiêu đề công việc').fill('TV4 trình duyệt — gửi duyệt lại')
  await employer.getByLabel('Lương tối thiểu').fill('200')
  await employer.getByLabel('Lương tối đa').fill('100')
  await employer.getByRole('button', { name: 'Lưu và gửi duyệt lại' }).click()
  await employer.getByText('Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.').waitFor()
  await employer.getByLabel('Lương tối đa').fill('300')
  await employer.getByRole('button', { name: 'Lưu và gửi duyệt lại' }).click()
  await employer.getByText('Đã gửi tin cho quản trị viên duyệt.').waitFor()

  await employer.goto(url(`/employer/jobs/${demo.closed}/applicants`))
  await employer.getByText('Hồ sơ thử TV4').waitFor()
  await noHorizontalOverflow(employer)
  const cv = await employer.getByRole('link', { name: 'Mở CV mẫu (demo)' }).getAttribute('href')
  assert.equal((await employer.request.get(cv)).status(), 200)
  await employer.getByRole('button', { name: 'Mời phỏng vấn' }).click()
  await employer.getByText('Đã cập nhật trạng thái hồ sơ.').waitFor()

  const candidate = await login(demo.candidate, '/', 1280)
  await candidate.goto(url('/candidate/applications'))
  await candidate.getByText('Mời phỏng vấn', { exact: true }).waitFor()
  await candidate.goto(url('/admin'))
  await candidate.waitForURL(url('/'))
  const other = await login(demo.other, '/employer/dashboard', 1280)
  await other.goto(url(`/employer/jobs/${demo.rejected}/edit`))
  await other.getByText('Tin tuyển dụng không tồn tại hoặc bạn không có quyền chỉnh sửa.').waitFor()
  assert.equal(await other.getByLabel('Tiêu đề công việc').count(), 0)

  const admin = await login('admin@example.com', '/admin', 320)
  const reviewCard = admin.getByRole('article').filter({
    has: admin.getByRole('heading', { name: title, exact: true }),
  })
  await reviewCard.getByText('Xem nội dung để xét duyệt').click()
  await reviewCard.getByText('Nội dung kiểm thử trước khi duyệt.').waitFor()
  await reviewCard.getByRole('button', { name: 'Duyệt và công khai tin' }).click()
  await admin.getByText('Đã duyệt tin. Ứng viên có thể tìm thấy tin này.').waitFor()
  await noHorizontalOverflow(admin)

  await employer.goto(url('/employer/dashboard'))
  const approvedRow = employer.getByRole('row').filter({ hasText: title })
  await approvedRow.getByText('Đang tuyển', { exact: true }).waitFor()
  await approvedRow.getByRole('button', { name: 'Đóng tin', exact: true }).click()
  await approvedRow.getByRole('button', { name: 'Xác nhận đóng tin' }).click()
  await approvedRow.getByText('Đã đóng', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: Chrome 320px và 1280px — điều hướng, hồ sơ công ty, tạo/sửa/duyệt/đóng tin, lỗi mạng, CV demo và phân quyền.')
} finally {
  await browser.close()
}
