#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const agentsRoot = resolve(dirname(scriptPath), '..', '..');

const args = process.argv.slice(2);

await main(args);

async function main(argv) {
  const [area, action, ...rest] = argv;
  const areaOptions = parseOptions(argv.slice(1));

  if (!area || area === '-h' || area === '--help') {
    printHelp();
    return;
  }

  const options = parseOptions(rest);
  const repo = resolve(options.repo || process.cwd());

  if (area === 'profile' && action === 'show') return profileShow(repo);
  if (area === 'profile' && action === 'init') return profileInit(repo, options);
  if (area === 'context' && action === 'restore') return contextRestore(repo, options);
  if (area === 'context' && action === 'pack') return contextPack(repo, options);
  if (area === 'context' && action === 'audit') return contextAudit(repo, options);
  if (area === 'context' && action === 'update-plan') return contextUpdatePlan(repo, options);
  if (area === 'recipe' && action === 'show') return recipeShow(rest[0] || options.route);
  if (area === 'route' && action === 'start') return routeStart(repo, rest[0] || options.route, options);
  if (area === 'packet' && action === 'status') return packetStatus(repo, options);
  if (area === 'done' && action === 'check') return doneCheck(repo, options);
  if (area === 'run' && action === 'start') return runStart(repo, options);
  if (area === 'run' && action === 'finish') return runFinish(repo, options);
  if (area === 'review' && action === 'packet') return reviewPacket(repo, options);
  if (area === 'review' && action === 'complete') return reviewComplete(repo, options);
  if (area === 'release' && action === 'packet') return releasePacket(repo, options);
  if (area === 'release' && action === 'complete') return releaseComplete(repo, options);
  if (area === 'multi' && action === 'status') return multiStatus(repo, options);
  if (area === 'multi' && action === 'packet') return multiPacket(repo, options);
  if (area === 'contract' && action === 'packet') return contractPacket(repo, options);
  if (area === 'evidence' && action === 'init') return evidenceInit(repo, options);
  if (area === 'verify') return verify(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'calibrate' && action === 'add') return calibrateAdd(repo, options);
  if (area === 'calibrate' && action === 'summary') return calibrateSummary(repo, options);
  if (area === 'calibrate' && action === 'inspect') return calibrateInspect(repo, options);
  if (area === 'calibrate' && action === 'propose') return calibratePropose(repo, options);
  if (area === 'readiness') return readiness(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'setup' && action === 'doctor') return setupDoctor(repo, options);
  if (area === 'health') return health(repo, areaOptions);
  if (area === 'render' && action === 'smoke') return renderSmoke(repo, options);
  if (area === 'scenario' && action === 'list') return scenarioList();
  if (area === 'scenario' && action === 'show') return scenarioShow(rest[0] || options.name);
  if (area === 'scenario' && action === 'validate') return scenarioValidate(rest[0] || options.name, repo, options);
  if (area === 'scenario' && action === 'test') return scenarioTest(repo, options);
  if (area === 'handoff') return handoff(resolve(areaOptions.repo || process.cwd()), areaOptions);

  fail(`Unknown command: ${argv.join(' ')}`);
}

function printHelp() {
  console.log(`SDLC helper CLI

Usage:
  sdlc profile show [--repo <path>]
  sdlc profile init [--repo <path>] [--shared-context-root <path>]
  sdlc context restore [--repo <path>] [--include-related-repos]
  sdlc context pack --task "..." [--repo <path>] [--out <path>]
  sdlc context audit [--repo <path>] [--out <path>]
  sdlc context update-plan --task "..." [--repo <path>] [--out <path>]
  sdlc recipe show <route>
  sdlc route start <route> [--task "..."] [--repo <path>] [--out <path>]
  sdlc packet status [--repo <path>]
  sdlc done check --route <route> [--repo <path>] [--packet <path>]
  sdlc run start --task "..." [--repo <path>]
  sdlc run finish --route <route> [--repo <path>] [--packet <path>]
  sdlc review packet --task "..." [--repo <path>] [--out <path>]
  sdlc review complete --packet <path> --verdict "..." [--findings "..."] [--checks "..."] [--caps "..."]
  sdlc release packet [--task "..."] [--repo <path>] [--out <path>]
  sdlc release complete --packet <path> --action "none|commit|push|handoff" [--verdict "..."] [--checks "..."] [--caps "..."]
  sdlc multi status [--repo <path>]
  sdlc multi packet --task "..." [--repo <path>] [--out <path>]
  sdlc contract packet --task "..." [--repo <path>] [--out <path>]
  sdlc evidence init --route <route> [--repo <path>] [--out <path>]
  sdlc verify [--repo <path>] [--commands test,build]
  sdlc calibrate add --route <route> [--repo <path>] [--out <path>]
  sdlc calibrate summary [--repo <path>] [--in <path>] [--out <path>]
  sdlc calibrate inspect [--repo <path>] [--in <path>]
  sdlc calibrate propose [--repo <path>] [--in <path>] [--out <path>]
  sdlc readiness [--repo <path>]
  sdlc health [--repo <path>]
  sdlc setup doctor [--repo <path>] [--fix-plan]
  sdlc render smoke --url <url> [--repo <path>] [--cdp <url>] [--screenshot-dir <path>]
  sdlc scenario list
  sdlc scenario show <name>
  sdlc scenario validate <name> --task "..." [--repo <path>]
  sdlc scenario test [--repo <path>]
  sdlc handoff [--repo <path>]

This CLI automates mechanical SDLC evidence and context tasks. It does not replace
agent judgment, source review, human approvals, or the .agents skill guidance.`);
}

function parseOptions(tokens) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = tokens[index + 1];
    if (!next || next.startsWith('--')) {
      options[toCamel(key)] = true;
      continue;
    }

    options[toCamel(key)] = next;
    index++;
  }

  options._ = positionals;
  return options;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function profileShow(repo) {
  const profile = loadProfile(repo);
  printObject({
    repository: repo,
    profilePath: profile.path ? relative(repo, profile.path) : 'not found',
    repositoryName: profile.values.repository || profile.values.name || basename(repo),
    sharedContextRoot: profile.values.sharedContextRoot || '',
    productContext: profile.values.productContext || '',
    repoContext: profile.values.repoContext || '',
    productContextIndex: profile.values.productContextIndex || '',
    repoContextIndex: profile.values.repoContextIndex || '',
    serviceMap: profile.values.serviceMap || '',
    workflowMap: profile.values.workflowMap || '',
    releaseOrder: profile.values.releaseOrder || '',
    knownFailureModes: profile.values.knownFailureModes || '',
    testCommand: profile.values.testCommand || '',
    buildCommand: profile.values.buildCommand || '',
    lintTypecheckFormatCommands: profile.values.lintTypecheckFormatCommands || '',
    renderedUiReviewCommand: profile.values.renderedUiReviewCommand || '',
    accessibilityReviewPolicy: accessibilityPolicy(profile.values),
    evidenceOutputLocation: profile.values.evidenceOutputLocation || defaultRunsDir(repo),
    calibrationLog: profile.values.calibrationLog || defaultCalibrationPath(repo),
  });
}

function profileInit(repo, options) {
  const target = join(repo, '.ai-local', 'sdlc-profile.md');
  if (existsSync(target) && !options.force) {
    fail(`${relative(repo, target)} already exists. Pass --force to overwrite.`);
  }

  mkdirSync(dirname(target), { recursive: true });
  const git = getGitInfo(repo);
  const sharedContextRoot = options.sharedContextRoot || '';
  const content = `# SDLC Profile

Purpose: local repository profile for SDLC helper automation. Keep this file ignored/local unless the team approves sharing a sanitized variant.

## Repository
- Repository: ${basename(repo)}
- Path: ${repo}
- Branch: ${git.branch}
- Source host:
- Classification: personal / work / team / production
- Repository role:
- Related repositories:

## Context
- Shared context root: ${sharedContextRoot}
- Product context:
- Repo context:
- Product context index:
- Repo context index:
- Service map:
- Workflow map:
- Release order:
- Known failure modes:
- Durable docs:
- Agent-local docs: .ai-local/
- Evidence output location: .ai-local/sdlc-runs/
- Calibration log: .ai-local/sdlc-calibration.jsonl

## Commands
- Install command:
- Dev server command:
- Test command:
- Build command:
- Lint/typecheck/format commands:
- Rendered UI review command:
- Accessibility review policy: optional

## Release
- Release policy:
- Human approval gates:

## Tool Boundaries
- Approved tools:
- Blocked tools:
- Sensitive data restrictions:

## Last Reviewed
- Date:
- Reviewer:
`;

  writeFileSync(target, content, 'utf8');
  console.log(`Created ${relative(repo, target)}`);
}

function contextRestore(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const profileValues = profile.values;
  const related = splitList(profileValues.relatedRepositories);
  const contextDocs = contextDocCandidates(repo, profileValues).filter((item) => existsSync(item.path));

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
    missingSetup: missingSetup(profileValues, commands).join('; ') || 'none detected',
    recommendedNextCommand: 'sdlc evidence init --route standard',
  };

  if (options.includeRelatedRepos && related.length > 0) {
    output.relatedRepoStatus = related.map((item) => summarizeRelatedRepo(repo, item)).join('\n');
  }

  printObject(output);
}

function recipeShow(route) {
  console.log(getRecipe(route));
}

function contextPack(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context pack can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const related = splitList(profile.values.relatedRepositories);
  const docs = contextDocCandidates(repo, profile.values);
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

${formatContextDocs(repo, existingDocs)}

## Missing Context

${formatContextDocs(repo, missingDocs)}

## Related Repositories

${formatList(related)}

## Contracts And Events Involved

${formatList(contracts)}

## Commands Likely Needed

${formatCommandList(commands, route)}

## Potential Dirty Surfaces

${formatList(dirtySurfaces)}

## Security And Tool Triggers

${formatList(triggers)}

## Recommended Next Command

\`\`\`bash
sdlc route start ${route}
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function contextAudit(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Audit

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Status: ${git.status || 'clean'}

## Process Docs

${formatContextDocs(repo, existingDocs.filter((item) => ['AGENTS.md', 'SDLC profile JSON', 'SDLC profile Markdown', 'Agent-local SDLC profile', 'Agent-local repository setup'].includes(item.label)))}

## Software Memory Docs

${formatContextDocs(repo, existingDocs.filter((item) => !['AGENTS.md', 'SDLC profile JSON', 'SDLC profile Markdown', 'Agent-local SDLC profile', 'Agent-local repository setup'].includes(item.label)))}

## Missing Or Unconfigured Context

${formatContextDocs(repo, missingDocs)}

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

function contextUpdatePlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context update plan can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = inferRouteFromTask(task, git, profile.values);
  const dirtySurfaces = inferDirtySurfaces(task, git);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-context-update-plan.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Context Update Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Route: ${route}
Status: ${git.status || 'clean'}

## Update Only If Truth Changed

${formatList(contextUpdateTargets(route, dirtySurfaces, contracts, profile.values))}

## Dirty Surfaces

${formatList(dirtySurfaces)}

## Contracts Or Interfaces

${formatList(contracts)}

## Documentation Boundary

- Do not store process flow rediscovery in repo memory docs.
- Do store software-specific workflow, contract, service, release-order, and architecture facts when they help future agents avoid rediscovery.
- Prefer code-local docs for public exports, shared types, APIs, invariants, and examples.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function routeStart(repo, route, options = {}) {
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

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function packetStatus(repo, options = {}) {
  const packets = findPackets(repo, options);
  const rows = packets.map((packet) => ({
    file: relative(repo, packet.path),
    kind: packet.kind,
    completed: packet.completed ? 'yes' : 'no',
    verdict: packet.verdict || '',
    action: packet.action || '',
    head: packet.head || '',
  }));

  printObject({
    repository: repo,
    packets: rows.length,
    openPackets: rows.filter((row) => row.completed === 'no').length,
    completedPackets: rows.filter((row) => row.completed === 'yes').length,
    latestPacket: rows[0]?.file || 'none',
  });

  if (rows.length) {
    console.log('\n| Packet | Kind | Completed | Verdict | Action | Head |');
    console.log('| --- | --- | --- | --- | --- | --- |');
    for (const row of rows) {
      console.log(`| ${escapeCell(row.file)} | ${row.kind} | ${row.completed} | ${escapeCell(row.verdict)} | ${escapeCell(row.action)} | ${row.head} |`);
    }
  }
}

function doneCheck(repo, options = {}) {
  const route = options.route || '';
  if (!route) fail('Pass --route <route> so done checks can be route-specific.');

  const git = getGitInfo(repo);
  const packet = options.packet ? readPacket(repo, resolvePacketPath(repo, options.packet)) : findLatestPacket(repo, route);
  const checks = doneChecksForRoute(route, git, packet);
  const pass = checks.every((item) => item.status === 'pass' || item.status === 'note');

  printObject({
    repository: repo,
    route,
    packet: packet ? relative(repo, packet.path) : 'none',
    result: pass ? 'pass' : 'open',
  });
  console.log('\n| Check | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const check of checks) console.log(`| ${escapeCell(check.name)} | ${check.status} | ${escapeCell(check.detail)} |`);
  if (!pass) process.exitCode = 1;
}

function runStart(repo, options = {}) {
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
${runStartPacketCommand(route, task)}
\`\`\`

## Open Gates

${formatList(runStartGates(route, task, git, profile.values))}

## Finish Command

\`\`\`bash
sdlc run finish --route ${route}
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function runFinish(repo, options = {}) {
  const route = options.route || '';
  if (!route) fail('Pass --route <route> so run finish can check the right gates.');

  const git = getGitInfo(repo);
  const packet = options.packet ? readPacket(repo, resolvePacketPath(repo, options.packet)) : findLatestPacket(repo, route);
  const done = doneChecksForRoute(route, git, packet);
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

function getRecipe(route) {
  if (!route) fail('Pass a route name, such as standard, release-push, review-only, or multi-repo-integration.');

  const recipesPath = join(agentsRoot, 'skills', 'run-sdlc', 'references', 'route-recipes.md');
  if (!existsSync(recipesPath)) fail(`Missing route recipes: ${recipesPath}`);

  const text = readFileSync(recipesPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `### ${String(route).toLowerCase()}`);
  if (start < 0) fail(`Route recipe not found: ${route}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (lines[index].startsWith('### ')) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join('\n').trimEnd();
}

function evidenceInit(repo, options = {}) {
  const route = options.route || 'standard';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-evidence.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Evidence Packet

Date: ${new Date().toISOString()}
Route: ${route}
Repository: ${repo}
Branch: ${git.branch}
Upstream: ${git.upstream}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Intent
-

## Scope
-

## Changed Files

${formatList(git.changedFiles)}

## Checks

| Command | Result | Notes |
| --- | --- | --- |
|  |  |  |

## Evidence Caps
-

## Review Notes
-

## Handoff
- Suggested next action:
- Human approvals needed:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function reviewPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the review packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const inferredRoute = inferRouteFromTask(task, git, profile.values);
  const route = 'review-only';
  const triggers = securityTriggers(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-review-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Review Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Head: ${git.head || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Suggested route: ${route}
Other route signals: ${inferredRoute === route ? 'none' : inferredRoute}

## Read-Only Scope

- Do not edit code, docs, tests, or generated files while using this packet unless the work is explicitly rerouted.
- Review task: ${task}
- Changed files:
${indentList(git.changedFiles)}

## Context To Inspect

${formatContextDocs(repo, existingDocs)}

## Diff / Artifact Targets

${formatReviewTargets(git)}

## Suggested Checks

${formatReviewChecks(commands, route)}

## Security Overlay

${formatSecurityOverlay(triggers)}

## Findings

| Severity | File/line | Finding | Recommendation |
| --- | --- | --- | --- |
|  |  |  |  |

## Evidence Gaps

- Record missing requirements, missing tests, unavailable local services, skipped optional checks, or unavailable rendered evidence here.

## Review Verdict

- Pass / Pass with notes / Changes requested / Blocked:
- Rationale:
- Residual risk:

## Calibration Stub

\`\`\`bash
sdlc calibrate add --route review-only --checks "" --caps "" --outcome "" --route-fit "" --context-missing "" --verification-missing "" --friction "" --process-change-proposed ""
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function reviewComplete(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  if (!options.verdict) fail('Pass --verdict "..." so the review completion has a clear outcome.');

  const git = getGitInfo(repo);
  const entry = `## Review Completion

Completed: ${new Date().toISOString()}
Repository status: ${formatInlineStatus(git.status)}
Head: ${git.head || 'unknown'}
Verdict: ${options.verdict}

### Findings

${formatOptionList(options.findings)}

### Checks

${formatOptionList(options.checks)}

### Caps

${formatOptionList(options.caps)}

### Calibration Command

\`\`\`bash
sdlc calibrate add --route review-only --checks "${escapeCommandArg(options.checks || '')}" --caps "${escapeCommandArg(options.caps || '')}" --outcome "${escapeCommandArg(options.outcome || options.verdict)}" --route-fit "${escapeCommandArg(options.routeFit || '')}" --context-missing "${escapeCommandArg(options.contextMissing || '')}" --verification-missing "${escapeCommandArg(options.verificationMissing || '')}" --friction "${escapeCommandArg(options.friction || '')}" --process-change-proposed "${escapeCommandArg(options.processChangeProposed || '')}"
\`\`\`
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

function releasePacket(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const triggers = securityTriggers(options.task || 'release handoff push', profile.values);
  const commits = recentCommits(repo, 5);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-release-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Release Packet

Date: ${new Date().toISOString()}
Task: ${options.task || 'release / handoff readiness'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Head: ${git.head || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Release Scope

- No commit, push, merge, deploy, publish, or destructive action was taken by packet generation.
- Changed files:
${indentList(git.changedFiles)}
- Recent commits:
${indentList(commits)}

## Context To Inspect

${formatContextDocs(repo, existingDocs)}

## Release Policy

- Policy: ${profile.values.releasePolicy || 'not configured'}
- Human approval gates: ${profile.values.humanApprovalGates || 'not configured'}
- Accessibility policy: ${accessibilityPolicy(profile.values)}

## Expected Checks

${formatReleaseChecks(commands)}

## Stop Gates

${formatReleaseStopGates(git, profile.values)}

## Security Overlay

${formatSecurityOverlay(triggers)}

## Release Decision

| Item | Evidence | Status |
| --- | --- | --- |
| Scope reviewed |  | pending |
| Working tree appropriate |  | pending |
| Required checks pass |  | pending |
| Branch/upstream correct |  | pending |
| Human approval captured |  | pending |
| Git action performed | none by packet generation | pending |

## Handoff Notes

- Release action requested:
- Verification evidence:
- Caps:
- Next actor:

## Calibration Stub

\`\`\`bash
sdlc calibrate add --route release-push --checks "" --caps "" --outcome "" --route-fit "" --context-missing "" --verification-missing "" --friction "" --process-change-proposed ""
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function releaseComplete(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const action = options.action || '';
  if (!action) fail('Pass --action "none|commit|push|handoff" so the release completion records what happened.');
  if (!['none', 'commit', 'push', 'handoff'].includes(action)) fail('Use --action "none", "commit", "push", or "handoff".');

  const git = getGitInfo(repo);
  const entry = `## Release Completion

Completed: ${new Date().toISOString()}
Repository status: ${formatInlineStatus(git.status)}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Head: ${git.head || 'unknown'}
Action: ${action}
Verdict: ${options.verdict || 'not provided'}

### Checks

${formatOptionList(options.checks)}

### Caps

${formatOptionList(options.caps)}

### Git Action Evidence

${formatOptionList(options.evidence || (action === 'none' ? 'No git or release action performed.' : 'Record exact command/result here.'))}

### Calibration Command

\`\`\`bash
sdlc calibrate add --route release-push --checks "${escapeCommandArg(options.checks || '')}" --caps "${escapeCommandArg(options.caps || '')}" --outcome "${escapeCommandArg(options.outcome || options.verdict || action)}" --route-fit "${escapeCommandArg(options.routeFit || '')}" --context-missing "${escapeCommandArg(options.contextMissing || '')}" --verification-missing "${escapeCommandArg(options.verificationMissing || '')}" --friction "${escapeCommandArg(options.friction || '')}" --process-change-proposed "${escapeCommandArg(options.processChangeProposed || '')}"
\`\`\`
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

function multiStatus(repo) {
  const profile = loadProfile(repo);
  const related = splitList(profile.values.relatedRepositories);
  const rows = related.map((item) => {
    const path = resolve(repo, item);
    const info = getGitInfo(path);
    return {
      repo: item,
      path,
      branch: info.branch || 'unavailable',
      status: info.branch ? formatInlineStatus(info.status) : 'not a git repository or unavailable',
      upstream: info.upstream || '',
      aheadBehind: info.branch ? `${info.behind} behind / ${info.ahead} ahead` : '',
    };
  });

  printObject({
    repository: repo,
    relatedRepositories: related.length || 0,
    serviceMap: profile.values.serviceMap || 'not configured',
    releaseOrder: profile.values.releaseOrder || 'not configured',
  });

  if (!rows.length) {
    console.log('\n- No related repositories configured. Add them to the SDLC profile for multi-repo tasks.');
    return;
  }

  console.log('\n| Repository | Branch | Status | Upstream | Ahead/behind |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const row of rows) {
    console.log(`| ${escapeCell(row.repo)} | ${escapeCell(row.branch)} | ${escapeCell(row.status)} | ${escapeCell(row.upstream)} | ${row.aheadBehind} |`);
  }
}

function multiPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the multi-repo packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const related = splitList(profile.values.relatedRepositories);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-multi-repo-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Multi-Repo Packet

Date: ${new Date().toISOString()}
Task: ${task}
Primary repository: ${repo}
Primary branch: ${git.branch || 'unknown'}
Primary status: ${git.status || 'clean'}

## Related Repositories

${formatList(related)}

## Service And Release Context

- Service map: ${profile.values.serviceMap || 'not configured'}
- Workflow map: ${profile.values.workflowMap || 'not configured'}
- Release order: ${profile.values.releaseOrder || 'not configured'}
- Product context index: ${profile.values.productContextIndex || 'not configured'}
- Repo context index: ${profile.values.repoContextIndex || 'not configured'}

## Contracts Or Interfaces Likely Involved

${formatList(contracts)}

## Per-Repo Checklist

| Repository | Scope | Checks | Release order note | Status |
| --- | --- | --- | --- | --- |
${(related.length ? related : ['primary repository only']).map((item) => `| ${escapeCell(item)} |  |  |  | pending |`).join('\n')}

## Stop Gates

- Missing service map, release order, or ownership for affected repositories.
- Unclear contract direction across services.
- Dirty unrelated work in any affected repository.
- Human approval needed for coordinated push/release.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function contractPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the contract packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-contract-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Contract Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Contract Surfaces

${formatList(contracts.length ? contracts : ['public or cross-boundary interface to be identified'])}

## Required Decisions Before Implementation

- Producer/consumer ownership:
- Backward compatibility:
- Versioning or migration:
- Error behavior:
- Rollout/release order:
- Test or contract verification path:

## Interface Evidence

| Surface | Current behavior | Proposed behavior | Verification |
| --- | --- | --- | --- |
|  |  |  |  |

## Stop Gates

- No implementation plan before public or cross-boundary contract direction is clear.
- Human approval is needed when compatibility, release order, data, or ownership is unclear.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function verify(repo, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const requested = options.commands ? String(options.commands).split(',').map((value) => value.trim()) : ['test', 'build'];
  const results = [];

  for (const key of requested) {
    const command = commands[key];
    if (!command) {
      results.push({ key, command: '', status: 'missing', code: null });
      continue;
    }

    const result = spawnSync(command, {
      cwd: repo,
      shell: true,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    });
    results.push({ key, command, status: result.status === 0 ? 'pass' : 'fail', code: result.status, stdout: result.stdout, stderr: result.stderr });
  }

  const outPath = join(defaultRunsDir(repo), `${stamp()}-verification.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderVerification(results), 'utf8');
  console.log(renderVerification(results));
  console.log(`\nEvidence: ${relative(repo, outPath)}`);

  if (results.some((result) => result.status === 'fail')) process.exitCode = 1;
}

function calibrateAdd(repo, options = {}) {
  const route = options.route || 'unknown';
  const git = getGitInfo(repo);
  const outPath = options.out ? resolve(repo, options.out) : defaultCalibrationPath(repo);
  mkdirSync(dirname(outPath), { recursive: true });
  const row = {
    timestamp: new Date().toISOString(),
    repo,
    routePredicted: options.predicted || route,
    routeUsed: route,
    branch: git.branch,
    commit: git.head,
    dirty: Boolean(git.status),
    checks: splitList(options.checks),
    caps: splitList(options.caps),
    outcome: options.outcome || '',
    routeFit: options.routeFit || '',
    contextMissing: splitList(options.contextMissing),
    verificationMissing: splitList(options.verificationMissing),
    agentMissedStep: options.agentMissedStep || '',
    docsUpdated: options.docsUpdated || '',
    issueCaught: options.issueCaught || '',
    friction: options.friction || '',
    humanOverride: options.humanOverride || '',
    processChangeProposed: options.processChangeProposed || '',
  };
  appendFileSync(outPath, `${JSON.stringify(row)}\n`, 'utf8');
  console.log(relative(repo, outPath));
}

function calibrateSummary(repo, options = {}) {
  const inputPath = options.in ? resolve(repo, options.in) : defaultCalibrationPath(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-calibration-summary.md`);
  if (!existsSync(inputPath)) fail(`Calibration log not found: ${relative(repo, inputPath)}`);

  const rows = readFileSync(inputPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { parseError: line };
      }
    });

  const validRows = rows.filter((row) => !row.parseError);
  const invalidCount = rows.length - validRows.length;
  const byRoute = groupCounts(validRows.map((row) => row.routeUsed || 'unknown'));
  const checks = groupCounts(validRows.flatMap((row) => row.checks || []));
  const caps = groupCounts(validRows.flatMap((row) => row.caps || []));
  const outcomes = groupCounts(validRows.map((row) => row.outcome).filter(Boolean));
  const routeFit = groupCounts(validRows.map((row) => row.routeFit).filter(Boolean));
  const contextMissing = groupCounts(validRows.flatMap((row) => normalizeArray(row.contextMissing)));
  const verificationMissing = groupCounts(validRows.flatMap((row) => normalizeArray(row.verificationMissing)));
  const agentMissedSteps = groupCounts(validRows.map((row) => row.agentMissedStep).filter(Boolean));
  const docsUpdated = groupCounts(validRows.map((row) => row.docsUpdated).filter(Boolean));
  const friction = groupCounts(validRows.map((row) => row.friction).filter(Boolean));
  const proposals = validRows.map((row) => row.processChangeProposed).filter(Boolean);
  const overrides = validRows.map((row) => row.humanOverride).filter(Boolean);

  const content = `# SDLC Calibration Summary

Date: ${new Date().toISOString()}
Repository: ${repo}
Input: ${relative(repo, inputPath)}
Rows: ${validRows.length}
Invalid rows: ${invalidCount}

## Tasks By Route

${formatCounts(byRoute)}

## Checks Most Often Used

${formatCounts(checks)}

## Outcomes

${formatCounts(outcomes)}

## Route Fit

${formatCounts(routeFit)}

## Common Caps

${formatCounts(caps)}

## Repeated Missing Context

${formatCounts(contextMissing)}

## Repeated Missing Verification

${formatCounts(verificationMissing)}

## Agent Missed Steps

${formatCounts(agentMissedSteps)}

## Docs Updated

${formatCounts(docsUpdated)}

## Common Friction

${formatCounts(friction)}

## Human Overrides

${formatList(overrides)}

## Process Changes Proposed

${formatList(proposals)}

## Recommended Process-Learning Prompts

${recommendedLearningPrompts(caps, friction, proposals, contextMissing, verificationMissing, agentMissedSteps, routeFit)}
`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content, 'utf8');
  console.log(content.trimEnd());
  console.log(`\nSummary: ${relative(repo, outPath)}`);
}

function calibrateInspect(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true });
  const validRows = rows.filter((row) => !row.parseError);
  const caps = groupCounts(validRows.flatMap((row) => normalizeArray(row.caps)));
  const routeFit = groupCounts(validRows.map((row) => row.routeFit).filter(Boolean));
  const contextMissing = groupCounts(validRows.flatMap((row) => normalizeArray(row.contextMissing)));
  const verificationMissing = groupCounts(validRows.flatMap((row) => normalizeArray(row.verificationMissing)));
  const friction = groupCounts(validRows.map((row) => row.friction).filter(Boolean));
  const proposals = groupCounts(validRows.map((row) => row.processChangeProposed).filter(Boolean));

  printObject({
    repository: repo,
    rows: validRows.length,
    repeatedCaps: caps.length,
    routeFitSignals: routeFit.length,
    missingContextSignals: contextMissing.length,
    missingVerificationSignals: verificationMissing.length,
  });
  console.log('\n## Repeated Caps\n');
  console.log(formatCounts(caps));
  console.log('\n## Route Fit\n');
  console.log(formatCounts(routeFit));
  console.log('\n## Missing Context\n');
  console.log(formatCounts(contextMissing));
  console.log('\n## Missing Verification\n');
  console.log(formatCounts(verificationMissing));
  console.log('\n## Friction\n');
  console.log(formatCounts(friction));
  console.log('\n## Process Proposals\n');
  console.log(formatCounts(proposals));
}

function calibratePropose(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true }).filter((row) => !row.parseError);
  const caps = groupCounts(rows.flatMap((row) => normalizeArray(row.caps)));
  const routeFit = groupCounts(rows.map((row) => row.routeFit).filter(Boolean));
  const contextMissing = groupCounts(rows.flatMap((row) => normalizeArray(row.contextMissing)));
  const verificationMissing = groupCounts(rows.flatMap((row) => normalizeArray(row.verificationMissing)));
  const friction = groupCounts(rows.map((row) => row.friction).filter(Boolean));
  const proposals = processProposals(caps, routeFit, contextMissing, verificationMissing, friction);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-calibration-proposals.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Calibration Proposals

Date: ${new Date().toISOString()}
Repository: ${repo}
Rows inspected: ${rows.length}

## Proposed Improvements

${formatList(proposals)}

## Decision Rule

- Promote repeated signals into route recipes, setup profiles, context templates, or CLI helpers only after they repeat or create high-cost failure.
- Keep project-specific facts in repo or shared context docs, not in the reusable SDLC pack.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function readiness(repo) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const related = splitList(profile.values.relatedRepositories);
  const checks = readinessChecks(repo, profile, commands, existingDocs, related);
  const score = Math.round((checks.filter((item) => item.status === 'ready').length / checks.length) * 100);
  const fixes = checks.filter((item) => item.status !== 'ready').map((item) => item.fix);

  printObject({
    repository: repo,
    score: `${score}%`,
    profile: profile.path ? relative(repo, profile.path) : 'not found',
    branch: git.branch || 'unknown',
    gitStatus: git.status || 'clean',
    context: readinessStatus(checks, 'context'),
    commands: readinessStatus(checks, 'commands'),
    release: readinessStatus(checks, 'release'),
    security: readinessStatus(checks, 'security'),
    multiRepo: readinessStatus(checks, 'multi-repo'),
    recommendedSetupFixes: fixes.join('; ') || 'none',
    recommendedNextCommand: score < 75 ? 'sdlc setup doctor' : 'sdlc context pack --task "..."',
  });
}

function health(repo) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const related = splitList(profile.values.relatedRepositories);
  const checks = readinessChecks(repo, profile, commands, existingDocs, related);
  const packets = findPackets(repo, {});
  const calibrationRows = readCalibrationRows(repo, { allowMissing: true }).filter((row) => !row.parseError);
  const readinessScore = Math.round((checks.filter((item) => item.status === 'ready').length / checks.length) * 100);
  const openPackets = packets.filter((packet) => !packet.completed);

  printObject({
    repository: repo,
    readiness: `${readinessScore}%`,
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    packets: packets.length,
    openPackets: openPackets.length,
    calibrationRows: calibrationRows.length,
    relatedRepositories: related.length,
    recommendedNextCommand: openPackets.length ? `sdlc done check --route ${openPackets[0].route || openPackets[0].kind} --packet ${relative(repo, openPackets[0].path)}` : 'sdlc context pack --task "..."',
  });

  console.log('\n## Readiness Gaps\n');
  console.log(formatList(checks.filter((item) => item.status !== 'ready').map((item) => `${item.area}: ${item.fix}`)));
  console.log('\n## Open Packets\n');
  console.log(formatList(openPackets.map((packet) => `${relative(repo, packet.path)} (${packet.kind})`)));
}

function setupDoctor(repo, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const related = splitList(profile.values.relatedRepositories);
  const checks = readinessChecks(repo, profile, commands, existingDocs, related);
  const gaps = checks.filter((item) => item.status !== 'ready');
  const profilePath = profile.path ? relative(repo, profile.path) : '.ai-local/sdlc-profile.md';

  const lines = [
    '# SDLC Setup Doctor',
    '',
    `Repository: ${repo}`,
    `Profile: ${profilePath}`,
    '',
    '## Readiness Gaps',
    '',
    ...gaps.map((item) => `- ${item.area}: ${item.fix}`),
    ...(gaps.length ? [] : ['- none']),
    '',
    '## Suggested Profile Fields',
    '',
    'Copy or adapt these fields into the local SDLC profile. Keep personal paths and local evidence ignored unless the repo explicitly approves sharing a sanitized variant.',
    '',
    '```text',
    '- Rendered UI review command: npm run dev',
    '- Accessibility review policy: optional',
    '- Release policy: local commit/push only after tests/build pass and human approval',
    '- Human approval gates: commit, push, dependency install, external service calls, destructive commands',
    '- Approved tools: git, npm scripts, local browser/rendered inspection, SDLC helper',
    '- Blocked tools: credentialed production writes, destructive Git commands, dependency installs without approval',
    '- Sensitive data restrictions: no secrets, credentials, customer data, or private transcripts in tracked docs/evidence',
    '```',
    '',
    '## Useful Commands',
    '',
    '```bash',
    'sdlc readiness',
    'sdlc context restore',
    'sdlc context pack --task "..."',
    '```',
  ];

  if (options.fixPlan) {
    lines.push(
      '',
      '## Fix Plan',
      '',
      ...setupFixPlan(gaps, profile.values, commands).map((item, index) => `${index + 1}. ${item}`),
    );
  }

  console.log(lines.join('\n'));
}

async function renderSmoke(repo, options = {}) {
  const url = options.url || '';
  if (!url) fail('Pass --url <url> for rendered smoke validation.');

  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-render-smoke.md`);
  const screenshotDir = options.screenshotDir ? resolve(repo, options.screenshotDir) : join(repo, '.ai-local', 'rendered');
  const cdp = options.cdp || '';
  const evidence = {
    date: new Date().toISOString(),
    url,
    status: 'capped',
    notes: [],
    screenshots: [],
  };

  if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)/.test(url)) {
    evidence.notes.push('Only local URLs are supported by this dependency-free smoke helper.');
  } else if (!cdp) {
    evidence.notes.push('No --cdp endpoint provided. Start Chrome with remote debugging or record manual rendered evidence.');
  } else {
    try {
      const result = await captureRenderedSmoke(url, cdp, screenshotDir);
      evidence.status = result.status;
      evidence.notes.push(...result.notes);
      evidence.screenshots.push(...result.screenshots);
    } catch (error) {
      evidence.notes.push(`CDP smoke failed: ${error.message}`);
    }
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderSmokeEvidence(evidence), 'utf8');
  console.log(renderSmokeEvidence(evidence).trimEnd());
  console.log(`\nEvidence: ${relative(repo, outPath)}`);
}

function scenarioList() {
  const scenarios = scenarioNames();
  if (!scenarios.length) fail('No scenarios found.');
  console.log(scenarios.join('\n'));
}

function scenarioShow(name) {
  const scenario = loadScenario(name);
  console.log(scenario.text.trimEnd());
}

function scenarioValidate(name, repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the scenario can validate route inference.');

  const scenario = loadScenario(name);
  const profile = loadProfile(repo);
  const route = inferRouteFromTask(task, getGitInfo(repo), profile.values);
  const triggers = securityTriggers(task, profile.values);
  const expected = parseScenarioExpectedRoute(scenario.text);
  const normalizedExpected = expected.toLowerCase();
  const pass =
    normalizedExpected.includes(route) ||
    (normalizedExpected.includes('high-risk overlay') && triggers.length > 0) ||
    (normalizedExpected.includes('standard') && route === 'standard') ||
    (normalizedExpected.includes('tiny-docs') && route === 'tiny-docs');

  printObject({
    scenario: scenario.name,
    task,
    expectedRoute: expected || 'not found',
    inferredRoute: route,
    securityTriggers: triggers.join(', ') || 'none',
    result: pass ? 'pass' : 'review-needed',
    nextCommand: `sdlc route start ${route} --task "${task}"`,
  });

  if (!pass) process.exitCode = 1;
}

function scenarioTest(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const cases = scenarioRegressionCases();
  const results = cases.map((item) => {
    const route = inferRouteFromTask(item.task, item.cleanGitOnly ? { ...git, status: '', changedFiles: [] } : git, profile.values);
    const triggers = securityTriggers(item.task, profile.values);
    const routePass = item.expectedRoute ? route === item.expectedRoute : true;
    const overlayPass = item.expectedSecurityOverlay ? triggers.length > 0 : true;
    return { ...item, route, triggers, pass: routePass && overlayPass };
  });

  for (const result of results) {
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}: ${result.route}${result.triggers.length ? ` (${result.triggers.join(', ')})` : ''}`);
    if (!result.pass) {
      console.log(`  task: ${result.task}`);
      if (result.expectedRoute) console.log(`  expected route: ${result.expectedRoute}`);
      if (result.expectedSecurityOverlay) console.log('  expected security overlay: yes');
    }
  }

  if (results.some((result) => !result.pass)) process.exitCode = 1;
  if (options.verbose) {
    console.log(`\nScenarios tested: ${results.length}`);
  }
}

function handoff(repo) {
  const git = getGitInfo(repo);
  printObject({
    repository: repo,
    branch: git.branch,
    upstream: git.upstream,
    aheadBehind: `${git.behind} behind / ${git.ahead} ahead`,
    latestCommit: git.head,
    status: git.status || 'clean',
    changedFiles: git.changedFiles.join(', ') || 'none',
    suggestedNextAction: git.status ? 'review dirty working tree before handoff' : 'ready for release/review decision',
  });
}

function loadProfile(repo) {
  const candidates = [
    join(repo, '.sdlc', 'profile.json'),
    join(repo, '.sdlc', 'profile.md'),
    join(repo, '.ai-local', 'sdlc-profile.md'),
    join(repo, '.ai-local', 'repository-setup.md'),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (candidate.endsWith('.json')) {
      return { path: candidate, values: normalizeKeys(readJsonIfExists(candidate) || {}) };
    }
    return { path: candidate, values: parseMarkdownProfile(readFileSync(candidate, 'utf8')) };
  }

  return { path: '', values: {} };
}

function parseMarkdownProfile(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-\s*)?([^:#|]+):\s*(.*)$/);
    if (!match) continue;
    values[toCamel(match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))] = match[2].trim();
  }
  return values;
}

function normalizeKeys(value) {
  const out = {};
  for (const [key, item] of Object.entries(value)) out[toCamel(key)] = item;
  return out;
}

function discoverCommands(profile, packageJson) {
  const scripts = packageJson?.scripts || {};
  return {
    install: profile.installCommand || '',
    dev: profile.devServerCommand || (scripts.dev ? 'npm run dev' : ''),
    test: profile.testCommand || (scripts.test ? 'npm run test' : ''),
    build: profile.buildCommand || (scripts.build ? 'npm run build' : ''),
    lint: profile.lintTypecheckFormatCommands || (scripts.lint ? 'npm run lint' : ''),
    rendered: profile.renderedUiReviewCommand || '',
  };
}

function getGitInfo(repo) {
  const branch = git(repo, ['branch', '--show-current']) || '';
  const upstream = git(repo, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']) || '';
  const counts = upstream ? (git(repo, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]) || '0\t0').split(/\s+/) : ['0', '0'];
  const status = git(repo, ['status', '--short', '--untracked-files=all']) || '';
  const head = git(repo, ['rev-parse', '--short', 'HEAD']) || '';
  return {
    branch,
    upstream,
    behind: Number(counts[0] || 0),
    ahead: Number(counts[1] || 0),
    status,
    head,
    changedFiles: status.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim()),
  };
}

function git(repo, args) {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function scenarioNames() {
  const dir = join(agentsRoot, 'templates', 'scenarios');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => basename(file, '.md'))
    .sort();
}

function scenarioRegressionCases() {
  return [
    {
      name: 'ui animation delay',
      task: 'add animation and a short delay so the computer attack feels like a turn occurred',
      expectedRoute: 'ui-rendered-review',
    },
    {
      name: 'dangerous destructive tool',
      task: 'delete files with rm -rf and force push the release',
      expectedSecurityOverlay: true,
    },
    {
      name: 'release dirty work packet',
      task: 'prepare release handoff with dirty unrelated work and push the current branch',
      expectedRoute: 'release-push',
    },
    {
      name: 'weak tests',
      task: 'prove the weak legacy tests catch this regression',
      expectedRoute: 'weak-test-legacy',
    },
    {
      name: 'multi repo contract',
      task: 'change the API schema contract across multiple service repositories',
      expectedRoute: 'multi-repo-integration',
    },
    {
      name: 'single repo public contract',
      task: 'change the public API contract for this library',
      expectedRoute: 'contract-first',
    },
    {
      name: 'review diff without edits',
      task: 'review the existing diff without making edits',
      expectedRoute: 'review-only',
    },
    {
      name: 'review release without edits',
      task: 'review the current release without making edits',
      expectedRoute: 'review-only',
    },
    {
      name: 'internal optional accessibility',
      task: 'internal admin UI layout tweak with optional accessibility note',
      expectedRoute: 'ui-rendered-review',
    },
    {
      name: 'tiny docs',
      task: 'fix a docs typo in the readme markdown',
      expectedRoute: 'tiny-docs',
      cleanGitOnly: true,
    },
  ];
}

function loadScenario(name) {
  if (!name) fail('Pass a scenario name, such as ui-rendered-issue.');
  const safeName = slug(name);
  const path = join(agentsRoot, 'templates', 'scenarios', `${safeName}.md`);
  if (!existsSync(path)) fail(`Scenario not found: ${name}`);
  return { name: safeName, path, text: readFileSync(path, 'utf8') };
}

async function captureRenderedSmoke(url, cdpBase, screenshotDir) {
  const targets = await fetchJson(`${trimSlash(cdpBase)}/json`);
  const page = targets.find((target) => target.type === 'page') || targets[0];
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No CDP page target found.');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, (message) => {
        if (message.error) {
          reject(new Error(JSON.stringify(message.error)));
          return;
        }
        resolve(message.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url });
    await sleep(600);
    const title = await send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true,
    });
    const bodyLength = await send('Runtime.evaluate', {
      expression: 'document.body ? document.body.innerText.length : 0',
      returnByValue: true,
    });
    mkdirSync(screenshotDir, { recursive: true });
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = join(screenshotDir, `${stamp()}-render-smoke.png`);
    writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    return {
      status: Number(bodyLength.result.value || 0) > 0 ? 'pass' : 'fail',
      notes: [`Loaded title: ${title.result.value || '(untitled)'}`, `Body text length: ${bodyLength.result.value || 0}`],
      screenshots: [screenshotPath],
    };
  } finally {
    ws.close();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.json();
}

function parseScenarioExpectedRoute(text) {
  const match = text.match(/## Expected Route\s+([\s\S]*?)(?:\n## |\n# |$)/);
  if (!match) return '';
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/`/g, '');
}

function findExisting(repo, paths) {
  return paths.map((path) => join(repo, path)).filter((path) => existsSync(path));
}

function contextDocCandidates(repo, profile) {
  const candidates = [
    { label: 'AGENTS.md', path: join(repo, 'AGENTS.md') },
    { label: 'SDLC profile JSON', path: join(repo, '.sdlc', 'profile.json') },
    { label: 'SDLC profile Markdown', path: join(repo, '.sdlc', 'profile.md') },
    { label: 'Agent-local SDLC profile', path: join(repo, '.ai-local', 'sdlc-profile.md') },
    { label: 'Agent-local repository setup', path: join(repo, '.ai-local', 'repository-setup.md') },
    { label: 'Memory context index', path: join(repo, 'docs', 'memory-bank', 'contextIndex.md') },
    { label: 'Memory active context', path: join(repo, 'docs', 'memory-bank', 'activeContext.md') },
    { label: 'Context state', path: join(repo, 'docs', 'context-state.md') },
    { label: 'Application model', path: join(repo, 'docs', 'application-model.md') },
  ];

  for (const [key, label] of [
    ['sharedContextRoot', 'Shared context root'],
    ['productContext', 'Product context'],
    ['repoContext', 'Repo context'],
    ['productContextIndex', 'Product context index'],
    ['repoContextIndex', 'Repo context index'],
    ['serviceMap', 'Service map'],
    ['workflowMap', 'Workflow map'],
    ['releaseOrder', 'Release order'],
    ['knownFailureModes', 'Known failure modes'],
  ]) {
    if (profile[key]) candidates.push({ label, path: resolveContextPath(repo, profile[key]) });
  }

  return dedupeByPath(candidates);
}

function resolveContextPath(repo, value) {
  const text = String(value || '').trim();
  if (!text) return repo;
  if (text === '~') return process.env.HOME || repo;
  if (text.startsWith('~/')) return join(process.env.HOME || repo, text.slice(2));
  return resolve(repo, text);
}

function splitList(value) {
  if (!value) return [];
  return String(value).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function inferLikelyRoute(gitInfo) {
  if (!gitInfo.status) return 'resume-work or review-work';
  if (gitInfo.changedFiles.every((file) => file.endsWith('.md'))) return 'tiny-docs';
  return 'standard';
}

function inferRouteFromTask(task, gitInfo, profile = {}) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  if (matchesAny(text, ['review', 'inspect', 'audit']) && matchesAny(text, ['without edit', 'without making edit', 'no edit', 'read-only', 'read only'])) return 'review-only';
  if (matchesAny(text, ['multi-repo', 'multi repo', 'cross repo', 'multiple service', 'multiple repo', 'release order'])) return 'multi-repo-integration';
  if (matchesAny(text, ['contract', 'interface', 'public api', 'sdk', 'cli flag', 'config format', 'event schema', 'message schema'])) return 'contract-first';
  if (matchesAny(text, ['release', 'push', 'deploy', 'merge', 'handoff'])) return 'release-push';
  if (matchesAny(text, ['review', 'inspect', 'audit'])) return 'review-only';
  if (matchesAny(text, ['ui', 'render', 'layout', 'mobile', 'accessibility', 'button', 'screen', 'page', 'animation', 'animate', 'delay', 'turn feel', 'feels like a turn'])) return 'ui-rendered-review';
  if (matchesAny(text, ['weak test', 'legacy', 'coverage', 'missing test'])) return 'weak-test-legacy';
  if (matchesAny(text, ['docs', 'readme', 'markdown']) && !gitInfo.status) return 'tiny-docs';
  if (matchesAny(text, ['bug', 'fix', 'regression', 'broken', 'failing', 'failure'])) return 'bugfix-regression';
  return inferLikelyRoute(gitInfo) === 'tiny-docs' ? 'tiny-docs' : 'standard';
}

function inferDirtySurfaces(task, gitInfo) {
  const text = task.toLowerCase();
  const surfaces = [];
  if (matchesAny(text, ['ui', 'render', 'layout', 'mobile', 'accessibility', 'page', 'screen', 'animation', 'animate', 'delay', 'turn feel', 'feels like a turn'])) surfaces.push('rendered UI');
  if (matchesAny(text, ['api', 'contract', 'schema', 'event', 'webhook'])) surfaces.push('API/contracts/events');
  if (matchesAny(text, ['database', 'migration', 'data', 'retention'])) surfaces.push('data model/storage');
  if (matchesAny(text, ['auth', 'permission', 'credential', 'secret', 'token'])) surfaces.push('security/auth');
  if (matchesAny(text, ['docs', 'context', 'readme'])) surfaces.push('docs/context');
  if (matchesAny(text, ['test', 'coverage', 'e2e'])) surfaces.push('test automation');
  if (gitInfo.changedFiles.length) surfaces.push(...gitInfo.changedFiles.slice(0, 12));
  return dedupe(surfaces);
}

function inferContracts(task, profile) {
  const text = `${task} ${profile.repositoryRole || ''}`.toLowerCase();
  const items = [];
  if (matchesAny(text, ['api', 'endpoint', 'http', 'rest', 'graphql'])) items.push('API endpoint or client contract');
  if (matchesAny(text, ['event', 'queue', 'topic', 'message'])) items.push('event/message contract');
  if (matchesAny(text, ['schema', 'database', 'migration', 'model'])) items.push('data schema contract');
  if (matchesAny(text, ['workflow', 'process', 'handoff'])) items.push('workflow contract');
  return dedupe(items);
}

function securityTriggers(task, profile = {}) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const triggers = [];
  if (matchesAny(text, ['secret', 'credential', 'password', 'token', 'api key', 'private key'])) triggers.push('secrets or credentials');
  if (matchesAny(text, ['dependency', 'package', 'install', 'npm install', 'pip install', 'cargo add', 'plugin'])) triggers.push('new dependency or tool install');
  if (matchesAny(text, ['external api', 'webhook', 'http', 'curl', 'network', 'third party', 'third-party'])) triggers.push('external API or network call');
  if (matchesAny(text, ['mcp', 'tool install', 'plugin install', 'connector'])) triggers.push('MCP/tool install');
  if (matchesAny(text, ['credentialed write', 'write action', 'push', 'deploy', 'publish'])) triggers.push('credentialed write action');
  if (matchesAny(text, ['production', 'prod', 'deploy', 'release'])) triggers.push('production or release surface');
  if (matchesAny(text, ['cross repo', 'multi repo', 'multi-repo', 'release order'])) triggers.push('cross-repo release order');
  if (matchesAny(text, ['runtime adapter', 'adapter', 'agent', 'skill'])) triggers.push('generated runtime adapter or skill surface');
  if (matchesAny(text, ['prompt injection', 'tool injection', 'untrusted input', 'user content'])) triggers.push('prompt/tool injection risk');
  if (matchesAny(text, ['delete', 'remove all', 'rm -rf', 'reset', 'force push', 'bulk rewrite'])) triggers.push('broad file mutation or destructive command');
  return dedupe(triggers);
}

function matchesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function profileToken(value) {
  const text = String(value || '').trim();
  if (!text || text.includes(' / ')) return '';
  return text;
}

function missingSetup(profile, commands) {
  const missing = [];
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) missing.push('no external/shared context paths configured');
  if (!commands.test) missing.push('no test command discovered');
  if (!commands.build) missing.push('no build command discovered');
  return missing;
}

function readinessChecks(repo, profile, commands, existingDocs, related) {
  const values = profile.values;
  return [
    {
      area: 'context',
      status: profile.path ? 'ready' : 'missing',
      fix: 'create .ai-local/sdlc-profile.md with sdlc profile init',
    },
    {
      area: 'context',
      status: existingDocs.some((item) => item.label === 'AGENTS.md') ? 'ready' : 'partial',
      fix: 'add or update AGENTS.md with repo commands and conventions',
    },
    {
      area: 'context',
      status: values.sharedContextRoot || values.productContext || values.repoContext || values.productContextIndex ? 'ready' : 'partial',
      fix: 'configure shared/product/repo context paths when the repo participates in larger systems',
    },
    {
      area: 'commands',
      status: commands.test ? 'ready' : 'missing',
      fix: 'record a test command in the SDLC profile or package scripts',
    },
    {
      area: 'commands',
      status: commands.build ? 'ready' : 'partial',
      fix: 'record a build/typecheck command when applicable',
    },
    {
      area: 'commands',
      status: commands.rendered || !requiresRenderedReview(repo) ? 'ready' : 'partial',
      fix: 'record rendered UI review command/tool if the repo has visible UI',
    },
    {
      area: 'release',
      status: values.releasePolicy || values.humanApprovalGates ? 'ready' : 'partial',
      fix: 'record release policy and human approval gates',
    },
    {
      area: 'security',
      status: values.approvedTools || values.blockedTools || values.sensitiveDataRestrictions ? 'ready' : 'partial',
      fix: 'record approved/blocked tools and sensitive data restrictions',
    },
    {
      area: 'multi-repo',
      status: related.length === 0 || values.serviceMap || values.productContextIndex ? 'ready' : 'partial',
      fix: 'add service map/product context index for related repositories',
    },
  ];
}

function readinessStatus(checks, area) {
  const areaChecks = checks.filter((item) => item.area === area);
  if (areaChecks.every((item) => item.status === 'ready')) return 'ready';
  if (areaChecks.some((item) => item.status === 'missing')) return 'missing';
  return 'partial';
}

function requiresRenderedReview(repo) {
  return existsSync(join(repo, 'src')) || existsSync(join(repo, 'app')) || existsSync(join(repo, 'pages'));
}

function summarizeRelatedRepo(repo, item) {
  const path = resolve(repo, item);
  const info = getGitInfo(path);
  if (!info.branch) return `${item}: not a git repository or unavailable`;
  return `${item}: ${info.branch} ${info.status ? 'dirty' : 'clean'} ${info.behind}/${info.ahead}`;
}

function renderVerification(results) {
  const lines = ['# SDLC Verification', '', `Date: ${new Date().toISOString()}`, '', '| Check | Command | Result | Exit code |', '| --- | --- | --- | --- |'];
  for (const result of results) lines.push(`| ${result.key} | ${escapeCell(result.command || 'not configured')} | ${result.status} | ${result.code ?? ''} |`);
  return `${lines.join('\n')}\n`;
}

function renderSmokeEvidence(evidence) {
  return `# SDLC Render Smoke

Date: ${evidence.date}
URL: ${evidence.url}
Status: ${evidence.status}

## Notes

${formatList(evidence.notes)}

## Screenshots

${formatList(evidence.screenshots)}

## Accessibility

- Policy: optional by default unless repository profile says suggested or required.
- Result: not run by render smoke.
- Cap: record as "accessibility not run" only when relevant to the task or required by profile.
`;
}

function printObject(object) {
  for (const [key, value] of Object.entries(object)) {
    console.log(`${humanize(key)}: ${value}`);
  }
}

function resolvePacketPath(repo, packet) {
  if (!packet) fail('Pass --packet <path> for the packet to complete.');
  const path = resolve(repo, packet);
  if (!existsSync(path)) fail(`Packet not found: ${relative(repo, path)}`);
  return path;
}

function findPackets(repo, options = {}) {
  const dir = options.dir ? resolve(repo, options.dir) : defaultRunsDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => readPacket(repo, join(dir, file)))
    .filter((packet) => packet.kind !== 'other')
    .sort((a, b) => basename(b.path).localeCompare(basename(a.path)));
}

function findLatestPacket(repo, route) {
  const wanted = packetKindForRoute(route);
  return findPackets(repo, {}).find((packet) => packet.kind === wanted || packet.route === route) || null;
}

function readPacket(repo, path) {
  const text = readFileSync(path, 'utf8');
  const kind = packetKind(text);
  return {
    path,
    kind,
    route: packetRoute(text, kind),
    completed: /## (Review|Release) Completion/.test(text),
    verdict: firstMatch(text, /^Verdict:\s*(.+)$/m),
    action: firstMatch(text, /^Action:\s*(.+)$/m),
    head: firstMatch(text, /^Head:\s*(.+)$/m),
    text,
    repo,
  };
}

function packetKind(text) {
  if (text.includes('# SDLC Review Packet')) return 'review';
  if (text.includes('# SDLC Release Packet')) return 'release';
  if (text.includes('# SDLC Multi-Repo Packet')) return 'multi-repo';
  if (text.includes('# SDLC Contract Packet')) return 'contract';
  if (text.includes('# SDLC Route Packet')) return 'route';
  if (text.includes('# SDLC Evidence Packet')) return 'evidence';
  return 'other';
}

function packetRoute(text, kind) {
  const route = firstMatch(text, /^Route:\s*(.+)$/m) || firstMatch(text, /^Suggested route:\s*(.+)$/m);
  if (route) return route;
  if (kind === 'review') return 'review-only';
  if (kind === 'release') return 'release-push';
  if (kind === 'multi-repo') return 'multi-repo-integration';
  if (kind === 'contract') return 'contract-first';
  return kind;
}

function packetKindForRoute(route) {
  if (route === 'review-only') return 'review';
  if (route === 'release-push') return 'release';
  if (route === 'multi-repo-integration') return 'multi-repo';
  if (route === 'contract-first') return 'contract';
  return 'route';
}

function firstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function doneChecksForRoute(route, gitInfo, packet) {
  const checks = [
    { name: 'Git status known', status: 'pass', detail: gitInfo.status || 'clean' },
  ];

  if (route === 'review-only') {
    checks.push(
      { name: 'Review packet exists', status: packet?.kind === 'review' ? 'pass' : 'open', detail: packet ? relative(packet.repo, packet.path) : 'missing review packet' },
      { name: 'Review completion exists', status: packet?.completed ? 'pass' : 'open', detail: packet?.completed ? 'completion appended' : 'run sdlc review complete' },
      { name: 'No edit route preserved', status: 'note', detail: 'confirm review did not mutate tracked files unless rerouted' },
    );
    return checks;
  }

  if (route === 'release-push') {
    checks.push(
      { name: 'Release packet exists', status: packet?.kind === 'release' ? 'pass' : 'open', detail: packet ? relative(packet.repo, packet.path) : 'missing release packet' },
      { name: 'Release completion exists', status: packet?.completed ? 'pass' : 'open', detail: packet?.completed ? `action: ${packet.action || 'unknown'}` : 'run sdlc release complete' },
      { name: 'Human approval gate recorded', status: packet?.text.includes('Human approval') || packet?.text.includes('approval') ? 'pass' : 'open', detail: 'approval must be explicit before credentialed release action' },
    );
    return checks;
  }

  if (route === 'multi-repo-integration') {
    checks.push(
      { name: 'Multi-repo packet exists', status: packet?.kind === 'multi-repo' ? 'pass' : 'open', detail: packet ? relative(packet.repo, packet.path) : 'run sdlc multi packet' },
      { name: 'Release order considered', status: packet?.text.includes('Release order') ? 'pass' : 'open', detail: 'release order must be named or capped' },
      { name: 'Per-repo checklist present', status: packet?.text.includes('Per-Repo Checklist') ? 'pass' : 'open', detail: 'affected repos need per-repo checks' },
    );
    return checks;
  }

  if (route === 'contract-first') {
    checks.push(
      { name: 'Contract packet exists', status: packet?.kind === 'contract' ? 'pass' : 'open', detail: packet ? relative(packet.repo, packet.path) : 'run sdlc contract packet' },
      { name: 'Compatibility decision present', status: packet?.text.includes('Backward compatibility') ? 'pass' : 'open', detail: 'contract compatibility must be decided or capped' },
    );
    return checks;
  }

  if (route === 'ui-rendered-review') {
    checks.push(
      { name: 'Rendered evidence considered', status: packet?.text.includes('render') || packet?.text.includes('screenshot') ? 'pass' : 'open', detail: 'run render smoke or record cap' },
      { name: 'Accessibility policy considered', status: packet?.text.includes('Accessibility') ? 'pass' : 'note', detail: 'accessibility remains optional unless profile/human requires it' },
    );
    return checks;
  }

  checks.push(
    { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packet ? relative(packet.repo, packet.path) : 'run route/evidence packet' },
    { name: 'Verification recorded', status: packet?.text.includes('Verification') || packet?.text.includes('Checks') ? 'pass' : 'open', detail: 'verification evidence or explicit cap required' },
  );
  return checks;
}

function runStartPacketCommand(route, task) {
  if (route === 'review-only') return `sdlc review packet --task "${escapeCommandArg(task)}"`;
  if (route === 'release-push') return 'sdlc release packet';
  if (route === 'multi-repo-integration') return `sdlc multi packet --task "${escapeCommandArg(task)}"`;
  if (route === 'contract-first') return `sdlc contract packet --task "${escapeCommandArg(task)}"`;
  return `sdlc evidence init --route ${route}`;
}

function runStartGates(route, task, gitInfo, profile) {
  const gates = [];
  if (!profile.releasePolicy && route === 'release-push') gates.push('release policy missing from profile');
  if (!profile.sharedContextRoot && route === 'multi-repo-integration') gates.push('shared context root or service map may be needed');
  if (gitInfo.status) gates.push('dirty working tree must be scoped');
  gates.push(...securityTriggers(task, profile).map((item) => `security/tool trigger: ${item}`));
  return gates.length ? gates : ['normal route gates only'];
}

function contextUpdateTargets(route, dirtySurfaces, contracts, profile) {
  const targets = [];
  if (!profile.sharedContextRoot && route === 'multi-repo-integration') targets.push('SDLC profile: configure shared context root or related repository map');
  if (dirtySurfaces.includes('docs/context')) targets.push('docs/memory-bank or docs/context-state: update active state if durable truth changed');
  if (contracts.length || route === 'contract-first' || route === 'multi-repo-integration') targets.push('docs/contracts or shared context root: update interface/contract truth');
  if (dirtySurfaces.includes('rendered UI')) targets.push('feature context or code-local docs: update visible workflow facts only if behavior changed');
  if (dirtySurfaces.includes('API/contracts/events')) targets.push('service map/workflow map: update cross-boundary facts');
  if (!targets.length) targets.push('no durable context update required unless implementation changes source truth');
  return dedupe(targets);
}

function setupFixPlan(gaps, profile, commands) {
  const plan = [];
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) plan.push('Configure shared/product/repo context paths in `.ai-local/sdlc-profile.md`, using external storage when multiple repos need the same context.');
  if (!commands.test) plan.push('Add or record the narrowest reliable test command.');
  if (!commands.build) plan.push('Add or record build/typecheck command when the repo can support it.');
  if (!profile.releasePolicy) plan.push('Record release policy and approval gates before using release packets for push/deploy work.');
  if (!profile.approvedTools && !profile.blockedTools) plan.push('Record approved/blocked tools and sensitive-data restrictions.');
  for (const gap of gaps) {
    const normalizedFix = gap.fix.toLowerCase();
    if (!plan.some((item) => item.toLowerCase().includes(normalizedFix) || normalizedFix.includes(item.toLowerCase().slice(0, 24)))) plan.push(gap.fix);
  }
  return dedupe(plan);
}

function readCalibrationRows(repo, options = {}) {
  const inputPath = options.in ? resolve(repo, options.in) : defaultCalibrationPath(repo);
  if (!existsSync(inputPath)) {
    if (options.allowMissing) return [];
    fail(`Calibration log not found: ${relative(repo, inputPath)}`);
  }
  return readFileSync(inputPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { parseError: line };
      }
    });
}

function processProposals(caps, routeFit, contextMissing, verificationMissing, friction) {
  const proposals = [];
  for (const [cap, count] of caps.filter(([, count]) => count >= 2)) proposals.push(`Repeated cap "${cap}" appeared ${count} times; consider setup/profile, route recipe, or tooling support.`);
  for (const [fit, count] of routeFit.filter(([fit, count]) => count >= 2 && ['too heavy', 'too light'].includes(fit))) proposals.push(`Route fit "${fit}" appeared ${count} times; tune route inference or recipe gates.`);
  for (const [item, count] of contextMissing.filter(([, count]) => count >= 2)) proposals.push(`Missing context "${item}" appeared ${count} times; add it to setup doctor or context-root templates.`);
  for (const [item, count] of verificationMissing.filter(([, count]) => count >= 2)) proposals.push(`Missing verification "${item}" appeared ${count} times; add command rails or done-check coverage.`);
  for (const [item, count] of friction.filter(([, count]) => count >= 2)) proposals.push(`Friction "${item}" appeared ${count} times; simplify CLI/docs or add a packet helper.`);
  if (!proposals.length) proposals.push('No repeated calibration signal has crossed the proposal threshold yet.');
  return proposals;
}

function appendPacketCompletion(packetPath, entry) {
  const existing = readFileSync(packetPath, 'utf8');
  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  writeFileSync(packetPath, `${existing}${separator}${entry}`, 'utf8');
}

function humanize(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatList(items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

function formatOptionList(value) {
  return formatList(splitList(value));
}

function formatInlineStatus(value) {
  return value ? String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join('; ') : 'clean';
}

function indentList(items) {
  return formatList(items).split('\n').map((line) => `  ${line}`).join('\n');
}

function formatContextDocs(repo, items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item.label}: ${relative(repo, item.path) || '.'}`).join('\n');
}

function formatCommandList(commands, route) {
  const selected = new Set(['test']);
  if (['standard', 'release-push', 'multi-repo-integration', 'ui-rendered-review'].includes(route)) selected.add('build');
  if (route === 'ui-rendered-review') selected.add('rendered');
  if (route === 'release-push') selected.add('lint');
  const lines = Object.entries(commands)
    .filter(([key, command]) => command && (selected.has(key) || ['install', 'dev'].includes(key)))
    .map(([key, command]) => `- ${key}: \`${command}\``);
  return lines.length ? lines.join('\n') : '- none discovered';
}

function formatReviewTargets(gitInfo) {
  if (gitInfo.changedFiles.length) {
    return `${formatList(gitInfo.changedFiles)}

Suggested diff commands:

\`\`\`bash
git diff --stat
git diff
\`\`\``;
  }

  return `- No dirty working-tree files detected.
- Review the latest commit, branch state, or explicit artifact named in the task.

Suggested read-only commands:

\`\`\`bash
git show --stat --oneline HEAD
git show --check --stat HEAD
\`\`\``;
}

function formatReviewChecks(commands, route) {
  const lines = [
    '- Read the relevant diff/artifacts before running broader checks.',
    '- `git diff --check` when reviewing a dirty working tree.',
    '- `git show --check --stat HEAD` when reviewing the latest committed change.',
  ];
  if (commands.test) lines.push(`- test: \`${commands.test}\``);
  if (commands.build && route !== 'review-only') lines.push(`- build: \`${commands.build}\``);
  if (commands.lint) lines.push(`- lint/typecheck/format: \`${commands.lint}\``);
  if (commands.rendered && route === 'ui-rendered-review') lines.push(`- rendered: \`${commands.rendered}\``);
  return lines.join('\n');
}

function formatReleaseChecks(commands) {
  const lines = ['- `git diff --check` for dirty work or `git show --check --stat HEAD` for committed-only release review.'];
  if (commands.test) lines.push(`- test: \`${commands.test}\``);
  if (commands.build) lines.push(`- build: \`${commands.build}\``);
  if (commands.lint) lines.push(`- lint/typecheck/format: \`${commands.lint}\``);
  if (!commands.test && !commands.build && !commands.lint) lines.push('- No project test/build/lint commands discovered; record this as a release cap.');
  return lines.join('\n');
}

function formatReleaseStopGates(gitInfo, profile) {
  const gates = [];
  if (gitInfo.status) gates.push('Dirty working tree is present; confirm whether each file belongs in the release before committing or pushing.');
  if (!gitInfo.upstream) gates.push('No upstream branch is configured; confirm push target before any credentialed write.');
  if (gitInfo.behind > 0) gates.push(`Branch is ${gitInfo.behind} commit(s) behind upstream; pull/rebase/merge policy must be confirmed before release.`);
  if (!profile.releasePolicy) gates.push('Release policy is not configured in the SDLC profile.');
  if (!profile.humanApprovalGates) gates.push('Human approval gates are not configured in the SDLC profile.');
  gates.push('Explicit human approval is required before commit, push, merge, deploy, publish, or destructive Git actions.');
  return formatList(gates);
}

function recentCommits(repo, count = 5) {
  return git(repo, ['log', '--oneline', `-${count}`]).split(/\r?\n/).filter(Boolean);
}

function accessibilityPolicy(profile) {
  const value = String(profile.accessibilityReviewPolicy || 'optional').trim().toLowerCase();
  return ['optional', 'suggested', 'required'].includes(value) ? value : 'optional';
}

function formatAccessibilityPolicy(policy, route) {
  const routeText = route === 'ui-rendered-review' ? 'This route touches rendered UI.' : 'This route does not inherently require accessibility evidence.';
  if (policy === 'required') {
    return `Policy: required
${routeText}
Required evidence: run the repository accessibility check or record the work as incomplete/capped until a human waives it.`;
  }
  if (policy === 'suggested') {
    return `Policy: suggested
${routeText}
Suggested evidence: run accessibility checks when UI changes affect real users, keyboard use, forms, navigation, focus, semantics, contrast, or production-facing surfaces. If skipped, record a cap.`;
  }
  return `Policy: optional
${routeText}
Default behavior: accessibility checks are available but not a stopping gate. For internal tools, skipped accessibility is not a failure unless the repository or human requires it.`;
}

function formatSecurityOverlay(triggers) {
  if (!triggers.length) {
    return `Security/tool triggers:
- none detected

Consent gates:
- use normal route gates

Mitigations or caps:
- none`;
  }

  return `Security/tool triggers:
${formatList(triggers)}

Consent gates:
- get explicit approval before credentialed writes, destructive actions, dependency/tool installs, production effects, or external service calls

Mitigations or caps:
- load threat-model/security review guidance when data, auth, dependency, tool, external integration, prompt/tool injection, or production risk is present
- document unavailable security evidence as an explicit cap`;
}

function groupCounts(values) {
  const counts = new Map();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function trimSlash(value) {
  return String(value).replace(/\/+$/, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCounts(counts) {
  if (!counts.length) return '- none';
  return counts.map(([key, count]) => `- ${key}: ${count}`).join('\n');
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  return splitList(value);
}

function recommendedLearningPrompts(caps, friction, proposals, contextMissing = [], verificationMissing = [], agentMissedSteps = [], routeFit = []) {
  const prompts = [];
  if (caps.length) prompts.push('Review repeated evidence caps and decide whether setup-sdlc-in-repo should capture missing commands or context paths.');
  if (contextMissing.length) prompts.push('Review repeated missing context and decide whether repository setup, context-root templates, or context packs should require new fields.');
  if (verificationMissing.length) prompts.push('Review repeated missing verification and decide whether quality automation guidance or repo readiness checks need stronger rails.');
  if (agentMissedSteps.length) prompts.push('Review missed agent steps and decide whether run-sdlc should make the step mandatory or easier to execute.');
  if (routeFit.some(([key]) => ['too heavy', 'too light'].includes(key))) prompts.push('Review route-fit mismatches and adjust route recipes or classification triggers.');
  if (friction.length) prompts.push('Review repeated friction and decide whether route recipes, templates, or CLI affordances should change.');
  if (proposals.length) prompts.push('Promote repeated process-change proposals into process-learning review before editing router skills.');
  return formatList(prompts);
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function dedupeByPath(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item.path || seen.has(item.path)) continue;
    seen.add(item.path);
    out.push(item);
  }
  return out;
}

function defaultRunsDir(repo) {
  return join(repo, '.ai-local', 'sdlc-runs');
}

function defaultCalibrationPath(repo) {
  return join(repo, '.ai-local', 'sdlc-calibration.jsonl');
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'route';
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

function escapeCommandArg(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
