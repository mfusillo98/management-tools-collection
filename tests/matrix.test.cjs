const test = require('node:test');
const assert = require('node:assert/strict');
const { example, calculate, validState } = require('../assets/js/matrix-core.js');
test('weighted ranking and normalization', () => {
  const state = example(); const result = calculate(state);
  assert.equal(result.ranking[0].name, 'Soluzione B'); assert.equal(result.ranking[0].score, 3.95);
  state.criteria.forEach(c => c.weight *= 2);
  assert.deepEqual(calculate(state).ranking, result.ranking);
});
test('zero weights and missing scores never produce a misleading ranking', () => {
  const state = example(); state.criteria.forEach(c => c.weight = 0); assert.ok(calculate(state).error);
  state.criteria[0].weight = 1; state.options[0].scores[0] = null; assert.ok(calculate(state).error);
  state.options[0].scores[0] = 3; state.options[0].scores[1] = null; assert.ok(calculate(state).ranking);
});
test('ties include all winners', () => {
  const state = example(); state.options.forEach(o => o.scores = [4, 4, 4]); assert.equal(calculate(state).winners.length, 3);
});
test('reject malformed persisted values and out-of-range input', () => {
  for (const bad of [null, {}, { ...example(), options: [] }]) assert.ok(!validState(bad));
  const state = example(); state.options[0].scores[0] = 6; assert.ok(calculate(state).error);
  state.options[0].scores[0] = 2.5; assert.ok(calculate(state).error);
  state.options[0].scores[0] = 3; state.criteria[0].weight = -1; assert.ok(calculate(state).error);
});
test('blank labels and missing weights are incomplete', () => {
  const state = example(); state.criteria[0].name = ' '; assert.ok(calculate(state).error);
  state.criteria[0].name = 'Costo'; state.criteria[0].weight = null; assert.ok(calculate(state).error);
});
test('shared cases preserve Unicode, incomplete scores and zero weights', () => {
  const { encodeState, decodeState } = require('../assets/js/matrix-core.js');
  const state = example(); state.title = 'Caffè ☕ e decisioni 日本語'; state.criteria[0].weight = 0; state.options[0].scores[0] = null;
  const encoded = encodeState(state);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeState(encoded), state);
  assert.deepEqual(calculate(decodeState(encoded)), calculate(state));
});
test('shared cases reject corrupt, oversized and invalid payloads and discard extra fields', () => {
  const { encodeState, decodeState } = require('../assets/js/matrix-core.js');
  for (const value of ['', '*', 'a'.repeat(65537), btoa('{}'), btoa('{'), btoa(String.fromCharCode(255))]) assert.throws(() => decodeState(value));
  const invalid = example(); invalid.options[0].scores[0] = 99;
  assert.throws(() => decodeState(btoa(JSON.stringify(invalid))));
  const state = example(); state.extra = 'discard'; state.criteria[0].extra = 'discard';
  assert.deepEqual(decodeState(encodeState(state)), example());
});
