import { initDB, getScripts, saveScript } from './store.js';
import { checkPin, initPin, lockApp } from './components/pin.js';
import { initModals } from './components/modals.js';
import { renderToday } from './views/today.js';
import { renderScripts } from './views/scripts.js';
import { renderTracker } from './views/tracker.js';
import { renderCollect } from './views/collect.js';
import { renderCaregiver } from './views/caregiver.js';

const TABS = ['today', 'scripts', 'doses', 'repeats', 'add', 'caregiver'];
let activeTab = 'today';

async function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${tab}`)?.classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

  if (tab === 'today') await renderToday();
  if (tab === 'scripts') await renderScripts();
  if (tab === 'doses') await renderTracker();
  if (tab === 'repeats') await renderCollect();
  if (tab === 'caregiver') await renderCaregiver();
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function initAddForm() {
  document.getElementById('taper-toggle').addEventListener('change', e => {
    document.getElementById('taper-area').style.display = e.target.checked ? 'block' : 'none';
  });

  document.getElementById('add-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const times = [...f.querySelectorAll('input[name=times]:checked')].map(x => x.value);
    const repeats = parseInt(f.repeats.value) || 0;
    const used = parseInt(f.repeatsUsed.value) || 0;
    const script = {
      id: `s_${Date.now()}`,
      name: f.medName.value.trim(),
      brandName: f.brandName.value.trim(),
      dose: f.dose.value.trim(),
      repeats,
      repeatsUsed: used,
      repeatsRemaining: Math.max(0, repeats - used),
      expiryDate: f.expiryDate.value || null,
      doctor: f.doctor.value.trim(),
      notes: f.notes.value.trim(),
      taperNotes: f.querySelector('#taper-toggle').checked ? f.taperNotes.value.trim() : '',
      times: times.length ? times : ['morning'],
      createdAt: Date.now()
    };
    await saveScript(script);
    f.reset();
    document.getElementById('taper-area').style.display = 'none';
    alert(`${script.name} saved!`);
    switchTab('scripts');
  });
}

async function init() {
  await initDB();
  initPin();
  initModals();
  await checkPin();
  initTabs();
  initAddForm();
  document.getElementById('lock-btn').addEventListener('click', lockApp);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/mymeds/sw.js').catch(console.error);
  }
  switchTab('today');
}

init();
