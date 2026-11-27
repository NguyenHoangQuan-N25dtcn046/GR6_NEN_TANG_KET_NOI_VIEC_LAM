import { renderLayout } from './components/layout.js';
import {api,cvMime,jobById,uploadCV,me} from './api.js';

renderLayout();

const MAX_CV_BYTES = 5 * 1024 * 1024;
const form = document.querySelector('#apply-form');
const missing = document.querySelector('#apply-missing');
const jobId = new URLSearchParams(window.location.search).get('jobId');
let job=null;let jobError='';try{job=await jobById(jobId);}catch(e){jobError=e.message;}
const summary = document.querySelector('#apply-job-details');
const cvInput = document.querySelector('#apply-cv');
const cvMeta = document.querySelector('#apply-cv-meta');
const previewLink = document.querySelector('#apply-cv-preview');
const message = document.querySelector('#apply-result');
const letter = document.querySelector('#apply-letter');
const charCount = document.querySelector('#apply-letter-count');
let fileUrl = null;
let currentProfile=null;
let submitting=false;
let submitted=false;
const available=()=>job&&job.job_status==='open'&&(!job.deadline||job.deadline>=new Date().toLocaleDateString('sv-SE'));

if (!job) {
  form.hidden = true;
  missing.hidden = false;
  summary.textContent = jobError||'Chưa có công việc hợp lệ được chọn.';
} else {
  document.title = `Ứng tuyển: ${job.title} | Cổng việc làm`;
  const title = document.createElement('h3'); title.textContent = job.title;
  const company = document.createElement('p'); company.textContent = job.company;
  const list = document.createElement('ul');
  for (const detail of [`Ngành nghề: ${job.category}`, `Địa điểm: ${job.location}`, `Hình thức: ${job.workModeLabel}`, `Mức lương: ${job.salary}`]) {
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
  if (!file) return currentProfile?.cv_url?'':'Vui lòng chọn tệp CV để ứng tuyển.';
  const mime = cvMime(file.name);
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
  message.textContent = 'Hồ sơ hợp lệ. Bạn có thể gửi ứng tuyển.';
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
  cvMeta.textContent = file ? `${file.name} (${(file.size/1024/1024).toLocaleString("vi-VN", {maximumFractionDigits: 2})} MB)` : currentProfile?.cv_url?'Sử dụng CV đã lưu trên hệ thống.':'Chưa chọn tệp CV.';
  if (!cvError && file) {
    fileUrl = URL.createObjectURL(file);
    previewLink.href = fileUrl;
    previewLink.textContent = file.name.toLowerCase().endsWith('.pdf') ? 'Xem PDF đã chọn' : 'Mở tệp DOCX đã chọn';
    previewLink.hidden = false;
  }
  message.textContent = '';
});
letter.addEventListener('input', () => { charCount.textContent = String(letter.value.length); });
document.querySelector('#apply-validate').addEventListener('click', validateForm);
const send=form.querySelector('[type="submit"]');
send.disabled=true;try{const u=await me();currentProfile=await api('/candidate/profile',{auth:true});document.querySelector('#apply-name').value=currentProfile.full_name;document.querySelector('#apply-email').value=u.email;document.querySelector('#apply-phone').value=currentProfile.phone||'';for(const id of ['apply-name','apply-email','apply-phone'])document.getElementById(id).readOnly=true;cvInput.required=!currentProfile.cv_url;if(currentProfile.cv_url)cvMeta.textContent='Có thể sử dụng CV đã lưu, hoặc chọn tệp mới.';send.disabled=!available();if(job&&!available())message.textContent='Tin đã đóng hoặc hết hạn.';}catch(e){message.textContent=e.message;send.disabled=true;}
form.addEventListener('submit',async event=>{event.preventDefault();if(submitting||submitted||!available()||!currentProfile||!validateForm())return;submitting=true;send.disabled=true;let uploaded=false;try{const file=cvInput.files[0];if(file){currentProfile=await uploadCV(file);uploaded=true;}const result=await api(`/jobs/${job.id}/applications`,{method:'POST',auth:true,body:{cv_url:currentProfile.cv_url,cover_letter:letter.value.trim()||null}});submitted=true;message.classList.remove('is-error');message.textContent=`Ứng tuyển thành công. Mã đơn: ${result.id}. Xem trong Lịch sử ứng tuyển.`;return;}catch(e){message.classList.add('is-error');message.textContent=(uploaded?'CV đã lưu nhưng chưa xác nhận ứng tuyển. ':'')+e.message;}finally{submitting=false;send.disabled=submitted||!available();}});
window.addEventListener('pagehide', revokePreview);
