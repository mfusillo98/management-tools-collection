// Aggiungi qui i nuovi tool: i filtri vengono generati dai tag del catalogo.
const tools = [{ title: 'Matrice decisionale pesata', description: 'Confronta le alternative, dai peso a ciò che conta e trova la scelta più adatta alle tue priorità.', tags: ['Decisioni', 'Strategia', 'Analisi'], href: 'tools/decision-matrix/', number: '01', openLabel: 'Apri la matrice' }, { title: 'Griglia obiettivi 9×9', description: 'Trasforma un obiettivo in otto aree e 64 azioni concrete. Costruisci il piano e segui i tuoi progressi.', tags: ['Obiettivi', 'Strategia', 'Pianificazione'], href: 'tools/goal-grid/', number: '02', openLabel: 'Apri la griglia', preview: 'goal' }];
const selected = new Set();
const filters = document.querySelector('#filters');
const search = document.querySelector('#search');
function filterButton(label, active, action) {
  const button = document.createElement('button');
  button.className = 'btn tag-filter' + (active ? ' active' : '');
  button.textContent = label;
  button.setAttribute('aria-pressed', String(active));
  button.addEventListener('click', action);
  filters.append(button);
}
function renderFilters() {
  filters.replaceChildren();
  filterButton('Tutti i tool', !selected.size, () => { selected.clear(); render(); });
  [...new Set(tools.flatMap(tool => tool.tags))].sort().forEach(tag => filterButton(tag, selected.has(tag), () => { selected.has(tag) ? selected.delete(tag) : selected.add(tag); render(); }));
}
function render() {
  const focused = document.activeElement?.closest('#filters button')?.textContent;
  renderFilters();
  if (focused) [...filters.children].find(button => button.textContent === focused)?.focus();
  const query = search.value.trim().toLocaleLowerCase('it');
  const visible = tools.filter(tool => (!selected.size || tool.tags.some(tag => selected.has(tag))) && `${tool.title} ${tool.description} ${tool.tags.join(' ')}`.toLocaleLowerCase('it').includes(query));
  document.querySelector('#total-count').textContent = tools.length;
  const container = document.querySelector('#tools');
  container.replaceChildren();
  visible.forEach(tool => {
    const column = document.createElement('div'); column.className = 'col-md-6 col-xl-4';
    const card = document.createElement('article'); card.className = 'tool-card h-100';
    const preview = document.createElement('div'); preview.className = 'tool-preview'; preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = '<span class="preview-label">PONDERA. CONFRONTA. SCEGLI.</span><div class="mini-matrix"><span></span><span>× 40%</span><span>× 35%</span><span>× 25%</span><b>A</b><i class="cell-medium">3</i><i>4</i><i class="cell-low">2</i><b>B</b><i>5</i><i>4</i><i>5</i><b>C</b><i class="cell-low">2</i><i class="cell-medium">3</i><i>4</i></div>';
    if (tool.preview === 'goal') preview.innerHTML = '<span class="preview-label">DEFINISCI. SCOMPONI. AGISCI.</span><div class="goal-mini">' + '<i></i>'.repeat(81) + '</div>';
    const body = document.createElement('div'); body.className = 'tool-body';
    const meta = document.createElement('p'); meta.className = 'eyebrow'; meta.textContent = `TOOL ${tool.number}`;
    const heading = document.createElement('h3'); heading.className = 'h4';
    const link = document.createElement('a'); link.href = tool.href; link.textContent = tool.title; heading.append(link);
    const description = document.createElement('p'); description.className = 'text-secondary'; description.textContent = tool.description;
    const tags = document.createElement('div'); tags.className = 'd-flex flex-wrap gap-2 mt-4';
    tool.tags.forEach(tag => { const badge = document.createElement('span'); badge.className = 'tool-tag'; badge.textContent = tag; tags.append(badge); });
    const open = document.createElement('a'); open.className = 'btn btn-primary w-100 mt-4'; open.href = tool.href; open.textContent = tool.openLabel;
    body.append(meta, heading, description, tags, open); card.append(preview, body); column.append(card); container.append(column);
  });
  document.querySelector('#empty').hidden = !!visible.length;
  document.querySelector('#result-count').textContent = `${visible.length} tool trovati`;
}
search.addEventListener('input', render);
document.querySelector('#clear').addEventListener('click', () => { search.value = ''; selected.clear(); render(); search.focus(); });
render();
