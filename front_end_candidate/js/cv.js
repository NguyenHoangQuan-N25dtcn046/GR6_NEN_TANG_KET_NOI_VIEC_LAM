import { renderLayout } from './components/layout.js';
renderLayout();

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_PDF = 'application/pdf';
const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
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
let objectUrl = null;
let currentFile = null;

function resetPreview() {
  preview.hidden = true;
  preview.removeAttribute('src');
  openFile.hidden = true;
  openFile.removeAttribute('href');
  empty.hidden = false;
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
  const ext = file.name.split('.').pop()?.toLowerCase();
  const expectedMime = ext === 'pdf' ? MIME_PDF : ext === 'docx' ? MIME_DOCX : null;
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
  objectUrl = URL.createObjectURL(file);
  openFile.href = objectUrl;
  openFile.hidden = false;
  if (file.name.toLowerCase().endsWith('.pdf')) {
    preview.src = objectUrl;
    preview.hidden = false;
    empty.hidden = true;
  } else {
    empty.querySelector('p').textContent = 'Trình duyệt không hỗ trợ xem trước DOCX trực tiếp. Chọn “Mở file” để tải hoặc mở bằng ứng dụng phù hợp.';
  }
  // Không bật nút upload khi backend chưa có hợp đồng API.
  upload.disabled = true;
}
input.addEventListener('change', () => handleFile(input.files?.[0]));
document.querySelector('#cv-remove').addEventListener('click', clearFile);
for (const event of ['dragenter','dragover']) dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('is-over'); });
for (const event of ['dragleave','drop']) dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('is-over'); });
dropzone.addEventListener('drop', e => { if(e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]); });
window.addEventListener('pagehide', resetPreview);
