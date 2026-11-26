import {api,cvMime,uploadCV,me} from './api.js';
import { renderLayout } from './components/layout.js';
renderLayout();

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_PDF = 'application/pdf';
const input = document.querySelector('#cv-file');
const dropzone = document.querySelector('#cv-dropzone');
const selected = document.querySelector('#cv-selected');
const filename = document.querySelector('#cv-name');
const meta = document.querySelector('#cv-meta');
const error = document.querySelector('#cv-file-error');
const preview = document.querySelector('#cv-preview-frame');
const empty = document.querySelector('#cv-preview-empty');
const openFile = document.querySelector('#cv-open-file');
const upload = document.querySelector('#cv-upload');
const jobId = new URLSearchParams(window.location.search).get('jobId');
if (/^[0-9]+$/.test(jobId ?? '')) {
  const returnLink = document.createElement('a');
  returnLink.href = `apply.html?jobId=${encodeURIComponent(jobId)}`;
  returnLink.textContent = 'Quay lại đơn ứng tuyển';
  upload.parentElement.append(returnLink);
}

let objectUrl = null;
let currentFile = null;

function resetPreview() {
  preview.hidden = true;
  preview.removeAttribute('src');
  openFile.hidden = true;
  openFile.removeAttribute('href');
  empty.hidden = false;
  empty.querySelector('p').textContent = 'Chưa có CV để xem trước';
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
}
function clearFile() {
  currentFile = null;
  input.value = '';
  selected.hidden = true;
  upload.disabled = true;
  error.textContent = '';
  resetPreview();
}
function checkFile(file) {
  if (!file) return 'Bạn chưa chọn tệp CV.';
  const expectedMime = cvMime(file.name);
  if (!expectedMime || (file.type && file.type !== expectedMime)) return 'Chỉ chấp nhận file PDF hoặc DOCX.';
  if (file.size === 0) return 'Tệp CV đang trống.';
  if (file.size > MAX_BYTES) return 'Dung lượng CV không được vượt quá 5 MB.';
  return '';
}
function handleFile(file) {
  clearFile();
  const validation = checkFile(file);
  if (validation) { error.textContent = validation; return; }
  currentFile = file;
  filename.textContent = file.name;
  meta.textContent = `${(file.size/1024/1024).toFixed(2)} MB · ${file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'} · Chỉ xem thử trên máy`;
  selected.hidden = false;
  showPreview(file, cvMime(file.name), file.name);
  upload.disabled = busy;
}

function showPreview(file, mime, name) {
  resetPreview();
  objectUrl = URL.createObjectURL(file);
  openFile.href = objectUrl;
  openFile.hidden = false;
  openFile.removeAttribute('download');
  openFile.textContent = 'Mở PDF trong tab mới';
  if (mime === MIME_PDF) {
    preview.src = objectUrl;
    preview.hidden = false;
    empty.hidden = true;
  } else {
    openFile.download = name;
    openFile.textContent = 'Tải DOCX';
    empty.querySelector('p').textContent = 'Tải DOCX để xem trong ứng dụng đọc tài liệu.';
  }
}
input.addEventListener('change', () => handleFile(input.files?.[0]));
document.querySelector('#cv-remove').addEventListener('click', clearFile);
for (const event of ['dragenter','dragover']) dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('is-over'); });
for (const event of ['dragleave','drop']) dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('is-over'); });
dropzone.addEventListener('drop', e => { if(e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]); });
window.addEventListener('pagehide', resetPreview);

const status=document.querySelector('#cv-upload-status');
const saved=document.createElement('button');saved.className='btn btn--outline';saved.type='button';saved.textContent='Xem CV đã lưu';upload.after(saved);
let busy=false;upload.addEventListener('click',async()=>{if(!currentFile||busy)return;busy=true;upload.disabled=true;try{await uploadCV(currentFile);status.textContent='Đã tải CV lên hệ thống.';}catch(e){status.textContent=e.message;}finally{busy=false;upload.disabled=!currentFile;}});
saved.addEventListener('click',async()=>{try{const file=await api('/candidate/cv',{auth:true,blob:true});showPreview(file,file.type,file.type===MIME_PDF?'cv.pdf':'cv.docx');status.textContent='Đã lấy CV đã lưu.';}catch(e){status.textContent=e.message;}});
try{await me();const data=await api('/candidate/profile',{auth:true});status.textContent=data.cv_url?'Đã có CV trên hệ thống.':'Chưa có CV trên hệ thống.';}catch(e){status.textContent=e.message;}
