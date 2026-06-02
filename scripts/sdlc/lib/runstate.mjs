import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { dedupe, escapeCommandArg, optionFiles, readJsonIfExists, slug } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { artifactBudgetForRoute } from './artifacts.mjs';
import { defaultRunsDir, runStatePath } from './paths.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { affectedUnits, inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';

export function buildRunState(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  return {
    timestamp: new Date().toISOString(),
    task,
    repo,
    branch: git.branch,
    route,
    affectedUnits: units.map((unit) => unit.name),
    contextBuckets: dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)),
    testingSurfaces: surfaces,
    qaMode: qaModeForSurfaces(surfaces, task),
    artifactBudget: artifactBudgetForRoute(route).name,
    nextAction: `sdlc run dashboard --task "${escapeCommandArg(task)}"`,
  };
}

export function loadRunState(repo, task) {
  const explicit = task ? runStatePath(repo, task) : '';
  if (explicit && existsSync(explicit)) return { ...readJsonIfExists(explicit), path: explicit };
  const dir = defaultRunsDir(repo);
  if (!existsSync(dir)) return {};
  const files = readdirSync(dir).filter((file) => file.endsWith('-run-state.json')).map((file) => join(dir, file));
  if (!files.length) return {};
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return { ...readJsonIfExists(files[0]), path: files[0] };
}

export function runNextAction(repo, state, git, dependencies = {}) {
  const task = state.task || '';
  if (!state.path) return task ? `sdlc run plan --task "${escapeCommandArg(task)}"` : 'sdlc run plan --task "..."';
  const findPackets = dependencies.findPackets || (() => []);
  const finalGateOpenItems = dependencies.finalGateOpenItems || (() => []);
  const suggestedFinalGateCommand = dependencies.suggestedFinalGateCommand || ((gate) => gate?.next || 'sdlc done check');
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  if (!packets.some((packet) => packet.kind === 'task-preflight')) return `sdlc task preflight --task "${escapeCommandArg(task)}" --lock`;
  if (git.changedFiles.length && !packets.some((packet) => packet.kind === 'touched')) return 'sdlc touched packet';
  if (!packets.some((packet) => packet.kind === 'developer-verification')) return `sdlc verify packet --task "${escapeCommandArg(task)}"`;
  if (open.length) return suggestedFinalGateCommand(open[0], task);
  return `sdlc task finish --task "${escapeCommandArg(task)}"`;
}
