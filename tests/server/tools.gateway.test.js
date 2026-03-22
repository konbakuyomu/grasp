import test from 'node:test';
import assert from 'node:assert/strict';
import { registerGatewayTools } from '../../src/server/tools.gateway.js';

test('entry returns a gateway response with strategy metadata', async () => {
  const calls = [];
  const server = { registerTool(name, spec, handler) { calls.push({ name, handler }); } };
  const state = { pageState: { currentRole: 'content', graspConfidence: 'high', riskGateDetected: false }, handoff: { state: 'idle' } };

  registerGatewayTools(server, state, {
    enterWithStrategy: async () => ({ url: 'https://example.com', title: 'Example', preflight: { session_trust: 'high' }, pageState: state.pageState }),
  });

  const entry = calls.find((tool) => tool.name === 'entry');
  const result = await entry.handler({ url: 'https://example.com' });

  assert.equal(result.meta.status, 'direct');
  assert.equal(result.meta.page.url, 'https://example.com');
});
