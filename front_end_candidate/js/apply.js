import { renderLayout } from './components/layout.js';
import { demoJobs } from './components/job-card.js';

renderLayout();

// APPLY-02: giao diện + validation tại client. Chưa có API và không lưu dữ liệu ứng tuyển.
const MAX_CV_BYTES = 5 * 1024 * 1024;
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const form = document.querySelector('#apply-form');
const missing = document.querySelector('#apply-missing');
const jobId = new URLSearchParams(window.location.search).get('jobId');
const job = demoJobs.find(item => String(item.id) === jobId);
const summary = document.querySelector('#apply-job-details');
const cvInput = document.querySelector('#apply-cv');
const cvMeta = document.querySelector('#apply-cv-meta');
const previewLink = document.querySelector('#apply-cv-preview');
const message = document.querySelector('#apply-result');
const letter = document.querySelector('#apply-letter');
const charCount = document.querySelector('#apply-letter-count');
let fileUrl = null;

if (!job) {
  form.hidden = true;
  missing.hidden = false;
  summary.textContent = 'Chưa có công việc hợp lệ được chọn.';
} else {
  document.title = `Ứng tuyển: ${job.title} | Job Portal`;
  const title = document.createElement('h3'); title.textContent = job.title;
  const company = document.createElement('p'); company.textContent = job.company;
  const list = document.createElement('ul');
  for (const detail of [`Ngành nghề: ${job.category}`, `Địa điểm: ${job.location}`, `Loại hình: ${job.type}`, `Mức lương: ${job.salary}`]) {
    const item = document.createElement('li'); item.textContent = detail; list.append(item);
  }
  summary.replaceChildren(title, company, list);
}

function setError(field, text) {
  document.querySelector(`#apply-${field}-error`).textContent = text;
  const control = document.querySelector(`#apply-${field}`);
  if (text) control.setAttribute('aria-invalid', 'true'); else control.removeAttribute('aria-invalid');
}

function validateCV(file) {
  if (!file) return 'Vui lòng chọn file CV để ứng tuyển.';
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mime = extension === 'pdf' ? PDF_MIME : extension === 'docx' ? DOCX_MIME : null;
  if (!mime || (file.type && file.type !== mime)) return 'Chỉ hỗ trợ CV định dạng PDF hoặc DOCX.';
  if (!file.size) return 'Tệp CV không được để trống.';
  if (file.size > MAX_CV_BYTES) return 'Dung lượng CV phải nhỏ hơn hoặc bằng 5 MB.';
  return '';
}

function validateForm() {
  const name = document.querySelector('#apply-name').value.trim();
  const email = document.querySelector('#apply-email').value.trim();
  const phone = document.querySelector('#apply-phone').value.trim();
  const file = cvInput.files?.[0];
  const nameError = name.length < 2 ? 'Họ tên cần ít nhất 2 ký tự.' : '';
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Vui lòng nhập địa chỉ email hợp lệ.';
  const digits = phone.replace(/[\s().-]/g,'');
  const phoneError = phone && !/^\+?[0-9]{9,15}$/.test(digits) ? 'Số điện thoại không hợp lệ.' : '';
  const cvError = validateCV(file);
  for (const [field, error] of [['name', nameError],['email',emailError],['phone',phoneError],['cv',cvError]]) setError(field, error);
  if (nameError || emailError || phoneError || cvError) {
    message.classList.add('is-error');
    message.textContent = 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường được báo lỗi.';
    return false;
  }
  message.classList.remove('is-error');
  message.textContent = 'Hồ sơ hợp lệ tại trình duyệt. Chưa gửi ứng tuyển: backend chưa cung cấp API và cơ chế xác thực.';
  return true;
}

function revokePreview() {
  if (fileUrl) { URL.revokeObjectURL(fileUrl); fileUrl = null; }
  previewLink.hidden = true;
  previewLink.removeAttribute('href');
}
cvInput.addEventListener('change', () => {
  revokePreview();
  const file = cvInput.files?.[0];
  const cvError = validateCV(file);
  setError('cv', cvError);
  cvMeta.textContent = file ? `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)` : 'Chưa chọn file CV.';
  if (!cvError && file) {
    fileUrl = URL.createObjectURL(file);
    previewLink.href = fileUrl;
    previewLink.textContent = file.name.toLowerCase().endsWith('.pdf') ? 'Xem PDF đã chọn' : 'Mở file DOCX đã chọn';
    previewLink.hidden = false;
  }
  message.textContent = '';
});
letter.addEventListener('input', () => { charCount.textContent = String(letter.value.length); });
document.querySelector('#apply-validate').addEventListener('click', validateForm);
form.addEventListener('submit', event => {
  event.preventDefault();
  // Tuyệt đối không báo thành công hoặc gửi dữ liệu khi chưa có API Contract.
  validateForm();
});
window.addEventListener('pagehide', revokePreview);
