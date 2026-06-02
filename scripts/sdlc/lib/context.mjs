import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, dedupe, formatList, printTable, readJsonLines, safeWriteTextFile } from './common.mjs';
import { evidenceRequirementsForTask, readEvidenceManifest } from './evidence.mjs';
import { getGitInfo } from './git.mjs';
import { safeReadSmall } from './index.mjs';
import { defaultRunsDir } from './paths.mjs';
import { loadProfile } from './profile.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { loadRunState } from './runstate.mjs';
import { ensureControlRunDir, nextActionForStage, readCurrentState, readCurrentStateInfo } from './state.mjs';
import { affectedUnits, inferTestingSurfaces } from './units.mjs';

function optionFiles(options, fallback = []) {
  return options.files ? String(options.files).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean) : fallback;
}

export function contextBudget(repo, options = {}, deps = {}) {
  const rows = contextBudgetRows(repo, options, deps);
  printTable(['Source', 'Approx Tokens', 'Status', 'Note'], rows.map((row) => [row.source, row.tokens, row.status, row.note]));
  const total = rows.reduce((sum, row) => sum + row.tokens, 0);
  console.log(`Total approximate tokens: ${total}`);
  if (rows.some((row) => row.status === 'warn')) process.exitCode = 1;
}

export function contextAssemble(repo, options = {}, deps = {}) {
  const phase = options.phase || 'planning';
  const packet = buildContextPacket(repo, phase, options);
  const outPath = options.out ? resolve(repo, options.out) : join(ensureControlRunDir(repo, options, options.task || phase), 'context', `${phase}.context.md`);
  safeWriteTextFile(repo, outPath, renderContextPacket(packet));
  appendContextLedger(repo, outPath, packet);
  console.log(relative(repo, outPath));
}

export function contextCompact(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const state = readCurrentState(repo, options) || synthesizeFallbackState(repo, options.task || '', options);
  const manifest = info.runDir ? readEvidenceManifest(info.runDir) : { required: [], captured: [] };
  const lines = [
    '# SDLC Compact Context',
    '',
    `Task: ${state.task || options.task || 'not provided'}`,
    `Route: ${state.route || 'unknown'}`,
    `Stage: ${state.stage || 'unknown'}`,
    '',
    '## Evidence Snapshot',
    '',
    ...formatList((manifest.captured || []).map((item) => `${item.kind}: ${item.summary}`).slice(-12)).split('\n'),
    '',
    '## Next Action',
    '',
    nextActionForStage(state.stage || 'intake', state.task || options.task || ''),
  ];
  const outPath = options.out ? resolve(repo, options.out) : join(ensureControlRunDir(repo, options, options.task || 'compact'), 'context', 'compact.context.md');
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}

export function contextLedger(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const ledgers = [];
  if (info.runDir) ledgers.push(join(info.runDir, 'context', 'context-ledger.jsonl'));
  const root = defaultRunsDir(repo);
  if (existsSync(root)) {
    for (const file of readdirSync(root)) {
      const candidate = join(root, file, 'context', 'context-ledger.jsonl');
      if (existsSync(candidate)) ledgers.push(candidate);
    }
  }
  const rows = dedupe(ledgers).flatMap((ledger) => readJsonLines(ledger));
  if (!rows.length) return console.log('No context ledger rows found. Run sdlc context assemble first.');
  printTable(['Time', 'Phase', 'Tokens', 'Path'], rows.map((row) => [row.timestamp, row.phase, row.approxTokens, row.path]));
}

function contextBudgetRows(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const state = readCurrentState(repo, options) || loadRunState(repo, options.task || '') || {};
  const docs = (deps.contextDocCandidates?.(repo, profile.values) || []).filter((item) => existsSync(item.path));
  return [
    budgetRow('runtime adapter/global skill prompt', 2500, 'estimate', 'keep static instructions minimal'),
    budgetRow('repo profile', approxTokens(profile.path ? readFileSync(profile.path, 'utf8') : ''), profile.path ? 'ok' : 'warn', profile.path ? relative(repo, profile.path) : 'missing'),
    budgetRow('task state', approxTokens(JSON.stringify(state)), state.task || options.task ? 'ok' : 'warn', state.task ? 'current state found' : options.task ? 'task provided without current state file' : 'task not provided'),
    budgetRow('context docs', docs.reduce((sum, item) => sum + approxTokens(safeReadSmall(item.path, 12000)), 0), docs.length > 4 ? 'warn' : 'ok', `${docs.length} candidate docs`),
    budgetRow('tool output summaries', 600, 'estimate', 'prefer summaries over raw logs'),
  ];
}

function budgetRow(source, tokens, status, note) {
  return { source, tokens: Math.round(tokens || 0), status, note };
}

function approxTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function buildContextPacket(repo, phase, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const requirements = evidenceRequirementsForTask(repo, task, route, git, profile, options);
  return { phase, task, route, repo, branch: git.branch, files, units, surfaces, requirements, profilePath: profile.path ? relative(repo, profile.path) : '', nextAction: nextActionForPhase(phase, task) };
}

function renderContextPacket(packet) {
  return ['# SDLC Context Packet', '', `Phase: ${packet.phase}`, `Task: ${packet.task || 'not provided'}`, `Route: ${packet.route}`, `Repository: ${packet.repo}`, `Branch: ${packet.branch || 'unknown'}`, '', '## Affected Units', '', ...formatList(packet.units.map((unit) => `${unit.name}: ${unit.path} (${unit.testSurface || 'surface?'})`)).split('\n'), '', '## Changed Files', '', ...formatList(packet.files).split('\n'), '', '## Testing Surfaces', '', ...formatList(packet.surfaces).split('\n'), '', '## Required Evidence', '', ...formatList(packet.requirements.map((item) => `${item.level}: ${item.id} - ${item.summary}`)).split('\n'), '', '## Context Source', '', `- Profile: ${packet.profilePath || 'not found'}`, '- Archived plans excluded by default.', '- Load exact code or docs only when needed for this phase.', '', '## Next Action', '', packet.nextAction, ''].join('\n');
}

function appendContextLedger(repo, outPath, packet) {
  const ledger = join(dirname(outPath), 'context-ledger.jsonl');
  appendControlJsonLine(repo, ledger, { timestamp: new Date().toISOString(), phase: packet.phase, task: packet.task, path: outPath, approxTokens: approxTokens(renderContextPacket(packet)) });
}

function nextActionForPhase(phase, task) {
  if (phase === 'intake') return 'sdlc config validate && sdlc capability snapshot';
  if (phase === 'planning') return `sdlc recipe compile --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'implementation') return 'edit within affected units and keep scope ledger current';
  if (phase === 'verification') return `sdlc checks plan && sdlc evidence plan --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'qa') return `sdlc qa build --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'finish') return `sdlc complete check --task "${escapeCommandArg(task || '...')}"`;
  return 'continue with SDLC state/current evidence';
}

function synthesizeFallbackState(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  return {
    taskId: options.taskId || slugLike(task || 'ad-hoc'),
    task,
    repo,
    route: options.route || inferRouteFromTask(task, git, profile.values),
    stage: options.stage || 'finish-ready',
    status: 'ad-hoc',
  };
}

function slugLike(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

function escapeCommandArg(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
