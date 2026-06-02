import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, escapeCommandArg, fail, formatList, printObject, readJsonIfExists, readJsonLines, safeWriteJsonFile, safeWriteTextFile } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadTaskJournal } from './journal.mjs';
import { defaultRunsDir } from './paths.mjs';
import { buildCommandRecommendation } from './commandplan.mjs';
import { buildToolInventory } from './tools.mjs';

export function commandCapture(repo, options = {}) {
  const task = options.task || '';
  const command = options.command || '';
  const name = options.name || options.phase || 'command';
  if (!task || !command) fail('Pass --task "..." and --command "...".');
  const row = {
    schema: 'sdlc-command-capture-v1',
    task,
    name,
    phase: options.phase || 'verification',
    command,
    recommendedCommand: options.recommended || options.recommendedCommand || '',
    deviationReason: options.deviationReason || options.reason || '',
    cwd: repo,
    status: options.status || 'cap',
    summary: options.summary || '',
    evidenceClass: options.evidenceClass || (options.status === 'pass' ? 'deterministic-proof' : 'cap-or-warning'),
    capReason: options.capReason || '',
    capturedAt: new Date().toISOString(),
  };
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'command-captures.jsonl');
  mkdirSync(dirname(outPath), { recursive: true });
  appendFileSync(outPath, `${JSON.stringify(row)}\n`, 'utf8');
  printObject({ captured: relative(repo, outPath), command, status: row.status, summary: row.summary || 'none' });
}

export function commandInterpret(repo, options = {}) {
  const file = options.file || '';
  if (!file) fail('Pass --file <captured-result>.');
  const path = resolve(repo, file);
  const rows = path.endsWith('.jsonl') ? readJsonLines(path) : [readJsonIfExists(path)].filter(Boolean);
  const interpreted = rows.map((row) => ({ ...row, classification: classifyCommandResult(row) }));
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-command-interpretation-v1', file: relative(repo, path), results: interpreted }, null, 2));
    return;
  }
  console.log(formatList(interpreted.map((row) => `${row.command}: ${row.status} (${row.classification})`)));
}

export function evidenceFromCommand(repo, options = {}) {
  const task = options.task || '';
  const capture = options.capture || '';
  if (!task || !capture) fail('Pass --task "..." and --capture <path>.');
  const path = resolve(repo, capture);
  const rows = path.endsWith('.jsonl') ? readJsonLines(path) : [readJsonIfExists(path)].filter(Boolean);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'command-evidence.json');
  const evidence = {
    schema: 'sdlc-command-evidence-v1',
    task,
    generatedAt: new Date().toISOString(),
    source: relative(repo, path),
    evidence: rows.map((row) => ({
      kind: row.name || row.phase || 'command',
      summary: row.summary || `${row.command} -> ${row.status}`,
      status: row.status === 'pass' ? 'captured' : row.status || 'captured',
      evidenceClass: row.evidenceClass || 'local-command',
    })),
  };
  safeWriteJsonFile(repo, outPath, evidence);
  console.log(relative(repo, outPath));
}

export function contextProject(repo, options = {}) {
  const task = options.task || '';
  const phase = options.phase || 'planning';
  if (!task) fail('Pass --task "...".');
  const journal = loadTaskJournal(repo, task, options);
  const git = getGitInfo(repo);
  const inventory = buildToolInventory(repo);
  const projection = {
    schema: 'sdlc-context-projection-v1',
    generatedAt: new Date().toISOString(),
    task,
    phase,
    repository: repo,
    journal: journal.paths?.markdown ? relative(repo, journal.paths.markdown) : 'missing',
    promptAnalysis: journal.promptAnalysis || null,
    localFirst: journal.localFirst || null,
    changedFiles: git.changedFiles.slice(0, 80),
    toolFacts: {
      packageManager: inventory.packageManager,
      scripts: inventory.scripts.filter((script) => /test|build|lint|typecheck|dev/i.test(script.name)).slice(0, 20),
      units: inventory.units || [],
    },
    include: ['source code around changed files', 'task run journal summary', 'route-relevant context docs', 'captured command evidence summaries'],
    exclude: ['raw logs', 'raw ticket text', 'raw database rows', 'archived strategy plans', 'unrelated repo docs'],
    sizeGuidance: 'Keep prompt context bounded; link artifacts instead of pasting large files.',
  };
  projection.diagnostics = projectionDiagnostics(projection, { task, journal, git, inventory });
  if (options.json) console.log(JSON.stringify(projection, null, 2));
  else writeProjection(repo, options.out, projection);
  if (options.check && projection.diagnostics.blockers.length) process.exitCode = 1;
}

export function evidenceLedger(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = loadTaskJournal(repo, task, options);
  const captures = readJsonLines(join(defaultRunsDir(repo), 'command-captures.jsonl')).filter((row) => row.task === task);
  const ledger = {
    schema: 'sdlc-evidence-ledger-v1',
    generatedAt: new Date().toISOString(),
    task,
    repository: repo,
    proved: captures.filter((row) => row.status === 'pass').map((row) => row.summary || row.command),
    inferred: [journal.route ? `route: ${journal.route}` : '', journal.qaMode ? `qa mode: ${journal.qaMode}` : ''].filter(Boolean),
    capped: captures.filter((row) => row.status === 'cap').map((row) => row.capReason || row.summary || row.command),
    missing: evidenceMissing(journal, captures),
    packets: journal.packets || [],
  };
  if (options.json) console.log(JSON.stringify(ledger, null, 2));
  else renderLedger(ledger);
}

export function evidenceConfidence(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const captures = readJsonLines(join(defaultRunsDir(repo), 'command-captures.jsonl')).filter((row) => row.task === task);
  const pass = captures.filter((row) => row.status === 'pass').length;
  const cap = captures.filter((row) => row.status === 'cap').length;
  const level = pass && !cap ? 'high-with-local-evidence' : pass ? 'medium-with-caps' : 'low-no-command-evidence';
  const result = { schema: 'sdlc-evidence-confidence-v1', task, level, passedCommandEvidence: pass, caps: cap };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else printObject(result);
}

export function responseDraft(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = loadTaskJournal(repo, task, options);
  const captures = readJsonLines(join(defaultRunsDir(repo), 'command-captures.jsonl')).filter((row) => row.task === task);
  const content = `Implemented/Reviewed: ${task}

Changed files: ${(journal.touchedFiles || []).join(', ') || 'none recorded'}
Checks: ${captures.map((row) => `${row.command} (${row.status})`).join('; ') || 'none captured'}
QA: ${journal.qaImpact || journal.qaMode || 'not assessed'}
Caps: ${captures.filter((row) => row.status === 'cap').map((row) => row.capReason || row.summary).join('; ') || 'none recorded'}
Commit/push: not performed; requires explicit human approval.
Next action: ${journal.nextRecommendedAction || `sdlc operator next --task "${escapeCommandArg(task)}"`}
Confidence: ${captures.some((row) => row.status === 'pass') ? 'local command evidence captured' : 'needs local verification or accepted cap'}
`;
  if (options.json) console.log(JSON.stringify({ schema: 'sdlc-response-draft-v1', task, content }, null, 2));
  else console.log(content.trimEnd());
}

export function handoffCompile(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const audience = options.audience || 'developer';
  const journal = loadTaskJournal(repo, task, options);
  const content = `# SDLC ${audience} Handoff

Task: ${task}
Repository: ${repo}
Journal: ${journal.paths?.markdown ? relative(repo, journal.paths.markdown) : 'missing'}

## Status

- Route: ${journal.route || 'unknown'}
- Mode: ${journal.mode || 'unknown'}
- QA: ${journal.qaImpact || journal.qaMode || 'not assessed'}
- Next: ${journal.nextRecommendedAction || `sdlc operator next --task "${escapeCommandArg(task)}"`}

## Evidence

${formatList([...(journal.evidenceCaptured || []), ...(journal.packets || []).map((row) => typeof row === 'string' ? row : row.path || row.kind)].filter(Boolean))}

## Boundaries

- Commit/push require explicit human approval.
- Merge/deploy/release are not automated by SDLC.
`;
  if (options.out) safeWriteTextFile(repo, resolve(repo, options.out), content);
  else console.log(content.trimEnd());
}

function classifyCommandResult(row) {
  const text = `${row.command || ''} ${row.summary || ''} ${row.status || ''}`.toLowerCase();
  if (row.status === 'pass') return 'passed-local-evidence';
  if (/permission|sandbox|eacces|eperm/.test(text)) return 'permission-or-sandbox-failure';
  if (/not found|command failed|enoent/.test(text)) return 'tooling-or-setup-failure';
  if (/test|expect|assert|failed/.test(text)) return 'system-under-test-or-test-failure';
  if (row.status === 'cap') return 'explicit-cap';
  return 'needs-human-interpretation';
}

function evidenceMissing(journal, captures) {
  const rows = [];
  if (!captures.length) rows.push('No command captures recorded.');
  if (!journal.promptAnalysis) rows.push('Prompt analysis missing.');
  if (!journal.localFirst) rows.push('Local-first plan missing.');
  return rows;
}

function writeProjection(repo, out, projection) {
  const content = `# SDLC Context Projection

Task: ${projection.task}
Phase: ${projection.phase}
Journal: ${projection.journal}

## Include

${formatList(projection.include)}

## Exclude

${formatList(projection.exclude)}

## Changed Files

${formatList(projection.changedFiles)}

## Tool Facts

${formatList((projection.toolFacts.scripts || []).map((script) => `${script.command}: ${script.detail}`))}

## Projection Diagnostics

- Estimated size: ${projection.diagnostics.estimatedTokens} tokens
- Included: ${projection.diagnostics.includedCount}
- Excluded: ${projection.diagnostics.excludedCount}
- Stale warnings: ${projection.diagnostics.staleWarnings.length}
- Missing warnings: ${projection.diagnostics.missingWarnings.length}
- Sensitive warnings: ${projection.diagnostics.sensitiveWarnings.length}

## Warnings

${formatList([...projection.diagnostics.blockers, ...projection.diagnostics.warnings])}
`;
  if (out) safeWriteTextFile(repo, resolve(repo, out), content);
  else console.log(content.trimEnd());
}

function projectionDiagnostics(projection, { task, journal, git, inventory }) {
  const warnings = [];
  const blockers = [];
  const missingWarnings = [];
  const staleWarnings = [];
  const sensitiveWarnings = [];
  const taskText = String(task || '').toLowerCase();
  const changedFiles = git.changedFiles || [];

  if (!journal.promptAnalysis) missingWarnings.push('prompt analysis missing from run journal');
  if (!journal.localFirst) missingWarnings.push('local-first plan missing from run journal');
  if (!changedFiles.length && /implement|change|fix|add|update/.test(taskText)) warnings.push('no changed files detected yet; projection is pre-implementation or stale');
  if (/ticket|youtrack|database|sql|production|customer|client|private url|log/.test(taskText)) sensitiveWarnings.push('task mentions sensitive evidence; keep raw values out of projection');
  if (/api|swagger|openapi/.test(taskText) && !inventory.files.some((file) => /swagger|openapi/i.test(file.path))) warnings.push('API task without detected OpenAPI/Swagger file; profile or locate contract source');
  if (/ui|render|browser|screen|page/.test(taskText) && projection.toolFacts.units.length === 0 && inventory.packageManager === 'unknown') warnings.push('UI task without detected app/package signals; rendered verification may need manual profile data');
  if (projection.include.length > 8) warnings.push('projection include list is broad; consider pruning before model prompt use');
  if (projection.exclude.some((row) => /raw/.test(row)) && /raw log|raw ticket|raw database/.test(taskText)) blockers.push('task asks for raw sensitive evidence; projection must use redacted summaries');

  return {
    estimatedTokens: estimateTokens(JSON.stringify({
      task: projection.task,
      phase: projection.phase,
      changedFiles: projection.changedFiles,
      toolFacts: projection.toolFacts,
      include: projection.include,
      exclude: projection.exclude,
    })),
    includedCount: projection.include.length,
    excludedCount: projection.exclude.length,
    staleWarnings,
    missingWarnings,
    sensitiveWarnings,
    warnings: [...missingWarnings, ...staleWarnings, ...sensitiveWarnings, ...warnings],
    blockers,
  };
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function renderLedger(ledger) {
  printObject({ task: ledger.task, proved: ledger.proved.length, capped: ledger.capped.length, missing: ledger.missing.length });
  console.log('\n## Proved\n');
  console.log(formatList(ledger.proved));
  console.log('\n## Capped\n');
  console.log(formatList(ledger.capped));
  console.log('\n## Missing\n');
  console.log(formatList(ledger.missing));
}
