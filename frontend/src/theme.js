const KEY = 'sd_theme';

function systemPref() {
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getTheme() {
  return localStorage.getItem(KEY) || systemPref();
}

export function setTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(KEY, theme);
}

export function initTheme() {
  setTheme(getTheme());
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function watchSystemChanges() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const stored = localStorage.getItem(KEY);
    if (!stored) setTheme(systemPref());
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
