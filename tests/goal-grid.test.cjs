const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/js/goal-core.js');
test('9x9 chart maps one goal, mirrored pillars and 64 distinct actions', () => {
  const refs = Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, c) => core.cell(b, c))).flat();
  assert.equal(refs.filter(r => r.kind === 'goal').length, 1);
  const actions = refs.filter(r => r.kind === 'action'); assert.equal(actions.length, 64);
  assert.equal(new Set(actions.map(r => `${r.pillar}:${r.action}`)).size, 64);
  for (let i = 0; i < 8; i++) assert.equal(refs.filter(r => r.kind === 'pillar' && r.pillar === i).length, 2);
});
test('blank and example charts have fixed structure and accurate completion', () => {
  assert.ok(core.validState(core.blank())); assert.ok(core.validState(core.example()));
  const state = core.example(); assert.deepEqual(core.progress(state), { defined: 64, done: 0, total: 64 });
  state.pillars[0].actions[0].done = true; assert.equal(core.progress(state).done, 1);
  const copy = core.copyState(state); copy.pillars[0].actions[0].text = 'Changed'; assert.notEqual(copy.pillars[0].actions[0].text, state.pillars[0].actions[0].text);
});
test('shared chart preserves Unicode and completion flags and rejects malformed data', () => {
  const state = core.example(); state.goal = 'Caffè ☕ 日本語'; state.pillars[0].actions[0].done = true;
  assert.deepEqual(core.decodeState(core.encodeState(state)), state);
  for (const invalid of ['', '*', btoa('{}'), 'a'.repeat(131073)]) assert.throws(() => core.decodeState(invalid));
  const emptyDone = core.blank(); emptyDone.pillars[0].actions[0].done = true; assert.equal(core.validState(emptyDone), false);
  const fewerPillars = core.blank(); fewerPillars.pillars.pop(); assert.equal(core.validState(fewerPillars), false);
  const excessive = core.blank(); excessive.goal = 'a'.repeat(201); assert.equal(core.validState(excessive), false);
});
