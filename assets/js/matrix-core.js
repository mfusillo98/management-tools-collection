(function (root) {
  'use strict';
  function example() {
    return { version: 1, title: 'Scegliere un software per il team', criteria: [{ name: 'Convenienza', weight: 40 }, { name: 'Funzionalità', weight: 35 }, { name: 'Facilità d’uso', weight: 25 }], options: [{ name: 'Soluzione A', scores: [4, 3, 5] }, { name: 'Soluzione B', scores: [3, 5, 4] }, { name: 'Soluzione C', scores: [5, 3, 3] }] };
  }
  const isWeight = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000;
  const isScore = value => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
  function validState(state) {
    return state && state.version === 1 && typeof state.title === 'string' && state.title.length <= 150 && Array.isArray(state.criteria) && state.criteria.length >= 1 && state.criteria.length <= 12 && state.criteria.every(c => c && typeof c.name === 'string' && c.name.length <= 80 && (c.weight === null || isWeight(c.weight))) && Array.isArray(state.options) && state.options.length >= 2 && state.options.length <= 20 && state.options.every(o => o && typeof o.name === 'string' && o.name.length <= 80 && Array.isArray(o.scores) && o.scores.length === state.criteria.length && o.scores.every(s => s === null || isScore(s)));
  }
  function calculate(state) {
    if (!validState(state)) return { error: 'La matrice contiene dati non validi.' };
    if (state.criteria.some(c => !c.name.trim()) || state.options.some(o => !o.name.trim())) return { error: 'Assegna un nome a ogni criterio e alternativa.' };
    if (state.criteria.some(c => !isWeight(c.weight))) return { error: 'Inserisci un peso valido da 0 a 1000 per ogni criterio.' };
    const total = state.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (total === 0) return { error: 'Assegna un peso maggiore di zero ad almeno un criterio.' };
    if (state.options.some(o => o.scores.some((s, i) => state.criteria[i].weight > 0 && !isScore(s)))) return { error: 'Completa i voti dei criteri attivi con numeri interi da 1 a 5.' };
    const ranking = state.options.map((option, index) => ({ name: option.name, index, score: option.scores.reduce((sum, score, i) => sum + (state.criteria[i].weight === 0 ? 0 : score * state.criteria[i].weight), 0) / total })).sort((a, b) => b.score - a.score);
    return { total, ranking, winners: ranking.filter(o => Math.abs(o.score - ranking[0].score) < 1e-9) };
  }
  const api = { example, validState, calculate };
  root.MatrixCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
