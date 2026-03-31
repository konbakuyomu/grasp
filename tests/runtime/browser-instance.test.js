import test from 'node:test';
import assert from 'node:assert/strict';

import { inferBrowserInstance } from '../../src/runtime/browser-instance.js';

test('inferBrowserInstance marks HeadlessChrome endpoints as headless', () => {
  const instance = inferBrowserInstance({
    Browser: 'HeadlessChrome/136.0.7103.114',
    'Protocol-Version': '1.3',
  });

  assert.deepEqual(instance, {
    browser: 'HeadlessChrome/136.0.7103.114',
    protocolVersion: '1.3',
    headless: true,
    display: 'headless',
    warning: 'Current endpoint is a headless browser, not a visible local browser window.',
  });
});

test('inferBrowserInstance marks Chrome endpoints as windowed instead of visible-local', () => {
  const instance = inferBrowserInstance({
    Browser: 'Chrome/136.0.7103.114',
    'Protocol-Version': '1.3',
  });

  assert.deepEqual(instance, {
    browser: 'Chrome/136.0.7103.114',
    protocolVersion: '1.3',
    headless: false,
    display: 'windowed',
    warning: null,
  });
});
