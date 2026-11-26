import {API_BASE_URL} from './config.js';
const key='tv3_candidate_token';
export const token=()=>sessionStorage.getItem(key);
export const setToken=value=>sessionStorage.setItem(key,value);
export const clearToken=()=>sessionStorage.removeItem(key);
export async function api(path,{method='GET',body,auth=false,blob=false}={}){
 const headers={}; if(auth){if(!token())throw Object.assign(new Error('Vui lòng đăng nhập Candidate.'),{status:401});headers.Authorization=`Bearer ${token()}`;}
 if(body!==undefined && !(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 let res;try{res=await fetch(API_BASE_URL.replace(/\/$/,'')+path,{method,headers,body,signal:AbortSignal.timeout(15000)});}catch(e){throw new Error('Không kết nối được API. Kiểm tra backend cổng 8000 và CORS.');}
 if(!res.ok){const data=await res.json().catch(()=>({}));if(auth&&res.status===401)clearToken();throw Object.assign(new Error(typeof data.detail==='string'?data.detail:`Lỗi HTTP ${res.status}`),{status:res.status});}
 return res.status===204?null:blob?res.blob():res.json();
}
export async function me(){const u=await api('/auth/me',{auth:true});if(u.role!=='candidate'){clearToken();throw new Error('Tài khoản không có vai trò Candidate.');}return u;}
const cvMimeTypes = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
export function cvMime(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return undefined;
  const extension = filename.slice(dot + 1).toLowerCase();
  return Object.hasOwn(cvMimeTypes, extension) ? cvMimeTypes[extension] : undefined;
}
export async function uploadCV(file) {
  const body = new FormData();
  const normalized = file.type ? file : new File([file], file.name, { type: cvMime(file.name) });
  body.append('file', normalized);
  return api('/candidate/cv', { method: 'POST', body, auth: true });
}
export function normalizeJob(j){return {...j,company:j.company_name||'Chưa cập nhật',category:j.category_id==null?'Chưa phân loại':`Ngành #${j.category_id}`,type:'Chưa cập nhật',salaryMin:j.salary_min==null?null:Number(j.salary_min),salary:j.salary_min==null&&j.salary_max==null?'Thỏa thuận':[j.salary_min,j.salary_max].filter(x=>x!=null).map(x=>Number(x).toLocaleString('vi-VN')).join(' – '),time:j.deadline?`Hạn: ${j.deadline}`:'Việc làm'};}
export async function jobs(filters={}){const all=[];let offset=0;while(true){const q=new URLSearchParams({limit:'100',offset:String(offset)});for(const [k,v] of Object.entries(filters))if(v!==''&&v!=null)q.set(k,String(v));const batch=await api('/jobs?'+q);all.push(...batch);if(batch.length<100)break;offset+=batch.length;}return all.map(normalizeJob);}
export async function jobById(id){if(!/^\d+$/.test(id||''))throw Object.assign(new Error('ID công việc không hợp lệ.'),{status:404});return normalizeJob(await api('/jobs/'+encodeURIComponent(id)));}
