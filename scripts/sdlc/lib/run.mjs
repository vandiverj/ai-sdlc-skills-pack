import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, escapeCell, escapeCommandArg, fail, formatInlineList, formatList, printObject, safeWriteTextFile, slug, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir, runStatePath } from './paths.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';
import { buildRunState, loadRunState, runNextAction } from './runstate.mjs';
import { affectedUnits, inferTestingSurfaces } from './units.mjs';

export function runStartPacketCommand(route, task) {
  if (route === 'review-only') return `sdlc review packet --task "${escapeCommandArg(task)}"`;
  if (route === 'release-push') return 'sdlc release packet';
  if (route === 'multi-repo-integration') return `sdlc multi packet --task "${escapeCommandArg(task)}"`;
  if (route === 'contract-first') return `sdlc contract packet --task "${escapeCommandArg(task)}"`;
  if (route === 'bugfix-live-system') return `sdlc bug evidence --task "${escapeCommandArg(task)}"`;
  return `sdlc evidence init --route ${route}`;
}

export function runStartGates(route, task, gitInfo, profile) {
  const gates = [];
  if (!profile.releasePolicy && route === 'release-push') gates.push('release policy missing from profile');
  if (!profile.sharedContextRoot && route === 'multi-repo-integration') gates.push('shared context root or service map may be needed');
  if (gitInfo.status) gates.push('dirty working tree must be scoped');
  gates.push(...securityTriggers(task, profile).map((item) => `security/tool trigger: ${item}`));
  return gates.length ? gates : ['normal route gates only'];
}

export function runPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the run can be planned.');
  const state = buildRunState(repo, task, options);
  const outPath = options.out ? resolve(repo, options.out) : runStatePath(repo, task);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(state, null, 2), 'utf8');
  console.log(relative(repo, outPath));
}

export function runStart(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the run can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-run-start.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Run Start

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Route: ${route}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Suggested Command Sequence

\`\`\`bash
sdlc readiness
sdlc context pack --task "${escapeCommandArg(task)}"
sdlc route start ${route} --task "${escapeCommandArg(task)}"
${dependencies.runStartPacketCommand(route, task)}
\`\`\`

## Open Gates

${formatList(dependencies.runStartGates(route, task, git, profile.values))}

## Finish Command

\`\`\`bash
sdlc run finish --route ${route}
\`\`\`
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function runFinish(repo, options = {}, dependencies = {}) {
  const route = options.route || '';
  if (!route) fail('Pass --route <route> so run finish can check the right gates.');

  const git = getGitInfo(repo);
  const packet = options.packet ? dependencies.readPacket(repo, dependencies.resolvePacketPath(repo, options.packet)) : dependencies.findLatestPacket(repo, route);
  const done = dependencies.doneChecksForRoute(route, git, packet);
  const open = done.filter((item) => item.status === 'open');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-run-finish.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Run Finish

Date: ${new Date().toISOString()}
Repository: ${repo}
Route: ${route}
Packet: ${packet ? relative(repo, packet.path) : 'none'}
Result: ${open.length ? 'open gates remain' : 'done checks pass'}

## Done Checks

| Check | Status | Detail |
| --- | --- | --- |
${done.map((item) => `| ${escapeCell(item.name)} | ${item.status} | ${escapeCell(item.detail)} |`).join('\n')}

## Remaining Work

${formatList(open.map((item) => `${item.name}: ${item.detail}`))}
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (open.length) process.exitCode = 1;
}

export function runStatus(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  const state = loadRunState(repo, task);
  const git = getGitInfo(repo);
  printObject({
    repository: repo,
    task: state.task || task || 'not provided',
    route: state.route || 'unknown',
    runState: state.path ? relative(repo, state.path) : 'not found',
    changedFiles: git.changedFiles.length,
    nextAction: runNextAction(repo, state, git, dependencies),
  });
}

export function runNext(repo, options = {}, dependencies = {}) {
  const state = loadRunState(repo, options.task || '');
  const git = getGitInfo(repo);
  console.log(runNextAction(repo, state, git, dependencies));
}

export function runResume(repo, options = {}, dependencies = {}) {
  const state = loadRunState(repo, options.task || '');
  if (!state.path) fail('No run state found. Use `sdlc run plan --task "..."` first.');
  runDashboard(repo, { ...options, task: state.task, out: options.out }, dependencies);
}

export function runDashboard(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  const state = loadRunState(repo, task);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const findPackets = dependencies.findPackets || (() => []);
  const finalGateOpenItems = dependencies.finalGateOpenItems || (() => []);
  const taskEvidenceSummary = dependencies.taskEvidenceSummary || (() => ['No evidence summary provider available.']);
  const packets = findPackets(repo, {});
  const route = state.route || inferRouteFromTask(task, git, profile.values);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task || state.task || '', git.changedFiles, profile);
  const open = finalGateOpenItems(repo, task || state.task || '', git, packets);
  const content = `# SDLC Run Dashboard

Task: ${task || state.task || 'not provided'}
Repository: ${repo}
Route: ${route}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Scope

- Changed files: ${git.changedFiles.length}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Test surfaces: ${formatInlineList(surfaces)}

## Evidence

${formatList(taskEvidenceSummary(repo, packets))}

## Open Gates

${formatList(open)}

## QA

- QA script: ${packets.some((packet) => packet.kind === 'qa-script') ? 'present' : 'missing or not needed'}
- Recommended QA command: sdlc qa script --task "${escapeCommandArg(task || state.task || 'current task')}"

## Finish

- Commit: ${open.length ? 'not ready' : 'ready only with explicit human approval'}
- Push: ${open.length ? 'not ready' : 'only with explicit human approval'}
- Merge/deploy/release: not automatic
- Next safe action: ${runNextAction(repo, state, git, dependencies)}
`;
  if (options.out) {
    const outPath = resolve(repo, options.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}
