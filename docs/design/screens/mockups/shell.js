/* Maquetas: inyecta la navegación del administrador y gestiona los estados de demostración. */
const ICONS = {
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12M3.3 7 12 12l8.7-5"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  store: '<path d="m3 9 1.5-5h15L21 9"/><path d="M4 9v11h16V9M3 9h18M10 20v-5h4v5"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  power: '<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A16.9 16.9 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
};
const icon = (name, size) =>
  `<svg viewBox="0 0 24 24" width="${size || 18}" height="${size || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

/* Navegación del administrador (la del operador solo muestra Productos e Historial). */
const NAV = [
  ['companias', 'Compañías', 'building'],
  ['usuarios', 'Usuarios', 'users'],
  ['roles', 'Roles', 'shield'],
  ['catalogo', 'Catálogo', 'box'],
  ['historial', 'Historial', 'history'],
];

function mountShell() {
  const host = document.querySelector('[data-shell]');
  if (!host) return;
  const active = host.dataset.shell;
  host.innerHTML = `
    <div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>Argos</span></div>
    ${NAV.map(([id, label, ic]) =>
      `<a class="nav-item" href="index.html"${id === active ? ' aria-current="page"' : ''}>${icon(ic, 19)}<span>${label}</span></a>`).join('')}`;
}

/* Barra de estados: <div class="demo-bar" data-states="login,error,bloqueado"> con botones generados. */
function mountDemoBar() {
  const bar = document.querySelector('[data-demo-bar]');
  if (!bar) return;
  document.body.classList.add('has-demo-bar');
  const states = [...document.querySelectorAll('[data-state]')];
  /* data-state admite varios estados separados por espacio: data-state="activo bloqueado". */
  const has = (s, name) => s.dataset.state.split(' ').includes(name);
  const names = [...new Set(states.flatMap((s) => s.dataset.state.split(' ')))];
  bar.innerHTML = names.map((n) => `<button type="button" data-set="${n}" aria-pressed="false">${n.replace(/-/g, ' ')}</button>`).join('');
  const set = (name) => {
    states.forEach((s) => { s.hidden = !has(s, name); });
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === name)));
    window.dispatchEvent(new CustomEvent('demo-state', { detail: name }));
  };
  bar.addEventListener('click', (e) => { const b = e.target.closest('[data-set]'); if (b) set(b.dataset.set); });
  window.demoSet = set;
  set(bar.dataset.initial || names[0]);
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-icon]').forEach((el) => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, +el.dataset.size || 18)); });
  mountShell();
  mountDemoBar();
});
