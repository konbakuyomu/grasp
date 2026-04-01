import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflowPath = new URL('../../.github/workflows/npm-publish.yml', import.meta.url);

test('npm publish workflow is manual-only and keeps npm auth/version checks', () => {
  const workflow = readFileSync(workflowPath, 'utf8');

  assert.doesNotMatch(workflow, /push:\s*\n\s+tags:\s*\n\s+-\s*['"]v\*['"]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /npm publish --access public/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /npm whoami/);
  assert.match(workflow, /NPM_TOKEN/);
  assert.match(workflow, /github\.ref_name/);
  assert.match(workflow, /package\.json/);
});
