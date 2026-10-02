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
  // Keep only the documented fields when importing untrusted links.
  function copyState(state) {
    if (!validState(state)) throw new Error('Dati della matrice non validi.');
    return { version: 1, title: state.title, criteria: state.criteria.map(c => ({ name: c.name, weight: c.weight })), options: state.options.map(o => ({ name: o.name, scores: [...o.scores] })) };
  }
  function encodeState(state) {
    const bytes = new TextEncoder().encode(JSON.stringify(copyState(state)));
    return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeState(value) {
    if (typeof value !== 'string' || !value.length || value.length > 65536 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Link non valido.');
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    return copyState(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  }
  const api = { example, validState, calculate, copyState, encodeState, decodeState };
  root.MatrixCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
