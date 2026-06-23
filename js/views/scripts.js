import { getScripts, saveScript, deleteScript } from '../store.js';
import { showTaperSheet, showEditTaperSheet } from '../components/modals.js';

export async function renderScripts() {
  const el = document.getElementById('view-scripts');
  const scripts = await getScripts();

  if (!scripts.length) {
    el.innerHTML = `<div class="empty"><div class="icon">📋</div><p>No scripts yet.<br>Add your first medication in the <strong>Add</strong> tab.</p></div>`;
    return;
  }

  let html = `<p class="section-head">Your Scripts (${scripts.length})</p>`;
  for (const s of scripts) {
    const exp = s.expiryDate ? new Date(s.expiryDate) : null;
    const daysLeft = exp ? Math.ceil((exp - Date.now()) / 86400000) : null;
    const expClass = daysLeft !== null && daysLeft <= 7 ? 'color:var(--warn)' : 'color:var(--text-muted)';

    html += `<div class="card script-card">
      <div class="row">
        <div class="card-title">${s.name}</div>
        ${s.brandName ? `<span class="chip">${s.brandName}</span>` : ''}
      </div>
      <div class="card-sub mt">${s.dose || '—'}</div>
      ${s.doctor ? `<div class="card-sub">Dr ${s.doctor}</div>` : ''}
      ${exp ? `<div class="card-sub mt" style="${expClass}">Expiry: ${exp.toLocaleDateString('en-AU')}${daysLeft <= 7 ? ' ⚠️' : ''}</div>` : ''}
      ${s.repeatsRemaining !== undefined ? `<div class="card-sub">Repeats remaining: ${s.repeatsRemaining}</div>` : ''}
      ${s.taperNotes ? `<div class="taper-badge" onclick="window._viewTaper('${s.id}')">⚠️ Tapering — tap to view</div>` : ''}
      <div class="script-actions">
        <button class="script-btn" onclick="window._editTaper('${s.id}')">✏️ Taper notes</button>
        <button class="script-btn danger" onclick="window._deleteScript('${s.id}')">🗑 Delete</button>
      </div>
    </div>`;
  }
  el.innerHTML = html;

  window._viewTaper = async id => {
    const scripts = await getScripts();
    const s = scripts.find(x => x.id === id);
    showTaperSheet(s?.taperNotes);
  };
  window._showTaper = window._viewTaper;

  window._editTaper = async id => {
    const scripts = await getScripts();
    const s = scripts.find(x => x.id === id);
    showEditTaperSheet(s, async newText => {
      s.taperNotes = newText;
      await saveScript(s);
      renderScripts();
    });
  };

  window._deleteScript = async id => {
    if (confirm('Delete this medication?')) {
      await deleteScript(id);
      renderScripts();
    }
  };
}
