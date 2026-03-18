import { probe, listTools } from '../layer1-bridge/webmcp.js';
import { buildHintMap } from '../layer2-perception/hints.js';
import { createPageState, applySnapshotToPageState } from './page-state.js';

export function isSafeModeEnabled() {
  return process.env.GRASP_SAFE_MODE !== 'false';
}

export function createServerState() {
  return {
    webmcp: null,
    hintMap: [],
    lastUrl: null,
    hintRegistry: new Map(),   // fingerprint → id，跨调用保持稳定
    hintCounters: { B: 0, I: 0, L: 0, S: 0 },
    safeMode: isSafeModeEnabled(),
    pageState: createPageState(),
  };
}

export async function syncPageState(page, state, { force = false } = {}) {
  const url = page.url();
  const snapshotData = await page.evaluate(() => {
    const bodyText = document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 500) ?? '';
    const nodes = document.querySelectorAll('button,a,input,textarea,select,[role],[contenteditable]').length;
    return { bodyText, nodes };
  });

  const snapshotHash = `${url}|${snapshotData.nodes}|${snapshotData.bodyText}`;
  const prevPageState = state.pageState ?? createPageState();
  const nextPageState = applySnapshotToPageState(prevPageState, { url, snapshotHash });
  const urlChanged = prevPageState.lastUrl !== url;
  const domRevisionChanged = prevPageState.domRevision !== nextPageState.domRevision;
  state.pageState = nextPageState;
  state.lastUrl = nextPageState.lastUrl;

  const needsRefresh = force || state.webmcp === null || urlChanged || domRevisionChanged;

  if (!needsRefresh) {
    return state;
  }

  // URL 变化 → 新页面，清空 hint 注册表
  if (urlChanged) {
    state.hintRegistry = new Map();
    state.hintCounters = { B: 0, I: 0, L: 0, S: 0 };
  }

  const webmcp = await probe(page);
  state.lastUrl = url;

  if (webmcp.available) {
    const tools = await listTools(page, webmcp);
    state.webmcp = { ...webmcp, tools };
    state.hintMap = [];
    return state;
  }

  state.webmcp = webmcp;
  state.hintMap = await buildHintMap(page, state.hintRegistry, state.hintCounters);
  return state;
}

export function describeMode(state) {
  if (state.webmcp?.available) {
    return {
      mode: 'WebMCP',
      detail: `WebMCP via ${state.webmcp.source} (${state.webmcp.tools?.length ?? 0} native tools)`,
      summary: `WebMCP (${state.webmcp.tools?.length ?? 0} native tools)`,
    };
  }

  return {
    mode: 'CDP',
    detail: 'CDP (Hint Map + Mouse Events)',
    summary: 'CDP (Hint Map + Mouse Events)',
  };
}
