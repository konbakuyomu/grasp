import test from 'node:test';
import assert from 'node:assert/strict';
import { textResponse, errorResponse } from '../../src/server/responses.js';

const retryMeta = {
  retry: {
    attempt: 2,
    maxAttempts: 5,
  },
};

const traceMeta = {
  traceId: 'trace-123',
};

test('errorResponse passes retry metadata through', () => {
  const response = errorResponse('ouch', retryMeta);

  assert.strictEqual(response.isError, true);
  assert.deepStrictEqual(response.meta, retryMeta);
  assert.strictEqual(response.content[0].text, 'ouch');
});

test('textResponse forwards metadata when provided', () => {
  const response = textResponse('hello world', traceMeta);

  assert.deepStrictEqual(response.meta, traceMeta);
  assert.strictEqual(response.content[0].text, 'hello world');
});
