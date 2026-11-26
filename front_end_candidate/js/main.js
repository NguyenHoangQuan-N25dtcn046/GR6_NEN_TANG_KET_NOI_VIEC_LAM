import { renderLayout } from './components/layout.js';
import { jobCard } from './components/job-card.js';
import { fillCategories, jobs } from './api.js';

renderLayout();

const list = document.querySelector('#recent-jobs');
const form = document.querySelector('#hero-search');
const locationInput = document.createElement('input');
locationInput.name = 'location';
locationInput.placeholder = 'Nhập địa điểm';
locationInput.setAttribute('aria-label', 'Địa điểm');
document.querySelector('#hero-location').replaceWith(locationInput);

const category = document.querySelector('#hero-category');
category.name = 'category_id';
category.replaceChildren(new Option('Tất cả ngành nghề', ''));
fillCategories(category).catch(() => { category.disabled = true; });

form.addEventListener('submit', event => {
  event.preventDefault();
  const query = new URLSearchParams();
  for (const [name, value] of new FormData(form)) if (value.trim()) query.set(name, value.trim());
  window.location.href = './pages/jobs.html?' + query;
});

try {
  const listings = await jobs({}, { limit: 5, all: false });
  list.append(...listings.map(job => jobCard(job)));
  if (!listings.length) list.textContent = 'Chưa có việc làm công khai.';
} catch (error) {
  list.textContent = error.message;
}
