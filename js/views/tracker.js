import { getScripts, getDoses, saveDose } from '../store.js';

const BUCKETS = [
  { key: 'morning', label: '🌅 Morning' },
  { key: 'midday', label: '☀️ Midday' },
  { key: 'evening', label: '🌆 Evening' },
  { key: 'night', label: '🌙 Night' }
];

export async function renderTracker() {
  const el = document.getElementById('view-doses');
  const scripts = await getScripts();
  const doses = await getDoses();
  const today = new Date().toDateString();
  const todayDoses = doses.filter(d => new Date(d.ts).toDateString() === today);

  if (!scripts.length) {
    el.innerHTML = `<div class="empty"><div class="icon">📅</div><p>No medications to track yet.</p></div>`;
    return;
  }

  let html = `<p class="section-head">Dose Tracker — Today</p>`;

  for (const s of scripts) {
    const times = s.times || ['morning'];
    const activeBuckets = BUCKETS.filter(b => times.includes(b.key));
    html += `<div class="med-dose-block"><h3>${s.name}</h3><div class="bucket-grid">`;
    for (const b of activeBuckets) {
      const key = `${s.id}_${b.key}`;
      const dose = todayDoses.find(d => d.bucketKey === key);
      const status = dose?.status || null;
      const ts = dose ? new Date(dose.ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '';
      html += `<div class="bucket">
        <div class="bucket-label">${b.label}</div>
        <div class="bucket-btns">
          <button class="bucket-btn${status === 'taken' ? ' taken' : ''}" onclick="window._bucketLog('${s.id}','${b.key}','taken')">✓ Taken</button>
          <button class="bucket-btn${status === 'unsure' ? ' unsure' : ''}" onclick="window._bucketLog('${s.id}','${b.key}','unsure')">? Unsure</button>
        </div>
        ${ts ? `<div class="bucket-time">Logged ${ts}</div>` : ''}
      </div>`;
    }
    html += `</div></div>`;
  }

  el.innerHTML = html;

  window._bucketLog = async (scriptId, bucketKey, status) => {
    const key = `${scriptId}_${bucketKey}`;
    const existing = todayDoses.find(d => d.bucketKey === key);
    if (existing) {
      existing.status = status;
      await saveDose(existing);
    } else {
      await saveDose({ id: `${key}_${Date.now()}`, bucketKey: key, status, ts: Date.now() });
    }
    renderTracker();
  };
}
