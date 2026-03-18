import test from 'node:test';
import assert from 'node:assert/strict';
import { rebindHintCandidate } from '../../src/layer2-perception/hints.js';
import { applySnapshotToPageState, createPageState } from '../../src/server/page-state.js';
import { locateElement } from '../../src/layer3-action/actions.js';

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

test('locateElement rebuild path succeeds even when hintId stays the same', async () => {
  const results = [null, { inView: true, centerY: 0, tag: 'input', label: 'Rebound Input' }];
  let evaluateCalls = 0;
  const page = {
    evaluate: async () => null,
    $: async () => ({}),
    mouse: {
      move: async () => {},
      wheel: async () => {},
      down: async () => {},
      up: async () => {},
    },
    waitForLoadState: async () => {},
  };

  let rebuildCalls = 0;
  const result = await locateElement(page, 'I2', {
    rebuildHints: async () => {
      rebuildCalls += 1;
      return { id: 'I2' };
    },
    evaluateHint: async () => {
      const next = results[Math.min(evaluateCalls, results.length - 1)];
      evaluateCalls += 1;
      return next;
    },
  });

  assert.strictEqual(result.info.tag, 'input');
  assert.strictEqual(rebuildCalls, 1);
  assert.strictEqual(evaluateCalls, 2);
});
