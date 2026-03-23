import test from 'node:test';
import assert from 'node:assert/strict';
import { registerWorkspaceTools } from '../../src/server/tools.workspace.js';

test('workspace_inspect returns task_kind workspace with live items and composer state', async () => {
  const calls = [];
  const server = { registerTool(name, spec, handler) { calls.push({ name, handler }); } };
  const state = {
    pageState: { currentRole: 'workspace', workspaceSurface: 'thread', graspConfidence: 'high', riskGateDetected: false },
    handoff: { state: 'idle' },
  };

  registerWorkspaceTools(server, state, {
    getActivePage: async () => ({ title: async () => 'BOSS直聘', url: () => 'https://www.zhipin.com/web/geek/chat?id=1' }),
    syncPageState: async () => undefined,
    collectVisibleWorkspaceSnapshot: async () => ({
      workspace_surface: 'thread',
      live_items: [{ label: '李女士', selected: true }],
      active_item: { label: '李女士' },
      composer: { kind: 'chat_composer', draft_present: false },
      action_controls: [{ label: '发送', action_kind: 'send' }],
      blocking_modals: [],
      loading_shell: false,
      summary: { active_item_label: '李女士', draft_present: false, loading_shell: false },
    }),
  });

  const tool = calls.find((entry) => entry.name === 'workspace_inspect');
  const result = await tool.handler({});

  assert.equal(result.meta.result.task_kind, 'workspace');
  assert.equal(result.meta.result.workspace.workspace_surface, 'thread');
  assert.equal(result.meta.result.workspace.live_items.length, 1);
});

test('workspace_inspect short-circuits blocked handoff and gated pages', async () => {
  const cases = [
    { handoffState: 'handoff_required', expectedStatus: 'handoff_required' },
    { handoffState: 'handoff_in_progress', expectedStatus: 'handoff_required' },
    { handoffState: 'awaiting_reacquisition', expectedStatus: 'handoff_required' },
    { handoffState: 'idle', riskGateDetected: true, expectedStatus: 'gated' },
  ];

  for (const testCase of cases) {
    const calls = [];
    const server = { registerTool(name, spec, handler) { calls.push({ name, handler }); } };
    const state = {
      pageState: { currentRole: 'workspace', workspaceSurface: 'thread', graspConfidence: 'high', riskGateDetected: testCase.riskGateDetected === true },
      handoff: { state: testCase.handoffState },
    };

    registerWorkspaceTools(server, state, {
      getActivePage: async () => ({ title: async () => 'BOSS直聘', url: () => 'https://www.zhipin.com/web/geek/chat?id=1' }),
      syncPageState: async () => undefined,
      collectVisibleWorkspaceSnapshot: async () => ({
        workspace_surface: 'thread',
        live_items: [{ label: '李女士', selected: true }],
        active_item: { label: '李女士' },
        composer: { kind: 'chat_composer', draft_present: true },
        action_controls: [{ label: '发送', action_kind: 'send' }],
        blocking_modals: [],
        loading_shell: false,
        summary: { active_item_label: '李女士', draft_present: true, loading_shell: false },
      }),
    });

    const tool = calls.find((entry) => entry.name === 'workspace_inspect');
    const before = JSON.parse(JSON.stringify(state));
    const result = await tool.handler({});

    assert.equal(result.meta.status, testCase.expectedStatus);
    assert.equal(result.meta.continuation.suggested_next_action, 'request_handoff');
    assert.deepEqual(state, before);
  }
});
