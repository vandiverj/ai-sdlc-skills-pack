import { join, relative, resolve } from 'node:path';
import { appendControlJsonLine, fail, readJsonIfExists, readJsonLines, safeWriteJsonFile } from './common.mjs';
import { defaultRunsDir } from './paths.mjs';

export function learnExport(repo, options = {}) {
  const rows = readJsonLines(defaultLearningBacklogPath(repo)).map(sanitizePortableObject);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'sdlc-learnings.sanitized.json');
  safeWriteJsonFile(repo, outPath, { schema: 'sdlc-sanitized-learning-export-v1', exportedAt: new Date().toISOString(), rows });
  console.log(relative(repo, outPath));
}

export function learnImport(repo, options = {}) {
  if (!options.file) fail('Pass --file <path>.');
  const input = readJsonIfExists(resolve(repo, options.file));
  const rows = Array.isArray(input?.rows) ? input.rows : Array.isArray(input) ? input : [];
  const target = defaultLearningBacklogPath(repo);
  for (const row of rows) appendControlJsonLine(repo, target, { ...row, importedAt: new Date().toISOString(), importReviewRequired: true });
  console.log(`${rows.length} learning rows imported to ${relative(repo, target)}`);
}

function sanitizePortableObject(value) {
  if (Array.isArray(value)) return value.map(sanitizePortableObject);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = sanitizePortableObject(item);
    return out;
  }
  if (typeof value !== 'string') return value;
  return sanitizeOneLine(value)
    .replace(/\/Users\/[^\s/]+/g, '/Users/[redacted]')
    .replace(/https?:\/\/[^\s)]+/gi, '[redacted-url]')
    .replace(/\b[A-Z]{1,10}-\d{1,8}\b/g, '[ticket-id]')
    .replace(/\b(?:client|customer|company|tenant)[-_ ]?[A-Za-z0-9]+\b/gi, '[redacted-entity]');
}

function defaultLearningBacklogPath(repo) {
  return join(repo, '.ai-local', 'sdlc-learning-backlog.jsonl');
}

function sanitizeOneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}
