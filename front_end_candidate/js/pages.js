import {renderLayout} from './components/layout.js';
import {jobCard} from './components/job-card.js';
import {jobs,jobById} from './api.js';

renderLayout();
const root = '..';
const list = document.querySelector('#job-list');

if (list) {
  const form = document.querySelector('#job-filter');
  const keyword = form.querySelector('#keyword');
  const locationInput = form.querySelector('#location');
  const total = document.querySelector('#count');
  const pagination = document.querySelector('#job-pagination');
  const sort = document.querySelector('#job-sort');
  const params = new URLSearchParams(window.location.search);
  keyword.value = params.get('keyword') || '';
  locationInput.value = params.get('location') || '';
  const PAGE_SIZE = 3;
  const locText=document.createElement('input');locText.setAttribute('aria-label','Địa điểm');locText.id='location';locText.type='search';locText.placeholder='Nhập địa điểm';locationInput.replaceWith(locText);locText.value=params.get('location')||'';
  const category=document.createElement('input');category.type='number';category.min='1';category.placeholder='ID ngành (nếu biết)';category.id='category-id';category.setAttribute('aria-label','ID ngành nghề');category.value=params.get('category_id')||'';form.querySelector('.filter-group').replaceChildren(Object.assign(document.createElement('h3'),{textContent:'Ngành nghề (ID)'}),category);
  for(const name of ['jobType','experience','workMode'])for(const input of form.querySelectorAll(`[name="${name}"]`)){input.disabled=true;input.title='Backend chưa hỗ trợ trường này';}
  const notice=document.createElement('p');notice.textContent='API chưa có tên ngành, loại hình, kinh nghiệm, hình thức làm việc. Mức lương chưa xác định đơn vị.';form.prepend(notice);
  let demoJobs=[];let loadError='';let requestSeq=0;let loading=false;
  const oldSalary=form.querySelector('#salary-range');const salaryInput=document.createElement('input');salaryInput.id='salary-range';salaryInput.type='number';salaryInput.min='0';salaryInput.step='any';salaryInput.placeholder='Không giới hạn';oldSalary.replaceWith(salaryInput);
  const filterStatus = form.querySelector('#filter-status');
  const normalizeText = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi').trim();
  let currentPage = 1;
  let appliedFilters = null;

  for (const badge of form.querySelectorAll('[data-count-category]')) {
    badge.textContent = String(demoJobs.filter(job => job.category === badge.dataset.countCategory).length);
  }

  function selectedValues(name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
  }
  function readFilters() {
    return {
      keyword: keyword.value.trim(),
      location: locText.value.trim(), categoryId:category.value,
      categories: selectedValues('category'),
      types: selectedValues('jobType'),
      experiences: selectedValues('experience'),
      workModes: selectedValues('workMode'),
      minSalary: salaryInput.value ? Number(salaryInput.value) : 0
    };
  }
  function filterJobs(filters){return demoJobs.filter(job=>!filters.minSalary||(job.salaryMin!==null&&job.salaryMin>=filters.minSalary));}
  async function load(){const seq=++requestSeq;loading=true;total.textContent='Đang tải việc làm...';list.replaceChildren();pagination.replaceChildren();loadError='';try{const f=appliedFilters;const result=await jobs({q:f.keyword,location:f.location,category_id:f.categoryId});if(seq!==requestSeq)return;demoJobs=result;loading=false;renderJobs();}catch(e){if(seq!==requestSeq)return;demoJobs=[];loading=false;loadError=e.message;renderJobs();}}
  function renderPagination(pageCount) {
    pagination.replaceChildren();
    if (pageCount <= 1) return;
    const addButton = (label, page, disabled, isActive = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.disabled = disabled;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => {
        currentPage = page;
        renderJobs();
        document.querySelector('.listing-toolbar')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
      pagination.append(btn);
    };
    addButton('‹ Trước', currentPage - 1, currentPage === 1);
    for (let i = 1; i <= pageCount; i++) addButton(String(i), i, false, i === currentPage);
    addButton('Tiếp ›', currentPage + 1, currentPage === pageCount);
  }
  function renderJobs() {
    if(loading)return;
    if(loadError){total.textContent=loadError;list.replaceChildren();pagination.replaceChildren();return;}
    const filters = appliedFilters || readFilters();
    let matches = filterJobs(filters);
    if (sort.value === 'oldest') matches = [...matches].reverse();
    else if (sort.value === 'title') matches = [...matches].sort((a,b) => a.title.localeCompare(b.title,'vi'));
    const pageCount = Math.ceil(matches.length / PAGE_SIZE);
    currentPage = Math.max(1, Math.min(currentPage, pageCount || 1));
    const start = (currentPage - 1) * PAGE_SIZE;
    list.replaceChildren(...matches.slice(start, start + PAGE_SIZE).map(job => jobCard(job, root)));
    total.textContent = matches.length ? `Hiển thị ${start + 1}–${Math.min(start + PAGE_SIZE, matches.length)} trong ${matches.length} việc làm` : 'Không có việc làm phù hợp';
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'placeholder-notice';
      empty.textContent = 'Không có việc làm phù hợp. Hãy thử chọn lại bộ lọc hoặc nhấn “Xóa bộ lọc”.';
      list.append(empty);
    }
    renderPagination(pageCount);
  }

  // Chỉ áp dụng các điều kiện sau khi nhấn "Lọc việc làm".
  form.addEventListener('submit', event => {
    event.preventDefault();
    appliedFilters = readFilters();
    currentPage = 1;
    filterStatus.textContent = 'Đã áp dụng bộ lọc.';
    load();
  });
  sort.addEventListener('change', () => { currentPage = 1; renderJobs(); });
  document.querySelector('#clear-filters').addEventListener('click', () => {
    form.reset();
    keyword.value = '';
    locText.value = ''; category.value='';
    appliedFilters = readFilters();
    currentPage = 1;
    window.history.replaceState(null, '', window.location.pathname);
    filterStatus.textContent = 'Đã xóa bộ lọc.';
    load();
  });
  // Có thể đến trang Jobs từ thanh tìm kiếm ở Homepage qua query string.
  appliedFilters = readFilters();
  load();
}

const detail = document.querySelector('#detail-job');
if (detail) {
  const id = new URLSearchParams(window.location.search).get('id');
  let job=null;let jobError='';try{job=await jobById(id);}catch(e){jobError=e.message;}
  const container = document.querySelector('.job-detail-grid');
  const notFound = document.querySelector('#job-not-found');
  if (!job) {
    container.hidden = true;
    notFound.hidden = false;notFound.querySelector('p').textContent=jobError;
    document.title = 'Không tìm thấy công việc — Job Portal';
  } else {
    const content={description:job.description,experience:'Chưa cập nhật',responsibilities:[],skills:[]};
    document.title = `${job.title} — Job Portal`;
    detail.querySelector('.detail-job-title').textContent = job.title;
    detail.querySelector('.detail-job-company').textContent = job.company;
    detail.querySelector('.detail-job-meta').textContent = `${job.category} · ${job.type} · ${job.salary} · ${job.location}`;
    detail.querySelector('.job-card__time, .tag').textContent = job.time;
    document.querySelector('#job-description').textContent = content.description;
    for (const [id, items] of [['job-responsibilities',content.responsibilities],['job-skills',content.skills]]) {
      const ul = document.getElementById(id);
      ul.replaceChildren(...items.map(item => {
        const li = document.createElement('li'); li.textContent = item; return li;
      }));
    }
    const tags = document.getElementById('detail-tags');
    for (const label of [job.type,job.category]) {
      const tag = document.createElement('span'); tag.className='tag'; tag.textContent=label; tags.append(tag);
    }
    container.querySelector('.overview-title').textContent = job.title;
    document.querySelector('.overview-type').textContent = job.type;
    document.querySelector('.overview-category').textContent = job.category;
    document.querySelector('.overview-experience').textContent = content.experience;
    container.querySelector('.overview-location').textContent = job.location;
    container.querySelector('.overview-salary').textContent = job.salary;
    document.querySelector('#apply-job-link').href = `apply.html?jobId=${encodeURIComponent(job.id)}`;
    const related = document.querySelector('#related-jobs');
    try{const others=await jobs(job.category_id==null?{}:{category_id:job.category_id});related.replaceChildren(...others.filter(j=>j.id!==job.id).slice(0,3).map(j=>jobCard(j,root)));}catch(e){related.textContent=e.message;}
    if(job.job_status!=='open'){const link=document.querySelector('#apply-job-link');link.removeAttribute('href');link.textContent='Tin đã đóng';}

  }
}

for (const form of document.querySelectorAll('.demo-form')) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    form.querySelector('.form-status').textContent = 'Giao diện mẫu: chưa kết nối API, chưa gửi dữ liệu.';
  });
}
