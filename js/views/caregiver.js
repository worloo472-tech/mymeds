import { getScripts, getDoses, getSetting, setSetting } from '../store.js';

export async function renderCaregiver() {
  const el = document.getElementById('view-caregiver');
  const scripts = await getScripts();
  const doses = await getDoses();
  const today = new Date().toDateString();
  const todayDoses = doses.filter(d => new Date(d.ts).toDateString() === today);

  // Load saved caregiver contact
  const savedContact = await getSetting('caregiver_contact') || { name: '', phone: '' };

  let html = `<div class="carer-header">
    <h2>👁️ Caregiver View</h2>
    <p>Read-only snapshot — ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
  </div>

  <!-- Default contact setup -->
  <div class="card carer-contact-card">
    <div class="carer-contact-label">📬 Default contact to send snapshot to</div>
    <div class="carer-contact-row">
      <input id="carer-contact-name" class="carer-input" type="text" placeholder="Name (e.g. Jane)" value="${savedContact.name || ''}" />
      <input id="carer-contact-phone" class="carer-input" type="tel" placeholder="Phone number" value="${savedContact.phone || ''}" />
    </div>
    <button class="carer-save-btn" onclick="window._saveCaregiverContact()">💾 Save contact</button>
  </div>

  <!-- Send button -->
  <button class="share-btn" onclick="window._shareSnapshot()">
    ${savedContact.name ? `📤 Send to ${savedContact.name}` : '📤 Share snapshot as text'}
  </button>`;

  if (!scripts.length) {
    html += `<div class="empty"><p>No medications on file.</p></div>`;
    el.innerHTML = html;
    bindCaregiverHandlers(scripts, todayDoses);
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

    const nameDisplay = s.brandName
      ? `${s.brandName} <span style="font-weight:400;font-size:0.82rem;color:var(--text-muted)">(${s.name})</span>`
      : s.name;

    html += `<div class="card">
      <div class="row">
        <div class="card-title">${nameDisplay}</div>
        <span class="status-pill ${allTaken ? 'taken' : anyTaken ? 'taken' : 'pending'}">${allTaken ? 'All taken' : anyTaken ? 'Partial' : 'Pending'}</span>
      </div>
      <div class="card-sub">${s.dose || ''}</div>
      ${s.taperNotes ? `<div class="taper-badge" style="cursor:default">⚠️ Tapering schedule active</div>` : ''}
    </div>`;
  }

  el.innerHTML = html;
  bindCaregiverHandlers(scripts, todayDoses);
}

function bindCaregiverHandlers(scripts, todayDoses) {
  window._saveCaregiverContact = async () => {
    const name = document.getElementById('carer-contact-name')?.value.trim() || '';
    const phone = document.getElementById('carer-contact-phone')?.value.trim() || '';
    await setSetting('caregiver_contact', { name, phone });
    // Update share button label
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) shareBtn.textContent = name ? `📤 Send to ${name}` : '📤 Share snapshot as text';
    alert(name ? `Contact saved — ${name}` : 'Contact cleared');
  };

  window._shareSnapshot = async () => {
    const contact = await getSetting('caregiver_contact') || { name: '', phone: '' };
    const lines = [`MyMeds Snapshot — ${new Date().toLocaleString('en-AU')}`, ''];

    for (const s of scripts) {
      const times = s.times || ['morning'];
      const BUCKET_KEYS = ['morning', 'midday', 'evening', 'night'];
      const activeBuckets = BUCKET_KEYS.filter(b => times.includes(b));
      const displayName = s.brandName ? `${s.brandName} (${s.name})` : s.name;
      lines.push(`💊 ${displayName} — ${s.dose || ''}`);
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

    // If we have a saved phone number, open SMS with pre-filled number and message
    if (contact.phone) {
      const encoded = encodeURIComponent(text);
      // sms: URI works on both iOS and Android
      window.location.href = `sms:${contact.phone}?body=${encoded}`;
      return;
    }

    // Fallback — native share sheet or clipboard
    try {
      await navigator.share({ title: 'MyMeds Snapshot', text });
    } catch {
      await navigator.clipboard.writeText(text);
      alert('Snapshot copied to clipboard!');
    }
  };
}
