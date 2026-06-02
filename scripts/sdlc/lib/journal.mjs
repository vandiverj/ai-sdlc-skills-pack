import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { dedupe, escapeCommandArg, formatList, printObject, readJsonIfExists, safeWriteJsonFile, safeWriteTextFile, slug } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { affectedUnits, inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';

export function journalTaskId(task, options = {}) {
  return options.taskId || slug(task || 'task');
}

export function journalDir(repo, task, options = {}) {
  return resolve(repo, options.journalDir || join(defaultRunsDir(repo), journalTaskId(task, options)));
}

export function journalPaths(repo, task, options = {}) {
  const dir = journalDir(repo, task, options);
  return {
    dir,
    markdown: join(dir, 'run.md'),
    json: join(dir, 'run.json'),
  };
}

export function loadTaskJournal(repo, task = '', options = {}) {
  const explicit = task ? journalPaths(repo, task, options) : null;
  if (explicit && existsSync(explicit.json)) return { ...readJsonIfExists(explicit.json), paths: explicit };
  const latest = findLatestJournal(repo);
  if (!latest) return {};
  const data = readJsonIfExists(latest.json) || {};
  return { ...data, paths: latest };
}

export function upsertTaskJournal(repo, task, updates = {}, options = {}) {
  if (!task) return {};
  const paths = journalPaths(repo, task, options);
  const existing = readJsonIfExists(paths.json) || {};
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = Array.isArray(updates.touchedFiles) ? updates.touchedFiles : git.changedFiles;
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const route = updates.route || existing.route || options.route || inferRouteFromTask(task, git, profile.values);
  const now = new Date().toISOString();
  const journal = {
    schema: 'sdlc-task-journal-v1',
    taskId: existing.taskId || journalTaskId(task, options),
    task,
    repository: repo,
    branch: git.branch || existing.branch || '',
    head: git.head || existing.head || '',
    route,
    mode: updates.mode || existing.mode || 'normal',
    status: updates.status || existing.status || 'started',
    createdAt: existing.createdAt || now,
    updatedAt: now,
    affectedUnits: dedupe([...(existing.affectedUnits || []), ...units.map((unit) => unit.name)]),
    contextBuckets: dedupe([...(existing.contextBuckets || []), ...units.map((unit) => unit.contextBucket).filter(Boolean)]),
    testingSurfaces: dedupe([...(existing.testingSurfaces || []), ...surfaces]),
    qaMode: updates.qaMode || existing.qaMode || qaModeForSurfaces(surfaces, task),
    touchedFiles: dedupe([...(existing.touchedFiles || []), ...files]),
    context: mergeArray(existing.context, updates.context),
    decisions: mergeArray(existing.decisions, updates.decisions),
    evidenceRequired: mergeArray(existing.evidenceRequired, updates.evidenceRequired),
    evidenceCaptured: mergeArray(existing.evidenceCaptured, updates.evidenceCaptured),
    packets: mergeArray(existing.packets, updates.packets),
    promptAnalysis: updates.promptAnalysis || existing.promptAnalysis || null,
    promptHistory: mergeRecords(existing.promptHistory, updates.promptHistory, 'recordedAt'),
    localFirst: updates.localFirst || existing.localFirst || null,
    agents: mergeRecords(existing.agents, updates.agents, 'role'),
    qaImpact: updates.qaImpact || existing.qaImpact || '',
    caps: mergeArray(existing.caps, updates.caps),
    waivers: mergeArray(existing.waivers, updates.waivers),
    nextRecommendedAction: updates.nextRecommendedAction || existing.nextRecommendedAction || `sdlc next --task "${escapeCommandArg(task)}"`,
    finalHandoffSummary: updates.finalHandoffSummary || existing.finalHandoffSummary || '',
  };
  safeWriteJsonFile(repo, paths.json, journal);
  safeWriteTextFile(repo, paths.markdown, renderTaskJournal(journal, paths, repo));
  return { ...journal, paths };
}

export function printTaskJournalStatus(repo, task, options = {}) {
  const journal = loadTaskJournal(repo, task, options);
  if (!journal.task) {
    printObject({
      repository: repo,
      task: task || 'not provided',
      journal: 'missing',
      suggestedNextCommand: task ? `sdlc start --task "${escapeCommandArg(task)}"` : 'sdlc start --task "..."',
    });
    return;
  }
  printObject({
    repository: repo,
    task: journal.task,
    taskId: journal.taskId,
    route: journal.route || 'unknown',
    mode: journal.mode || 'normal',
    status: journal.status || 'unknown',
    journal: journal.paths?.markdown ? relative(repo, journal.paths.markdown) : 'unknown',
    nextRecommendedAction: journal.nextRecommendedAction || `sdlc next --task "${escapeCommandArg(journal.task)}"`,
  });
}

export function journalCheck(repo, options = {}) {
  const task = options.task || '';
  const journal = loadTaskJournal(repo, task, options);
  const rows = validateJournal(journal);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-journal-check-v1', task: journal.task || task || '', result: rows.some((row) => row.status === 'block') ? 'block' : rows.some((row) => row.status === 'warn') ? 'warn' : 'pass', checks: rows }, null, 2));
  } else {
    console.log('| Check | Status | Detail |');
    console.log('| --- | --- | --- |');
    for (const row of rows) console.log(`| ${row.check} | ${row.status} | ${row.detail} |`);
  }
  if (rows.some((row) => row.status === 'block')) process.exitCode = 1;
}

export function validateJournal(journal = {}) {
  const rows = [];
  rows.push(checkRow('task', journal.task ? 'pass' : 'block', journal.task || 'missing task'));
  rows.push(checkRow('schema', journal.schema ? 'pass' : 'warn', journal.schema || 'older journal or missing schema'));
  rows.push(checkRow('taskId', journal.taskId ? 'pass' : 'block', journal.taskId || 'missing taskId'));
  rows.push(checkRow('route', journal.route ? 'pass' : 'warn', journal.route || 'missing route'));
  rows.push(checkRow('promptAnalysis', journal.promptAnalysis ? 'pass' : 'warn', journal.promptAnalysis ? 'present' : 'missing; run sdlc prompt audit --task "..."'));
  rows.push(checkRow('localFirst', journal.localFirst ? 'pass' : 'warn', journal.localFirst ? 'present' : 'missing; run sdlc capabilities negotiate --task "..."'));
  rows.push(checkRow('agents', Array.isArray(journal.agents || []) ? 'pass' : 'warn', Array.isArray(journal.agents || []) ? `${(journal.agents || []).length} records` : 'not structured'));
  rows.push(checkRow('packets', Array.isArray(journal.packets || []) ? 'pass' : 'warn', Array.isArray(journal.packets || []) ? `${(journal.packets || []).length} records` : 'not structured'));
  rows.push(checkRow('nextRecommendedAction', journal.nextRecommendedAction ? 'pass' : 'warn', journal.nextRecommendedAction || 'missing'));
  return rows;
}

export function journalNextAction(repo, task, options = {}, deps = {}) {
  const journal = loadTaskJournal(repo, task, options);
  const git = getGitInfo(repo);
  const packets = deps.findPackets ? deps.findPackets(repo, {}) : [];
  const open = deps.finalGateOpenItems && (journal.task || task) ? deps.finalGateOpenItems(repo, journal.task || task, git, packets) : [];
  const scopedTask = journal.task || task;
  if (!scopedTask) {
    return nextActionRow('Start an SDLC task', 'No task was provided and no task journal was found.', 'sdlc start --task "..."', 'task journal', 'provide the task statement', 'Run with --task "..."');
  }
  if (!journal.task) {
    return nextActionRow('Create task run journal', 'No canonical run journal exists for this task.', `sdlc start --task "${escapeCommandArg(scopedTask)}"`, 'task memory', 'none', 'Use sdlc task start if console start is unavailable.');
  }
  if (git.changedFiles.length && !journal.touchedFiles?.length) {
    return nextActionRow('Record touched files', 'Git shows changed files but the journal has not captured touched surfaces yet.', 'sdlc touched packet', 'scope/evidence', 'none', `sdlc task ledger --task "${escapeCommandArg(scopedTask)}"`);
  }
  if (!packets.some((packet) => packet.kind === 'developer-verification') && git.changedFiles.length) {
    return nextActionRow('Capture developer verification evidence', 'Implementation changes exist and no developer verification packet was found.', `sdlc verify packet --task "${escapeCommandArg(scopedTask)}"`, 'verification', 'none unless commands require approval', `sdlc verify ladder --task "${escapeCommandArg(scopedTask)}"`);
  }
  if (!packets.some((packet) => packet.kind === 'qa-script') && /qa|youtrack|manual|legacy|multi/i.test(`${journal.mode} ${journal.qaMode} ${journal.route}`)) {
    return nextActionRow('Prepare human QA Markdown', 'Detected mode/route suggests human QA may be needed and no QA script packet exists.', `sdlc qa script --task "${escapeCommandArg(scopedTask)}"`, 'QA handoff', 'confirm QA is needed if uncertain', `sdlc qa coverage --task "${escapeCommandArg(scopedTask)}"`);
  }
  const recommendedAgent = (journal.agents || []).find((agent) => ['recommended', 'strongly-recommended'].includes(agent.recommendation || agent.status));
  if (recommendedAgent && !recommendedAgent.path) {
    return nextActionRow('Create bounded agent handoff packet', `The run journal recommends a ${recommendedAgent.role} packet for this task.`, `sdlc agents packet --role ${recommendedAgent.role} --task "${escapeCommandArg(scopedTask)}"`, 'agent handoff/process clarity', 'skip only if the work is tiny or the packet adds overhead', `sdlc agents status --task "${escapeCommandArg(scopedTask)}"`);
  }
  if (open.length) {
    const command = deps.suggestedFinalGateCommand ? deps.suggestedFinalGateCommand(open[0], scopedTask) : `sdlc complete check --task "${escapeCommandArg(scopedTask)}"`;
    return nextActionRow('Close the next completion gate', open[0], command, 'finish readiness', 'human waiver may be needed for capped evidence', `sdlc complete explain --task "${escapeCommandArg(scopedTask)}"`);
  }
  return nextActionRow('Ask for finish decision', 'No open deterministic gates were detected. Commit/push remains a human approval choice.', `sdlc finish-ready --task "${escapeCommandArg(scopedTask)}"`, 'finish decision', 'choose no action, commit only, or commit and push', `sdlc finish packet --task "${escapeCommandArg(scopedTask)}"`);
}

export function printJournalNextAction(row) {
  console.log('Recommended next action:');
  console.log(row.action);
  console.log(`Why: ${row.why}`);
  console.log(`Command or agent prompt: ${row.command}`);
  console.log(`Evidence affected: ${row.evidence}`);
  console.log(`Human decision needed: ${row.humanDecision}`);
  console.log(`Fallback if blocked: ${row.fallback}`);
}

function renderTaskJournal(journal, paths, repo) {
  return `# SDLC Task Run Journal

Updated: ${journal.updatedAt}
Task ID: ${journal.taskId}
Task: ${journal.task}
Repository: ${journal.repository}
Branch: ${journal.branch || 'unknown'}
Route: ${journal.route || 'unknown'}
Mode: ${journal.mode || 'normal'}
Status: ${journal.status || 'unknown'}

## Repositories And Units

- Primary repository: ${journal.repository}
- Affected units: ${formatInline(journal.affectedUnits)}
- Context buckets: ${formatInline(journal.contextBuckets)}
- Testing surfaces: ${formatInline(journal.testingSurfaces)}
- QA mode: ${journal.qaMode || 'unknown'}

## Prompt Analysis

Original prompt: ${journal.promptAnalysis?.originalPrompt || journal.task || 'not captured'}
Cleaned prompt: ${journal.promptAnalysis?.cleanedPrompt || 'not captured'}
Intent: ${journal.promptAnalysis?.intent || 'not captured'}
Entities: ${formatInline((journal.promptAnalysis?.entities || []).map((entity) => `${entity.kind}:${entity.value}`))}
Constraints: ${formatInline(journal.promptAnalysis?.constraints || [])}
Approvals: ${formatInline(journal.promptAnalysis?.approvals || [])}
Denials: ${formatInline(journal.promptAnalysis?.denials || [])}
Risk terms: ${formatInline(journal.promptAnalysis?.riskTerms || [])}
Ambiguities: ${formatInline(journal.promptAnalysis?.ambiguities || [])}
Sensitivity: ${journal.promptAnalysis?.sensitivity || 'not captured'}
Done criteria: ${formatInline(journal.promptAnalysis?.doneCriteria || [])}

## Local-First Plan

- Can prove locally: ${formatInline(journal.localFirst?.canProveLocally || [])}
- Needs LLM judgment: ${formatInline(journal.localFirst?.needsLlmJudgment || [])}
- Unavailable: ${formatInline(journal.localFirst?.unavailable || [])}
- Fallback evidence: ${formatInline(journal.localFirst?.fallbackEvidence || [])}
- Human approval needed: ${formatInline(journal.localFirst?.humanApprovalNeeded || [])}
- Recommended next local command: ${journal.localFirst?.recommendedNextLocalCommand || 'not captured'}

## Context Included Or Excluded

${formatList(journal.context || [])}

## Decisions

${formatList(journal.decisions || [])}

## Files Touched

${formatList(journal.touchedFiles || [])}

## Evidence Required

${formatList(journal.evidenceRequired || [])}

## Evidence Captured

${formatList(journal.evidenceCaptured || [])}

## Linked Packets

${formatList((journal.packets || []).map((packet) => typeof packet === 'string' ? packet : `${packet.kind || 'packet'}: ${packet.path || ''}`))}

## Agent Handoff Packets

${formatList((journal.agents || []).map((agent) => `${agent.role || 'unknown'}: ${agent.status || 'unknown'}${agent.path ? ` (${agent.path})` : agent.why ? ` - ${agent.why}` : ''}`))}

## QA Impact

${journal.qaImpact || 'not assessed'}

## Caps And Waivers

${formatList([...(journal.caps || []).map((item) => `Cap: ${item}`), ...(journal.waivers || []).map((item) => `Waiver: ${item}`)])}

## Current State

- Status: ${journal.status || 'unknown'}
- JSON: ${relative(repo, paths.json)}

## Next Recommended Action

${journal.nextRecommendedAction || 'sdlc next --task "..."'}

## Final Handoff Summary

${journal.finalHandoffSummary || 'not ready'}
`;
}

function findLatestJournal(repo) {
  const root = defaultRunsDir(repo);
  if (!existsSync(root)) return null;
  const dirs = readdirSync(root).map((name) => join(root, name)).filter((path) => existsSync(join(path, 'run.json')));
  if (!dirs.length) return null;
  dirs.sort((a, b) => statSync(join(b, 'run.json')).mtimeMs - statSync(join(a, 'run.json')).mtimeMs);
  const dir = dirs[0];
  return { dir, json: join(dir, 'run.json'), markdown: join(dir, 'run.md') };
}

function mergeArray(left = [], right = []) {
  const a = Array.isArray(left) ? left : left ? [left] : [];
  const b = Array.isArray(right) ? right : right ? [right] : [];
  return dedupe([...a, ...b].map((item) => typeof item === 'string' ? item : JSON.stringify(item)));
}

function mergeRecords(left = [], right = [], key = 'id') {
  const rows = [
    ...(Array.isArray(left) ? left : left ? [left] : []),
    ...(Array.isArray(right) ? right : right ? [right] : []),
  ].filter(Boolean).map((row) => typeof row === 'string' ? { value: row } : row);
  const map = new Map();
  for (const row of rows) {
    const rowKey = row[key] || row.path || row.value || JSON.stringify(row);
    map.set(rowKey, { ...(map.get(rowKey) || {}), ...row });
  }
  return [...map.values()];
}

function nextActionRow(action, why, command, evidence, humanDecision, fallback) {
  return { action, why, command, evidence, humanDecision, fallback };
}

function checkRow(check, status, detail) {
  return { check, status, detail };
}

function formatInline(items = []) {
  return items.length ? items.join(', ') : 'none';
}
