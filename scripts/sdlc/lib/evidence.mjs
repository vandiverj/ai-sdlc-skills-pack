import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, dedupeBy, escapeCell, fail, formatList, optionFiles, printObject, readJsonIfExists, readJsonLines, safeWriteJsonFile, slug, stamp, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { ensureControlRunDir, readCurrentState, readCurrentStateInfo } from './state.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';
import { externalEvidenceProfile } from './tools.mjs';
import { inferTestingSurfaces, matchesAny, qaModeForSurfaces } from './units.mjs';
import { taskContract } from './contract.mjs';

export function evidenceInit(repo, options = {}) {
  const route = options.route || 'standard';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-evidence.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Evidence Packet

Date: ${new Date().toISOString()}
Route: ${route}
Repository: ${repo}
Branch: ${git.branch}
Upstream: ${git.upstream}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Intent
-

## Scope
-

## Changed Files

${formatList(git.changedFiles)}

## Checks

| Command | Result | Notes |
| --- | --- | --- |
|  |  |  |

## Evidence Caps
-

## Review Notes
-

## Handoff
- Suggested next action:
- Human approvals needed:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function evidenceRequired(repo, options = {}) {
  const task = options.task || readCurrentState(repo, options)?.task || '';
  if (!task) fail('Pass --task "..." or initialize state first.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const requirements = evidenceRequirementsForTask(repo, task, route, git, profile, options);
  const runDir = ensureControlRunDir(repo, options, task);
  const manifest = ensureEvidenceManifest(repo, runDir, task, route, options);
  manifest.required = requirements;
  manifest.updatedAt = new Date().toISOString();
  safeWriteJsonFile(repo, join(runDir, 'evidence.json'), manifest);
  printObject({ task, route, required: requirements.filter((item) => item.level === 'required').length, recommended: requirements.filter((item) => item.level === 'recommended').length });
  printEvidenceRows(requirements);
}

export function evidenceStatus(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task || '';
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task || 'current-task');
  const route = options.route || stateInfo.state?.route || inferRouteFromTask(task, getGitInfo(repo), loadProfile(repo).values);
  const manifest = ensureEvidenceManifest(repo, runDir, task, route, options);
  const rows = evidenceStatusRows(repo, runDir, manifest);
  printObject({ task: task || 'not provided', route, result: rows.some((row) => row.status === 'missing') ? 'open' : 'satisfied' });
  printEvidenceStatusRows(rows);
  if (rows.some((row) => row.status === 'missing' && row.level === 'required')) process.exitCode = 1;
}

export function evidenceAdd(repo, options = {}) {
  const kind = options.kind || '';
  const summary = options.summary || '';
  if (!kind || !summary) fail('Pass --kind <kind> and --summary "...".');
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task || '';
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task || 'current-task');
  const manifest = ensureEvidenceManifest(repo, runDir, task, stateInfo.state?.route || options.route || 'standard', options);
  const item = {
    id: options.id || `${kind}-${Date.now()}`,
    kind,
    summary,
    path: options.path || '',
    status: options.status || 'captured',
    capturedAt: new Date().toISOString(),
  };
  manifest.captured = [...(manifest.captured || []), item];
  manifest.updatedAt = item.capturedAt;
  safeWriteJsonFile(repo, join(runDir, 'evidence.json'), manifest);
  appendEvidenceTrace(repo, runDir, 'evidence', `added ${kind} evidence`, item);
  printObject(item);
}

export function evidencePlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const rows = evidenceRequirementsForTask(repo, task, route, git, profile, options);
  const content = ['# SDLC Evidence Plan', '', `Task: ${task}`, `Route: ${route}`, '', '| Evidence | Level | Summary |', '| --- | --- | --- |', ...rows.map((row) => `| ${escapeCell(row.id)} | ${row.level} | ${escapeCell(row.summary)} |`), ''].join('\n');
  writeOrPrint(repo, options.out, content);
}

export function evidenceMatrix(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const matrix = buildEvidenceMatrix(repo, task, options);
  const content = renderEvidenceMatrix(matrix);
  writeOrPrint(repo, options.out, content);
}

export function evidenceGap(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const matrix = buildEvidenceMatrix(repo, task, options);
  const gaps = matrix.rows.filter((row) => row.status !== 'satisfied');
  printObject({ task, route: matrix.route, criteria: matrix.rows.length, gaps: gaps.length, result: gaps.some((row) => row.required) ? 'open' : 'advisory' });
  console.log('\n| Criterion | Status | Gap | Next |');
  console.log('| --- | --- | --- | --- |');
  for (const row of gaps) console.log(`| ${escapeCell(row.criterion)} | ${row.status} | ${escapeCell(row.gap)} | ${escapeCell(row.next)} |`);
  if (gaps.some((row) => row.required)) process.exitCode = 1;
}

export function evidenceProvenance(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const rows = provenanceRows(repo, task, git, packets);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Evidence Provenance

Task: ${task}
Repository: ${repo}

| Source | Trust | Freshness | Note |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.source)} | ${row.trust} | ${row.freshness} | ${escapeCell(row.note)} |`).join('\n')}

## Rule

- Source code, tests, runtime logs, and current command output outrank advisory context.
- Issue text, generated docs, old agent output, and external/tool summaries are advisory until verified.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function buildEvidenceMatrix(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const runDir = readCurrentStateInfo(repo, options).runDir || ensureControlRunDir(repo, options, task);
  const manifest = ensureEvidenceManifest(repo, runDir, task, route, options);
  const contract = loadTaskContract(repo, task, options) || taskContract(repo, task, { route, git, profile, task });
  const captured = [...(manifest.captured || []), ...readJsonLines(join(runDir, 'checks.jsonl')).map((row) => ({ kind: row.name || row.type || 'check', summary: row.summary || row.command || '', status: row.status === 0 || row.status === 'pass' ? 'captured' : row.status || 'captured' }))];
  const rows = (contract.acceptanceCriteria || []).map((criterion) => {
    const proofNeeded = contract.evidenceRequired?.find((item) => item.criterionId === criterion.id)?.proofNeeded || proofForText(criterion.text, contract.testingSurfaces || []);
    const matched = captured.find((item) => evidenceMatchesCriterion(item, criterion, proofNeeded));
    return {
      criterionId: criterion.id,
      criterion: criterion.text,
      proofNeeded,
      evidence: matched ? matched.summary || matched.kind : '',
      status: matched ? 'satisfied' : 'missing',
      required: true,
      gap: matched ? '' : `No captured evidence mapped to ${criterion.id}.`,
      next: matched ? 'none' : nextEvidenceCommand(contract, criterion, proofNeeded),
      qa: qaImplication(contract, criterion, matched),
    };
  });
  return { schema: 'sdlc-evidence-matrix-v1', generatedAt: new Date().toISOString(), task, route, runDir, contractSource: contract.source || 'generated', testingSurfaces: contract.testingSurfaces || [], qaMode: contract.qaMode || 'workflow', rows };
}

function renderEvidenceMatrix(matrix) {
  return `# SDLC Evidence Matrix

Date: ${matrix.generatedAt}
Task: ${matrix.task}
Route: ${matrix.route}
QA mode: ${matrix.qaMode}
Testing surfaces: ${(matrix.testingSurfaces || []).join(', ') || 'unknown'}

| Criterion | Proof needed | Status | Evidence | QA implication | Next |
| --- | --- | --- | --- | --- | --- |
${matrix.rows.map((row) => `| ${escapeCell(row.criterion)} | ${escapeCell(row.proofNeeded)} | ${row.status} | ${escapeCell(row.evidence || 'none')} | ${escapeCell(row.qa)} | ${escapeCell(row.next)} |`).join('\n')}
`;
}

function loadTaskContract(repo, task, options = {}) {
  if (options.contract) return readJsonIfExists(resolve(repo, options.contract));
  const runDir = readCurrentStateInfo(repo, options).runDir || '';
  if (runDir) {
    const current = readJsonIfExists(join(runDir, 'task-contract.json'));
    if (current) return current;
  }
  return null;
}

function evidenceMatchesCriterion(item, criterion, proofNeeded) {
  const text = `${item.kind || ''} ${item.summary || ''} ${item.path || ''}`.toLowerCase();
  const words = String(criterion.text || '').toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 4);
  if (words.some((word) => text.includes(word))) return true;
  if (/api|endpoint|swagger/i.test(proofNeeded) && /api|contract|swagger|test|check/i.test(text)) return true;
  if (/render|browser|ui/i.test(proofNeeded) && /render|browser|ui|smoke|screenshot/i.test(text)) return true;
  if (/data|database|query/i.test(proofNeeded) && /data|database|query|sql/i.test(text)) return true;
  if (/diff|docs/i.test(proofNeeded) && /diff|docs|markdown|check/i.test(text)) return true;
  return /verification|test|build|smoke|manual/i.test(text);
}

function proofForText(text, surfaces) {
  if (surfaces.includes('api-contract') || /api|endpoint|swagger/i.test(text)) return 'API request/response, contract test, Swagger/developer validation, or cap';
  if (surfaces.includes('rendered-product-ui') || /ui|screen|page|button|layout/i.test(text)) return 'rendered/browser smoke, UI test, screenshot, or cap';
  if (surfaces.includes('data-persistence') || /data|database|stored|saved/i.test(text)) return 'data evidence, regression test, or redacted query/evidence cap';
  return 'targeted automated check, smoke/manual evidence, or explicit cap';
}

function nextEvidenceCommand(contract, criterion, proofNeeded) {
  if (/api|endpoint|swagger/i.test(proofNeeded)) return `sdlc qa api --task "${escapeMatrixCommand(contract.task || criterion.text)}"`;
  if (/render|browser|ui/i.test(proofNeeded)) return `sdlc render evidence --task "${escapeMatrixCommand(contract.task || criterion.text)}"`;
  if (/data|database|query/i.test(proofNeeded)) return `sdlc data evidence --task "${escapeMatrixCommand(contract.task || criterion.text)}"`;
  if (/docs|diff/i.test(proofNeeded)) return 'git diff --check plus changed-file review';
  return `sdlc verify ladder --task "${escapeMatrixCommand(contract.task || criterion.text)}"`;
}

function qaImplication(contract, criterion, matched) {
  if (matched) return 'developer evidence exists; QA can focus on user-visible regression if needed';
  if (contract.qaMode === 'api-contract') return 'include API/developer validation step or cap';
  if (contract.qaMode === 'rendered-ui') return 'include human-visible workflow step';
  if (contract.qaMode === 'data') return 'include safe setup and expected persisted state';
  return 'include in QA only if tester-visible';
}

function escapeMatrixCommand(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function ensureEvidenceManifest(repo, runDir, task, route, options = {}) {
  const path = join(runDir, 'evidence.json');
  const existing = readJsonIfExists(path);
  if (existing) return existing;
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const manifest = {
    schema: 'sdlc-evidence-v1',
    task,
    route,
    required: evidenceRequirementsForTask(repo, task, route, git, profile, options),
    captured: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  safeWriteJsonFile(repo, path, manifest);
  return manifest;
}

export function readEvidenceManifest(runDir) {
  return readJsonIfExists(join(runDir, 'evidence.json')) || { required: [], captured: [] };
}

export function evidenceStatusRows(repo, runDir, manifest) {
  const checks = readJsonLines(join(runDir, 'checks.jsonl'));
  const captured = manifest.captured || [];
  return (manifest.required || []).map((req) => {
    const matched = evidenceRequirementSatisfied(req, captured, checks);
    return { id: req.id, level: req.level, status: matched ? 'satisfied' : 'missing', summary: req.summary };
  });
}

export function evidenceRequirementsForTask(repo, task, route, git, profile, options = {}) {
  const profileValues = profile.values || profile || {};
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const triggers = securityTriggers(task, profileValues);
  const recipes = matchRecipes(task, git, profileValues);
  const requirements = [
    evidenceRequirement('scope', 'required', 'Task scope/intent is recorded.'),
    evidenceRequirement('changed-files', 'required', 'Changed files and touched surfaces are known.'),
    evidenceRequirement('verification', 'required', 'At least one fresh check, smoke, or explicit cap is recorded.'),
    evidenceRequirement('finish-control', 'required', 'Commit/push/release remains human-controlled.'),
  ];
  if (route === 'tiny-docs') requirements.push(evidenceRequirement('diff-hygiene', 'required', 'Diff hygiene check is recorded.'));
  if (route === 'review-only') requirements.push(evidenceRequirement('review', 'required', 'Review verdict/findings are recorded.'));
  if (route === 'release-push') requirements.push(evidenceRequirement('release-approval', 'required', 'Release/git action approval boundary is explicit.'));
  if (route === 'multi-repo-integration') requirements.push(evidenceRequirement('workspace-ledger', 'required', 'Affected repos/units and release order are recorded.'));
  if (route === 'contract-first') requirements.push(evidenceRequirement('contract', 'required', 'Contract surfaces and compatibility decision are recorded.'));
  if (route === 'bugfix-live-system') requirements.push(evidenceRequirement('exact-live-evidence', 'required', 'Exact sanitized live/log/request evidence or cap is recorded.'));
  if (route === 'weak-test-legacy') requirements.push(evidenceRequirement('manual-qa', 'required', 'Manual QA script or explicit cap is recorded.'));
  if (qaMode !== 'workflow' && qaMode !== 'docs-process') requirements.push(evidenceRequirement('qa-outline', 'recommended', `QA outline/script covers ${qaMode}.`));
  if (surfaces.includes('rendered-product-ui')) requirements.push(evidenceRequirement('rendered-smoke', 'recommended', 'Rendered/browser smoke or cap is recorded.'));
  if (surfaces.includes('api-contract')) requirements.push(evidenceRequirement('api-contract', 'recommended', 'API/Swagger/client contract evidence or cap is recorded.'));
  if (surfaces.includes('data-persistence')) requirements.push(evidenceRequirement('data-evidence', 'recommended', 'Data/storage evidence or cap is recorded.'));
  if (surfaces.includes('integration-provider')) requirements.push(evidenceRequirement('integration-evidence', 'recommended', 'Integration/provider evidence or cap is recorded.'));
  if (triggers.length) requirements.push(evidenceRequirement('policy', 'required', `Security/tool triggers checked: ${triggers.join(', ')}.`));
  for (const recipeItem of recipes) requirements.push(evidenceRequirement(`recipe-${recipeItem.id}`, recipeItem.status === 'experimental' ? 'recommended' : 'required', `${recipeItem.id}: ${recipeItem.requiredProof.join('; ')}`));
  return dedupeBy(requirements, (item) => item.id);
}

function provenanceRows(repo, task, git, packets) {
  const profile = loadProfile(repo);
  const external = externalEvidenceProfile(profile.values);
  return [
    { source: 'source code', trust: 'authoritative', freshness: git.status ? 'current dirty worktree' : 'current clean worktree', note: `${git.changedFiles.length} changed file(s)` },
    { source: 'tests/current command output', trust: 'strong current evidence', freshness: 'current when run this task', note: packets.some((packet) => packet.kind === 'developer-verification') ? 'verification packet found' : 'not found' },
    { source: 'runtime logs/database/provider evidence', trust: matchesAny(task.toLowerCase(), ['log', 'sql', 'provider', 'staging', 'production']) ? 'strong when sanitized and exact' : 'not used', freshness: 'task-specific', note: 'capture exact failing table/endpoint/status when relevant' },
    { source: 'read-only database MCP evidence', trust: external.database.availability === 'available' ? 'strong for observed state when bounded and redacted' : 'not available/unknown unless human provides sanitized result', freshness: 'environment-specific', note: 'proves observed state, not desired product behavior; record environment/time/caps' },
    { source: 'human task statement', trust: 'intent source', freshness: 'current request', note: task },
    { source: 'issue/ticket text', trust: 'scope/acceptance source when current; advisory when stale or conflicting', freshness: external.ticket.availability === 'available' ? 'refreshable through ticket MCP' : 'pasted or unavailable', note: 'verify drift before closeout when ticket MCP is available' },
    { source: 'generated docs/previous agent output', trust: 'advisory', freshness: 'unknown', note: 'never use as proof without source check' },
    { source: 'context docs', trust: 'routing memory', freshness: 'check freshness/conflicts', note: 'source code/tests/logs win when conflicting' },
  ];
}

export function evidenceRequirement(id, level, summary) {
  return { id, level, summary };
}

function evidenceRequirementSatisfied(req, captured, checks) {
  const haystack = `${captured.map((item) => `${item.kind} ${item.id} ${item.summary}`).join(' ')} ${checks.map((item) => `${item.name} ${item.kind} ${item.status} ${item.summary}`).join(' ')}`.toLowerCase();
  if (req.id === 'scope') return haystack.includes('scope') || haystack.includes('impact') || haystack.includes('state');
  if (req.id === 'changed-files') return haystack.includes('touched') || haystack.includes('scope') || haystack.includes('changed');
  if (req.id === 'verification') return checks.some((check) => ['pass', 'cap'].includes(check.status)) || haystack.includes('verify') || haystack.includes('smoke') || haystack.includes('test') || haystack.includes('build');
  if (req.id === 'finish-control') return true;
  if (req.id === 'diff-hygiene') return haystack.includes('diff') || haystack.includes('format');
  if (req.id === 'manual-qa') return haystack.includes('qa');
  if (req.id === 'qa-outline') return haystack.includes('qa');
  if (req.id === 'policy') return haystack.includes('policy') || haystack.includes('security');
  return haystack.includes(req.id.replace(/^recipe-/, '').replace(/-/g, ' ')) || haystack.includes(req.id);
}

function printEvidenceRows(rows) {
  console.log('\n| Evidence | Level | Summary |');
  console.log('| --- | --- | --- |');
  for (const row of rows) console.log(`| ${escapeCell(row.id)} | ${row.level} | ${escapeCell(row.summary)} |`);
}

function printEvidenceStatusRows(rows) {
  console.log('\n| Evidence | Level | Status | Summary |');
  console.log('| --- | --- | --- | --- |');
  for (const row of rows) console.log(`| ${escapeCell(row.id)} | ${row.level} | ${row.status} | ${escapeCell(row.summary)} |`);
}

function appendEvidenceTrace(repo, runDir, type, summary, extra = {}) {
  appendControlJsonLine(repo, join(runDir, 'trace.jsonl'), {
    timestamp: new Date().toISOString(),
    repo,
    type,
    summary,
    route: extra.route || '',
    task: extra.task || '',
    stage: extra.stage || '',
    status: extra.status || '',
    gate: extra.gate || '',
    evidence: extra.evidence || '',
  });
}
