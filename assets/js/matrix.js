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
const titleInput = document.querySelector('#decision-name');
const numberFormat = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
function save() {
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
