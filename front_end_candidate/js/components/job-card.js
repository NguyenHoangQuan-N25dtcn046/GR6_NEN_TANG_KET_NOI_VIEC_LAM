import { api, normalizeJob, token } from '../api.js';

let savedJobsRequest;

export function savedJobs() {
  if (!savedJobsRequest) {
    savedJobsRequest = api('/candidate/saved-jobs', { auth: true })
      .then(items => new Map(items.map(job => [job.id, normalizeJob(job)])))
      .catch(error => { savedJobsRequest = null; throw error; });
  }
  return savedJobsRequest;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function jobCard(job, root = '.', onRemoved) {
  const article = element('article', 'job-card');
  article.dataset.jobId = String(job.id);
  const time = element('span', 'tag job-card__time', job.time);
  const bookmark = element('button', 'bookmark');
  bookmark.type = 'button';
  const feedback = element('p', 'bookmark-status');
  feedback.setAttribute('role', 'status');
  feedback.hidden = true;
  let saved = false;

  function updateBookmark() {
    bookmark.textContent = saved ? '★' : '☆';
    bookmark.setAttribute('aria-pressed', String(saved));
    bookmark.setAttribute('aria-label', (saved ? 'Bỏ lưu ' : 'Lưu ') + job.title);
  }
  function showError(error) {
    feedback.textContent = error.message;
    feedback.hidden = false;
  }
  updateBookmark();
  if (token()) {
    bookmark.disabled = true;
    savedJobs().then(items => {
      saved = items.has(job.id);
      updateBookmark();
    }).catch(showError).finally(() => { bookmark.disabled = false; });
  }
  bookmark.addEventListener('click', async () => {
    if (!token()) {
      window.location.href = root + '/pages/login.html';
      return;
    }
    bookmark.disabled = true;
    feedback.hidden = true;
    try {
      const items = await savedJobs();
      const remove = items.has(job.id);
      await api('/candidate/saved-jobs/' + job.id, { method: remove ? 'DELETE' : 'PUT', auth: true });
      saved = !remove;
      if (remove) items.delete(job.id);
      else items.set(job.id, job);
      updateBookmark();
      if (remove) onRemoved?.();
    } catch (error) {
      showError(error);
    } finally {
      bookmark.disabled = false;
    }
  });

  const head = element('div', 'job-card__head');
  const info = document.createElement('div');
  info.append(element('h3', '', job.title), element('p', 'job-card__company', job.company));
  head.append(element('div', 'job-logo', '◈'), info);
  const bottom = element('div', 'job-card__bottom');
  const meta = element('div', 'job-meta');
  for (const value of [job.category, job.type, job.workMode, job.salary, job.location]) {
    meta.append(element('span', '', value));
  }
  const link = element('a', 'btn btn--sm', 'Xem chi tiết');
  link.href = root + '/pages/job-detail.html?id=' + encodeURIComponent(job.id);
  bottom.append(meta, link);
  article.append(time, bookmark, head, bottom, feedback);
  return article;
}
