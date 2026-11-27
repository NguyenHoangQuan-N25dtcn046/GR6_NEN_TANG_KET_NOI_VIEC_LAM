import { renderLayout } from './components/layout.js';
import {api, setToken, clearToken, me} from './api.js';
renderLayout();
const form=document.querySelector('#login-form, #register-form');
const status=document.querySelector('#auth-status');
const isRegister=form?.id==='register-form';
const $=(id)=>document.getElementById(id);
const fields=isRegister?['register-email','register-password','register-confirm','register-agree']:['login-email','login-password'];
function setError(id,message){const input=$(id);const error=$(id+'-error');if(error)error.textContent=message;if(input)input.setAttribute('aria-invalid',message?'true':'false');}
function showStatus(message,state='error'){status.textContent=message;status.dataset.state=state;}
function validate(){
 let valid=true;
 const email=$(isRegister?'register-email':'login-email');
 const pass=$(isRegister?'register-password':'login-password');
 const emailText=email.value.trim();
 const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText)&&emailText.length<=100;
 setError(email.id,emailOk?'':'Vui lòng nhập địa chỉ email hợp lệ.');if(!emailOk)valid=false;
 const passOk=isRegister?pass.value.length>=8&&pass.value.length<=128:pass.value.length>0;
 setError(pass.id,passOk?'':isRegister?'Mật khẩu cần ít nhất 8 ký tự.':'Vui lòng nhập mật khẩu.');if(!passOk)valid=false;
 if(isRegister){
  const name=$('register-name');const nameOK=!!name.value.trim();setError(name.id,nameOK?'':'Vui lòng nhập họ tên.');if(!nameOK)valid=false;
  const confirm=$('register-confirm');const matched=confirm.value.length>0&&confirm.value===pass.value;
  setError(confirm.id,matched?'':'Mật khẩu nhập lại chưa trùng khớp.');if(!matched)valid=false;
  const agreed=$('register-agree').checked;setError('register-agree',agreed?'':'Vui lòng xác nhận trước khi đăng ký.');if(!agreed)valid=false;
 }
 return valid;
}
fields.forEach(id=>$(id)?.addEventListener('input',()=>{setError(id,'');showStatus('','');}));
$('register-agree')?.addEventListener('change',()=>setError('register-agree',''));
document.querySelectorAll('.password-toggle').forEach(toggle=>{
 toggle.addEventListener('click',()=>{const input=$(toggle.dataset.target);const visible=input.type==='password';input.type=visible?'text':'password';toggle.textContent=visible?'Ẩn':'Hiện';toggle.setAttribute('aria-pressed',String(visible));toggle.setAttribute('aria-label',visible?'Ẩn mật khẩu':'Hiện mật khẩu');});
});
form?.addEventListener('submit',async event=>{
 event.preventDefault();showStatus('','');
 if(!validate()){form.querySelector('[aria-invalid="true"]')?.focus();return;}
 const button=form.querySelector('[type="submit"]');button.disabled=true;
 const email=$(isRegister?'register-email':'login-email').value.trim();const password=$(isRegister?'register-password':'login-password').value;
 try{if(isRegister){await api('/auth/register',{method:'POST',body:{email,password,role:'candidate',full_name:$('register-name').value.trim()}});form.reset();showStatus('Đăng ký thành công. Hãy đăng nhập.','success');}else{clearToken();const result=await api('/auth/login',{method:'POST',body:{email,password}});if(!result.access_token)throw new Error('Hệ thống chưa xác nhận được phiên đăng nhập.');setToken(result.access_token);await me();location.href='profile.html';}}catch(e){if(!isRegister)clearToken();showStatus(e.message);}finally{button.disabled=false;}
});
