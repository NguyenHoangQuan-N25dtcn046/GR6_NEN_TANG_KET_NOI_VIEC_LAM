import {renderLayout} from './components/layout.js';
import {jobCard} from './components/job-card.js';
import {fillCategories, jobs, jobById} from './api.js';

renderLayout();
const root = '..';
const list = document.querySelector('#job-list');

if (list) {
  const form = document.querySelector('#job-filter');
  const keyword = form.querySelector('#keyword');
  const locationInput = form.querySelector('#location');
  const category = form.querySelector('#category-id');
  const salary = form.querySelector('#salary-range');
  const total = document.querySelector('#count');
  const pagination = document.querySelector('#job-pagination');
  const sort = document.querySelector('#job-sort');
  const filterStatus = form.querySelector('#filter-status');
  const params = new URLSearchParams(window.location.search);
  const PAGE_SIZE = 3;
  let results = [];
  let loadError = '';
  let requestSeq = 0;
  let loading = false;
  let currentPage = 1;

  keyword.value = params.get('q') || params.get('keyword') || '';
  locationInput.value = params.get('location') || '';
  const selectedCategory = params.get('category_id') || '';
  for (const input of form.querySelectorAll('input[type="checkbox"]')) {
    const queryNames = { jobType: 'job_type', workMode: 'work_mode', experience: 'experience' };
    input.checked = params.getAll(queryNames[input.name]).includes(input.value);
  }
  salary.value = params.get('salary_min') || '';
  fillCategories(category, selectedCategory).catch(error => { filterStatus.textContent = error.message; });

  function selectedValues(name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
  }

  function readFilters(categoryId = category.value) {
    return {
      q: keyword.value.trim(),
      location: locationInput.value.trim(),
      category_id: categoryId,
      job_type: selectedValues('jobType'),
      experience: selectedValues('experience'),
      work_mode: selectedValues('workMode'),
      salary_min: salary.value,
    };
  }

  async function load(filters) {
    const seq = ++requestSeq;
    loading = true;
    total.textContent = 'Đang tải việc làm…';
    list.replaceChildren();
    pagination.replaceChildren();
    loadError = '';
    try {
      const matches = await jobs(filters);
      if (seq !== requestSeq) return;
      results = matches;
    } catch (error) {
      if (seq !== requestSeq) return;
      results = [];
      loadError = error.message;
    }
    loading = false;
    renderJobs();
  }

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
    let matches = results;
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
    currentPage = 1;
    const filters = readFilters();
    const search = new URLSearchParams();
    for (const [key, selected] of Object.entries(filters)) {
      for (const value of Array.isArray(selected) ? selected : [selected]) {
        if (value) search.append(key, value);
      }
    }
    const query = search.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : ''));
    filterStatus.textContent = 'Đã áp dụng bộ lọc.';
    load(filters);
  });
  sort.addEventListener('change', () => { currentPage = 1; renderJobs(); });
  document.querySelector('#clear-filters').addEventListener('click', () => {
    form.reset();
    keyword.value = '';
    locationInput.value = '';
    category.value = '';
    salary.value = '';
    for (const input of form.querySelectorAll('input[type="checkbox"]')) input.checked = false;
    currentPage = 1;
    window.history.replaceState(null, '', window.location.pathname);
    filterStatus.textContent = 'Đã xóa bộ lọc.';
    load(readFilters());
  });
  load(readFilters(selectedCategory));
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
    container.hidden = false;
    document.title = `${job.title} — Job Portal`;
    detail.querySelector('.detail-job-title').textContent = job.title;
    detail.querySelector('.detail-job-company').textContent = job.company;
    detail.querySelector('.detail-job-meta').textContent = `${job.category} · ${job.type} · ${job.salary} · ${job.location}`;
    detail.querySelector('.job-card__time, .tag').textContent = job.time;
    document.querySelector('#job-description').textContent = job.description;
    const tags = document.getElementById('detail-tags');
    for (const label of [job.type, job.workMode, job.category]) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = label;
      tags.append(tag);
    }
    container.querySelector('.overview-title').textContent = job.title;
    document.querySelector('.overview-type').textContent = job.type;
    document.querySelector('.overview-category').textContent = job.category;
    document.querySelector('.overview-experience').textContent = job.experience;
    container.querySelector('.overview-location').textContent = job.location;
    container.querySelector('.overview-salary').textContent = job.salary;
    const applyLink = document.querySelector('#apply-job-link');
    if (job.is_expired || job.job_status !== 'open') {
      applyLink.removeAttribute('href');
      applyLink.textContent = job.is_expired ? 'Tin đã hết hạn' : 'Tin đã đóng';
    } else {
      applyLink.href = `apply.html?jobId=${encodeURIComponent(job.id)}`;
    }
    const related = document.querySelector('#related-jobs');
    try{const others=await jobs(job.category_id==null?{}:{category_id:job.category_id}, {limit:4,all:false});related.replaceChildren(...others.filter(j=>j.id!==job.id).slice(0,3).map(j=>jobCard(j,root)));}catch(e){related.textContent=e.message;}

  }
}
