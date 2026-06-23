let currentSheet = null;

export function openSheet(id) {
  closeSheet();
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); currentSheet = el; }
}

export function closeSheet() {
  if (currentSheet) { currentSheet.classList.remove('open'); currentSheet = null; }
}

export function initModals() {
  document.addEventListener('click', e => {
    if (e.target.classList.contains('overlay')) closeSheet();
    if (e.target.classList.contains('sheet-close')) closeSheet();
  });
}

export function showTaperSheet(text) {
  document.getElementById('taper-text-display').textContent = text || 'No tapering instructions saved.';
  openSheet('taper-view-overlay');
}

export function showEditTaperSheet(script, onSave) {
  const ta = document.getElementById('taper-edit-input');
  ta.value = script.taperNotes || '';
  document.getElementById('taper-save-btn').onclick = async () => {
    await onSave(ta.value);
    closeSheet();
  };
  document.getElementById('taper-remove-btn').onclick = async () => {
    await onSave('');
    closeSheet();
  };
  openSheet('taper-edit-overlay');
}
