import { getSetting, setSetting } from '../store.js';

let pinEntry = '';
let resolvePin;

export async function checkPin() {
  const stored = await getSetting('pin');
  if (!stored) {
    // No PIN set — prompt to create one
    return new Promise(res => {
      resolvePin = res;
      showPinScreen('create');
    });
  }
  return new Promise(res => {
    resolvePin = res;
    showPinScreen('enter');
  });
}

function showPinScreen(mode) {
  const el = document.getElementById('pin-screen');
  const title = el.querySelector('h1');
  const sub = el.querySelector('p');
  title.textContent = mode === 'create' ? 'Set Your PIN' : 'MyMeds';
  sub.textContent = mode === 'create' ? 'Choose a 4-digit PIN to protect your data' : 'Enter your PIN to continue';
  el.style.display = 'flex';
  pinEntry = '';
  updateDots();
}

export function initPin() {
  const pad = document.getElementById('pin-pad');
  pad.addEventListener('click', async e => {
    const btn = e.target.closest('.pin-btn');
    if (!btn) return;
    const val = btn.dataset.val;
    if (val === 'del') {
      pinEntry = pinEntry.slice(0, -1);
    } else if (pinEntry.length < 4) {
      pinEntry += val;
    }
    updateDots();
    if (pinEntry.length === 4) {
      await handlePin();
    }
  });
}

function updateDots() {
  document.querySelectorAll('.pin-dot').forEach((d, i) => {
    d.classList.toggle('filled', i < pinEntry.length);
  });
}

async function handlePin() {
  const stored = await getSetting('pin');
  if (!stored) {
    // Creating PIN
    await setSetting('pin', pinEntry);
    hidePinScreen();
    resolvePin(true);
  } else {
    if (pinEntry === stored) {
      hidePinScreen();
      resolvePin(true);
    } else {
      document.getElementById('pin-error').textContent = 'Incorrect PIN — try again';
      pinEntry = '';
      updateDots();
    }
  }
}

function hidePinScreen() {
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('pin-error').textContent = '';
}

export async function lockApp() {
  const stored = await getSetting('pin');
  if (stored) {
    pinEntry = '';
    updateDots();
    showPinScreen('enter');
  }
}
