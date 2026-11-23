'use strict';

// Dataset means transcribed from the complete-system table in the manuscript.
// Each entry is [default without loop, default with loop, ours without, ours with].
const results = {
  bridge: {
    omega: [[.204,.113,.140,.073],[.624,.381,.368,.178],[1.546,.638,1.155,.455],[3.783,1.915,4.442,.792]],
    vggt: [[1.099,.632,.912,.526],[3.903,3.039,3.677,2.408],[4.137,3.501,3.607,2.833],[17.77,14.66,11.28,5.264]],
    da3: [[.347,.229,.244,.133],[1.773,1.017,1.388,.790],[1.850,.921,1.418,.484],[4.610,3.531,3.615,1.905]]
  },
  vio: {
    omega: [[.663,.267,.287,.121],[.568,.372,.533,.258],[.784,.365,.348,.125],[28.42,28.71,5.427,5.445]],
    vggt: [[1.090,.427,.767,.309],[2.190,1.258,1.492,.951],[1.298,.511,.928,.209],[null,null,null,null]],
    da3: [[.724,.363,.389,.194],[.704,.398,.496,.315],[.955,.355,.685,.163],[28.68,30.17,3.600,3.232]]
  }
};
const datasets = ['EuRoC','Aria','ScaRF','Spires'];
const names = { bridge:'VGGT-Bridge', vio:'FoundationVIO', omega:'VGGT-Ω', vggt:'VGGT', da3:'DA3' };
const format = value => value === null ? 'fail' : value.toFixed(3);

function renderResults() {
  const value = name => document.querySelector(`input[name="${name}"]:checked`).value;
  const system = value('system'), backbone = value('backbone'), loop = value('loop');
  const offset = loop === 'with' ? 1 : 0;
  const rows = results[system][backbone].map((entry,i) => ({dataset:datasets[i], baseline:entry[offset], ours:entry[2+offset]}));
  const max = Math.max(...rows.flatMap(row => [row.baseline || 0,row.ours || 0]));
  const title = `${names[system]} · ${names[backbone]} · ${loop === 'with' ? 'With' : 'Without'} loop closure`;
  const metric = `${system === 'bridge' ? 'Sim(3)' : 'SE(3)'} ATE RMSE (m)`;
  document.querySelector('#chart-title').textContent = title;
  document.querySelector('#chart-metric').textContent = metric;
  document.querySelector('#table-caption').textContent = `${title} — ${metric}`;
  document.querySelector('#result-bars').innerHTML = rows.map(row => {
    if (row.baseline === null) return `<div class="chart-row"><span class="chart-dataset">${row.dataset}</span><span class="failure">Both weightings failed on at least one sequence.</span><span class="reduction">—</span></div>`;
    const reduction = (1-row.ours/row.baseline)*100;
    const improvement = reduction >= 0;
    const label = `${row.dataset}: default ${format(row.baseline)} meters, FoundationCov ${format(row.ours)} meters, ${Math.abs(reduction).toFixed(1)} percent ${improvement ? 'lower' : 'higher'} error`;
    return `<div class="chart-row" role="group" aria-label="${label}"><span class="chart-dataset">${row.dataset}</span><div class="bar-pair" aria-hidden="true"><div class="bar-line"><div class="bar" style="width:${row.baseline/max*82}%"></div><span class="bar-value">${format(row.baseline)}</span></div><div class="bar-line"><div class="bar ours" style="width:${row.ours/max*82}%"></div><span class="bar-value">${format(row.ours)}</span></div></div><span class="reduction" aria-hidden="true">${Math.abs(reduction).toFixed(1)}%<small>${improvement ? 'lower error' : 'higher error'}</small></span></div>`;
  }).join('');
  document.querySelector('#result-table').innerHTML = rows.map(row => {
    const change = row.baseline === null ? 'Not available' : `${((1-row.ours/row.baseline)*100).toFixed(1)}%`;
    return `<tr><th scope="row">${row.dataset}</th><td>${format(row.baseline)}</td><td>${format(row.ours)}</td><td>${change}</td></tr>`;
  }).join('');
}
document.querySelectorAll('.results-controls input').forEach(input => input.addEventListener('change', renderResults));
renderResults();

// Accessible tabs support pointer interaction and standard keyboard navigation.
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function select(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
      if (event.key === 'ArrowLeft') next = (index-1+tabs.length)%tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length-1;
      if (next !== undefined) { event.preventDefault(); select(tabs[next]); tabs[next].focus(); }
    });
  });
});

const slider = document.querySelector('#map-slider');
slider.addEventListener('input', () => {
  document.querySelector('.image-comparison').style.setProperty('--split',`${slider.value}%`);
  document.querySelector('#map-position').value = `${slider.value}%`;
  slider.setAttribute('aria-valuetext',`${slider.value} percent FoundationCov visible`);
});

const themeButton = document.querySelector('.theme-toggle');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute('aria-label',`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0c1110' : '#fafcfb';
}
try { const stored = localStorage.getItem('foundationcov-theme'); if (stored === 'light' || stored === 'dark') applyTheme(stored); } catch {}
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('foundationcov-theme',theme); } catch {}
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open navigation'); }
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',`${open ? 'Close' : 'Open'} navigation`);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const dialog = document.querySelector('#figure-dialog');
let previousFocus;
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  previousFocus = button;
  const image = document.querySelector('#dialog-image');
  image.src = button.dataset.zoom;
  image.alt = button.querySelector('img').alt;
  document.querySelector('#dialog-caption').textContent = button.dataset.caption;
  dialog.showModal();
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click',event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
dialog.addEventListener('close', () => previousFocus?.focus());

const navLinks = [...nav.querySelectorAll('a')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active',link.hash === `#${entry.target.id}`));
}, {rootMargin:'-15% 0px -55% 0px',threshold:0});
navLinks.forEach(link => observer.observe(document.querySelector(link.hash)));
