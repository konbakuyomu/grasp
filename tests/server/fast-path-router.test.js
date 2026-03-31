import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createFakePage } from '../helpers/fake-page.js';
import { readFastPath } from '../../src/server/fast-path-router.js';

test('readFastPath keeps the built-in BOSS adapter behavior', async () => {
  const page = createFakePage({
    url: () => 'https://www.zhipin.com/job_detail/123.html',
    title: () => '算法工程师 - BOSS直聘',
    evaluate: async (fn) => {
      const savedDocument = globalThis.document;
      globalThis.document = {
        title: '算法工程师 - BOSS直聘',
        querySelector: (selector) => {
          if (selector === '[data-url*="/wapi/zpgeek/friend/add.json"]') {
            return {
              innerText: '立即沟通',
              textContent: '立即沟通',
              getAttribute: (name) => (
                name === 'redirect-url'
                  ? '/chat/abc'
                  : name === 'data-url'
                    ? '/wapi/zpgeek/friend/add.json'
                    : null
              ),
            };
          }
          return null;
        },
        querySelectorAll: () => [],
      };

      try {
        return await fn();
      } finally {
        globalThis.document = savedDocument;
      }
    },
  });

  const result = await readFastPath(page, { adapterDirs: [] });

  assert.equal(result.surface, 'detail');
  assert.equal(result.title, '算法工程师 - BOSS直聘');
  assert.equal(result.url, 'https://www.zhipin.com/job_detail/123.html');
  assert.match(result.mainText, /立即沟通/);
});

test('readFastPath loads a local .js adapter without changing core code', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'grasp-fast-path-'));
  const adaptersDir = path.join(root, 'site-adapters');
  mkdirSync(adaptersDir, { recursive: true });
  writeFileSync(path.join(adaptersDir, 'example.js'), `
    export default {
      id: 'example',
      matches(url) {
        return url.includes('example.com');
      },
      async read(page) {
        return {
          surface: 'plugin',
          title: await page.title(),
          url: page.url(),
          mainText: 'loaded from js adapter'
        };
      }
    };
  `);

  const page = createFakePage({
    url: () => 'https://example.com/demo',
    title: () => 'Example Demo',
  });

  const result = await readFastPath(page, { adapterDirs: [adaptersDir] });

  assert.deepEqual(result, {
    surface: 'plugin',
    title: 'Example Demo',
    url: 'https://example.com/demo',
    mainText: 'loaded from js adapter',
  });
});

test('readFastPath loads a .skill manifest that points at a .js adapter', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'grasp-fast-path-skill-'));
  const adaptersDir = path.join(root, 'site-adapters');
  const entriesDir = path.join(adaptersDir, 'entries');
  mkdirSync(adaptersDir, { recursive: true });
  mkdirSync(entriesDir, { recursive: true });
  writeFileSync(path.join(entriesDir, 'skill-target.js'), `
    export const adapter = {
      id: 'skill-target',
      matches(url) {
        return url.includes('skill.example');
      },
      async read(page) {
        return {
          surface: 'skill-plugin',
          title: await page.title(),
          url: page.url(),
          mainText: 'loaded from skill manifest'
        };
      }
    };
  `);
  writeFileSync(path.join(adaptersDir, 'skill-target.skill'), `---
name: skill-target
entry: ./entries/skill-target.js
---
`);

  const page = createFakePage({
    url: () => 'https://skill.example/chat',
    title: () => 'Skill Example',
  });

  const result = await readFastPath(page, { adapterDirs: [adaptersDir] });

  assert.deepEqual(result, {
    surface: 'skill-plugin',
    title: 'Skill Example',
    url: 'https://skill.example/chat',
    mainText: 'loaded from skill manifest',
  });
});

test('readFastPath also supports plain-text .skill manifests with adapter entries', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'grasp-fast-path-plain-skill-'));
  const adaptersDir = path.join(root, 'site-adapters');
  const entriesDir = path.join(adaptersDir, 'entries');
  mkdirSync(adaptersDir, { recursive: true });
  mkdirSync(entriesDir, { recursive: true });
  writeFileSync(path.join(entriesDir, 'plain-target.js'), `
    export default {
      id: 'plain-target',
      matches(url) {
        return url.includes('plain.skill.example');
      },
      async read(page) {
        return {
          surface: 'plain-skill-plugin',
          title: await page.title(),
          url: page.url(),
          mainText: 'loaded from plain skill manifest'
        };
      }
    };
  `);
  writeFileSync(path.join(adaptersDir, 'plain-target.skill'), `
This is a lightweight Grasp adapter manifest.
adapter: ./entries/plain-target.js
`);

  const page = createFakePage({
    url: () => 'https://plain.skill.example/runtime',
    title: () => 'Plain Skill Example',
  });

  const result = await readFastPath(page, { adapterDirs: [adaptersDir] });

  assert.deepEqual(result, {
    surface: 'plain-skill-plugin',
    title: 'Plain Skill Example',
    url: 'https://plain.skill.example/runtime',
    mainText: 'loaded from plain skill manifest',
  });
});

test('readFastPath supports .skill manifests whose adapter entry lives below frontmatter', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'grasp-fast-path-body-skill-'));
  const adaptersDir = path.join(root, 'site-adapters');
  const entriesDir = path.join(adaptersDir, 'entries');
  mkdirSync(adaptersDir, { recursive: true });
  mkdirSync(entriesDir, { recursive: true });
  writeFileSync(path.join(entriesDir, 'body-target.js'), `
    export default {
      id: 'body-target',
      matches(url) {
        return url.includes('body.skill.example');
      },
      async read(page) {
        return {
          surface: 'body-skill-plugin',
          title: await page.title(),
          url: page.url(),
          mainText: 'loaded from body entry manifest'
        };
      }
    };
  `);
  writeFileSync(path.join(adaptersDir, 'body-target.skill'), `---
name: body-target
description: lightweight manifest
---
adapter: ./entries/body-target.js
`);

  const page = createFakePage({
    url: () => 'https://body.skill.example/runtime',
    title: () => 'Body Skill Example',
  });

  const result = await readFastPath(page, { adapterDirs: [adaptersDir] });

  assert.deepEqual(result, {
    surface: 'body-skill-plugin',
    title: 'Body Skill Example',
    url: 'https://body.skill.example/runtime',
    mainText: 'loaded from body entry manifest',
  });
});
