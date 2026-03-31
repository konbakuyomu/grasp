import test from 'node:test';
import assert from 'node:assert/strict';

import { matchStructuredFields } from '../../src/server/structured-extraction.js';

test('matchStructuredFields prefers exact label matches and reports missing fields', () => {
  const result = matchStructuredFields(
    ['公司名称', '职位', '邮箱'],
    [
      { label: '公司', value: 'Example Inc', strategy: 'inline_pair' },
      { label: '职位', value: '前端工程师', strategy: 'table_row' },
      { label: '公司名称', value: 'OpenAI', strategy: 'definition_list' },
    ],
  );

  assert.deepEqual(result.record, {
    公司名称: 'OpenAI',
    职位: '前端工程师',
  });
  assert.deepEqual(result.missing_fields, ['邮箱']);
  assert.deepEqual(result.evidence, [
    { field: '公司名称', label: '公司名称', value: 'OpenAI', strategy: 'definition_list' },
    { field: '职位', label: '职位', value: '前端工程师', strategy: 'table_row' },
  ]);
});

test('matchStructuredFields normalizes label punctuation before matching', () => {
  const result = matchStructuredFields(
    ['公司名称', '城市'],
    [
      { label: '公司名称：', value: 'OpenAI', strategy: 'inline_pair' },
      { label: '城市 :', value: 'San Francisco', strategy: 'inline_pair' },
    ],
  );

  assert.deepEqual(result.record, {
    公司名称: 'OpenAI',
    城市: 'San Francisco',
  });
  assert.deepEqual(result.missing_fields, []);
});
