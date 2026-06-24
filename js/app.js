import { initDB, getScripts, saveScript, getSetting, setSetting } from './store.js';
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

// Auto-fill expiry date to 1 year after prescribed date
function initPrescribedDateAutoFill() {
  const prescribedInput = document.getElementById('prescribed-date-input');
  const expiryInput = document.getElementById('expiry-date-input');
  if (prescribedInput && expiryInput) {
    prescribedInput.addEventListener('change', () => {
      if (prescribedInput.value && !expiryInput.value) {
        const d = new Date(prescribedInput.value);
        d.setFullYear(d.getFullYear() + 1);
        expiryInput.value = d.toISOString().split('T')[0];
      }
    });
  }
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
      prescribedDate: f.prescribedDate.value || null,
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

// Show onboarding screen on very first launch
async function checkOnboarding() {
  const seen = await getSetting('onboarding_done');
  if (!seen) {
    document.getElementById('onboarding-screen').style.display = 'flex';
    document.getElementById('onboard-start-btn').addEventListener('click', async () => {
      await setSetting('onboarding_done', true);
      document.getElementById('onboarding-screen').style.display = 'none';
    });
    return true; // onboarding shown, skip rest of init until dismissed
  }
  return false;
}

async function init() {
  await initDB();

  // Show onboarding on very first launch
  const onboardingShown = await checkOnboarding();
  if (onboardingShown) {
    // After they dismiss onboarding, complete the rest of init
    document.getElementById('onboard-start-btn').addEventListener('click', async () => {
      initPin();
      initModals();
      await checkPin();
      initTabs();
      initAddForm();
      initPrescribedDateAutoFill();
      document.getElementById('lock-btn').addEventListener('click', lockApp);
      switchTab('today');
    }, { once: true });
    return;
  }

  initPin();
  initModals();
  await checkPin();
  initTabs();
  initAddForm();
  initPrescribedDateAutoFill();
  document.getElementById('lock-btn').addEventListener('click', lockApp);

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.register('/mymeds/sw.js').catch(console.error);
    if (reg) {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version of the app is available
            const reload = confirm(
              'MyMeds has been updated with new features.\n\nTap OK to reload and use the latest version.\n\n(Your medication data is safe — it stays on this device.)'
            );
            if (reload) window.location.reload();
          }
        });
      });
    }
  }

  switchTab('today');
}

init();
