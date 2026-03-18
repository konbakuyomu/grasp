import test from 'node:test';
import assert from 'node:assert/strict';
import { rebindHintCandidate } from '../../src/layer2-perception/hints.js';
import { applySnapshotToPageState, createPageState } from '../../src/server/page-state.js';

test('rebindHintCandidate matches by type, label, and position proximity', () => {
  const previous = { id: 'I2', type: 'combobox', label: 'Command Menu', x: 1266, y: 106 };
  const candidates = [
    { id: 'I1', type: 'button', label: 'Command Menu', x: 400, y: 120 },
    { id: 'I3', type: 'combobox', label: 'Command Menu', x: 1270, y: 110 },
  ];

  const rebound = rebindHintCandidate(previous, candidates);
  assert.strictEqual(rebound?.id, 'I3');
});

test('applySnapshotToPageState keeps domRevision when no change', () => {
  const state = createPageState();
  const stepOne = applySnapshotToPageState(state, { url: 'https://grok.com/', snapshotHash: 'hash-a' });
  const stepTwo = applySnapshotToPageState(stepOne, { url: 'https://grok.com/', snapshotHash: 'hash-a' });

  assert.strictEqual(stepTwo.domRevision, stepOne.domRevision);
});

test('applySnapshotToPageState increments when same url but snapshot changes', () => {
  const state = createPageState();
  const stepOne = applySnapshotToPageState(state, { url: 'https://grok.com/', snapshotHash: 'hash-a' });
  const stepTwo = applySnapshotToPageState(stepOne, { url: 'https://grok.com/', snapshotHash: 'hash-b' });

  assert.strictEqual(stepTwo.domRevision, stepOne.domRevision + 1);
});

test('applySnapshotToPageState resets domRevision when url changes', () => {
  const state = createPageState();
  const stepOne = applySnapshotToPageState(state, { url: 'https://grok.com/', snapshotHash: 'hash-a' });
  const stepTwo = applySnapshotToPageState(stepOne, { url: 'https://example.com/', snapshotHash: 'hash-c' });

  assert.strictEqual(stepTwo.domRevision, 0);
});
