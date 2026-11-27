import {API_BASE_URL} from './config.js';
const key='tv3_candidate_token';
export const token=()=>sessionStorage.getItem(key);
export const setToken=value=>sessionStorage.setItem(key,value);
export const clearToken=()=>sessionStorage.removeItem(key);

const validationFields = {
  email: 'Email',
  password: 'Mật khẩu',
  full_name: 'Họ và tên',
  phone: 'Số điện thoại',
  skills: 'Kỹ năng',
  company: 'Công ty',
  position: 'Vị trí',
  school: 'Trường',
  major: 'Chuyên ngành',
  degree: 'Bằng cấp',
  start_date: 'Ngày bắt đầu',
  end_date: 'Ngày kết thúc',
  cover_letter: 'Thư ứng tuyển',
  file: 'Tệp CV',
  category_id: 'Mã ngành nghề',
  salary_min: 'Mức lương tối thiểu',
  salary_max: 'Mức lương tối đa',
};
const validationMessages = {
  missing: 'Thông tin bắt buộc',
  string_too_short: 'Nội dung quá ngắn',
  string_too_long: 'Nội dung quá dài',
  int_parsing: 'Vui lòng nhập số nguyên',
  int_type: 'Vui lòng nhập số nguyên',
  greater_than_equal: 'Giá trị thấp hơn mức cho phép',
  less_than_equal: 'Giá trị vượt quá mức cho phép',
  date_from_datetime_parsing: 'Ngày không hợp lệ',
  date_parsing: 'Ngày không hợp lệ',
};
const detailMessages = {
  'Candidate cần full_name': 'Vui lòng nhập họ và tên.',
  'Token không hợp lệ hoặc đã hết hạn': 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  'Token đã bị thu hồi': 'Phiên đăng nhập đã kết thúc.',
  'Not authenticated': 'Vui lòng đăng nhập.',
  'Chỉ chấp nhận file PDF hoặc DOCX hợp lệ': 'Chỉ chấp nhận tệp PDF hoặc DOCX hợp lệ.',
};
const httpMessages = {
  400: 'Yêu cầu không hợp lệ.',
  401: 'Vui lòng đăng nhập.',
  403: 'Bạn không có quyền truy cập chức năng này.',
  404: 'Không tìm thấy dữ liệu.',
  405: 'Yêu cầu này chưa được hỗ trợ.',
  422: 'Dữ liệu không hợp lệ.',
  500: 'Đã xảy ra lỗi hệ thống.',
};

function errorMessage(data, status) {
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map(({location, code, message}) => {
      const fieldKey = location?.at(-1);
      const field = validationFields[fieldKey] || 'Dữ liệu';
      const reason = fieldKey === 'email' && code === 'value_error'
        ? 'Địa chỉ email không hợp lệ'
        : validationMessages[code] || (
          message === 'Value error, Ngày bắt đầu phải trước ngày kết thúc'
            ? 'Ngày bắt đầu phải trước ngày kết thúc'
            : 'Thông tin không hợp lệ'
        );
      return `${field}: ${reason}`;
    }).join(' · ');
  }
  const detail = typeof data.detail === 'string' ? data.detail.replace(/^Value error,\s*/, '') : '';
  if (detail && detail !== data.title) return detailMessages[detail] || detail;
  return httpMessages[status] || `Đã xảy ra lỗi (mã ${status}).`;
}

export async function api(path,{method='GET',body,auth=false,blob=false}={}){
 const headers={}; if(auth){if(!token())throw Object.assign(new Error('Vui lòng đăng nhập bằng tài khoản ứng viên.'),{status:401});headers.Authorization=`Bearer ${token()}`;}
 if(body!==undefined && !(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 let res;try{res=await fetch(API_BASE_URL.replace(/\/$/,'')+path,{method,headers,body,signal:AbortSignal.timeout(15000)});}catch(e){throw new Error('Không kết nối được với hệ thống. Vui lòng thử lại.');}
 if(!res.ok){const data=await res.json().catch(()=>({}));if(auth&&res.status===401)clearToken();throw Object.assign(new Error(errorMessage(data, res.status)),{status:res.status});}
 return res.status===204?null:blob?res.blob():res.json();
}
export async function me(){const u=await api('/auth/me',{auth:true});if(u.role!=='candidate'){clearToken();throw new Error('Tài khoản này chưa có quyền truy cập trang ứng viên.');}return u;}
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
const workModes = {onsite: 'Tại văn phòng', remote: 'Từ xa', hybrid: 'Kết hợp'};
export function normalizeJob(job) {
  const salaryRange = [job.salary_min, job.salary_max]
    .filter(value => value != null)
    .map(value => Number(value).toLocaleString('vi-VN'));
  const deadline = job.deadline?.split('-').reverse().join('/');
  return {
    ...job,
    company: job.company_name || 'Chưa cập nhật',
    category: job.category_id == null ? 'Chưa phân loại' : `Mã ngành ${job.category_id}`,
    type: 'Chưa cập nhật',
    workMode: job.work_mode || null,
    workModeLabel: workModes[job.work_mode] || 'Chưa cập nhật',
    salaryMin: job.salary_min == null ? null : Number(job.salary_min),
    salary: salaryRange.length ? `${salaryRange.join(' – ')} đ` : 'Thỏa thuận',
    time: deadline ? `Hạn nộp: ${deadline}` : 'Việc làm',
  };
}
export async function jobs(filters={}){const all=[];let offset=0;while(true){const q=new URLSearchParams({limit:'100',offset:String(offset)});for(const [k,v] of Object.entries(filters))if(v!==''&&v!=null)q.set(k,String(v));const batch=await api('/jobs?'+q);all.push(...batch);if(batch.length<100)break;offset+=batch.length;}return all.map(normalizeJob);}
export async function jobById(id){if(!/^\d+$/.test(id||''))throw Object.assign(new Error('Mã công việc không hợp lệ.'),{status:404});return normalizeJob(await api('/jobs/'+encodeURIComponent(id)));}
