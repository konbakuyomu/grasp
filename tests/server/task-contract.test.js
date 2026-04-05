import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGatewayResponse } from '../../src/server/gateway-response.js';

test('buildGatewayResponse adds a normalized task-facing contract for ready routes', () => {
  const response = buildGatewayResponse({
    status: 'ready',
    page: {
      title: 'Example',
      url: 'https://example.com',
      page_role: 'content',
      risk_gate: false,
      grasp_confidence: 'high',
    },
    result: {
      summary: 'Summary',
      artifacts: [{ path: '/tmp/example.md' }],
    },
    continuation: {
      can_continue: true,
      suggested_next_action: 'extract',
      handoff_state: 'idle',
    },
    route: { selected_mode: 'public_read' },
  });

  assert.deepEqual(response.meta.task, {
    status: 'ready',
    reason: 'The runtime has enough context to continue on the current route.',
    next_step: 'extract',
    next_step_human: 'extract',
    can_continue: true,
  });
  assert.deepEqual(response.meta.delivery, {
    status: 'delivered',
    summary: '1 artifact(s) ready',
    artifacts: [{ path: '/tmp/example.md' }],
  });
});

test('buildGatewayResponse adds a normalized task-facing contract for blocked routes', () => {
  const response = buildGatewayResponse({
    status: 'blocked_for_handoff',
    page: {
      title: 'Checkpoint',
      url: 'https://example.com/checkpoint',
      page_role: 'checkpoint',
      risk_gate: true,
      grasp_confidence: 'low',
    },
    continuation: {
      can_continue: false,
      suggested_next_action: 'request_handoff',
      handoff_state: 'handoff_required',
    },
    route: { selected_mode: 'handoff' },
  });

  assert.deepEqual(response.meta.task, {
    status: 'blocked_for_handoff',
    reason: 'A human step is required before the task can continue.',
    next_step: 'request_handoff',
    next_step_human: 'request_handoff',
    can_continue: false,
  });
});

test('buildGatewayResponse keeps mixed task status when aggregate status is mixed on a checkpoint page', () => {
  const response = buildGatewayResponse({
    status: 'mixed',
    page: {
      title: 'Checkpoint',
      url: 'https://example.com/checkpoint',
      page_role: 'checkpoint',
      risk_gate: true,
      grasp_confidence: 'low',
    },
    continuation: {
      can_continue: false,
      suggested_next_action: 'request_handoff',
      handoff_state: 'idle',
    },
    verification: {
      status: 'partial',
      summary: 'Batch extraction completed with 1 blocked or incomplete URL(s).',
    },
    route: { selected_mode: 'handoff' },
  });

  assert.deepEqual(response.meta.task, {
    status: 'mixed',
    reason: 'Batch extraction completed with 1 blocked or incomplete URL(s).',
    next_step: 'request_handoff',
    next_step_human: 'request_handoff',
    can_continue: false,
  });
});

test('buildGatewayResponse preserves mixed task status when continuation is handoff_required', () => {
  const response = buildGatewayResponse({
    status: 'mixed',
    page: {
      title: 'Checkpoint',
      url: 'https://example.com/checkpoint',
      page_role: 'checkpoint',
      risk_gate: true,
      grasp_confidence: 'low',
    },
    continuation: {
      can_continue: false,
      suggested_next_action: 'request_handoff',
      handoff_state: 'handoff_required',
    },
    verification: {
      status: 'partial',
      summary: 'Batch extraction completed with 1 blocked or incomplete URL(s).',
    },
    route: { selected_mode: 'handoff' },
  });

  assert.deepEqual(response.meta.task, {
    status: 'mixed',
    reason: 'Batch extraction completed with 1 blocked or incomplete URL(s).',
    next_step: 'request_handoff',
    next_step_human: 'request_handoff',
    can_continue: false,
  });
});
