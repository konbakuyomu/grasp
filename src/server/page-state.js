export function createPageState() {
  return {
    lastUrl: null,
    domRevision: 0,
    lastSnapshotHash: null,
  };
}

export function applySnapshotToPageState(state, { url, snapshotHash }) {
  const next = {
    ...state,
    lastUrl: url,
    lastSnapshotHash: snapshotHash,
  };

  const sameUrl = state.lastUrl === url;

  if (!sameUrl) {
    next.domRevision = 0;
  } else if (state.lastSnapshotHash && state.lastSnapshotHash !== snapshotHash) {
    next.domRevision = state.domRevision + 1;
  } else {
    next.domRevision = state.domRevision;
  }

  return next;
}
