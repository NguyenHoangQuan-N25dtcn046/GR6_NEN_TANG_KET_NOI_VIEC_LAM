import { renderLayout } from './components/layout.js';
import { jobCard, savedJobs } from './components/job-card.js';

renderLayout();

const list = document.querySelector('#job-list');
const status = document.querySelector('#saved-job-status');

try {
  const jobs = await savedJobs();
  function render() {
    status.textContent = jobs.size ? '' : 'Bạn chưa lưu việc làm nào.';
    list.replaceChildren(...Array.from(jobs.values(), job => jobCard(job, '..', render)));
  }
  render();
} catch (error) {
  status.textContent = error.message;
}
