import test from 'node:test';
import assert from 'node:assert/strict';
import { formatConnectionLabel, formatInstanceLabel } from '../../src/cli/cmd-status.js';

test('formatConnectionLabel prefers live connection when online', () => {
  assert.strictEqual(formatConnectionLabel(true, null), 'ready');
});

test('formatConnectionLabel exposes unreachable when runtime says CDP_UNREACHABLE', () => {
  assert.strictEqual(
    formatConnectionLabel(false, { state: 'CDP_UNREACHABLE' }),
    'browser unreachable'
  );
});

test('formatConnectionLabel shows disconnected when runtime snapshot is stale', () => {
  assert.strictEqual(
    formatConnectionLabel(false, { state: 'connected', lastError: 'timeout' }),
    'disconnected'
  );
});

test('formatConnectionLabel defaults to CDP_UNREACHABLE when no snapshot', () => {
  assert.strictEqual(formatConnectionLabel(false, null), 'browser unreachable');
});

test('formatInstanceLabel distinguishes headless endpoints', () => {
  assert.strictEqual(
    formatInstanceLabel({ display: 'headless' }),
    'headless browser'
  );
});

test('formatInstanceLabel avoids claiming local visibility for windowed endpoints', () => {
  assert.strictEqual(
    formatInstanceLabel({ display: 'windowed' }),
    'windowed browser'
  );
});
