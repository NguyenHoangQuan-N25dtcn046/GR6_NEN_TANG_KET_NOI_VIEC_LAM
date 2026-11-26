// Chuyển trang nhẹ cho MPA, không thay đổi URL hoặc routing hiện tại.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);
    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== current.origin) return;
    if (destination.pathname === current.pathname && destination.search === current.search && destination.hash) return;
    event.preventDefault();
    document.body.classList.add('page-leaving');
    window.setTimeout(() => { window.location.assign(destination.href); }, 170);
  });
}
// Phục hồi trạng thái nếu browser dùng back/forward cache.
window.addEventListener('pageshow', () => document.body.classList.remove('page-leaving'));
