function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeStructuredLabel(value) {
  return normalizeWhitespace(value)
    .replace(/[：:]+$/u, '')
    .toLowerCase();
}

function scoreStructuredCandidate(field, candidate) {
  if (!field || !candidate) return 0;
  if (field === candidate) return 4;
  if (candidate.includes(field)) return 3;
  if (field.includes(candidate)) return 2;
  return 0;
}

export function matchStructuredFields(fields = [], candidates = []) {
  const normalizedCandidates = candidates.map((candidate, index) => ({
    index,
    label: normalizeWhitespace(candidate?.label),
    value: normalizeWhitespace(candidate?.value),
    strategy: candidate?.strategy ?? 'unknown',
    normalizedLabel: normalizeStructuredLabel(candidate?.label),
  })).filter((candidate) => candidate.label && candidate.value);
  const used = new Set();
  const record = {};
  const evidence = [];
  const missing_fields = [];

  for (const requestedField of fields) {
    const field = normalizeWhitespace(requestedField);
    const normalizedField = normalizeStructuredLabel(requestedField);
    const matches = normalizedCandidates
      .filter((candidate) => !used.has(candidate.index))
      .map((candidate) => ({
        ...candidate,
        score: scoreStructuredCandidate(normalizedField, candidate.normalizedLabel),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.label.length - right.label.length);

    if (matches.length === 0) {
      missing_fields.push(field);
      continue;
    }

    const best = matches[0];
    used.add(best.index);
    record[field] = best.value;
    evidence.push({
      field,
      label: best.label,
      value: best.value,
      strategy: best.strategy,
    });
  }

  return {
    requested_fields: fields.map((field) => normalizeWhitespace(field)).filter(Boolean),
    record,
    missing_fields,
    evidence,
  };
}

export async function extractStructuredContent(page, fields = []) {
  const candidates = await page.evaluate(() => {
    function normalizeWhitespace(value) {
      return String(value ?? '').replace(/\s+/g, ' ').trim();
    }

    function pushCandidate(target, label, value, strategy) {
      const normalizedLabel = normalizeWhitespace(label);
      const normalizedValue = normalizeWhitespace(value);
      if (!normalizedLabel || !normalizedValue) return;
      const key = `${strategy}::${normalizedLabel}::${normalizedValue}`;
      if (target.seen.has(key)) return;
      target.seen.add(key);
      target.items.push({
        label: normalizedLabel,
        value: normalizedValue,
        strategy,
      });
    }

    const target = { items: [], seen: new Set() };

    for (const term of document.querySelectorAll('dt')) {
      const detail = term.nextElementSibling;
      if (detail && detail.tagName?.toLowerCase() === 'dd') {
        pushCandidate(target, term.textContent, detail.textContent, 'definition_list');
      }
    }

    for (const row of document.querySelectorAll('tr')) {
      const headers = [...row.querySelectorAll('th')].map((cell) => normalizeWhitespace(cell.textContent)).filter(Boolean);
      const cells = [...row.querySelectorAll('td')].map((cell) => normalizeWhitespace(cell.textContent)).filter(Boolean);

      if (headers.length === 1 && cells.length >= 1) {
        pushCandidate(target, headers[0], cells.join(' '), 'table_row');
        continue;
      }

      if (headers.length === 0 && cells.length === 2) {
        pushCandidate(target, cells[0], cells[1], 'table_pair');
      }
    }

    const root = document.querySelector('main') || document.querySelector('article') || document.body;
    const lines = normalizeWhitespace(root?.innerText ?? '')
      .split('\n')
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean);

    for (const line of lines) {
      const separator = line.includes('：') ? '：' : line.includes(':') ? ':' : null;
      if (!separator) continue;
      const parts = line.split(separator);
      if (parts.length < 2) continue;
      const label = parts.shift();
      const value = parts.join(separator);
      pushCandidate(target, label, value, 'inline_pair');
    }

    return target.items;
  });

  return matchStructuredFields(fields, candidates);
}
