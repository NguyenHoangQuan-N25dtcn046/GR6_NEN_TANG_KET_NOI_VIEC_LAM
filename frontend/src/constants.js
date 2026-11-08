export const JOB_STATUS = {
  pending: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700 ring-amber-200' },
  active: { label: 'Đang tuyển', cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Bị từ chối', cls: 'bg-rose-100 text-rose-700 ring-rose-200' },
  closed: { label: 'Đã đóng', cls: 'bg-slate-200 text-slate-600 ring-slate-300' },
}

export const APPLICATION_STATUS = {
  submitted: { label: 'Đã nộp', cls: 'bg-sky-100 text-sky-700 ring-sky-200' },
  shortlisted: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Từ chối', cls: 'bg-rose-100 text-rose-700 ring-rose-200' },
  accepted: { label: 'Mời phỏng vấn', cls: 'bg-violet-100 text-violet-700 ring-violet-200' },
}

export const WORK_TYPE = {
  onsite: { label: 'Onsite', icon: '🏢' },
  remote: { label: 'Remote', icon: '🏠' },
  hybrid: { label: 'Hybrid', icon: '🔀' },
}

export const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Khác',
]

export const CATEGORIES = [
  'Công nghệ thông tin',
  'Kinh doanh / Bán hàng',
  'Marketing / Truyền thông',
  'Kế toán / Tài chính',
  'Nhân sự',
  'Thiết kế',
  'Giáo dục',
  'Y tế',
  'Khác',
]

export function formatSalary(min, max) {
  const fmt = (n) => (n ? n.toLocaleString('vi-VN') : '?')
  if (!min && !max) return 'Thỏa thuận'
  if (min && max) return `${fmt(min)} - ${fmt(max)} VNĐ`
  if (min) return `Từ ${fmt(min)} VNĐ`
  return `Đến ${fmt(max)} VNĐ`
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
