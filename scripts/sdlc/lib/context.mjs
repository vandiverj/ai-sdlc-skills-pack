import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, dedupe, escapeCell, fail, formatInlineList, formatList, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteTextFile, splitList, stamp } from './common.mjs';
import { evidenceRequirementsForTask, readEvidenceManifest } from './evidence.mjs';
import { getGitInfo } from './git.mjs';
import { safeReadSmall } from './index.mjs';
import { defaultRunsDir } from './paths.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { inferContracts, inferDirtySurfaces, inferLikelyRoute, inferRouteFromTask, securityTriggers } from './routes.mjs';
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

export function contextRestore(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const profileValues = profile.values;
  const related = splitList(profileValues.relatedRepositories);
  const contextDocs = deps.contextDocCandidates(repo, profileValues).filter((item) => existsSync(item.path));
  const commands = discoverCommands(profileValues, packageJson);
  const output = {
    repository: repo,
    repositoryRole: profileValues.repositoryRole || '',
    branch: git.branch,
    status: git.status || 'clean',
    upstream: git.upstream,
    aheadBehind: `${git.behind} behind / ${git.ahead} ahead`,
    profilePath: profile.path ? relative(repo, profile.path) : 'not found',
    contextDocsFound: contextDocs.map((item) => `${item.label}: ${relative(repo, item.path) || '.'}`).join(', ') || 'none',
    sharedContextRoot: profileValues.sharedContextRoot || '',
    productContext: profileValues.productContext || '',
    repoContext: profileValues.repoContext || '',
    relatedRepositories: related.join(', '),
    commandsAvailable: Object.entries(commands)
      .filter(([, command]) => command)
      .map(([key, command]) => `${key}: ${command}`)
      .join('; ') || 'none discovered',
    likelyRoute: inferLikelyRoute(git),
    missingSetup: deps.missingSetup(profileValues, commands).join('; ') || 'none detected',
    recommendedNextCommand: 'sdlc evidence init --route standard',
  };
  if (options.includeRelatedRepos && related.length > 0) {
    output.relatedRepoStatus = related.map((item) => summarizeRelatedRepo(repo, item)).join('\n');
  }
  printObject(output);
}

export function contextPack(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context pack can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const related = splitList(profile.values.relatedRepositories);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const route = inferRouteFromTask(task, git, profile.values);
  const triggers = securityTriggers(task, profile.values);
  const dirtySurfaces = inferDirtySurfaces(task, git);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-context-pack.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Context Pack

Date: ${new Date().toISOString()}
Task: ${task}
Likely route: ${route}
Repository: ${repo}
Repository role: ${profile.values.repositoryRole || 'not configured'}
Branch: ${git.branch || 'unknown'}
Git status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Relevant Context Docs

${deps.formatContextDocs(repo, existingDocs)}

## Missing Context

${deps.formatContextDocs(repo, missingDocs)}

## Related Repositories

${formatList(related)}

## Contracts And Events Involved

${formatList(contracts)}

## Commands Likely Needed

${deps.formatCommandList(commands, route)}

## Potential Dirty Surfaces

${formatList(dirtySurfaces)}

## Security And Tool Triggers

${formatList(triggers)}

## Recommended Next Command

\`\`\`bash
sdlc route start ${route}
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function contextAudit(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const processLabels = ['AGENTS.md', 'SDLC profile JSON', 'SDLC profile Markdown', 'Agent-local SDLC profile', 'Agent-local repository setup'];
  const content = `# SDLC Context Audit

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Status: ${git.status || 'clean'}

## Process Docs

${deps.formatContextDocs(repo, existingDocs.filter((item) => processLabels.includes(item.label)))}

## Software Memory Docs

${deps.formatContextDocs(repo, existingDocs.filter((item) => !processLabels.includes(item.label)))}

## Missing Or Unconfigured Context

${deps.formatContextDocs(repo, missingDocs)}

## Guidance

- Process docs explain how agents should work.
- Software memory docs explain this software and cross-repo system state.
- External shared context roots are valid and should be configured in the SDLC profile instead of duplicated into every repository.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextFreshness(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const days = Number(options.days || 60);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => deps.contextFreshnessRow(repo, item, days));
  const existingRows = rows.filter((row) => row.status !== 'missing');
  const staleRows = rows.filter((row) => row.status === 'stale');
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Freshness

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Freshness window: ${days} days

## Context Documents Checked

| Document | Status | Age days | Path |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.ageDays} | ${escapeCell(row.path)} |`).join('\n')}

## Source Truth Cross-Check

- Changed files: ${git.changedFiles.length}
- Touched surfaces: ${formatInlineList(dedupe(git.changedFiles.map(deps.classifyTouchedSurface)))}
- Context docs used by agent should be named in the task ledger.
- If stale docs contradict source files, source files win and context update should be recorded.

## Recommended Action

${formatList(deps.contextFreshnessRecommendations(existingRows, staleRows, profile.values))}
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
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

function summarizeRelatedRepo(repo, item) {
  const path = resolve(repo, item);
  const info = getGitInfo(path);
  if (!info.branch) return `${item}: not a git repository or unavailable`;
  return `${item}: ${info.branch} ${info.status ? 'dirty' : 'clean'} ${info.behind}/${info.ahead}`;
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
