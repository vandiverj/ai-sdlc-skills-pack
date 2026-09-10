import { existsSync, mkdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, escapeCommandArg, fail, formatList, optionFiles, printGateRows, printObject, readJsonIfExists, readJsonLines, safeWriteJsonFile, slug, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { affectedUnits, inferTestingSurfaces } from './units.mjs';

export function controlRunRoot(repo, options = {}) {
  return options.outRoot ? resolve(repo, options.outRoot) : defaultRunsDir(repo);
}

export function controlCurrentPointerPath(repo, options = {}) {
  return join(controlRunRoot(repo, options), 'current.json');
}

export function controlRunDir(repo, options = {}) {
  const root = controlRunRoot(repo, options);
  const id = options.taskId || slug(options.task || 'task');
  return join(root, id);
}

export function ensureControlRunDir(repo, options = {}, task = '') {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || controlRunDir(repo, { ...options, task });
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

export function readCurrentState(repo, options = {}) {
  return readCurrentStateInfo(repo, options).state;
}

export function readCurrentStateInfo(repo, options = {}) {
  const pointer = readJsonIfExists(controlCurrentPointerPath(repo, options));
  const pointedDir = pointer?.path ? resolve(repo, pointer.path) : '';
  const pointedState = pointedDir ? readJsonIfExists(join(pointedDir, 'state.json')) : null;
  const runDir = options.taskId ? join(controlRunRoot(repo, options), options.taskId)
    : options.task && pointedState?.task !== options.task ? join(controlRunRoot(repo, options), slug(options.task))
      : pointedDir;
  const statePath = runDir ? join(runDir, 'state.json') : '';
  const state = statePath && existsSync(statePath) ? readJsonIfExists(statePath) : null;
  if (state && options.task && state.task !== options.task) fail('The selected run belongs to another task. Use a distinct --task-id.');
  return { state, runDir, previousStage: state?.stage || '' };
}

export function validStateTransition(from, to) {
  const order = ['intake', 'scoped', 'implementing', 'verifying', 'qa-ready', 'finish-ready', 'committed'];
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) return false;
  return toIndex >= fromIndex;
}

export function nextActionForStage(stage, task) {
  const escaped = escapeCommandArg(task || 'current task');
  if (stage === 'scoped') return `sdlc state advance --to implementing --reason "scope approved"`;
  if (stage === 'implementing') return `sdlc run-check --name test -- <project test command>`;
  if (stage === 'verifying') return `sdlc complete check --task "${escaped}"`;
  if (stage === 'qa-ready') return `sdlc finish packet --task "${escaped}"`;
  if (stage === 'finish-ready') return 'sdlc action preview --action commit';
  if (stage === 'committed') return 'human decides whether push/release process applies';
  return `sdlc evidence required --task "${escaped}"`;
}

export function synthesizeState(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  return {
    taskId: options.taskId || slug(task || 'ad-hoc'),
    task,
    repo,
    route: options.route || inferRouteFromTask(task, git, profile.values),
    stage: options.stage || 'finish-ready',
    status: 'ad-hoc',
  };
}

export function readControlJsonLines(path) {
  return readJsonLines(path);
}

export function appendControlEvent(repo, runDir, type, summary, extra = {}) {
  appendControlJsonLine(repo, join(runDir, 'trace.jsonl'), controlTraceRow(repo, { type, summary, ...extra }));
}

export function controlTraceRow(repo, options = {}) {
  return {
    timestamp: new Date().toISOString(),
    repo,
    type: options.type || 'event',
    summary: options.summary || '',
    route: options.route || '',
    task: options.task || '',
    stage: options.stage || '',
    status: options.status || '',
    gate: options.gate || '',
    evidence: options.evidence || '',
  };
}

export function writeGateRows(repo, runDir, rows) {
  for (const row of rows) appendControlJsonLine(repo, join(runDir, 'gates.jsonl'), { ...row, recordedAt: new Date().toISOString() });
}

export function nextActionFromGates(rows, task) {
  const open = rows.find((row) => ['block', 'warn'].includes(row.status));
  return open?.next || `sdlc finish packet --task "${escapeCommandArg(task || 'current task')}"`;
}

export function gitScopeRows(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  const runDir = stateInfo.runDir || '';
  const expected = runDir ? readJsonIfExists(join(runDir, 'expected-scope.json')) : null;
  const git = getGitInfo(repo);
  const rows = [];
  if (expected?.files?.length) {
    const unexpected = git.changedFiles.filter((file) => !expected.files.includes(file));
    rows.push({ id: 'scope-unexpected-files', status: unexpected.length ? 'warn' : 'pass', detail: unexpected.join(', ') || 'actual files match expected scope', next: unexpected.length ? 'review dirty files before commit' : '' });
  } else {
    rows.push({ id: 'scope-expected-files', status: git.changedFiles.length ? 'warn' : 'pass', detail: git.changedFiles.length ? 'no expected scope recorded' : 'clean worktree', next: git.changedFiles.length ? 'sdlc scope expect --files "..."' : '' });
  }
  if (git.changedFiles.some((file) => classifyControlPathActivity(file) !== 'active-source')) rows.push({ id: 'scope-non-active-files', status: 'warn', detail: 'generated/archived/dependency-like files changed', next: 'review before commit' });
  return rows;
}

export function classifyControlPathActivity(file) {
  const value = String(file || '').toLowerCase();
  if (value.includes('node_modules/') || value.includes('/vendor/') || value.includes('/dist/') || value.includes('/build/') || value.includes('/coverage/')) return 'generated-or-dependency';
  if (value.includes('/archive/') || value.startsWith('archive/') || value.includes('/archived/')) return 'archived-reference';
  if (value.endsWith('.min.js') || value.endsWith('.map')) return 'generated-or-dependency';
  return 'active-source';
}

export function stateInit(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the state can be initialized.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const units = affectedUnits(repo, files, profile, options.unit);
  const recipes = matchRecipes(task, git, profile.values);
  const runDir = controlRunDir(repo, { ...options, task });
  const state = {
    schema: 'sdlc-state-v1',
    taskId: basename(runDir),
    task,
    repo,
    route,
    stage: 'intake',
    status: 'active',
    branch: git.branch || '',
    head: git.head || '',
    affectedUnits: units.map((unit) => unit.name),
    testingSurfaces: surfaces,
    selectedRecipes: recipes.map((recipe) => recipe.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextAction: `sdlc evidence required --task "${escapeCommandArg(task)}"`,
  };
  safeWriteJsonFile(repo, join(runDir, 'state.json'), state);
  safeWriteJsonFile(repo, controlCurrentPointerPath(repo, options), { taskId: state.taskId, path: relative(repo, runDir), updatedAt: state.updatedAt });
  dependencies.appendControlEvent(repo, runDir, 'state', 'initialized task state', { task, route, stage: state.stage });
  dependencies.ensureEvidenceManifest(repo, runDir, task, route, options);
  printObject({
    taskId: state.taskId,
    route,
    stage: state.stage,
    path: relative(repo, runDir),
    nextAction: state.nextAction,
  });
}

export function stateCurrent(repo, options = {}) {
  const state = readCurrentState(repo, options);
  if (!state) {
    printObject({ repository: repo, state: 'not initialized', nextAction: 'sdlc state init --task "..."' });
    return;
  }
  printObject({
    taskId: state.taskId,
    task: state.task,
    route: state.route,
    stage: state.stage,
    status: state.status,
    updatedAt: state.updatedAt,
    nextAction: state.nextAction || 'sdlc state explain',
  });
}

export function stateAdvance(repo, options = {}, dependencies = {}) {
  const to = options.to || '';
  if (!to) fail('Pass --to <stage>.');
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) fail('No current state found. Run `sdlc state init --task "..."` first.');
  const state = stateInfo.state;
  const valid = validStateTransition(state.stage, to);
  if (!valid && !options.force) fail(`Invalid state transition ${state.stage} -> ${to}. Pass --force --reason "..." if this is intentional.`);
  state.stage = to;
  state.status = to === 'committed' ? 'complete' : 'active';
  state.updatedAt = new Date().toISOString();
  state.nextAction = nextActionForStage(to, state.task);
  safeWriteJsonFile(repo, join(stateInfo.runDir, 'state.json'), state);
  dependencies.appendControlEvent(repo, stateInfo.runDir, 'state', `advanced to ${to}`, { from: stateInfo.previousStage, to, forced: !valid, reason: options.reason || '' });
  printObject({ taskId: state.taskId, stage: state.stage, status: state.status, nextAction: state.nextAction });
}

export function stateBlockers(repo, options = {}, dependencies = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) fail('No current state found. Run `sdlc state init --task "..."` first.');
  const rows = dependencies.controlGateRows(repo, stateInfo.state, stateInfo.runDir, options);
  const blockers = rows.filter((row) => row.status === 'block');
  printObject({
    taskId: stateInfo.state.taskId,
    blockers: blockers.length,
    result: blockers.length ? 'blocked' : 'clear',
  });
  printGateRows(rows);
  if (blockers.length) process.exitCode = 1;
}

export function stateExplain(repo, options = {}, dependencies = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) {
    printObject({ repository: repo, state: 'not initialized', nextAction: 'sdlc state init --task "..."' });
    return;
  }
  const evidence = dependencies.readEvidenceManifest(stateInfo.runDir);
  const checks = dependencies.readControlJsonLines(join(stateInfo.runDir, 'checks.jsonl'));
  const waivers = dependencies.readControlJsonLines(join(stateInfo.runDir, 'waivers.jsonl'));
  const gates = dependencies.controlGateRows(repo, stateInfo.state, stateInfo.runDir, options);
  printObject({
    taskId: stateInfo.state.taskId,
    task: stateInfo.state.task,
    route: stateInfo.state.route,
    stage: stateInfo.state.stage,
    status: stateInfo.state.status,
    requiredEvidence: evidence.required?.length || 0,
    capturedEvidence: evidence.captured?.length || 0,
    checks: checks.length,
    waivers: waivers.length,
    openBlockers: gates.filter((row) => row.status === 'block').length,
    nextAction: dependencies.nextActionFromGates(gates, stateInfo.state.task),
  });
  printGateRows(gates);
}
