import {api,clearToken,me} from './api.js';
import { loadProfileRecords } from './profile-records.js';
import { renderLayout } from './components/layout.js';
renderLayout();

// Không lưu thông tin cá nhân vào localStorage khi chưa có quyết định về bảo mật.
let profile={fullName:'',email:'',phone:'',skills:[]};
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
  byId('side-name').textContent = displayText(profile.fullName);
  byId('side-email').textContent = displayText(profile.email);
  byId('profile-avatar').textContent = initials(profile.fullName) || 'UV';
  const chips=byId('view-skills');
  chips.replaceChildren();
  if(profile.skills.length){
    for(const skill of profile.skills){const el=document.createElement('span');el.className='profile-chip';el.textContent=skill;chips.append(el);}
  }else{chips.textContent='Chưa cập nhật';}
  const values=[profile.fullName,profile.phone,profile.skills.length];
  const progress=Math.round(values.filter(v=>typeof v==='number'?v>0:Boolean(String(v).trim())).length / values.length * 100);
  byId('completion-progress').style.width=`${progress}%`;
  byId('completion-text').textContent=`Hồ sơ hoàn thiện ${progress}%`;
  document.querySelector('.completion-bar').setAttribute('aria-valuenow',String(progress));
}
function fillForm() {
  byId('full-name').value=profile.fullName;
  byId('profile-email').value=profile.email;
  byId('phone').value=profile.phone;
  byId('skills').value=profile.skills.join(', ');
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
form.addEventListener('submit',async event=>{
  event.preventDefault();showStatus();
  const name=byId('full-name').value.trim().replace(/\s+/g,' ');
  const phone=byId('phone').value.trim();
  let valid=true;
  if(!name){byId('full-name-error').textContent='Vui lòng nhập họ tên.';byId('full-name').setAttribute('aria-invalid','true');valid=false;}
  else{byId('full-name-error').textContent='';byId('full-name').removeAttribute('aria-invalid');}
  if(phone && !/^[+\d][\d\s().-]{6,19}$/.test(phone)){byId('phone-error').textContent='Vui lòng nhập số điện thoại hợp lệ.';byId('phone').setAttribute('aria-invalid','true');valid=false;}
  else{byId('phone-error').textContent='';byId('phone').removeAttribute('aria-invalid');}
  if(!valid){form.querySelector('[aria-invalid=true]')?.focus();return;}
  const skills=[...new Set(byId('skills').value.split(',').map(s=>s.trim()).filter(Boolean))].slice(0,20);
  const button=form.querySelector('[type="submit"]');button.disabled=true;
  try{const data=await api('/candidate/profile',{method:'PATCH',auth:true,body:{full_name:name,phone,skills:skills.join(', ')}});assign(data);render();toggleEdit(false);showStatus('Đã lưu hồ sơ trên hệ thống.','success');}catch(e){showStatus(e.message,'error');}finally{button.disabled=false;}
});
function assign(data){profile={...profile,fullName:data.full_name,phone:data.phone||'',skills:(data.skills||'').split(',').map(x=>x.trim()).filter(Boolean)};}
const passwordForm = byId('password-form');
passwordForm.addEventListener('submit', async event => {
  event.preventDefault();
  const status = byId('password-status');
  const { current_password, new_password, confirmation } = Object.fromEntries(new FormData(passwordForm));
  status.textContent = '';
  if (new_password !== confirmation) {
    status.textContent = 'Mật khẩu nhập lại chưa trùng khớp.';
    return;
  }
  const button = passwordForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await api('/auth/password', { method: 'PATCH', auth: true, body: { current_password, new_password } });
    clearToken();
    window.location.replace('login.html?passwordChanged=1');
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
});

edit.disabled=true;
try{const u=await me();profile.email=u.email;assign(await api('/candidate/profile',{auth:true}));render();edit.disabled=false;byId('account-security').hidden=false;await loadProfileRecords();}catch(e){showStatus(e.message,'error');}
