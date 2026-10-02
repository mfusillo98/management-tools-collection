(function (root) {
  'use strict';
  const positions = [0, 1, 2, 3, 5, 6, 7, 8];
  function blank() { return { version: 1, goal: '', pillars: Array.from({ length: 8 }, () => ({ name: '', actions: Array.from({ length: 8 }, () => ({ text: '', done: false })) })) }; }
  function example() {
    const state = blank(); state.goal = 'Lanciare un nuovo servizio in 90 giorni';
    const themes = ['Clienti', 'Offerta', 'Competenze', 'Comunicazione', 'Vendite', 'Organizzazione', 'Finanze', 'Qualità'];
    const actions = [
      ['Definire il cliente ideale', 'Intervistare 5 potenziali clienti', 'Raccogliere i problemi ricorrenti', 'Analizzare 3 alternative esistenti', 'Verificare la disponibilità a pagare', 'Scegliere un segmento iniziale', 'Raccogliere i primi contatti', 'Validare il problema principale'],
      ['Scrivere la promessa del servizio', 'Definire cosa è incluso', 'Definire cosa è escluso', 'Creare un pacchetto iniziale', 'Stabilire il prezzo di prova', 'Preparare una demo', 'Testare l’offerta con 3 persone', 'Aggiornare la proposta'],
      ['Elencare le competenze necessarie', 'Valutare le lacune', 'Scegliere un corso mirato', 'Studiare 30 minuti al giorno', 'Esercitarsi su un caso reale', 'Trovare un confronto esperto', 'Documentare quanto imparato', 'Completare un progetto pilota'],
      ['Scrivere una presentazione breve', 'Preparare una pagina descrittiva', 'Creare 3 contenuti utili', 'Scegliere un canale principale', 'Raccontare un caso concreto', 'Pubblicare con regolarità', 'Raccogliere domande frequenti', 'Misurare le richieste ricevute'],
      ['Preparare una lista di contatti', 'Scrivere un messaggio personale', 'Contattare 10 potenziali clienti', 'Organizzare 3 incontri', 'Preparare un preventivo', 'Rispondere alle obiezioni', 'Concludere una prima vendita', 'Chiedere una referenza'],
      ['Definire le tappe dei 90 giorni', 'Pianificare la settimana', 'Riservare tempo ogni giorno', 'Creare una lista operativa', 'Eliminare una distrazione', 'Rivedere i progressi ogni venerdì', 'Preparare modelli riutilizzabili', 'Adeguare il piano ai risultati'],
      ['Definire il budget iniziale', 'Elencare i costi fissi', 'Stimare i costi per cliente', 'Calcolare il margine atteso', 'Definire un obiettivo di ricavi', 'Registrare entrate e uscite', 'Controllare il budget ogni settimana', 'Creare una riserva'],
      ['Definire il risultato atteso', 'Creare una checklist di consegna', 'Testare il servizio completo', 'Raccogliere feedback dal pilota', 'Correggere il problema principale', 'Misurare la soddisfazione', 'Documentare il processo', 'Decidere il prossimo miglioramento']
    ];
    state.pillars.forEach((pillar, i) => { pillar.name = themes[i]; pillar.actions.forEach((a, j) => { a.text = actions[i][j]; }); }); return state;
  }
  const validText = value => typeof value === 'string' && value.length <= 200;
  function validState(s) { return !!s && s.version === 1 && validText(s.goal) && Array.isArray(s.pillars) && s.pillars.length === 8 && s.pillars.every(p => p && validText(p.name) && Array.isArray(p.actions) && p.actions.length === 8 && p.actions.every(a => a && validText(a.text) && typeof a.done === 'boolean' && (!a.done || !!a.text.trim()))); }
  function copyState(s) { if (!validState(s)) throw new Error('Griglia non valida.'); return { version: 1, goal: s.goal, pillars: s.pillars.map(p => ({ name: p.name, actions: p.actions.map(a => ({ text: a.text, done: a.done })) })) }; }
  function encodeState(s) { const bytes = new TextEncoder().encode(JSON.stringify(copyState(s))); return btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function decodeState(value) { if (typeof value !== 'string' || !value.length || value.length > 131072 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Link non valido.'); return copyState(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))))); }
  function cell(block, cell) { if (block === 4) return cell === 4 ? { kind: 'goal' } : { kind: 'pillar', pillar: positions.indexOf(cell) }; const pillar = positions.indexOf(block); return cell === 4 ? { kind: 'pillar', pillar } : { kind: 'action', pillar, action: positions.indexOf(cell) }; }
  function progress(s) { const actions = s.pillars.flatMap(p => p.actions); return { defined: actions.filter(a => a.text.trim()).length, done: actions.filter(a => a.text.trim() && a.done).length, total: 64 }; }
  const api = { blank, example, validState, copyState, encodeState, decodeState, cell, progress }; root.GoalCore = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
