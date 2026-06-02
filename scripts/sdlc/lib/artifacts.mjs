import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { escapeCell, formatList, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteJsonFile, writeOrPrint } from './common.mjs';
import { defaultRunsDir } from './paths.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';

export function artifactBudget(repo, options = {}) {
  const route = options.route || 'standard';
  const budget = artifactBudgetForRoute(route, options.size || '');
  printObject({
    repository: repo,
    route,
    budget: budget.name,
    requiredArtifacts: budget.required.join(', '),
    optionalArtifacts: budget.optional.join(', ') || 'none',
    chatRule: budget.chatRule,
  });
  console.log('\n## Final Response Shape\n');
  console.log(formatList(['changed files', 'checks', 'QA readiness', 'open caps', 'commit/push status', 'next action', 'confidence block']));
}

export function artifactBudgetForRoute(route, size = '') {
  if (size === 'micro' || route === 'tiny-docs') return {
    name: 'micro/tiny',
    required: ['changed-files summary', 'one verification check or explicit cap', 'final confidence block'],
    optional: ['context placement note when durable truth changed'],
    chatRule: 'keep preflight and final response inline; no packet unless a gate appears',
  };
  if (['multi-repo-integration', 'bugfix-live-system', 'contract-first', 'release-push'].includes(route)) return {
    name: 'expanded evidence',
    required: ['preflight packet', 'route-specific packet', 'per-unit/per-repo checks', 'QA Markdown when human QA is involved', 'finish decision'],
    optional: ['security/risk packet', 'context bucket check', 'learning packet'],
    chatRule: 'summarize decisions in chat; keep dense evidence in packets',
  };
  if (route === 'ui-rendered-review') return {
    name: 'rendered workflow',
    required: ['preflight or route packet', 'rendered/behavior evidence or cap', 'verification packet', 'finish confidence block'],
    optional: ['QA Markdown', 'accessibility note when suggested/required'],
    chatRule: 'show only visual result, checks, caps, and next action',
  };
  return {
    name: 'standard',
    required: ['preflight summary', 'touched/impact awareness', 'verification evidence or cap', 'finish confidence block'],
    optional: ['QA Markdown', 'context update plan', 'learning capture'],
    chatRule: 'one-screen summary unless high-risk signals appear',
  };
}

export function formatArtifactBudget(budget) {
  return formatList([
    `Budget: ${budget.name}`,
    `Required: ${budget.required.join('; ')}`,
    `Optional: ${budget.optional.join('; ') || 'none'}`,
    `Chat rule: ${budget.chatRule}`,
  ]);
}

export function artifactValidate(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || defaultRunsDir(repo);
  const findings = artifactFindings(runDir);
  printTable(['Status', 'Artifact', 'Detail'], findings.map((item) => [item.status, item.artifact, item.detail]));
  if (findings.some((item) => item.status === 'block')) process.exitCode = 1;
}

export function artifactSummarize(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || defaultRunsDir(repo);
  const findings = artifactFindings(runDir);
  const lines = ['# SDLC Artifact Summary', '', `Run root: ${runDir}`, '', '| Status | Artifact | Detail |', '| --- | --- | --- |', ...findings.map((item) => `| ${item.status} | ${escapeCell(item.artifact)} | ${escapeCell(item.detail)} |`), ''];
  writeOrPrint(repo, options.out, lines.join('\n'));
}

export function artifactMigrate(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || ensureControlRunDir(repo, options, options.task || 'migration');
  const marker = join(runDir, 'artifact-migration.json');
  safeWriteJsonFile(repo, marker, { schema: 'sdlc-artifact-migration-v1', migratedAt: new Date().toISOString(), action: 'no-op-current-version' });
  console.log(relative(repo, marker));
}

export function artifactFindings(runDir) {
  const expected = ['state.json', 'evidence.json', 'checks.jsonl', 'gates.jsonl', 'waivers.jsonl', 'trace.jsonl'];
  if (!existsSync(runDir)) return [{ status: 'block', artifact: runDir, detail: 'run directory not found' }];
  return expected.map((file) => {
    const path = join(runDir, file);
    if (!existsSync(path)) return { status: ['waivers.jsonl', 'gates.jsonl'].includes(file) ? 'warn' : 'block', artifact: file, detail: 'missing' };
    if (file.endsWith('.json') && !readJsonIfExists(path)) return { status: 'block', artifact: file, detail: 'invalid json' };
    if (file.endsWith('.jsonl') && readJsonLines(path).some((row) => row.parseError)) return { status: 'block', artifact: file, detail: 'invalid jsonl row' };
    return { status: 'pass', artifact: file, detail: 'present' };
  });
}
