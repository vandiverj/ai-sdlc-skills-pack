import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, escapeCell, fail, formatList, printObject, slug, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { affectedUnits, inferTestingSurfaces, matchesAny } from './units.mjs';

export function bugNextCommand(action, task) {
  const order = ['reproduce', 'diagnose', 'fix-plan', 'verify', 'qa'];
  const next = order[order.indexOf(action) + 1] || 'qa';
  return action === 'qa' ? `sdlc qa scenario --task "${escapeCommandArg(task)}"` : `sdlc bug ${next} --task "${escapeCommandArg(task)}"`;
}

export function bugEvidencePacket(repo, options = {}, dependencies = {}) {
  const { taskCaseId } = dependencies;
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the live-system bug evidence packet can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-bugfix-live-system-evidence.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Bugfix Live-System Evidence Packet

Date: ${new Date().toISOString()}
Case ID: ${taskCaseId(task, options, profile.values) || 'not provided'}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route overlay: bugfix-live-system

## Affected Units

${formatList(units.map((unit) => `${unit.name} (${unit.testSurface || 'surface unknown'}, context ${unit.contextBucket || 'not configured'})`))}

## Observed Failure

- Environment: staging / QA / production-safe log / local repro
- Exact error/log source:
- Failing endpoint/table/contract/job:
- Failing columns/fields/status codes:
- Scenario/case identifier:

## Evidence Before Fix

- Generated SQL/log/request/response:
- Smallest reproduction:
- Existing successful analogous path:
- Root-cause hypothesis:
- Confidence:

## Fix Discipline

- Smallest evidence-backed fix chosen:
- Broad fallback plan rejected/deferred:
- Why the smaller fix is sufficient:
- Data/customer safety considerations:

## Regression Coverage

- Targeted test added or updated:
- Command:
- Result:
- If no automated test, why:

## QA Scenario Retest

- Scenario name/id:
- Environment:
- Preconditions/test data:
- Expected retest outcome:
- Developer validation separate from QA validation:

## Context/Learning Follow-Up

- Durable product fact belongs in:
- Portable process learning candidate:
- Sensitive details redacted before sharing:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function bugLiveEvidence(repo, options = {}, dependencies = {}) {
  return bugEvidencePacket(repo, options, dependencies);
}

export function bugEvidenceCheck(repo, options = {}, dependencies = {}) {
  const { packetHas, resolvePacketPath } = dependencies;
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const required = [
    ['Case ID', ['Case ID:', 'Case:']],
    ['Exact log/source', ['Exact error/log source:', 'Exact log/request/SQL/source:']],
    ['Failing surface', ['Failing endpoint/table/contract/job:', 'Failing table', 'Failing endpoint']],
    ['Failing field/status/payload', ['Failing columns/fields/status codes:', 'failing column', 'status code', 'payload']],
    ['Analogous working path', ['Existing successful analogous path:', 'analogous working path']],
    ['Smallest fix', ['Smallest evidence-backed fix chosen:', 'Smallest evidence-backed fix:']],
    ['Targeted regression', ['Targeted test added or updated:', 'targeted regression']],
    ['QA scenario retest', ['QA Scenario Retest', 'Scenario name/id:']],
  ];
  const rows = required.map(([name, needles]) => ({ name, status: packetHas(text, needles) ? 'pass' : 'open', detail: needles.join(' or ') }));
  const pass = rows.every((row) => row.status === 'pass');
  printObject({ repository: repo, packet: relative(repo, packetPath), result: pass ? 'pass' : 'open' });
  console.log('\n| Evidence | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const row of rows) console.log(`| ${escapeCell(row.name)} | ${row.status} | ${escapeCell(row.detail)} |`);
  if (!pass) process.exitCode = 1;
}

export function bugWorkflowPacket(repo, action, options = {}, dependencies = {}) {
  const { bugNextCommand, findPackets, formatQualityFloorTable, humanize, qualityFloorRows, taskCaseId } = dependencies;
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the bug workflow packet can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const sections = {
    reproduce: ['Observed failure', 'Smallest safe reproduction', 'Exact log/request/SQL/source', 'Expected behavior', 'Current cap'],
    diagnose: ['Failure boundary', 'Analogous working path', 'Root-cause hypothesis', 'Rejected broad fixes', 'Confidence'],
    'fix-plan': ['Smallest evidence-backed fix', 'Files/units expected to change', 'Regression test path', 'Rollback/fallback', 'Human gates'],
    verify: ['Developer checks', 'Regression proof', 'Data/API/UI/integration evidence', 'Caps', 'Context update decision'],
    qa: ['Human QA scenario', 'Preconditions/test data', 'Steps', 'Expected result', 'YouTrack-ready notes'],
  };
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-bugfix-${slug(action)}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Bugfix ${humanize(action)} Packet

Date: ${new Date().toISOString()}
Case ID: ${taskCaseId(task, options, profile.values) || 'not provided'}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route overlay: bugfix-live-system

## Affected Units

${formatList(units.map((unit) => `${unit.name}: ${unit.testSurface || 'surface unknown'} / ${unit.contextBucket || 'context bucket missing'}`))}

## Required Evidence

${formatList((sections[action] || sections.reproduce).map((name) => `${name}:`))}

## Quality Floor

${formatQualityFloorTable(qualityFloorRows({ task, git, route: 'bugfix-live-system', units, surfaces: inferTestingSurfaces(repo, task, git.changedFiles, profile), qaMode: 'scenario-retest', profile, packets: findPackets(repo, {}) }))}

## Next Command

\`\`\`bash
${bugNextCommand(action, task)}
\`\`\`
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function commandClassify(repo, options = {}, dependencies = {}) {
  const command = options.command || '';
  const status = options.status ?? '';
  const stderr = options.stderr || options.error || '';
  if (!command && !stderr) fail('Pass --command "..." and/or --stderr "..." so the failure can be classified.');
  const classification = classifyCommandFailure(command, status, stderr);
  printObject({ repository: repo, command: command || 'not provided', status: status === '' ? 'not provided' : status, classification: classification.kind, evidenceUse: classification.evidenceUse, recommendedNextAction: classification.nextAction });
}

function classifyCommandFailure(command, status, stderr) {
  const text = `${command}\n${stderr}`.toLowerCase();
  if (matchesAny(text, ['eperm', 'permission denied', 'operation not permitted', 'sandbox'])) return { kind: 'permission/sandbox failure', evidenceUse: 'cap until rerun with permission or alternate output path', nextAction: 'rerun with approved permission or record sandbox cap' };
  if (matchesAny(text, ['unexpected token', 'unterminated', 'quote', 'parsererror', 'syntax error near', 'no matches found'])) return { kind: 'invocation/tooling failure', evidenceUse: 'not product evidence', nextAction: 'fix quoting/shell invocation and rerun' };
  if (matchesAny(text, ['command not found', 'not recognized', 'cannot find module', 'no such file or directory', 'missing script'])) return { kind: 'environment/setup cap', evidenceUse: 'setup evidence, not product failure', nextAction: 'record missing tool/dependency or install with approval' };
  if (matchesAny(text, ['timeout', 'econnreset', 'enotfound', 'rate limit', 'temporarily unavailable'])) return { kind: 'flaky/transient external failure', evidenceUse: 'inconclusive until retried or capped', nextAction: 'retry once or record external cap' };
  if (String(status) !== '' && Number(status) !== 0) return { kind: 'product/test failure', evidenceUse: 'valid failing evidence if command invocation was correct', nextAction: 'debug failing check or record accepted cap' };
  return { kind: 'pass or unclassified', evidenceUse: 'usable only with command output context', nextAction: 'record check result normally' };
}

export function dotnetEfcoreDiagnose(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-efcore-diagnostic.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const triggerMode = matchesAny(task.toLowerCase(), ['trigger', 'output clause', 'output', 'sqloutput']) ? 'sql-server-output-trigger' : 'fk-relationship';
  const content = `# SDLC EF Core Diagnostic Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Diagnostic mode: ${triggerMode}

## Required Evidence

${formatList(triggerMode === 'sql-server-output-trigger' ? [
    'Capture exact SQL Server error naming OUTPUT/trigger behavior and target table.',
    'Check EF Core/SQL Server provider version or package change if relevant.',
    'Get authoritative trigger-backed table list for the affected database.',
    'Intersect trigger-backed tables with entities mapped by the affected DbContext.',
    'Prefer model metadata/output-clause configuration fix before workflow/schema changes.',
    'Add metadata-level regression test and record SQL Server smoke cap.',
  ] : [
    'Capture exact FK error, target table, and columns from SQL/log output.',
    'Identify relationship invariant the ORM did not satisfy.',
    'Find analogous successful path before changing save ordering broadly.',
    'Prefer narrow relationship wiring fix when evidence supports it.',
    'Add focused regression test for the invariant.',
  ])}
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function patternAnalog(repo, options = {}, dependencies = {}) {
  const { searchPattern } = dependencies;
  const task = options.task || '';
  const hint = options.hint || task;
  if (!task) fail('Pass --task "...".');
  const terms = dedupe(String(hint).split(/[^A-Za-z0-9_/-]+/).filter((word) => word.length > 4)).slice(0, 6);
  const results = terms.flatMap((term) => searchPattern(repo, term).slice(0, 10)).slice(0, 40);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-analogous-paths.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Analogous Path Search

Task: ${task}
Hint: ${hint}

## Candidate Working Paths

${formatList(results.map((item) => `${relative(repo, item.path)}:${item.line} ${item.text}`))}

## Review Questions

- Which candidate is known working behavior?
- What invariant can be reused?
- What differences limit reuse?
- If no analogous path exists, record that as a cap before broad implementation.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function fixScope(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-fix-scope.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Fix Scope Packet

Task: ${task}
Repository: ${repo}

## Primary Evidence-Backed Fix

- Evidence:
- Proposed narrow change:
- Blast radius:
- Rollback/revert note:

## Fallback Plans Deferred

- Fallback:
- Why deferred:
- Evidence required before use:

## Gate

- Broad remediation requires explicit evidence or human approval.
- Final handoff should explain why the implemented fix was the smallest safe fix.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function escapeCommandArg(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}
