import { renderLayout } from './components/layout.js';
import { API_BASE_URL } from './config.js';
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
 const passOk=isRegister?pass.value.length>=8:pass.value.length>0;
 setError(pass.id,passOk?'':isRegister?'Mật khẩu cần ít nhất 8 ký tự.':'Vui lòng nhập mật khẩu.');if(!passOk)valid=false;
 if(isRegister){
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
 if(!API_BASE_URL.trim()){
  showStatus('Form hợp lệ. Chưa thể gửi dữ liệu vì backend chưa được cấu hình. Hãy đặt API_BASE_URL trong js/config.js.');return;
 }
 const button=form.querySelector('[type="submit"]');button.disabled=true;
 const email=$(isRegister?'register-email':'login-email').value.trim();
 const password=$(isRegister?'register-password':'login-password').value;
 // Chỉ gửi các field đã nêu trong SRS: role candidate cho đăng ký, email và password cho đăng nhập.
 const payload=isRegister?{email,password,role:'candidate'}:{email,password};
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(`${API_BASE_URL.replace(/\/$/,'')}/api/auth/${isRegister?'register':'login'}`,{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok){showStatus(result.message||result.error||`Yêu cầu thất bại (HTTP ${response.status}).`);return;}
  if(isRegister){form.reset();showStatus('Đăng ký thành công. Bạn có thể đăng nhập bằng tài khoản vừa tạo.','success');}
  else{
   // Hợp đồng backend chưa xác nhận tên trường token. Không suy đoán hoặc lưu thông tin nhạy cảm.
   showStatus('Backend phản hồi đăng nhập thành công. Cần xác nhận hợp đồng token/session và điều hướng sau đăng nhập với Leader.','success');
  }
 }catch(error){showStatus(error.name==='AbortError'?'Yêu cầu quá thời gian. Hãy kiểm tra kết nối API.':'Không thể kết nối backend. Kiểm tra API_BASE_URL, server và cấu hình CORS.');}
 finally{clearTimeout(timeout);button.disabled=false;}
});
