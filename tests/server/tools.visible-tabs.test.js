import test from 'node:test';
import assert from 'node:assert/strict';

import { registerActionTools } from '../../src/server/tools.actions.js';
import { createFakePage } from '../helpers/fake-page.js';
import { storeRuntimeConfirmation } from '../../src/server/runtime-confirmation.js';

test('list_visible_tabs returns user tabs with active tab metadata', async () => {
  const calls = [];
  const server = {
    registerTool(name, spec, handler) {
      calls.push({ name, spec, handler });
    },
  };
  const page = createFakePage({
    url: () => 'https://example.com/chatgpt',
    title: () => 'ChatGPT',
  });
  const state = {
    pageState: { currentRole: 'content', graspConfidence: 'high', riskGateDetected: false },
    handoff: { state: 'idle' },
  };

  registerActionTools(server, state, {
    getActivePage: async () => page,
    getTabs: async () => ([
      { index: 0, title: 'Extensions', url: 'chrome://extensions', isUser: false },
      { index: 1, title: 'ChatGPT', url: 'https://example.com/chatgpt', isUser: true },
      { index: 2, title: 'Gemini', url: 'https://example.com/gemini', isUser: true },
    ]),
  });

  const listVisibleTabs = calls.find((tool) => tool.name === 'list_visible_tabs');
  const result = await listVisibleTabs.handler();

  assert.equal(result.meta.tabs.length, 2);
  assert.equal(result.meta.tabs[0].active, true);
  assert.equal(result.meta.tabs[1].active, false);
  assert.match(result.content[0].text, /\[1\] ChatGPT/);
  assert.doesNotMatch(result.content[0].text, /chrome:\/\/extensions/);
});

test('select_visible_tab matches by title or url fragment and brings the tab to front', async () => {
  const calls = [];
  const server = {
    registerTool(name, spec, handler) {
      calls.push({ name, spec, handler });
    },
  };
  const runtimeInstance = {
    browser: 'Chrome/136.0.7103.114',
    protocolVersion: '1.3',
    display: 'windowed',
    headless: false,
    warning: null,
  };
  const state = {
    pageState: { currentRole: 'content', graspConfidence: 'high', riskGateDetected: false },
    handoff: { state: 'idle' },
  };
  storeRuntimeConfirmation(state, runtimeInstance);

  let switchedIndex = null;
  const switchedPage = createFakePage({
    url: () => 'https://example.com/gemini',
    title: () => 'Gemini',
  });

  registerActionTools(server, state, {
    getBrowserInstance: async () => runtimeInstance,
    getTabs: async () => ([
      { index: 1, title: 'ChatGPT', url: 'https://example.com/chatgpt', isUser: true },
      { index: 2, title: 'Gemini', url: 'https://example.com/gemini', isUser: true },
    ]),
    switchTab: async (index) => {
      switchedIndex = index;
      return switchedPage;
    },
    syncPageState: async (_page, currentState, options) => {
      currentState.pageState = state.pageState;
      assert.deepEqual(options, { force: true });
      return currentState;
    },
  });

  const selectVisibleTab = calls.find((tool) => tool.name === 'select_visible_tab');
  const result = await selectVisibleTab.handler({ query: 'gemini' });

  assert.equal(switchedIndex, 2);
  assert.equal(result.meta.tab.title, 'Gemini');
  assert.match(result.content[0].text, /Selected tab \[2\]: Gemini/);
});
