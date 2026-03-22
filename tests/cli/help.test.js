import test from 'node:test';
import assert from 'node:assert/strict';

import { renderHelpText } from '../../index.js';

test('renderHelpText describes the gateway help', () => {
  assert.match(renderHelpText(), /AI browser gateway/i);
  assert.match(renderHelpText(), /grasp\s+Start gateway setup/i);
});

test('index.js can be imported without auto-running the CLI', async () => {
  const mod = await import('../../index.js');
  assert.strictEqual(typeof mod.main, 'function');
});
