import { renderLayout } from './components/layout.js';
renderLayout();

// PROF-02: Dữ liệu mẫu phục vụ UI. KHÔNG phải thông tin tài khoản đã đăng nhập.
// Không lưu thông tin cá nhân vào localStorage khi chưa có quyết định về bảo mật.
let profile = {
  fullName: 'Nguyễn An',
  email: 'ungvien@example.com',
  phone: '0912 345 678',
  skills: ['HTML', 'CSS', 'JavaScript'],
  experience: 'Đã tham gia xây dựng giao diện website bằng HTML, CSS và JavaScript.',
  education: 'Sinh viên ngành Công nghệ thông tin'
};

const byId = id => document.getElementById(id);
const form = byId('profile-form');
const view = byId('profile-view');
const edit = byId('start-edit');
const status = byId('profile-status');
function showStatus(message='',state='') { status.textContent=message; status.dataset.state=state; }
function initials(name) { return name.trim().split(/\s+/).slice(-2).map(part=>part.charAt(0)).join('').toLocaleUpperCase('vi'); }
function displayText(value) { return String(value||'').trim() || 'Chưa cập nhật'; }

function render() {
  byId('view-fullname').textContent = displayText(profile.fullName);
  byId('view-email').textContent = displayText(profile.email);
  byId('view-phone').textContent = displayText(profile.phone);
  byId('view-experience').textContent = displayText(profile.experience);
  byId('view-education').textContent = displayText(profile.education);
  byId('side-name').textContent = displayText(profile.fullName);
  byId('side-email').textContent = displayText(profile.email);
  byId('profile-avatar').textContent = initials(profile.fullName) || 'UV';
  const chips=byId('view-skills');
  chips.replaceChildren();
  if(profile.skills.length){
    for(const skill of profile.skills){const el=document.createElement('span');el.className='profile-chip';el.textContent=skill;chips.append(el);}
  }else{chips.textContent='Chưa cập nhật';}
  const values=[profile.fullName,profile.phone,profile.skills.length,profile.experience,profile.education];
  const progress=Math.round(values.filter(v=>typeof v==='number'?v>0:Boolean(String(v).trim())).length / values.length * 100);
  byId('completion-progress').style.width=`${progress}%`;
  byId('completion-text').textContent=`Hồ sơ hoàn thiện ${progress}% (dữ liệu mẫu)`;
  document.querySelector('.completion-bar').setAttribute('aria-valuenow',String(progress));
}
function fillForm() {
  byId('full-name').value=profile.fullName;
  byId('profile-email').value=profile.email;
  byId('phone').value=profile.phone;
  byId('skills').value=profile.skills.join(', ');
  byId('experience').value=profile.experience;
  byId('education').value=profile.education;
  byId('full-name-error').textContent='';
  byId('phone-error').textContent='';
  byId('full-name').removeAttribute('aria-invalid');
  byId('phone').removeAttribute('aria-invalid');
}
function toggleEdit(isEditing) {
  form.hidden=!isEditing;
  view.hidden=isEditing;
  edit.hidden=isEditing;
  if(isEditing){fillForm();byId('full-name').focus();}
}
edit.addEventListener('click',()=>{showStatus();toggleEdit(true);});
byId('cancel-edit').addEventListener('click',()=>{toggleEdit(false);showStatus('Đã hủy chỉnh sửa.');});
form.addEventListener('submit',event=>{
  event.preventDefault();showStatus();
  const name=byId('full-name').value.trim().replace(/\s+/g,' ');
  const phone=byId('phone').value.trim();
  let valid=true;
  if(name.length<2){byId('full-name-error').textContent='Họ tên cần ít nhất 2 ký tự.';byId('full-name').setAttribute('aria-invalid','true');valid=false;}
  else{byId('full-name-error').textContent='';byId('full-name').removeAttribute('aria-invalid');}
  if(phone && !/^[+\d][\d\s().-]{6,19}$/.test(phone)){byId('phone-error').textContent='Vui lòng nhập số điện thoại hợp lệ.';byId('phone').setAttribute('aria-invalid','true');valid=false;}
  else{byId('phone-error').textContent='';byId('phone').removeAttribute('aria-invalid');}
  if(!valid){form.querySelector('[aria-invalid=true]')?.focus();return;}
  const skills=[...new Set(byId('skills').value.split(',').map(s=>s.trim()).filter(Boolean))].slice(0,20);
  profile={...profile,fullName:name,phone,skills,experience:byId('experience').value.trim(),education:byId('education').value.trim()};
  render();toggleEdit(false);
  showStatus('Đã cập nhật giao diện demo. Thông tin chỉ tồn tại đến khi tải lại trang; chưa gửi lên backend.','success');
});
render();
