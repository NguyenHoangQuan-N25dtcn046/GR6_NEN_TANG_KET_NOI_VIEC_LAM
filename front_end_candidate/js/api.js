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
const jobTypes = {'full-time':'Toàn thời gian', 'part-time':'Bán thời gian', contract:'Hợp đồng', internship:'Thực tập'};
const workModes = {onsite:'Tại văn phòng', remote:'Từ xa', hybrid:'Kết hợp'};

export function normalizeJob(job) {
  const amounts = [job.salary_min, job.salary_max].filter(amount => amount != null);
  return {
    ...job,
    company: job.company_name || 'Chưa cập nhật',
    category: job.category_name || 'Chưa phân loại',
    type: jobTypes[job.job_type] || 'Chưa cập nhật',
    workMode: workModes[job.work_mode] || 'Chưa cập nhật',
    experience: job.experience_years == null ? 'Chưa cập nhật' : job.experience_years + ' năm',
    salary: amounts.length ? amounts.map(amount => Number(amount).toLocaleString('vi-VN')).join(' – ') + ' VND' : 'Thỏa thuận',
    time: job.is_expired ? 'Đã hết hạn' : job.job_status === 'closed' ? 'Đã đóng' : job.deadline ? 'Hạn ' + job.deadline : 'Việc làm',
  };
}

export async function jobs(filters = {}, { limit = 100, all = true } = {}) {
  const matches = [];
  const query = new URLSearchParams({ limit: String(limit) });
  for (const [key, selected] of Object.entries(filters)) {
    for (const value of Array.isArray(selected) ? selected : [selected]) {
      if (value !== '' && value != null) query.append(key, String(value));
    }
  }
  do {
    query.set('offset', String(matches.length));
    const batch = await api('/jobs?' + query);
    matches.push(...batch);
    if (!all || batch.length < limit) break;
  } while (true);
  return matches.map(normalizeJob);
}

export async function fillCategories(select, selected = '') {
  const categories = await api('/jobs/categories');
  select.append(...categories.map(({ id, name }) => new Option(name, id)));
  select.value = selected;
  if (select.selectedIndex < 0) select.selectedIndex = 0;
}

export async function jobById(id){if(!/^\d+$/.test(id||''))throw Object.assign(new Error('ID công việc không hợp lệ.'),{status:404});return normalizeJob(await api('/jobs/'+encodeURIComponent(id)));}
