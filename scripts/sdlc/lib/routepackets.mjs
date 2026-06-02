import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { escapeCell, fail, formatList, printObject, readJsonIfExists, safeWriteTextFile, slug, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { securityTriggers } from './routes.mjs';

export function routeStart(repo, route, options = {}, dependencies = {}) {
  const { accessibilityPolicy, formatAccessibilityPolicy, formatCommandList, formatSecurityOverlay, getRecipe } = dependencies;
  if (!route) fail('Pass a route name, such as standard, release-push, review-only, or multi-repo-integration.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const recipe = getRecipe(route);
  const task = options.task || '';
  const triggers = securityTriggers(task, profile.values);
  const accessibility = accessibilityPolicy(profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-route.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Route Packet

Date: ${new Date().toISOString()}
Route: ${route}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Route Recipe

${recipe}

## Route Checklist

- [ ] Restore or generate the context pack for this task.
- [ ] Confirm required context docs are present or document the cap.
- [ ] Confirm human consent gates before risky edits or release actions.
- [ ] Execute the minimum route checks needed for this work class.
- [ ] Record verification evidence and unresolved caps.
- [ ] Add a calibration row when the route completes or is abandoned.

## Commands Available

${formatCommandList(commands, route)}

## Security Overlay

${formatSecurityOverlay(triggers)}

## Accessibility Policy

${formatAccessibilityPolicy(accessibility, route)}

## Evidence Skeleton

| Item | Evidence | Status |
| --- | --- | --- |
| Context restored |  | pending |
| Scope confirmed |  | pending |
| Implementation/review completed |  | pending |
| Verification run |  | pending |
| Security/tool triggers checked |  | pending |
| Accessibility checked or capped according to policy |  | pending |
| Context docs updated if truth changed |  | pending |
| Calibration captured |  | pending |

## Calibration Stub

\`\`\`bash
sdlc calibrate add --route ${route} --checks "" --caps "" --outcome "" --route-fit "" --context-missing "" --verification-missing "" --friction "" --process-change-proposed ""
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function routeRetire(repo, options = {}, dependencies = {}) {
  const { classifySearchPath, formatSearchGroups, groupBy, searchPattern } = dependencies;
  const task = options.task || '';
  const oldPattern = options.old || options.oldPattern || '';
  const newPattern = options.new || options.newPattern || '';
  if (!task) fail('Pass --task "..." so route retirement evidence can be scoped.');
  if (!oldPattern || !newPattern) fail('Pass --old <pattern> and --new <pattern>.');
  const scope = options.scope ? resolve(repo, options.scope) : repo;
  const oldResults = searchPattern(scope, oldPattern).map((item) => ({ ...item, category: classifySearchPath(relative(repo, item.path)) }));
  const newResults = searchPattern(scope, newPattern).map((item) => ({ ...item, category: classifySearchPath(relative(repo, item.path)) }));
  const activeOld = oldResults.filter((item) => item.category === 'active source/page reference');
  const activeNew = newResults.filter((item) => item.category === 'active source/page reference');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-route-retirement.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Route Retirement Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Scope: ${relative(repo, scope) || '.'}
Old route/pattern: ${oldPattern}
New route/pattern: ${newPattern}
Result: ${activeOld.length ? 'open - old active references remain' : activeNew.length ? 'ready-looking' : 'open - no new active references found'}

## Active Callers Expected

- to be filled by the agent/human for the route replacement task

## Positive Search: New Route

${formatSearchGroups(repo, groupBy(newResults, (item) => item.category))}

## Negative Search: Old Route

${formatSearchGroups(repo, groupBy(oldResults, (item) => item.category))}

## Remaining Old References Classification

${formatList(oldResults.map((item) => `${item.category}: ${relative(repo, item.path)}:${item.line}`))}

## Manual QA Expectations

- Validate the user/API/download/workflow behavior that should now use the new route.
- Confirm the old failure, log, or bad route is absent in QA/staging when that evidence is available.
- Archived/generated/dependency references are not failures unless the task explicitly targets them.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (activeOld.length || !activeNew.length) process.exitCode = 1;
}

export function routeProof(repo, options = {}, dependencies = {}) {
  return routeRetire(repo, options, dependencies);
}

export function packetStatus(repo, options = {}, dependencies = {}) {
  const { completionTrackedPacketKinds, findPackets } = dependencies;
  const packets = findPackets(repo, options);
  const trackedKinds = completionTrackedPacketKinds();
  const rows = packets.map((packet) => ({
    file: relative(repo, packet.path),
    kind: packet.kind,
    completed: trackedKinds.includes(packet.kind) ? (packet.completed ? 'yes' : 'no') : 'n/a',
    verdict: packet.verdict || '',
    action: packet.action || '',
    head: packet.head || '',
  }));
  printObject({ repository: repo, packets: rows.length, openPackets: rows.filter((row) => row.completed === 'no').length, completedPackets: rows.filter((row) => row.completed === 'yes').length, latestPacket: rows[0]?.file || 'none' });
  if (rows.length) {
    console.log('\n| Packet | Kind | Completed | Verdict | Action | Head |');
    console.log('| --- | --- | --- | --- | --- | --- |');
    for (const row of rows) console.log(`| ${escapeCell(row.file)} | ${row.kind} | ${row.completed} | ${escapeCell(row.verdict)} | ${escapeCell(row.action)} | ${row.head} |`);
  }
}

export function doneCheck(repo, options = {}, dependencies = {}) {
  const { doneChecksForRoute, findLatestPacket, readPacket, resolvePacketPath } = dependencies;
  const route = options.route || '';
  if (!route) fail('Pass --route <route> so done checks can be route-specific.');
  const git = getGitInfo(repo);
  const packet = options.packet ? readPacket(repo, resolvePacketPath(repo, options.packet)) : findLatestPacket(repo, route);
  const checks = doneChecksForRoute(route, git, packet);
  const pass = checks.every((item) => item.status === 'pass' || item.status === 'note');
  printObject({ repository: repo, route, packet: packet ? relative(repo, packet.path) : 'none', result: pass ? 'pass' : 'open' });
  console.log('\n| Check | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const check of checks) console.log(`| ${escapeCell(check.name)} | ${check.status} | ${escapeCell(check.detail)} |`);
  if (!pass) process.exitCode = 1;
}
