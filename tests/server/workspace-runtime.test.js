import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLiveItem,
  resolveComposer,
  createWorkspaceWriteEvidence,
  executeGuardedAction,
} from '../../src/server/workspace-runtime.js';

test('resolveLiveItem matches by normalized label and returns ambiguity when needed', async () => {
  const exact = await resolveLiveItem({
    live_items: [
      { label: '李女士', normalized_label: '李女士', hint_id: 'L1' },
      { label: '胡女士', normalized_label: '胡女士', hint_id: 'L2' },
    ],
  }, '李女士');

  assert.equal(exact.item.label, '李女士');
  assert.equal(exact.ambiguous, false);
});

test('resolveLiveItem prefers the hint-backed item when duplicates exist', async () => {
  const result = await resolveLiveItem({
    live_items: [
      { label: '李女士', normalized_label: '李女士' },
      { label: '李女士', normalized_label: '李女士', hint_id: 'L1' },
    ],
  }, '李女士');

  assert.equal(result.item.hint_id, 'L1');
  assert.equal(result.ambiguous, false);
});

test('resolveComposer reports loading_shell when the workspace is still loading', async () => {
  const result = await resolveComposer({
    loading_shell: true,
  });

  assert.equal(result.composer, null);
  assert.equal(result.unresolved.reason, 'loading_shell');
});

test('createWorkspaceWriteEvidence reports draft-side effects for composer writes', () => {
  const evidence = createWorkspaceWriteEvidence({ kind: 'draft_action', target: 'chat_composer' });
  assert.equal(evidence.autosave_possible, true);
  assert.equal(evidence.write_side_effect, 'draft_mutation_possible');
});

test('executeGuardedAction refreshes and persists a snapshot with outcome signals', async () => {
  const persisted = [];
  const result = await executeGuardedAction({
    runtime: {
      snapshot: {
        body_text: '已发送',
        live_items: [],
        composer: { kind: 'chat_composer', draft_present: false },
        blocking_modals: [],
        loading_shell: false,
      },
      refreshSnapshot: async () => ({
        body_text: '已发送',
        live_items: [],
        composer: { kind: 'chat_composer', draft_present: false },
        blocking_modals: [],
        loading_shell: false,
      }),
      persistSnapshot: async (snapshot) => {
        persisted.push(snapshot);
      },
    },
    execute: async () => ({ ok: true }),
    verify: async ({ snapshot }) => {
      assert.equal(snapshot.outcome_signals.delivered, true);
      return { ok: true };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(persisted[0].outcome_signals.delivered, true);
});
