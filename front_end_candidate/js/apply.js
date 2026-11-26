import { renderLayout } from './components/layout.js';
import { api, jobById, me } from './api.js';

renderLayout();

const form = document.querySelector('#apply-form');
const missing = document.querySelector('#apply-missing');
const summary = document.querySelector('#apply-job-details');
const message = document.querySelector('#apply-result');
const jobId = new URLSearchParams(window.location.search).get('jobId');
const cvLink = document.querySelector('#apply-cv-link');
const letter = document.querySelector('#apply-letter');
const charCount = document.querySelector('#apply-letter-count');
const send = form.querySelector('[type="submit"]');

let job;
let jobError = '';
try {
  job = await jobById(jobId);
} catch (error) {
  jobError = error.message;
}

if (!job) {
  form.hidden = true;
  missing.hidden = false;
  summary.textContent = jobError || 'Chưa có công việc hợp lệ được chọn.';
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

function showStatus(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('is-error', isError);
}

if (job?.is_expired) {
  showStatus('Tin tuyển dụng đã hết hạn.', true);
} else if (job?.job_status === 'closed') {
  showStatus('Tin tuyển dụng đã đóng.', true);
} else if (job) {
  cvLink.href = `cv.html?jobId=${encodeURIComponent(job.id)}`;
  try {
    const user = await me();
    const profile = await api('/candidate/profile', { auth: true });
    document.querySelector('#apply-name').value = profile.full_name;
    document.querySelector('#apply-email').value = user.email;
    document.querySelector('#apply-phone').value = profile.phone || '';
    cvLink.hidden = false;

    if (profile.cv_url) {
      document.querySelector('#apply-cv-meta').textContent = 'Đơn ứng tuyển sẽ dùng CV đã lưu trong hồ sơ.';
      send.disabled = false;
    } else {
      showStatus('Vui lòng tải CV lên trước khi gửi ứng tuyển.', true);
    }
  } catch (error) {
    showStatus(error.message, true);
  }
}

letter.addEventListener('input', () => {
  charCount.textContent = String(letter.value.length);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (send.disabled) return;
  send.disabled = true;
  showStatus('Đang gửi ứng tuyển…');

  try {
    const result = await api(`/jobs/${job.id}/applications`, {
      method: 'POST',
      auth: true,
      body: { cover_letter: letter.value.trim() || null },
    });
    showStatus(`Ứng tuyển thành công. Mã đơn ${result.id}. Xem trong Lịch sử ứng tuyển.`);
  } catch (error) {
    showStatus(error.message, true);
    send.disabled = error.status === 400 || error.status === 401 || error.status === 409;
  }
});
