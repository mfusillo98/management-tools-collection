'use strict';
const $ = selector => document.querySelector(selector);
const draftKey = 'toolbox.goal-grid.v1';
let state = GoalCore.blank();
let initialMessage = '';
try { const saved = localStorage.getItem(draftKey); if (saved) state = GoalCore.copyState(JSON.parse(saved)); }
catch { initialMessage = 'La bozza locale non è disponibile o non è valida. Puoi comunque compilare la griglia.'; }
const shared = new URL(location.href).searchParams.get('case');
if (shared !== null) {
  try { state = GoalCore.decodeState(shared); initialMessage = 'Griglia condivisa caricata. Puoi modificarla o salvarne uno snapshot.'; }
  catch { initialMessage = 'Il link contiene dati non validi. È stata mantenuta la griglia locale.'; }
}
$('#message').textContent = initialMessage;
let selectedPillar = 0;
let editing;
function save() {
  const url = new URL(location.href); if (url.searchParams.has('case')) { url.searchParams.delete('case'); history.replaceState(null, '', url); }
  $('#share-panel').hidden = true;
  try { localStorage.setItem(draftKey, JSON.stringify(state)); $('#save-status').textContent = 'Salvato in questo browser.'; }
  catch { $('#save-status').textContent = 'Salvataggio automatico non disponibile. Le modifiche restano solo nella pagina aperta: puoi conservarle con un link.'; }
}
function pillarName(i) { return state.pillars[i].name.trim() || `Area ${i + 1}`; }
function cellText(ref) { return ref.kind === 'goal' ? state.goal : ref.kind === 'pillar' ? state.pillars[ref.pillar].name : state.pillars[ref.pillar].actions[ref.action].text; }
function edit(ref) {
  editing = ref;
  $('#edit-title').textContent = ref.kind === 'goal' ? 'Obiettivo centrale' : ref.kind === 'pillar' ? `Area ${ref.pillar + 1}` : `Azione ${ref.action + 1} · ${pillarName(ref.pillar)}`;
  $('#cell-text').value = cellText(ref);
  $('#edit-context').textContent = ref.kind === 'pillar' ? 'Il nome verrà aggiornato anche nell’altra posizione della griglia.' : ref.kind === 'action' ? 'Scrivi un passo concreto. Potrai segnarlo come completato nella lista delle azioni.' : 'Descrivi il risultato che vuoi raggiungere.';
  $('#cell-dialog').showModal(); $('#cell-text').focus();
}
function renderGrid() {
  const grid = $('#goal-grid'); grid.replaceChildren();
  for (let blockIndex = 0; blockIndex < 9; blockIndex++) {
    const block = document.createElement('div'); block.className = 'goal-block' + (blockIndex === 4 ? ' goal-center-block' : '');
    for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
      const ref = GoalCore.cell(blockIndex, cellIndex);
      const button = document.createElement('button'); button.type = 'button'; button.className = `goal-cell goal-${ref.kind}`;
      if (ref.kind !== 'goal') button.dataset.color = ref.pillar;
      const label = ref.kind === 'goal' ? 'Obiettivo' : ref.kind === 'pillar' ? `Area ${ref.pillar + 1}` : `Azione ${ref.action + 1} · ${pillarName(ref.pillar)}`;
      const text = cellText(ref); button.textContent = text || (ref.kind === 'goal' ? 'Il tuo obiettivo' : ref.kind === 'pillar' ? `Area ${ref.pillar + 1}` : `+ Azione ${ref.action + 1}`);
      button.classList.toggle('goal-empty', !text.trim());
      if (ref.kind === 'action' && state.pillars[ref.pillar].actions[ref.action].done) { button.classList.add('goal-done'); button.textContent = `✓ ${button.textContent}`; }
      button.setAttribute('aria-label', `${label}: ${text || 'da definire'}. Modifica`);
      button.addEventListener('click', () => edit(ref)); block.append(button);
    }
    grid.append(block);
  }
  const progress = GoalCore.progress(state); $('#progress-text').textContent = `${progress.defined}/64 azioni definite · ${progress.done}/64 completate`;
}
function renderActions() {
  const select = $('#pillar-select'); select.replaceChildren();
  state.pillars.forEach((pillar, i) => { const option = document.createElement('option'); option.value = i; option.textContent = pillarName(i); select.append(option); }); select.value = selectedPillar;
  const list = $('#action-list'); list.replaceChildren();
  state.pillars[selectedPillar].actions.forEach((action, i) => {
    const row = document.createElement('div'); row.className = 'goal-action-row';
    const label = document.createElement('label'); label.className = 'goal-action-label';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'form-check-input'; checkbox.checked = action.done; checkbox.disabled = !action.text.trim(); checkbox.setAttribute('aria-label', `Completa azione ${i + 1}: ${action.text || 'da definire'}`);
    const text = document.createElement('span'); text.textContent = action.text || `Azione ${i + 1} da definire`; text.classList.toggle('text-secondary', !action.text.trim());
    checkbox.addEventListener('change', () => { action.done = checkbox.checked; save(); renderGrid(); });
    label.append(checkbox, text);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-sm btn-outline-secondary'; button.textContent = 'Modifica'; button.setAttribute('aria-label', `Modifica azione ${i + 1} di ${pillarName(selectedPillar)}`); button.addEventListener('click', () => edit({ kind: 'action', pillar: selectedPillar, action: i })); row.append(label, button); list.append(row);
  });
}
function render() { $('#goal').value = state.goal; renderGrid(); renderActions(); }
$('#goal').addEventListener('input', () => { state.goal = $('#goal').value; save(); renderGrid(); });
$('#pillar-select').addEventListener('change', () => { selectedPillar = Number($('#pillar-select').value); renderActions(); });
$('#cancel-edit').addEventListener('click', () => $('#cell-dialog').close());
$('#cell-form').addEventListener('submit', event => {
  event.preventDefault(); const value = $('#cell-text').value;
  if (editing.kind === 'goal') state.goal = value;
  else if (editing.kind === 'pillar') state.pillars[editing.pillar].name = value;
  else { const action = state.pillars[editing.pillar].actions[editing.action]; action.text = value; if (!value.trim()) action.done = false; }
  if (editing.kind !== 'goal') selectedPillar = editing.pillar;
  $('#cell-dialog').close(); save(); render();
  if (editing.kind === 'goal') $('#goal').focus(); else $('#pillar-select').focus();
});
function confirmAction(message) {
  return new Promise(resolve => {
    const dialog = $('#confirm-dialog'); $('#confirm-text').textContent = message;
    const finish = answer => { dialog.close(); $('#confirm-yes').onclick = $('#confirm-no').onclick = dialog.oncancel = null; resolve(answer); };
    $('#confirm-yes').onclick = () => finish(true); $('#confirm-no').onclick = () => finish(false); dialog.oncancel = event => { event.preventDefault(); finish(false); }; dialog.showModal(); $('#confirm-no').focus();
  });
}
$('#example').addEventListener('click', async () => { if (!await confirmAction('Caricare l’esempio? La griglia attuale verrà sostituita. Salva prima uno snapshot per conservarla.')) return; state = GoalCore.example(); selectedPillar = 0; save(); render(); $('#goal').focus(); });
$('#new').addEventListener('click', async () => { if (!await confirmAction('Iniziare una nuova griglia? La bozza attuale verrà sostituita. Gli snapshot salvati restano nello storico.')) return; state = GoalCore.blank(); selectedPillar = 0; save(); render(); $('#goal').focus(); });
$('#print').addEventListener('click', () => window.print());
$('#share').addEventListener('click', () => {
  try { const url = new URL(location.href); url.searchParams.set('case', GoalCore.encodeState(state)); url.hash = ''; $('#share-url').value = url.href; $('#share-panel').hidden = false; $('#message').textContent = 'Link pronto: contiene una copia della griglia e delle azioni completate.'; $('#share-url').focus(); $('#share-url').select(); }
  catch { $('#message').textContent = 'Impossibile generare il link: la griglia contiene dati non validi.'; }
});
$('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#share-url').value); $('#message').textContent = 'Link copiato.'; } catch { $('#share-url').focus(); $('#share-url').select(); $('#message').textContent = 'Copia il link selezionato con Ctrl+C o ⌘C.'; } });
let snapshotBusy = false;
async function refreshHistory() {
  try {
    const items = (await GoalStorage.list()).filter(item => Number.isFinite(item.createdAt) && GoalCore.validState(item.state)).sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
    $('#history-status').textContent = items.length ? `${items.length} snapshot ${items.length === 1 ? 'salvato' : 'salvati'}.` : 'Nessuno snapshot salvato.'; $('#snapshot-list').replaceChildren();
    items.forEach(snapshot => {
      const item = document.createElement('li'); item.className = 'snapshot-item';
      const info = document.createElement('div'); info.className = 'snapshot-info'; const title = document.createElement('strong'); title.textContent = snapshot.state.goal.trim() || 'Griglia senza titolo';
      const details = document.createElement('div'); details.className = 'status-text mt-1'; const p = GoalCore.progress(snapshot.state); details.textContent = `${new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'medium' }).format(snapshot.createdAt)} · ${p.done}/64 azioni completate`; info.append(title, details);
      const actions = document.createElement('div'); actions.className = 'd-flex gap-2';
      const restore = document.createElement('button'); restore.className = 'btn btn-sm btn-outline-secondary'; restore.textContent = 'Riapri'; restore.setAttribute('aria-label', `Riapri ${title.textContent}`);
      restore.addEventListener('click', async () => { if (!await confirmAction('Riaprire questo snapshot? La bozza attuale verrà sostituita. Salva prima uno snapshot per conservarla.')) return; state = GoalCore.copyState(snapshot.state); save(); render(); $('#message').textContent = 'Snapshot riaperto. La copia nello storico resta invariata.'; $('#goal').focus(); });
      const remove = document.createElement('button'); remove.className = 'btn btn-sm btn-outline-secondary'; remove.textContent = 'Elimina'; remove.setAttribute('aria-label', `Elimina ${title.textContent}`);
      remove.addEventListener('click', async () => { if (!await confirmAction('Eliminare definitivamente questo snapshot?')) return; remove.disabled = true; try { await GoalStorage.remove(snapshot.id); await refreshHistory(); $('#snapshot').focus(); } catch { remove.disabled = false; $('#message').textContent = 'Impossibile eliminare lo snapshot.'; } });
      actions.append(restore, remove); item.append(info, actions); $('#snapshot-list').append(item);
    }); $('#snapshot').disabled = snapshotBusy;
  } catch { $('#history-status').textContent = 'Database locale non disponibile. Puoi conservare la griglia tramite un link condivisibile.'; $('#snapshot').disabled = true; }
}
$('#snapshot').addEventListener('click', async () => { if (snapshotBusy) return; snapshotBusy = true; $('#snapshot').disabled = true; try { await GoalStorage.add(state); $('#message').textContent = 'Snapshot salvato.'; await refreshHistory(); } catch { $('#message').textContent = 'Impossibile salvare lo snapshot. Verifica lo spazio e le impostazioni del browser.'; } finally { snapshotBusy = false; $('#snapshot').disabled = false; } });
render(); refreshHistory();
