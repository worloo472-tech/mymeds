import { getScripts, getDoses, saveDose } from '../store.js';

const BUCKETS = [
  { key: 'morning', label: '🌅 Morning', time: '08:00' },
  { key: 'midday', label: '☀️ Midday', time: '12:00' },
  { key: 'evening', label: '🌆 Evening', time: '18:00' },
  { key: 'night', label: '🌙 Night', time: '21:00' }
];

export async function renderToday() {
  const el = document.getElementById('view-today');
  const scripts = await getScripts();
  const doses = await getDoses();
  const today = new Date().toDateString();

  if (!scripts.length) {
    el.innerHTML = `<div class="empty"><div class="icon">💊</div><p>No medications added yet.<br>Go to <strong>Add</strong> to add your first script.</p></div>`;
    return;
  }

  const todayDoses = doses.filter(d => new Date(d.ts).toDateString() === today);

  let html = `<p class="section-head">Today — ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>`;

  for (const s of scripts) {
    const times = s.times || ['morning'];
    const activeBuckets = BUCKETS.filter(b => times.includes(b.key));
    // Show brand name first (what most people know), pharmaceutical beneath
    const nameHtml = s.brandName
      ? `<div class="today-med-name">${s.brandName} <span style="font-weight:400;font-size:0.82rem;color:var(--text-muted)">${s.name}</span></div>`
      : `<div class="today-med-name">${s.name}</div>`;

    html += `<div class="today-med-card">
      ${nameHtml}
      <div class="today-med-dose">${s.dose || ''}</div>
      ${s.taperNotes ? `<div class="taper-badge" onclick="window._showTaper('${s.id}')">⚠️ Tapering — tap to view</div>` : ''}
      <div class="quick-btns mt">`;
    for (const b of activeBuckets) {
      const key = `${s.id}_${b.key}`;
      const taken = todayDoses.find(d => d.bucketKey === key);
      html += `<button class="quick-btn${taken ? ' done' : ''}" onclick="window._logDose('${s.id}','${b.key}','taken')">${b.label}${taken ? ' ✓' : ''}</button>`;
    }
    html += `</div></div>`;
  }

  el.innerHTML = html;

  window._logDose = async (scriptId, bucketKey, status) => {
    const key = `${scriptId}_${bucketKey}`;
    const existing = todayDoses.find(d => d.bucketKey === key);
    if (existing) return;
    await saveDose({ id: `${key}_${Date.now()}`, bucketKey: key, status, ts: Date.now() });
    renderToday();
  };
}
