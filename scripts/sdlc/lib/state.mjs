import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readJsonIfExists, slug, stamp } from './common.mjs';
import { defaultRunsDir } from './paths.mjs';

function escapeCommandArg(value) {
  return String(value || '').replace(/"/g, '\"');
}

export function controlRunRoot(repo, options = {}) {
  return options.outRoot ? resolve(repo, options.outRoot) : defaultRunsDir(repo);
}

export function controlCurrentPointerPath(repo, options = {}) {
  return join(controlRunRoot(repo, options), 'current.json');
}

export function controlRunDir(repo, options = {}) {
  const root = controlRunRoot(repo, options);
  const id = options.taskId || `${stamp()}-${slug(options.task || 'task')}`;
  return join(root, id);
}

export function ensureControlRunDir(repo, options = {}, task = '') {
  const info = readCurrentStateInfo(repo, options);
  if (info.runDir) return info.runDir;
  const runDir = controlRunDir(repo, { ...options, task });
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

export function readCurrentState(repo, options = {}) {
  return readCurrentStateInfo(repo, options).state;
}

export function readCurrentStateInfo(repo, options = {}) {
  const pointer = readJsonIfExists(controlCurrentPointerPath(repo, options));
  const runDir = options.taskId ? join(controlRunRoot(repo, options), options.taskId) : pointer?.path ? resolve(repo, pointer.path) : '';
  const statePath = runDir ? join(runDir, 'state.json') : '';
  const state = statePath && existsSync(statePath) ? readJsonIfExists(statePath) : null;
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
