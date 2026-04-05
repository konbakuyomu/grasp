import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldMarkResumeVerified } from '../../src/server/tools.handoff.js';
import { registerHandoffTools } from '../../src/server/tools.handoff.js';

test('resume should verify when continuation is ready even if reacquired is false', () => {
  const result = shouldMarkResumeVerified({
    verify: true,
    checkpointStillPresent: false,
    pageState: {
      reacquired: false,
    },
    continuation: {
      task_continuation_ok: true,
      continuation_ready: true,
    },
  });

  assert.equal(result, true);
});

test('resume should stay unverified when continuation explicitly failed', () => {
  const result = shouldMarkResumeVerified({
    verify: true,
    checkpointStillPresent: false,
    pageState: {
      reacquired: true,
    },
    continuation: {
      task_continuation_ok: false,
      continuation_ready: false,
    },
  });

  assert.equal(result, false);
});

test('resume should stay unverified without reacquisition or continuation readiness', () => {
  const result = shouldMarkResumeVerified({
    verify: true,
    checkpointStillPresent: false,
    pageState: {
      reacquired: false,
    },
    continuation: {
      task_continuation_ok: null,
      continuation_ready: false,
    },
  });

  assert.equal(result, false);
});

test('resume_after_handoff passes state into the active page lookup', async () => {
  const calls = [];
  const server = { registerTool(name, spec, handler) { calls.push({ name, handler }); } };
  const state = {
    activeTaskId: 'task-a',
    pageState: {},
    handoff: { state: 'awaiting_reacquisition' },
  };
  let receivedArgs = null;

  registerHandoffTools(server, state, {
    getActivePage: async (args) => {
      receivedArgs = args;
      throw new Error('stop after lookup');
    },
  });

  const resume = calls.find((tool) => tool.name === 'resume_after_handoff');
  await assert.rejects(() => resume.handler());

  assert.equal(receivedArgs.state, state);
});

test('resume_after_handoff returns a normalized task-facing contract and verification envelope', async () => {
  const calls = [];
  const server = { registerTool(name, spec, handler) { calls.push({ name, handler }); } };
  const page = {
    url: () => 'https://example.com/dashboard',
    title: async () => 'Dashboard',
    evaluate: async (fn, arg) => {
      if (typeof arg === 'string') return true;
      return 'Dashboard body';
    },
  };
  const state = {
    activeTaskId: 'task-a',
    pageState: {
      currentRole: 'workspace',
      graspConfidence: 'high',
      reacquired: true,
      domRevision: 7,
      pageIdentity: 'dashboard',
      riskGateDetected: false,
    },
    handoff: {
      state: 'awaiting_reacquisition',
      expected_url_contains: 'example.com',
      expected_page_role: 'workspace',
      continuation_goal: 'resume_task',
    },
    hintMap: [],
  };
  const persisted = [];

  registerHandoffTools(server, state, {
    getActivePage: async () => page,
    syncPageState: async () => state,
    capturePageEvidence: async () => ({
      action: 'resume_after_handoff',
      url: 'https://example.com/dashboard',
      page_role: 'workspace',
      grasp_confidence: 'high',
      reacquired: true,
    }),
    readHandoffState: async () => state.handoff,
    writeHandoffState: async (snapshot) => {
      persisted.push(snapshot);
    },
    assessResumeContinuation: async () => ({
      required_checks: 2,
      passed_checks: 2,
      task_continuation_ok: true,
      continuation_ready: true,
      continuation_goal: 'resume_task',
      suggested_next_action: 'continue_task',
      checks: [],
    }),
    audit: async () => {},
  });

  const resume = calls.find((tool) => tool.name === 'resume_after_handoff');
  const result = await resume.handler({ verify: true });

  assert.deepEqual(result.meta.task, {
    status: 'resumed',
    reason: 'The task context was reacquired and the runtime has enough evidence to continue.',
    next_step: 'continue_task',
    next_step_human: 'continue_task',
    can_continue: true,
  });
  assert.deepEqual(result.meta.verification, {
    status: 'verified',
    summary: 'Resume evidence passed and the task can continue in the same browser context.',
    evidence: [],
    missing_evidence: [],
  });
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].state, 'resumed_verified');
});
