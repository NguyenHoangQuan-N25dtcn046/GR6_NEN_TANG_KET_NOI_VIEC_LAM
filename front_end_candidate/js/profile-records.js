import {api} from './api.js';

const definitions = {
  experiences: {label:'kinh nghiệm', fields:[['company','Công ty',200],['position','Vị trí',200],['start_date','Ngày bắt đầu','date'],['end_date','Ngày kết thúc (bỏ trống nếu đang làm)','date',false],['description','Mô tả','textarea',false]], title:r=>`${r.position} · ${r.company}`, detail:r=>r.description},
  educations: {label:'học vấn', fields:[['school','Trường',200],['major','Chuyên ngành',200],['degree','Bằng cấp',100],['start_date','Ngày bắt đầu','date'],['end_date','Ngày kết thúc (bỏ trống nếu đang học)','date',false]], title:r=>r.school, detail:r=>`${r.major} · ${r.degree}`}
};
function el(tag, cls='', text='') {const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;}
function button(text,cls='btn btn--outline btn--sm'){const n=el('button',cls,text);n.type='button';return n;}
const dateLabel=value=>value?value.split('-').reverse().join('/'):'Hiện tại';

export function mountRecords(section, kind, onCount) {
  const def=definitions[kind], path=`/candidate/${kind}`, root=section.querySelector('.record-manager');
  const toolbar=el('div','record-toolbar'), add=button(`+ Thêm ${def.label}`), retry=button('Tải lại');
  add.disabled=true;retry.hidden=true;toolbar.append(add,retry);
  const list=el('div','record-list'), status=el('p','profile-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const form=el('form','profile-form record-form');form.hidden=true;
  const grid=el('div','profile-form-grid'), inputs={};
  for(const [name,label,type,required=true] of def.fields){
    const field=el('div',`profile-field${type==='textarea'?' profile-field-wide':''}`), caption=el('label','',label+(required?' *':''));
    const input=el(type==='textarea'?'textarea':'input');input.id=`${kind}-${name}`;input.name=name;caption.htmlFor=input.id;input.required=required;
    if(type==='date')input.type='date';else if(type==='textarea'){input.rows=3;input.maxLength=2000;}else{input.type='text';input.maxLength=type;}
    inputs[name]=input;field.append(caption,input);grid.append(field);
  }
  const actions=el('div','profile-form-actions'), cancel=button('Hủy','profile-cancel'), save=el('button','btn','Lưu');save.type='submit';actions.append(cancel,save);form.append(grid,actions);root.append(toolbar,list,form,status);
  let rows=[],editing=null,busy=false,ready=false;
  function message(text='',state=''){status.textContent=text;status.dataset.state=state;}
  function controls(){add.disabled=busy||!ready;retry.disabled=busy;save.disabled=busy;cancel.disabled=busy;for(const input of Object.values(inputs))input.disabled=busy;for(const b of list.querySelectorAll('button'))b.disabled=busy||!ready;}
  function close(){form.reset();editing=null;form.hidden=true;}
  function open(row=null){if(busy||!ready)return;editing=row?.id??null;form.reset();for(const [name,input] of Object.entries(inputs))input.value=row?.[name]??'';form.hidden=false;message();Object.values(inputs)[0].focus();}
  function render(){list.replaceChildren();if(!rows.length)list.append(el('p','record-empty',`Chưa có ${def.label}.`));for(const row of rows){const card=el('article','record-item'),info=el('div','record-info');info.append(el('strong','',def.title(row)),el('p','',`${dateLabel(row.start_date)} – ${dateLabel(row.end_date)}`));if(def.detail(row))info.append(el('p','',def.detail(row)));const buttons=el('div','record-actions'), change=button('Sửa'), remove=button('Xóa','profile-cancel');change.addEventListener('click',()=>open(row));remove.addEventListener('click',async()=>{if(busy||!ready||!confirm(`Xóa ${def.label} này?`))return;busy=true;controls();try{await api(`${path}/${row.id}`,{method:'DELETE',auth:true});rows=rows.filter(r=>r.id!==row.id);if(editing===row.id)close();render();message('Đã xóa.','success');}catch(e){message(e.message,'error');}finally{busy=false;controls();}});buttons.append(change,remove);card.append(info,buttons);list.append(card);}onCount(rows.length);controls();}
  async function load(){if(busy)return;busy=true;controls();message('Đang tải…');try{rows=await api(path,{auth:true});ready=true;retry.hidden=true;render();message();}catch(e){ready=false;retry.hidden=false;message(e.message,'error');}finally{busy=false;controls();}}
  add.addEventListener('click',()=>open());retry.addEventListener('click',load);cancel.addEventListener('click',()=>{close();message();});
  form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!ready)return;const data=Object.fromEntries(Object.entries(inputs).map(([name,input])=>[name,input.value.trim()||null]));if(def.fields.some(([name,,,required=true])=>required&&!data[name])){message('Vui lòng nhập đủ các trường bắt buộc.','error');return;}if(data.end_date&&data.start_date>data.end_date){message('Ngày kết thúc không được trước ngày bắt đầu.','error');return;}const id=editing;busy=true;controls();try{const row=await api(id===null?path:`${path}/${id}`,{method:id===null?'POST':'PATCH',auth:true,body:data});rows=id===null?[row,...rows]:rows.map(r=>r.id===id?row:r);rows.sort((a,b)=>b.start_date.localeCompare(a.start_date));close();render();message('Đã lưu trên hệ thống.','success');}catch(e){message(e.message,'error');}finally{busy=false;controls();}});
  return {load,unavailable(text){ready=false;controls();message(text,'error');}};
}
