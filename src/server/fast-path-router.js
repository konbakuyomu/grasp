import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { bossFastPathAdapter } from './boss-fast-path.js';

const DEFAULT_ADAPTER_DIR = path.join(os.homedir(), '.grasp', 'site-adapters');

function normalizeEntry(value) {
  return String(value ?? '').trim();
}

function parseSkillEntry(source) {
  const text = String(source ?? '');
  const frontmatterMatch = text.match(/^---\s*([\s\S]*?)\s*---/);
  const candidates = [
    frontmatterMatch?.[1] ?? '',
    text,
  ];

  for (const candidate of candidates) {
    const entryMatch = candidate.match(/^(?:entry|adapter)\s*:\s*(.+)$/m);
    if (entryMatch) {
      return normalizeEntry(entryMatch[1]);
    }
  }

  return '';
}

function normalizeAdapter(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const matches = typeof candidate.matches === 'function'
    ? candidate.matches.bind(candidate)
    : typeof candidate.match === 'function'
      ? candidate.match.bind(candidate)
      : null;
  const read = typeof candidate.read === 'function'
    ? candidate.read.bind(candidate)
    : null;

  if (!matches || !read) {
    return null;
  }

  return {
    id: normalizeEntry(candidate.id) || 'external-adapter',
    matches,
    read,
  };
}

async function importAdapterModule(modulePath, loader = (target) => import(target)) {
  const mod = await loader(pathToFileURL(modulePath).href);
  return normalizeAdapter(mod.default ?? mod.adapter ?? mod);
}

async function loadAdaptersFromDir(dirPath, deps = {}) {
  const {
    readdirImpl = readdir,
    readFileImpl = readFile,
    importModule = (target) => import(target),
  } = deps;

  if (!dirPath || !existsSync(dirPath)) {
    return [];
  }

  const entries = await readdirImpl(dirPath, { withFileTypes: true });
  const adapters = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const filePath = path.join(dirPath, entry.name);
    if (entry.name.endsWith('.js')) {
      const adapter = await importAdapterModule(filePath, importModule);
      if (adapter) adapters.push(adapter);
      continue;
    }

    if (entry.name.endsWith('.skill')) {
      const skillSource = await readFileImpl(filePath, 'utf8');
      const relativeEntry = parseSkillEntry(skillSource);
      if (!relativeEntry) continue;
      const targetPath = path.resolve(path.dirname(filePath), relativeEntry);
      const adapter = await importAdapterModule(targetPath, importModule);
      if (adapter) adapters.push(adapter);
    }
  }

  return adapters;
}

export async function resolveFastPathAdapters(deps = {}) {
  const adapterDirs = Array.isArray(deps.adapterDirs)
    ? deps.adapterDirs
    : [process.env.GRASP_SITE_ADAPTER_DIR || DEFAULT_ADAPTER_DIR].filter(Boolean);
  const externalAdapters = [];

  for (const dirPath of adapterDirs) {
    const loaded = await loadAdaptersFromDir(dirPath, deps);
    externalAdapters.push(...loaded);
  }

  return [bossFastPathAdapter, ...externalAdapters];
}

export async function readFastPath(page, deps = {}) {
  const adapters = await resolveFastPathAdapters(deps);
  const currentUrl = page.url();

  for (const adapter of adapters) {
    if (!adapter.matches(currentUrl)) {
      continue;
    }

    const result = await adapter.read(page, { url: currentUrl });
    if (result) {
      return result;
    }
  }

  return null;
}

export async function readBossFastPath(page) {
  return readFastPath(page, { adapterDirs: [] });
}
