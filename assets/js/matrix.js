'use strict';
const KEY = 'toolbox.weighted-matrix.v1';
let state = MatrixCore.example();
let storageMessage = '';
try {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (MatrixCore.validState(parsed)) state = parsed;
    else storageMessage = 'I dati salvati non sono validi: è stato caricato l’esempio.';
  }
} catch { storageMessage = 'Salvataggio locale non disponibile o dati illeggibili. Puoi comunque usare la matrice.'; }
const shared = new URL(location.href).searchParams.get('case');
let sharedMessage = '';
if (shared !== null) {
  try { state = MatrixCore.decodeState(shared); sharedMessage = 'Caso condiviso caricato. Puoi modificarlo o salvarne uno snapshot.'; }
  catch { sharedMessage = 'Il link condiviso contiene dati non validi. È stata mantenuta la matrice locale.'; }
}
const titleInput = document.querySelector('#decision-name');
const numberFormat = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
function save() {
  // Once edited, the address must not retain an outdated shared case.
  const url = new URL(location.href);
  if (url.searchParams.has('case')) { url.searchParams.delete('case'); history.replaceState(null, '', url); }
  document.querySelector('#share-panel').hidden = true;
  try { localStorage.setItem(KEY, JSON.stringify(state)); document.querySelector('#save-status').textContent = 'Salvato in questo browser.'; }
  catch { document.querySelector('#save-status').textContent = 'Impossibile salvare: le modifiche resteranno disponibili solo fino alla chiusura della pagina.'; }
}
function input(value, label, onInput, numeric = false) {
  const field = document.createElement('input'); field.className = 'form-control'; field.value = value ?? ''; field.setAttribute('aria-label', label);
  field.type = numeric ? 'number' : 'text';
  if (!numeric) field.maxLength = 80;
  field.addEventListener('input', () => { const value = numeric ? (field.value === '' || !field.validity.valid ? null : field.valueAsNumber) : field.value; onInput(value); field.setAttribute('aria-invalid', String(numeric ? value === null : !value.trim())); save(); results(); });
  return field;
}
function removeButton(label, disabled, action) {
  const button = document.createElement('button'); button.className = 'icon-button'; button.textContent = '×'; button.setAttribute('aria-label', label); button.title = label; button.disabled = disabled; button.addEventListener('click', action); return button;
}
function render() {
  titleInput.value = state.title;
  const row = document.createElement('tr');
  const corner = document.createElement('th'); corner.scope = 'col'; corner.textContent = 'Alternative'; row.append(corner);
  state.criteria.forEach((criterion, i) => {
    const th = document.createElement('th'); th.scope = 'col';
    const line = document.createElement('div'); line.className = 'd-flex align-items-center gap-1';
    const name = input(criterion.name, `Nome criterio ${i + 1}`, value => { criterion.name = value; }); name.classList.add('criterion-name');
    line.append(name, removeButton(`Rimuovi criterio ${i + 1}`, state.criteria.length <= 1, () => { state.criteria.splice(i, 1); state.options.forEach(o => o.scores.splice(i, 1)); save(); render(); document.querySelector('#add-criterion').focus(); }));
    const weights = document.createElement('div'); weights.className = 'weight-row';
    const label = document.createElement('span'); label.textContent = 'Peso';
    const weight = input(criterion.weight, `Peso criterio ${i + 1}`, value => { criterion.weight = value; }, true); weight.min = 0; weight.max = 1000; weight.step = 'any';
    const normalized = document.createElement('span'); normalized.dataset.weight = i;
    weights.append(label, weight, normalized); th.append(line, weights); row.append(th);
  });
  document.querySelector('#matrix-head').replaceChildren(row);
  const body = document.querySelector('#matrix-body'); body.replaceChildren();
  state.options.forEach((option, i) => {
    const tr = document.createElement('tr'); const th = document.createElement('th'); th.scope = 'row';
    const line = document.createElement('div'); line.className = 'd-flex align-items-center gap-1';
    line.append(input(option.name, `Nome alternativa ${i + 1}`, value => { option.name = value; }), removeButton(`Rimuovi alternativa ${i + 1}`, state.options.length <= 2, () => { state.options.splice(i, 1); save(); render(); document.querySelector('#add-option').focus(); })); th.append(line); tr.append(th);
    option.scores.forEach((score, j) => { const td = document.createElement('td'); const field = input(score, `Voto alternativa ${i + 1}, criterio ${j + 1}`, value => { option.scores[j] = value; }, true); field.min = 1; field.max = 5; field.step = 1; field.classList.add('score-input'); td.append(field); tr.append(td); }); body.append(tr);
  });
  document.querySelector('#add-option').disabled = state.options.length >= 20;
  document.querySelector('#add-criterion').disabled = state.criteria.length >= 12;
  results();
}
function results() {
  const result = MatrixCore.calculate(state);
  const total = state.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  document.querySelectorAll('[data-weight]').forEach(el => { el.textContent = total ? `(${percentFormat.format((state.criteria[Number(el.dataset.weight)].weight || 0) / total * 100)}%)` : '(—)'; });
  const warning = document.querySelector('#validation'); warning.hidden = !result.error; warning.textContent = result.error || '';
  const ranking = document.querySelector('#ranking'); ranking.replaceChildren();
  const summary = document.querySelector('#summary'); summary.hidden = !!result.error;
  if (result.error) { ranking.textContent = 'Il confronto sarà disponibile quando la matrice è completa.'; return; }
  let rank = 1;
  result.ranking.forEach((option, i) => {
    if (i && Math.abs(option.score - result.ranking[i - 1].score) > 1e-9) rank = i + 1;
    const item = document.createElement('div'); item.className = 'ranking-item';
    const line = document.createElement('div'); line.className = 'd-flex align-items-center gap-2';
    const position = document.createElement('span'); position.className = 'rank-number'; position.textContent = String(rank).padStart(2, '0');
    const name = document.createElement('span'); name.className = 'flex-grow-1 text-break'; name.textContent = option.name;
    const score = document.createElement('span'); score.className = 'score'; score.textContent = `${numberFormat.format(option.score)} / 5`;
    line.append(position, name, score);
    const track = document.createElement('div'); track.className = 'progress'; track.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('div'); bar.className = 'progress-bar'; bar.style.width = `${option.score / 5 * 100}%`; track.append(bar); item.append(line, track); ranking.append(item);
  });
  summary.textContent = result.winners.length > 1 ? `Parità al primo posto: ${result.winners.map(o => o.name).join(', ')}.` : `${result.winners[0].name} ottiene il punteggio più alto con i pesi attuali.`;
}
titleInput.addEventListener('input', () => { state.title = titleInput.value; save(); });
document.querySelector('#add-option').addEventListener('click', () => { if (state.options.length >= 20) return; state.options.push({ name: `Alternativa ${state.options.length + 1}`, scores: state.criteria.map(() => null) }); save(); render(); document.querySelector('#matrix-body tr:last-child input').focus(); });
document.querySelector('#add-criterion').addEventListener('click', () => { if (state.criteria.length >= 12) return; state.criteria.push({ name: `Criterio ${state.criteria.length + 1}`, weight: 1 }); state.options.forEach(o => o.scores.push(null)); save(); render(); document.querySelector('#matrix-head th:last-child input').focus(); });
document.querySelector('#reset').addEventListener('click', () => { if (!window.confirm('Ripristinare l’esempio? Le modifiche alla matrice attuale verranno eliminate.')) return; state = MatrixCore.example(); save(); render(); titleInput.focus(); });
render();
if (storageMessage) document.querySelector('#save-status').textContent = storageMessage;

const caseStatus = document.querySelector('#case-status');
caseStatus.textContent = sharedMessage;
const snapshotButton = document.querySelector('#save-snapshot');
const snapshotList = document.querySelector('#snapshot-list');
const historyStatus = document.querySelector('#history-status');
const dateFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'medium' });
let snapshotBusy = false;
async function refreshHistory() {
  try {
    const snapshots = await MatrixStorage.list();
    snapshotList.replaceChildren();
    const valid = snapshots.filter(item => Number.isFinite(item.createdAt) && MatrixCore.validState(item.state)).sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
    historyStatus.textContent = valid.length ? `${valid.length} snapshot ${valid.length === 1 ? 'salvato' : 'salvati'}.` : 'Nessuno snapshot salvato. Salva il caso attuale per ritrovarlo qui.';
    valid.forEach(snapshot => {
      const item = document.createElement('li'); item.className = 'snapshot-item';
      const info = document.createElement('div'); info.className = 'snapshot-info';
      const title = document.createElement('strong'); title.textContent = snapshot.state.title.trim() || 'Caso senza titolo';
      const details = document.createElement('div'); details.className = 'status-text mt-1'; details.textContent = `${dateFormat.format(snapshot.createdAt)} · ${snapshot.state.options.length} alternative · ${snapshot.state.criteria.length} criteri`;
      info.append(title, details);
      const actions = document.createElement('div'); actions.className = 'd-flex gap-2';
      const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'btn btn-sm btn-outline-secondary'; restore.textContent = 'Riapri'; restore.setAttribute('aria-label', `Riapri ${title.textContent}`);
      restore.addEventListener('click', () => {
        if (!confirm('Riaprire questo snapshot? La matrice attuale verrà sostituita. Salva prima uno snapshot se vuoi conservarla.')) return;
        state = MatrixCore.copyState(snapshot.state); save(); render(); caseStatus.textContent = 'Snapshot riaperto. Le modifiche non alterano la copia salvata.'; titleInput.focus();
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-sm btn-outline-secondary'; remove.textContent = 'Elimina'; remove.setAttribute('aria-label', `Elimina ${title.textContent}`);
      remove.addEventListener('click', async () => {
        if (!confirm('Eliminare definitivamente questo snapshot dallo storico?')) return;
        remove.disabled = true;
        try { await MatrixStorage.remove(snapshot.id); await refreshHistory(); snapshotButton.focus(); }
        catch { caseStatus.textContent = 'Impossibile eliminare lo snapshot. Riprova.'; remove.disabled = false; }
      });
      actions.append(restore, remove); item.append(info, actions); snapshotList.append(item);
    });
    snapshotButton.disabled = snapshotBusy;
  } catch {
    historyStatus.textContent = 'Database locale non disponibile. Lo storico non può essere letto: prova a riaprire la pagina o verifica le impostazioni del browser.';
    snapshotButton.disabled = true;
  }
}
snapshotButton.addEventListener('click', async () => {
  if (snapshotBusy) return;
  snapshotBusy = true; snapshotButton.disabled = true;
  try {
    await MatrixStorage.add(state);
    caseStatus.textContent = 'Snapshot salvato nello storico.';
    await refreshHistory();
  } catch { caseStatus.textContent = 'Impossibile salvare lo snapshot. Verifica lo spazio disponibile e le impostazioni del browser.'; }
  finally { snapshotBusy = false; snapshotButton.disabled = false; }
});
document.querySelector('#share-case').addEventListener('click', () => {
  try {
    const url = new URL(location.href); url.searchParams.set('case', MatrixCore.encodeState(state)); url.hash = '';
    document.querySelector('#share-url').value = url.href;
    document.querySelector('#share-panel').hidden = false;
    caseStatus.textContent = 'Link pronto: contiene una copia del caso al momento della generazione.';
    document.querySelector('#share-url').focus(); document.querySelector('#share-url').select();
  } catch { caseStatus.textContent = 'Impossibile generare il link: il caso contiene dati non validi.'; }
});
document.querySelector('#copy-link').addEventListener('click', async () => {
  const field = document.querySelector('#share-url');
  try { await navigator.clipboard.writeText(field.value); caseStatus.textContent = 'Link copiato. Puoi condividerlo.'; }
  catch { field.focus(); field.select(); caseStatus.textContent = 'Copia automatica non disponibile. Copia il link selezionato con Ctrl+C o ⌘C.'; }
});
refreshHistory();
