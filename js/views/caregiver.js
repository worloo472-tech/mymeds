import { getScripts, getDoses } from '../store.js';

export async function renderCaregiver() {
  const el = document.getElementById('view-caregiver');
  const scripts = await getScripts();
  const doses = await getDoses();
  const today = new Date().toDateString();
  const todayDoses = doses.filter(d => new Date(d.ts).toDateString() === today);

  let html = `<div class="carer-header">
    <h2>👁️ Caregiver View</h2>
    <p>Read-only snapshot — ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
  </div>
  <button class="share-btn" onclick="window._shareSnapshot()">📤 Share snapshot as text</button>`;

  if (!scripts.length) {
    html += `<div class="empty"><p>No medications on file.</p></div>`;
    el.innerHTML = html;
    return;
  }

  html += `<p class="section-head">Medications</p>`;
  for (const s of scripts) {
    const times = s.times || ['morning'];
    const BUCKET_KEYS = ['morning', 'midday', 'evening', 'night'];
    const activeBuckets = BUCKET_KEYS.filter(b => times.includes(b));
    const statuses = activeBuckets.map(b => {
      const key = `${s.id}_${b}`;
      const d = todayDoses.find(x => x.bucketKey === key);
      return d ? d.status : 'pending';
    });
    const allTaken = statuses.every(x => x === 'taken');
    const anyTaken = statuses.some(x => x === 'taken');

    html += `<div class="card">
      <div class="row">
        <div class="card-title">${s.name}</div>
        <span class="status-pill ${allTaken ? 'taken' : anyTaken ? 'taken' : 'pending'}">${allTaken ? 'All taken' : anyTaken ? 'Partial' : 'Pending'}</span>
      </div>
      <div class="card-sub">${s.dose || ''}</div>
      ${s.taperNotes ? `<div class="taper-badge" style="cursor:default">⚠️ Tapering schedule active</div>` : ''}
    </div>`;
  }

  el.innerHTML = html;

  window._shareSnapshot = async () => {
    const lines = [`MyMeds Snapshot — ${new Date().toLocaleString('en-AU')}`, ''];
    for (const s of scripts) {
      const times = s.times || ['morning'];
      const BUCKET_KEYS = ['morning', 'midday', 'evening', 'night'];
      const activeBuckets = BUCKET_KEYS.filter(b => times.includes(b));
      lines.push(`💊 ${s.name}${s.brandName ? ` (${s.brandName})` : ''} — ${s.dose || ''}`);
      for (const b of activeBuckets) {
        const key = `${s.id}_${b}`;
        const d = todayDoses.find(x => x.bucketKey === key);
        const status = d ? (d.status === 'taken' ? '✅' : '❓') : '⬜';
        lines.push(`  ${status} ${b.charAt(0).toUpperCase() + b.slice(1)}`);
      }
      if (s.repeatsRemaining !== undefined) lines.push(`  Repeats left: ${s.repeatsRemaining}`);
      lines.push('');
    }
    const text = lines.join('\n');
    try {
      await navigator.share({ title: 'MyMeds Snapshot', text });
    } catch {
      await navigator.clipboard.writeText(text);
      alert('Snapshot copied to clipboard!');
    }
  };
}
