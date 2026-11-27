import {renderLayout} from './components/layout.js';
import {api} from './api.js';
renderLayout();
// Trạng thái theo ApplicationStatusUpdate và dữ liệu thực tế từ backend.
const statuses={submitted:'Đã nộp',reviewing:'Đang xét duyệt',accepted:'Đã chấp nhận',rejected:'Từ chối'};
let records=[];let loadError='';try{records=(await api('/candidate/applications',{auth:true})).map(r=>({id:r.id,jobId:r.job_id,appliedAt:r.applied_at,status:r.status,job:{title:r.job_title,company:r.company_name}}));}catch(e){loadError=e.message;}
const form=document.querySelector('#history-filter');
const select=document.querySelector('#history-status');
const keyword=document.querySelector('#history-keyword');
const list=document.querySelector('#history-list');
const summary=document.querySelector('#history-summary');
const count=document.querySelector('#history-count');
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
for(const [value,label] of Object.entries(statuses)){const option=el('option','',label);option.value=value;select.append(option);}
for(const [label,value] of [['Tổng đơn',records.length],...Object.entries(statuses).map(([key,label])=>[label,records.filter(r=>r.status===key).length])]){const stat=el('div','history-stat');stat.append(el('span','',label),el('strong','',String(value)));summary.append(stat);}
function normalize(value){return String(value??'').toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d').trim();}
function dateLabel(value){const date=new Date(value);return Number.isNaN(date.getTime())?'Chưa rõ':new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);}
function card(record){const item=el('article','history-item');const top=el('div','history-item-top');const info=el('div');info.append(el('h3','',record.job?.title??'Công việc không còn khả dụng'),el('p','',record.job?.company??'Không có thông tin công ty'));const badge=el('span',`history-status history-status--${Object.hasOwn(statuses,record.status)?record.status:'submitted'}`,statuses[record.status]??'Chưa xác định');top.append(info,badge);const bottom=el('div','history-item-bottom');bottom.append(el('p','',`Ngày ứng tuyển: ${dateLabel(record.appliedAt)} · ${record.id}`));if(record.job){const link=el('a','btn btn--outline btn--sm','Xem chi tiết việc làm');link.href=`job-detail.html?id=${encodeURIComponent(record.jobId)}`;bottom.append(link);}item.append(top,bottom);return item;}
function render(){const q=normalize(keyword.value);const status=select.value;const filtered=records.filter(r=>(!status||r.status===status)&&(!q||normalize(`${r.job?.title??''} ${r.job?.company??''}`).includes(q))).sort((a,b)=>b.appliedAt.localeCompare(a.appliedAt));count.textContent=`Hiển thị ${filtered.length} / ${records.length} đơn ứng tuyển`;list.replaceChildren(...filtered.map(card));if(loadError){list.append(el('p','history-empty',loadError));return;}if(!filtered.length){const empty=el('div','history-empty');empty.append(el('h3','','Không có đơn ứng tuyển phù hợp'),el('p','','Thử thay đổi từ khóa hoặc trạng thái.' ));const button=el('button','btn btn--outline','Xóa bộ lọc');button.type='button';button.addEventListener('click',reset);empty.append(button);list.append(empty);}}
function reset(){form.reset();render();}
const refresh=el('button','btn btn--outline','Cập nhật trạng thái');refresh.type='button';refresh.addEventListener('click',()=>location.reload());form.after(refresh);
form.addEventListener('submit',e=>{e.preventDefault();render();});document.querySelector('#history-reset').addEventListener('click',reset);render();
