import { getScripts, saveScript, getCollections, saveCollection } from '../store.js';

export async function renderCollect() {
  const el = document.getElementById('view-repeats');
  const scripts = await getScripts();
  const collections = await getCollections();

  if (!scripts.length) {
    el.innerHTML = `<div class="empty"><div class="icon">🔁</div><p>No scripts to track repeats for.</p></div>`;
    return;
  }

  let html = `<p class="section-head">Repeats & Collection</p>`;

  for (const s of scripts) {
    const remaining = s.repeatsRemaining ?? s.repeats ?? 0;
    const isLow = remaining <= 1;
    const exp = s.expiryDate ? new Date(s.expiryDate) : null;
    const daysLeft = exp ? Math.ceil((exp - Date.now()) / 86400000) : null;

    const smsBody = encodeURIComponent(`Hi, I'd like to order a repeat for ${s.name}${s.brandName ? ` (${s.brandName})` : ''}. Repeats remaining: ${remaining}.`);

    html += `<div class="card repeat-card">
      <div class="repeat-badge${isLow ? ' low' : ''}">${remaining} repeat${remaining !== 1 ? 's' : ''} left</div>
      <div class="card-title">${s.name}</div>
      ${s.brandName ? `<div class="card-sub">${s.brandName}</div>` : ''}
      ${s.dose ? `<div class="card-sub">${s.dose}</div>` : ''}
      ${s.doctor ? `<div class="card-sub">Dr ${s.doctor}</div>` : ''}
      ${exp ? `<div class="card-sub mt" style="${daysLeft <= 14 ? 'color:var(--warn)' : 'color:var(--text-muted)'}">Script expires: ${exp.toLocaleDateString('en-AU')}${daysLeft <= 14 ? ' ⚠️' : ''}</div>` : ''}
      <div id="collect-confirm-${s.id}" style="display:none" class="collect-confirm-row">
        <span class="collect-confirm-msg">Confirm collection logged?</span>
        <button class="collect-confirm-btn yes" onclick="window._confirmCollection('${s.id}')">✅ Yes</button>
        <button class="collect-confirm-btn no" onclick="window._cancelCollection('${s.id}')">✕ No</button>
      </div>
      <button class="collect-btn" id="collect-btn-${s.id}" onclick="window._logCollection('${s.id}')">✅ Log collection</button>
      ${isLow ? `<a href="sms:?body=${smsBody}" style="display:block;text-align:center;margin-top:8px;font-size:0.8rem;color:var(--accent)">📱 SMS pharmacy reminder</a>` : ''}
    </div>`;
  }

  const recent = [...collections].sort((a, b) => b.ts - a.ts).slice(0, 10);
  if (recent.length) {
    html += `<p class="section-head">Collection History</p>`;
    for (const c of recent) {
      html += `<div class="card"><div class="card-title">${c.scriptName}</div><div class="card-sub">${new Date(c.ts).toLocaleString('en-AU')}</div></div>`;
    }
  }

  el.innerHTML = html;

  window._logCollection = id => {
    document.getElementById(`collect-btn-${id}`).style.display = 'none';
    document.getElementById(`collect-confirm-${id}`).style.display = 'flex';
  };

  window._cancelCollection = id => {
    document.getElementById(`collect-confirm-${id}`).style.display = 'none';
    document.getElementById(`collect-btn-${id}`).style.display = 'block';
  };

  window._confirmCollection = async id => {
    const s = scripts.find(x => x.id === id);
    if (!s) return;
    s.repeatsRemaining = Math.max(0, (s.repeatsRemaining ?? s.repeats ?? 0) - 1);
    await saveScript(s);
    await saveCollection({ id: `col_${Date.now()}`, scriptId: id, scriptName: s.name, ts: Date.now() });
    renderCollect();
  };
}
