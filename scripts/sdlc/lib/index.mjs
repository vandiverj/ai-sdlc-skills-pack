import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fail, printTable, readJsonIfExists, safeWriteJsonFile } from './common.mjs';
import { loadProfile } from './profile.mjs';
import { affectedUnits, normalizeUnitPath } from './units.mjs';

export function indexBuild(repo, options = {}) {
  const files = scanIndexFiles(repo);
  const records = files.map((file) => indexRecord(repo, file));
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'sdlc-index.json');
  safeWriteJsonFile(repo, outPath, { schema: 'sdlc-local-index-v1', generatedAt: new Date().toISOString(), repo, records });
  console.log(`${records.length} records -> ${relative(repo, outPath)}`);
}

export function indexQuery(repo, options = {}) {
  const indexPath = options.index ? resolve(repo, options.index) : join(repo, '.ai-local', 'sdlc-index.json');
  const index = readJsonIfExists(indexPath);
  if (!index) fail('No index found. Run sdlc index build first.');
  const kind = options.kind || '';
  const unit = options.unit || '';
  const topic = String(options.topic || options.q || '').toLowerCase();
  const rows = (index.records || []).filter((record) => (!kind || record.kind === kind) && (!unit || record.unit === unit) && (!topic || `${record.path} ${record.headings || ''}`.toLowerCase().includes(topic))).slice(0, Number(options.limit || 80));
  printTable(['Kind', 'Unit', 'Path', 'Summary'], rows.map((row) => [row.kind, row.unit || '', row.path, row.summary || '']));
}

export function scanIndexFiles(repo) {
  const results = [];
  const ignored = ['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.ai-local/sdlc-runs'];
  function walk(dir, depth) {
    if (depth > 5 || results.length > 1200) return;
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = normalizeUnitPath(relative(repo, full));
      if (ignored.some((item) => rel === item || rel.startsWith(`${item}/`))) continue;
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (indexKind(rel)) results.push(full);
    }
  }
  walk(repo, 0);
  return results;
}

export function indexKind(rel) {
  const value = rel.toLowerCase();
  if (value.endsWith('.md') || value.includes('/docs/')) return 'docs';
  if (value.includes('test') || value.includes('spec')) return 'tests';
  if (value.includes('openapi') || value.includes('swagger') || value.endsWith('.http')) return 'api';
  if (/(package\.json|\.csproj|\.sln|deno\.json|tsconfig\.json|vite\.config|next\.config|appsettings|web\.config)$/.test(value)) return 'config';
  if (/\.(cs|ts|tsx|js|jsx|asp|aspx|sql)$/.test(value)) return 'code';
  return '';
}

export function indexRecord(repo, file) {
  const rel = normalizeUnitPath(relative(repo, file));
  const text = safeReadSmall(file, 5000);
  const profile = loadProfile(repo);
  const unit = affectedUnits(repo, [rel], profile)[0];
  return { path: rel, kind: indexKind(rel), unit: unit?.name || '', headings: (text.match(/^#{1,4}\s+.+$/gm) || []).slice(0, 10).join(' | '), summary: summarizeIndexFile(rel, text) };
}

export function safeReadSmall(path, limit) {
  try { return readFileSync(path, 'utf8').slice(0, limit); } catch { return ''; }
}

export function summarizeIndexFile(rel, text) {
  if (rel.endsWith('package.json')) return 'package manifest';
  if (rel.endsWith('.csproj')) return 'dotnet project';
  const first = String(text || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
  return first.slice(0, 120);
}
