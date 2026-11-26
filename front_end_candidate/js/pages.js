import {renderLayout} from './components/layout.js';
import {demoJobs, demoJobDetails, jobCard} from './components/job-card.js';

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
  const salaryInput = form.querySelector('#salary-range');
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
      keyword: normalizeText(keyword.value),
      location: normalizeText(locationInput.value),
      categories: selectedValues('category'),
      types: selectedValues('jobType'),
      experiences: selectedValues('experience'),
      workModes: selectedValues('workMode'),
      minSalary: salaryInput.value ? Number(salaryInput.value) : 0
    };
  }
  function filterJobs(filters) {
    return demoJobs.filter(job => {
      const matchKeyword = !filters.keyword || normalizeText(`${job.title} ${job.company} ${job.category}`).includes(filters.keyword);
      const matchLocation = !filters.location || normalizeText(job.location).includes(filters.location);
      const matchCategory = !filters.categories.length || filters.categories.includes(job.category);
      const matchType = !filters.types.length || filters.types.includes(job.type);
      const matchExperience = !filters.experiences.length || filters.experiences.some(group => {
        const years = job.experienceYears;
        return group === '0-1' ? years <= 1 : group === '2-3' ? years >= 2 && years <= 3 : years >= 4;
      });
      const matchMode = !filters.workModes.length || filters.workModes.includes(job.workMode);
      // Việc làm phải có mức lương tối thiểu đạt ngưỡng được chọn.
      const matchSalary = !filters.minSalary || job.salaryMin >= filters.minSalary;
      return matchKeyword && matchLocation && matchCategory && matchType && matchExperience && matchMode && matchSalary;
    });
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
    renderJobs();
  });
  sort.addEventListener('change', () => { currentPage = 1; renderJobs(); });
  document.querySelector('#clear-filters').addEventListener('click', () => {
    form.reset();
    keyword.value = '';
    locationInput.value = '';
    appliedFilters = readFilters();
    currentPage = 1;
    window.history.replaceState(null, '', window.location.pathname);
    filterStatus.textContent = 'Đã xóa bộ lọc.';
    renderJobs();
  });
  // Có thể đến trang Jobs từ thanh tìm kiếm ở Homepage qua query string.
  appliedFilters = readFilters();
  renderJobs();
}

const detail = document.querySelector('#detail-job');
if (detail) {
  const id = new URLSearchParams(window.location.search).get('id');
  const job = demoJobs.find(item => String(item.id) === id);
  const container = document.querySelector('.job-detail-grid');
  const notFound = document.querySelector('#job-not-found');
  if (!job) {
    container.hidden = true;
    notFound.hidden = false;
    document.title = 'Không tìm thấy công việc — Job Portal';
  } else {
    const content = demoJobDetails[job.id];
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
    related.replaceChildren(...demoJobs.filter(j => j.id !== job.id && j.category === job.category).concat(demoJobs.filter(j => j.id !== job.id && j.category !== job.category)).slice(0,3).map(j => jobCard(j,root)));
  }
}

for (const form of document.querySelectorAll('.demo-form')) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    form.querySelector('.form-status').textContent = 'Giao diện mẫu: chưa kết nối API, chưa gửi dữ liệu.';
  });
}
