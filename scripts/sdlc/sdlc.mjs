#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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
  if (area === 'context' && action === 'freshness') return contextFreshness(repo, options);
  if (area === 'context' && (action === 'contradictions' || action === 'check')) return contextContradictions(repo, options);
  if (area === 'context' && action === 'update-plan') return contextUpdatePlan(repo, options);
  if (area === 'change' && (action === 'graph' || action === 'graph-lite')) return changeGraph(repo, options);
  if (area === 'recipe' && action === 'show') return recipeShow(rest[0] || options.route);
  if (area === 'task' && action === 'start') return taskStart(repo, options);
  if (area === 'task' && (action === 'open')) return taskOpen(repo, options);
  if (area === 'task' && action === 'status') return taskStatus(repo, options);
  if (area === 'task' && (action === 'review' || action === 'checkpoint')) return taskReview(repo, options);
  if (area === 'task' && action === 'ledger') return taskLedger(repo, options);
  if (area === 'task' && action === 'verify') return taskVerify(repo, options);
  if (area === 'task' && action === 'qa') return taskQa(repo, options);
  if (area === 'task' && (action === 'finish' || action === 'complete')) return taskFinish(repo, options);
  if (area === 'route' && action === 'start') return routeStart(repo, rest[0] || options.route, options);
  if (area === 'packet' && action === 'status') return packetStatus(repo, options);
  if (area === 'done' && action === 'check') return doneCheck(repo, options);
  if (area === 'run' && action === 'start') return runStart(repo, options);
  if (area === 'run' && action === 'finish') return runFinish(repo, options);
  if (area === 'workspace' && action === 'status') return workspaceStatus(repo, options);
  if (area === 'workspace' && action === 'packet') return workspacePacket(repo, options);
  if (area === 'workmode' && action === 'detect') return workmodeDetect(repo, options);
  if (area === 'touched' && action === 'packet') return touchedPacket(repo, options);
  if (area === 'impact' && action === 'packet') return impactPacket(repo, options);
  if (area === 'review' && action === 'packet') return reviewPacket(repo, options);
  if (area === 'review' && action === 'complete') return reviewComplete(repo, options);
  if (area === 'release' && action === 'packet') return releasePacket(repo, options);
  if (area === 'release' && action === 'complete') return releaseComplete(repo, options);
  if (area === 'qa' && (action === 'script' || action === 'packet')) return qaScript(repo, options);
  if (area === 'qa' && action === 'complete') return qaComplete(repo, options);
  if (area === 'smoke' && action === 'packet') return smokePacket(repo, options);
  if (area === 'smoke' && action === 'complete') return smokeComplete(repo, options);
  if (area === 'multi' && action === 'status') return multiStatus(repo, options);
  if (area === 'multi' && action === 'packet') return multiPacket(repo, options);
  if (area === 'contract' && action === 'packet') return contractPacket(repo, options);
  if (area === 'data' && action === 'packet') return dataPacket(repo, options);
  if (area === 'integration' && action === 'packet') return integrationPacket(repo, options);
  if (area === 'test' && action === 'plan') return testPlan(repo, options);
  if (area === 'evidence' && action === 'init') return evidenceInit(repo, options);
  if (area === 'verify' && action === 'packet') return verifyPacket(repo, options);
  if (area === 'verify' && action === 'complete') return verifyComplete(repo, options);
  if (area === 'verify') return verify(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'final' && action === 'gate') return finalGate(repo, options);
  if (area === 'git' && action === 'packet') return gitPacket(repo, options);
  if (area === 'gates') return gates(repo, areaOptions);
  if (area === 'handoff' && action === 'draft') return handoffDraft(repo, options);
  if (area === 'calibrate' && action === 'add') return calibrateAdd(repo, options);
  if (area === 'calibrate' && action === 'summary') return calibrateSummary(repo, options);
  if (area === 'calibrate' && action === 'inspect') return calibrateInspect(repo, options);
  if (area === 'calibrate' && action === 'propose') return calibratePropose(repo, options);
  if (area === 'calibrate' && (action === 'flows' || action === 'promote-candidates')) return calibrateFlows(repo, options);
  if (area === 'readiness') return readiness(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'setup' && action === 'doctor') return setupDoctor(repo, options);
  if (area === 'setup' && action === 'bootstrap') return setupBootstrap(repo, options);
  if (area === 'health') return health(repo, areaOptions);
  if (area === 'process' && action === 'health') return processHealth(repo, options);
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
  sdlc context freshness --task "..." [--repo <path>] [--days <number>] [--out <path>]
  sdlc context contradictions --task "..." [--repo <path>] [--out <path>]
  sdlc context update-plan --task "..." [--repo <path>] [--out <path>]
  sdlc change graph --task "..." [--repo <path>] [--out <path>]
  sdlc recipe show <route>
  sdlc task start --task "..." [--repo <path>] [--out <path>]
  sdlc task open --task "..." [--repo <path>]
  sdlc task status [--task "..."] [--repo <path>]
  sdlc task review --task "..." [--repo <path>]
  sdlc task checkpoint --task "..." [--repo <path>]
  sdlc task ledger --task "..." [--repo <path>] [--out <path>]
  sdlc task verify --task "..." [--repo <path>]
  sdlc task qa --task "..." [--repo <path>]
  sdlc task finish --task "..." [--repo <path>] [--out <path>]
  sdlc task complete --task "..." [--repo <path>] [--out <path>]
  sdlc route start <route> [--task "..."] [--repo <path>] [--out <path>]
  sdlc packet status [--repo <path>]
  sdlc done check --route <route> [--repo <path>] [--packet <path>]
  sdlc run start --task "..." [--repo <path>]
  sdlc run finish --route <route> [--repo <path>] [--packet <path>]
  sdlc workspace status [--repo <path>] [--workspace <path>]
  sdlc workspace packet --task "..." [--repo <path>] [--out <path>]
  sdlc workmode detect [--task "..."] [--repo <path>]
  sdlc touched packet [--repo <path>] [--out <path>]
  sdlc impact packet --task "..." [--repo <path>] [--out <path>]
  sdlc review packet --task "..." [--repo <path>] [--out <path>]
  sdlc review complete --packet <path> --verdict "..." [--findings "..."] [--checks "..."] [--caps "..."]
  sdlc release packet [--task "..."] [--repo <path>] [--out <path>]
  sdlc release complete --packet <path> --action "none|commit|push|handoff" [--verdict "..."] [--checks "..."] [--caps "..."]
  sdlc qa script --task "..." [--repo <path>] [--out <path>]
  sdlc qa complete --packet <path> --status "draft|ready|blocked" [--caps "..."]
  sdlc smoke packet --task "..." [--repo <path>] [--out <path>]
  sdlc smoke complete --packet <path> --status "pass|fail|blocked" [--steps "..."] [--caps "..."]
  sdlc multi status [--repo <path>]
  sdlc multi packet --task "..." [--repo <path>] [--out <path>]
  sdlc contract packet --task "..." [--repo <path>] [--out <path>]
  sdlc data packet --task "..." [--repo <path>] [--out <path>]
  sdlc integration packet --task "..." [--repo <path>] [--out <path>]
  sdlc test plan --task "..." [--repo <path>] [--out <path>]
  sdlc evidence init --route <route> [--repo <path>] [--out <path>]
  sdlc verify packet --task "..." [--repo <path>] [--out <path>]
  sdlc verify complete --packet <path> --checks "..." [--caps "..."]
  sdlc verify [--repo <path>] [--commands test,build]
  sdlc final gate [--task "..."] [--repo <path>]
  sdlc git packet [--repo <path>] [--out <path>]
  sdlc gates [--task "..."] [--repo <path>]
  sdlc handoff draft [--task "..."] [--repo <path>] [--out <path>]
  sdlc calibrate add --route <route> [--repo <path>] [--out <path>]
  sdlc calibrate summary [--repo <path>] [--in <path>] [--out <path>]
  sdlc calibrate inspect [--repo <path>] [--in <path>]
  sdlc calibrate propose [--repo <path>] [--in <path>] [--out <path>]
  sdlc calibrate flows [--repo <path>] [--in <path>] [--out <path>]
  sdlc readiness [--repo <path>]
  sdlc health [--repo <path>]
  sdlc process health [--repo <path>] [--out <path>]
  sdlc setup doctor [--repo <path>] [--fix-plan]
  sdlc setup bootstrap [--repo <path>] [--shared-context-root <path>]
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
    verificationMaturity: profile.values.verificationMaturity || 'not configured',
    detectedStack: detectStack(repo).join(', ') || 'generic',
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
- Verification maturity: no automated tests / manual QA only / smoke tests / partial automated tests / mature CI

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

function contextFreshness(repo, options = {}) {
  const task = options.task || '';
  const days = Number(options.days || 60);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => contextFreshnessRow(repo, item, days));
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
- Touched surfaces: ${formatInlineList(dedupe(git.changedFiles.map(classifyTouchedSurface)))}
- Context docs used by agent should be named in the task ledger.
- If stale docs contradict source files, source files win and context update should be recorded.

## Recommended Action

${formatList(contextFreshnessRecommendations(existingRows, staleRows, profile.values))}
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextContradictions(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const related = splitList(profile.values.relatedRepositories);
  const contradictions = detectContextContradictions(repo, profile, commands, docs, related);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Contradiction Check

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Possible Contradictions

${formatList(contradictions)}

## How To Use This

- Treat these as review prompts, not proof.
- Source files and runnable commands win over stale context docs.
- If a contradiction is real and durable, update the repo or shared context docs after the task.
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

function changeGraph(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the change graph can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const graph = changeGraphEdges(task, files);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-change-graph-lite.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Change Graph Lite

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Repository role: ${profile.values.repositoryRole || 'not configured'}

## Changed Nodes

${formatList(files.length ? files.map((file) => `${file} (${classifyTouchedSurface(file)})`) : inferDirtySurfaces(task, git))}

## Likely Edges

| From | Relationship | To | Evidence |
| --- | --- | --- | --- |
${graph.length ? graph.map((edge) => `| ${escapeCell(edge.from)} | ${escapeCell(edge.relationship)} | ${escapeCell(edge.to)} | ${escapeCell(edge.evidence)} |`).join('\n') : '| task | affects | behavior to identify | no changed files yet |'}

## QA And Context Implications

${formatList(changeGraphImplications(graph, task, files))}

## Maintenance Rule

- This is a lightweight local graph, not a permanent architecture model.
- Promote repeated, stable edges into shared context docs such as service maps, workflow maps, API contracts, or known failure modes.
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
  const trackedKinds = completionTrackedPacketKinds();
  const rows = packets.map((packet) => ({
    file: relative(repo, packet.path),
    kind: packet.kind,
    completed: trackedKinds.includes(packet.kind) ? (packet.completed ? 'yes' : 'no') : 'n/a',
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

function taskStart(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task contract can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const modes = detectWorkModes(repo, task, profile.values, git.changedFiles);
  const triggers = securityTriggers(task, profile.values);
  const related = splitList(profile.values.relatedRepositories);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-start.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Start Contract

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Suggested route: ${route}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Normalized Task Shape

- Task type: ${taskType(task)}
- Work modes: ${formatInlineList(modes)}
- Affected repositories: ${related.length ? related.join(', ') : 'primary repository only / unknown'}
- Expected QA need: ${expectedQaNeed(task, git.changedFiles, profile.values)}
- Likely surfaces: ${formatInlineList(inferDirtySurfaces(task, git))}
- Verification maturity: ${verificationMaturity(profile.values, commands)}
- Commit/push preference: human decision at finish; never automatic

## Constraints And Gates

${formatList(runStartGates(route, task, git, profile.values))}

## Context To Check

\`\`\`bash
sdlc context freshness --task "${escapeCommandArg(task)}"
sdlc context pack --task "${escapeCommandArg(task)}"
sdlc change graph --task "${escapeCommandArg(task)}"
\`\`\`

## Suggested Task Flow

\`\`\`bash
sdlc task ledger --task "${escapeCommandArg(task)}"
sdlc touched packet
sdlc impact packet --task "${escapeCommandArg(task)}"
sdlc verify packet --task "${escapeCommandArg(task)}"
sdlc smoke packet --task "${escapeCommandArg(task)}"
sdlc qa script --task "${escapeCommandArg(task)}"
sdlc task finish --task "${escapeCommandArg(task)}"
\`\`\`

## Security And Tool Triggers

${formatList(triggers)}
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function taskOpen(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task can be opened.');

  const outDir = options.outDir ? resolve(repo, options.outDir) : defaultRunsDir(repo);
  mkdirSync(outDir, { recursive: true });
  const taskSlug = slug(task);
  const outputs = [
    ['task-start', () => taskStart(repo, { ...options, out: join(outDir, `${stamp()}-${taskSlug}-task-start.md`) })],
    ['context-freshness', () => contextFreshness(repo, { ...options, out: join(outDir, `${stamp()}-${taskSlug}-context-freshness.md`) })],
    ['context-contradictions', () => contextContradictions(repo, { ...options, out: join(outDir, `${stamp()}-${taskSlug}-context-contradictions.md`) })],
    ['change-graph', () => changeGraph(repo, { ...options, out: join(outDir, `${stamp()}-${taskSlug}-change-graph.md`) })],
    ['task-ledger', () => taskLedger(repo, { ...options, out: join(outDir, `${stamp()}-${taskSlug}-task-ledger.md`) })],
  ];

  printObject({
    repository: repo,
    task,
    action: 'opening task with start contract, context checks, change graph, and ledger',
  });
  for (const [, run] of outputs) run();
}

function taskStatus(repo, options = {}) {
  const task = options.task || '';
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  const metrics = taskMetrics(repo, task, git, packets);

  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    route: task ? inferRouteFromTask(task, git, loadProfile(repo).values) : 'not provided',
    packets: packets.length,
    finalGate: open.length ? 'open' : 'ready with explicit human approval',
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc task finish --task "..."',
  });
  console.log('\n## Metrics\n');
  console.log(formatList(Object.entries(metrics).map(([key, value]) => `${humanize(key)}: ${value}`)));
}

function taskReview(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  const latest = (kind) => latestPacketPath(repo, packets, kind);

  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    route: task ? inferRouteFromTask(task, git, profile.values) : 'not provided',
    changedFiles: git.changedFiles.length,
    finalGate: open.length ? 'open' : 'ready with explicit human approval',
    readyForQaHandoff: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no',
    readyToCommit: open.length ? 'no' : 'yes, with explicit human approval only',
    readyToPush: open.length ? 'no' : 'only with explicit human approval',
    mergeDeployRelease: 'forbidden by SDLC default; project-specific human process only',
  });

  console.log('\n## Evidence\n');
  console.log(formatList([
    `Task ledger: ${latest('task-ledger')}`,
    `Touched packet: ${latest('touched')}`,
    `Impact packet: ${latest('impact')}`,
    `Developer verification: ${latest('developer-verification')}`,
    `Manual smoke: ${latest('manual-smoke')}`,
    `QA script: ${latest('qa-script')}`,
    `Git packet: ${latest('git-action')}`,
  ]));
  console.log('\n## Open Gates\n');
  console.log(formatList(open));
  console.log('\n## Recommended Next Action\n');
  console.log(`- ${open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc task finish --task "..."'}`);
}

function taskLedger(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task ledger can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Ledger

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route: ${route}
Status: ${git.status || 'clean'}

## Evidence Index

| Kind | Latest packet | Completed |
| --- | --- | --- |
${taskLedgerRows(repo, packets).join('\n')}

## Context And Change Understanding

- Context freshness:
- Context pack:
- Change graph:
- Context update plan:

## Verification And QA

- Developer verification:
- Manual smoke:
- Human QA Markdown script:
- Test introduction plan:
- Render/browser evidence:
- Caps:

## Files Touched

${formatList(git.changedFiles)}

## Finish Decision

\`\`\`bash
sdlc task finish --task "${escapeCommandArg(task)}"
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function taskVerify(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so task verification can be scoped.');

  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  printObject({
    repository: repo,
    task,
    suggestedVerifyPacket: `sdlc verify packet --task "${task}"`,
    suggestedManualSmoke: `sdlc smoke packet --task "${task}"`,
    suggestedTestPlan: shouldSuggestTestPlan(repo, task, git.changedFiles) ? `sdlc test plan --task "${task}"` : 'not required by detected surfaces',
    latestDeveloperVerification: latestPacketPath(repo, packets, 'developer-verification'),
    latestManualSmoke: latestPacketPath(repo, packets, 'manual-smoke'),
  });
}

function taskQa(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so task QA can be scoped.');

  const packets = findPackets(repo, {});
  printObject({
    repository: repo,
    task,
    suggestedQaScript: `sdlc qa script --task "${task}"`,
    latestImpactPacket: latestPacketPath(repo, packets, 'impact'),
    latestQaScript: latestPacketPath(repo, packets, 'qa-script'),
    note: 'QA scripts are Markdown for human testers and YouTrack paste-in; they do not assume AI use.',
  });
}

function taskFinish(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the finish decision can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const open = finalGateOpenItems(repo, task, git, packets);
  const metrics = taskMetrics(repo, task, git, packets);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-finish-decision.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Finish Decision

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Head: ${git.head || 'unknown'}
Route: ${route}
Status: ${git.status || 'clean'}

## Decision Summary

- Ready to commit: ${open.length ? 'no' : 'yes, with explicit human approval only'}
- Ready to push: ${open.length ? 'no' : 'only with explicit human approval'}
- Ready for QA handoff: ${packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no'}
- Merge/deploy/release: forbidden by SDLC default; project-specific human process only
- Suggested commit message: ${proposedCommitMessage(git.changedFiles, packets.find((packet) => packet.kind === 'impact'))}

## Open Gates

${formatList(open)}

## Evidence Summary

${formatList(taskEvidenceSummary(repo, packets))}

## Task Metrics

${formatList(Object.entries(metrics).map(([key, value]) => `${humanize(key)}: ${value}`))}

## Human Approval Choices

- [ ] No action.
- [ ] Commit only.
- [ ] Commit and push.
- [ ] Generate/update QA handoff only.

## Next Commands

\`\`\`bash
${open.length ? suggestedFinalGateCommand(open[0], task) : 'sdlc git packet'}
sdlc calibrate add --route ${route} --outcome "" --route-fit "" --caps "" --friction "" --process-change-proposed ""
\`\`\`

## Final Response Shape For Agent

- Ready to commit: ${open.length ? 'no' : 'yes, with explicit human approval only'}
- Ready to push: ${open.length ? 'no' : 'only with explicit human approval'}
- QA script ready: ${packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no'}
- Tests/checks run:
- Caps:
- Files changed: ${git.changedFiles.length}
- Recommended next action: ${open[0] ? suggestedFinalGateCommand(open[0], task) : 'Ask human to choose no action / commit only / commit and push.'}
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (open.length) process.exitCode = 1;
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

function workspaceStatus(repo, options = {}) {
  const repos = workspaceRepos(repo, options);
  printObject({
    workspaceRoot: repo,
    repositories: repos.length,
  });
  console.log('\n| Repository | Role | Branch | Status | Upstream | Ahead/behind |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const item of repos) {
    const info = getGitInfo(item.path);
    const role = detectStack(item.path).join(', ') || 'generic';
    console.log(`| ${escapeCell(item.label)} | ${escapeCell(role)} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(info.branch ? formatInlineStatus(info.status) : 'not a git repository')} | ${escapeCell(info.upstream || '')} | ${info.branch ? `${info.behind} behind / ${info.ahead} ahead` : ''} |`);
  }
}

function workspacePacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the workspace packet can be scoped.');

  const repos = workspaceRepos(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-workspace-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const rows = repos.map((item) => {
    const info = getGitInfo(item.path);
    return `| ${escapeCell(item.label)} | ${escapeCell(detectStack(item.path).join(', ') || 'generic')} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(info.branch ? formatInlineStatus(info.status) : 'not a git repository')} | ${info.branch ? `${info.behind} behind / ${info.ahead} ahead` : ''} |`;
  });

  const content = `# SDLC Workspace Packet

Date: ${new Date().toISOString()}
Task: ${task}
Workspace root: ${repo}

## Repositories

| Repository | Role/runtime hints | Branch | Status | Ahead/behind |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Workspace Gates

- Confirm affected repositories before implementation.
- Keep unrelated dirty repos out of the task scope.
- Use per-repo verification and QA evidence when changes span repositories.
- Do not merge, deploy, move code between branches/environments, create MR/PRs, or trigger pipelines automatically.

## Multi-Repo Task Notes

- Primary repo:
- Secondary repos:
- Cross-repo workflow:
- Shared context root:
- Service map:
- Release order:
- QA script should describe the full tester-visible workflow, not repository internals.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function workmodeDetect(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const modes = detectWorkModes(repo, task, profile.values, git.changedFiles);
  printObject({
    repository: repo,
    task: task || 'not provided',
    workModes: modes.join(', ') || 'generic',
    verificationMaturity: verificationMaturity(profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')))),
    stack: detectStack(repo).join(', ') || 'generic',
    recommendedNextCommand: `sdlc impact packet --task "${escapeCommandArg(task || 'current task')}"`,
  });
}

function touchedPacket(repo, options = {}) {
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-touched-surface-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const rows = files.map((file) => ({
    file,
    surface: classifyTouchedSurface(file),
    runtime: classifyRuntimeSurface(file),
    qa: needsManualQa(file) ? 'yes' : 'maybe',
  }));

  const content = `# SDLC Touched Surface Ledger

Date: ${new Date().toISOString()}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Head: ${git.head || 'unknown'}

## Summary

- Changed files: ${files.length}
- Surfaces: ${formatInlineList(dedupe(rows.map((row) => row.surface)))}
- Runtime hints: ${formatInlineList(dedupe(rows.map((row) => row.runtime)))}

## Changed Files By Surface

| File | Surface | Runtime hint | Manual QA likely |
| --- | --- | --- | --- |
${rows.length ? rows.map((row) => `| ${escapeCell(row.file)} | ${row.surface} | ${row.runtime} | ${row.qa} |`).join('\n') : '| none |  |  |  |'}

## QA And Handoff Notes

- Use this ledger as an input to impact, developer verification, QA test scripts, and final handoff.
- Generated/build artifacts should be reviewed before commit.
- Manual QA is expected when changed behavior is user-visible, data-affecting, integration-affecting, or lacks automated coverage.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function impactPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the impact packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-impact-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Impact Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Verification maturity: ${profile.values.verificationMaturity || 'not configured'}

## Impact Summary

- Runtime/product type: ${formatInlineList(dedupe(files.map(classifyRuntimeSurface)))}
- Touched surfaces: ${formatInlineList(surfaces)}
- Changed files: ${files.length}

## Affected Areas To Consider

${formatList(impactAreas(task, files, profile.values))}

## User Or System Workflows

- Primary workflow:
- Secondary/regression workflows:
- Roles/permissions:
- Environments affected:

## Technical Impact

- APIs/contracts: ${surfaces.includes('backend/API') || surfaces.includes('contracts/interfaces') ? 'likely' : 'unknown/not detected'}
- Data/storage: ${surfaces.includes('database/storage') ? 'likely' : 'unknown/not detected'}
- External integrations: ${surfaces.includes('external integration') ? 'likely' : 'unknown/not detected'}
- Config/environment: ${surfaces.includes('config/environment') ? 'likely' : 'unknown/not detected'}
- Dependencies/packages: ${surfaces.includes('dependencies') ? 'likely' : 'unknown/not detected'}

## QA Coverage Areas

${formatList(qaAreas(task, files))}

## Risks, Unknowns, And Caps

- Unknown affected pages/screens:
- Unknown affected APIs/jobs:
- Test coverage cap:
- Release/handoff risk:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
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

function verifyPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the developer verification packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-developer-verification-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Developer Verification Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Head: ${git.head || 'unknown'}
Verification maturity: ${profile.values.verificationMaturity || inferVerificationMaturity(commands)}

## Developer / Agent Verification

This packet records verification performed by the developer or coding agent. It is separate from the human QA Markdown test script.

## Recommended Checks

${formatCommandList(commands, inferRouteFromTask(task, git, profile.values))}

## Checks Run

| Check | Command / Method | Result | Notes |
| --- | --- | --- | --- |
|  |  |  |  |

## Manual Smoke / Rendered / API / Data Checks

- Manual smoke:
- Rendered UI:
- API or service:
- Data/storage:
- Integration:

## Test Introduction Opportunity

- Existing test harness:
- Smallest useful test for this change:
- If not adding a test now, cap/rationale:

## Verification Caps

- No automated tests:
- Environment unavailable:
- Data/integration unavailable:
- Other:

## Completion Command

\`\`\`bash
sdlc verify complete --packet ${relative(repo, outPath)} --checks "" --caps ""
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function verifyComplete(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const git = getGitInfo(repo);
  const entry = `## Developer Verification Completion

Completed: ${new Date().toISOString()}
Repository status: ${formatInlineStatus(git.status)}
Head: ${git.head || 'unknown'}

### Checks

${formatOptionList(options.checks)}

### Caps

${formatOptionList(options.caps)}

### Result

- Outcome: ${options.outcome || 'not provided'}
- Notes: ${options.notes || ''}
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
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
- The SDLC prepares release readiness/handoff evidence only; it must not automatically merge, deploy, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit and push require explicit human approval.
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

function qaScript(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the QA test script can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const sourceHints = qaSourceHints(repo, options);
  const scopeItems = dedupe([...qaAreas(task, files), ...sourceHints.scope]);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-test-script.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# QA Test Script: ${task}

## Summary

Validate the changed behavior for this task and regression-test the affected site/application areas. This Markdown is intended to be pasted into YouTrack and followed by human QA testers. It does not assume QA will use AI, inspect source code, run developer commands, or know the SDLC.

## Scope

### In Scope

${formatList(scopeItems)}
${sourceHints.scope.length ? `\n### Source Packet Hints\n\n${formatList(sourceHints.scope)}` : ''}

### Out Of Scope

- Source-code review.
- Developer-only build/test commands.
- Merge, deploy, release, or branch movement decisions.

## Environment

- Environment: QA
- Browser/device:
- User role:
- Test account/data:
- Build/version/branch: ${git.branch || 'unknown'} / ${git.head || 'unknown'}

## Preconditions

- Required permissions:
- Required test data:
- Feature flags/config:
- External systems/sandbox availability:

## Test Cases

### QA-001: Primary Changed Workflow

**Purpose:** Validate the main behavior changed by this task.

**Steps**
1. Navigate to the affected area.
   - Expected: The page/workflow loads without errors.
2. Perform the primary changed action.
   - Expected: The new or fixed behavior works as described in the task.
3. Refresh or revisit the affected area when persistence matters.
   - Expected: Data/state remains correct.

**Result**
- Pass/Fail:
- Actual result:
- Notes:

### QA-002: Regression Check

**Purpose:** Ensure nearby existing behavior still works.

**Steps**
1. Run the closest existing workflow that uses the same page/API/data/integration.
   - Expected: Existing behavior still works.
2. Check validation/error handling for the affected area.
   - Expected: Errors are clear and no unexpected failures occur.

**Result**
- Pass/Fail:
- Actual result:
- Notes:

${qaDomainSections(task, files)}

## Regression Checklist

- [ ] Changed workflow works.
- [ ] Existing nearby workflow still works.
- [ ] Permissions/roles behave correctly.
- [ ] Existing saved data displays correctly.
- [ ] Validation and error messages behave correctly.
- [ ] No unexpected page, API, or integration errors are visible to QA.

## Known Risks / Notes

- Touched surfaces: ${formatInlineList(dedupe(files.map(classifyTouchedSurface)))}
- Changed files: ${files.length}
- Verification maturity: ${profile.values.verificationMaturity || 'not configured'}
- Developer caps to communicate:
${sourceHints.risks.length ? formatList(sourceHints.risks) : '- none recorded'}

## Developer Verification Summary

- Developer/agent checks run:
- Known verification caps:

## QA Completion

- QA status:
- QA tester:
- Date:
- Notes:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function qaComplete(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const status = options.status || '';
  if (!status) fail('Pass --status "draft|ready|blocked" so QA script readiness is explicit.');
  if (!['draft', 'ready', 'blocked'].includes(status)) fail('Use --status "draft", "ready", or "blocked".');

  const entry = `## QA Script Completion

Completed: ${new Date().toISOString()}
Status: ${status}
Ready for YouTrack paste: ${status === 'ready' ? 'yes' : 'no'}

### Remaining Gaps / Caps

${formatOptionList(options.caps)}

### Linked Evidence

- Impact packet: ${options.impact || ''}
- Touched packet: ${options.touched || ''}
- Developer verification packet: ${options.verify || ''}

### Notes

${options.notes || ''}
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

function smokePacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the manual smoke packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-manual-smoke-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Manual Smoke Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Head: ${git.head || 'unknown'}
Status: ${git.status || 'clean'}
Verification maturity: ${profile.values.verificationMaturity || 'not configured'}

## Purpose

Record developer/agent smoke evidence for the changed behavior before completion, commit, push, or QA handoff. This is separate from the human QA Markdown script.

## Changed Surfaces

${formatList(dedupe(files.map(classifyTouchedSurface)))}

## Suggested Smoke Steps

${formatList(smokeStepSuggestions(task, files))}

## Rendered Evidence Plan

${formatList(renderedEvidencePlan(task, files, profile.values))}

## Environment

- Local/QA URL:
- Browser/device:
- User role/test account:
- Data/config needed:

## Expected Result

- Changed behavior is visible or callable.
- Nearby existing behavior still works.
- No obvious console, page, API, or integration errors appear in the smoke path.

## Actual Result

- Status:
- Notes:
- Screenshots/logs:

## Caps

- Automated tests unavailable:
- Render/browser unavailable:
- External service/data unavailable:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function smokeComplete(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const status = options.status || '';
  if (!status) fail('Pass --status "pass|fail|blocked" so manual smoke outcome is explicit.');
  if (!['pass', 'fail', 'blocked'].includes(status)) fail('Use --status "pass", "fail", or "blocked".');

  const entry = `## Manual Smoke Completion

Completed: ${new Date().toISOString()}
Status: ${status}

### Steps Run

${formatOptionList(options.steps)}

### Result / Evidence

${formatOptionList(options.evidence || options.result)}

### Remaining Gaps / Caps

${formatOptionList(options.caps)}

### Notes

${options.notes || ''}
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

## Cross-Repo QA Handoff

- Tester-visible workflow:
- Repositories/services involved:
- Required QA environment:
- Test data/accounts:
- Provider/sandbox dependencies:
- Regression paths:

## Human-Controlled Release Notes

- Commit/push may be prepared only after explicit approval.
- Merge requests, release branches, AWS pipelines, compiled artifact movement, deploys, and production releases remain project-specific human processes.

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

function dataPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the data packet can be scoped.');

  const git = getGitInfo(repo);
  const dataFiles = git.changedFiles.filter((file) => classifyTouchedSurface(file) === 'database/storage');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-data-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Data / Storage Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Data Surfaces

${formatList(dataFiles.length ? dataFiles : ['No changed data files detected yet; identify tables/collections/files/caches/queues during implementation.'])}

## Data Change Checklist

- Tables/collections/files/caches/queues:
- Schema/migration/scripts:
- Stored procedures/views/functions:
- Data correction or backfill:
- Rollback approach:
- Locking/performance risk:
- QA data setup:
- Downstream workflows/APIs/pages:

## Verification

- Automated data/schema check:
- Manual data validation:
- Environment cap:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function integrationPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the integration packet can be scoped.');

  const git = getGitInfo(repo);
  const integrationFiles = git.changedFiles.filter((file) => classifyTouchedSurface(file) === 'external integration');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-integration-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Integration Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Integration Surfaces

${formatList(integrationFiles.length ? integrationFiles : ['No changed integration files detected yet; identify providers/endpoints/events/files during implementation.'])}

## Integration Checklist

- Provider/system:
- Endpoint/webhook/file/event:
- Auth/config touched:
- Sandbox/test path:
- Retry/error behavior:
- Logging/observability:
- QA validation path:
- Fallback/rollback:
- External dependency cap:

## Verification

- Sandbox/API check:
- Manual QA observable result:
- Unavailable integration cap:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function testPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the test introduction plan can be scoped.');

  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const git = getGitInfo(repo);
  const maturity = verificationMaturity(profile.values, commands);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-test-introduction-plan.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Test Introduction Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Verification maturity: ${maturity}

## Current Test Harness

- Test command: ${commands.test || 'not configured'}
- Build command: ${commands.build || 'not configured'}
- Lint/typecheck command: ${commands.lint || 'not configured'}

## Touched Surfaces

${formatList(dedupe(git.changedFiles.map(classifyTouchedSurface)))}

## Smallest Useful New Test

- Unit/characterization test:
- API/service smoke:
- UI/rendered smoke:
- Data/integration check:
- Manual QA only cap:

## Task-First Test Growth

- Target behavior:
- Smallest useful test now:
- Proposed test file/location:
- Command to run it:
- Why this test is worth adding:
- If not adding a test now, explicit cap:

## Recommendation

${formatList(testPlanRecommendations(maturity, git.changedFiles))}
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

function calibrateFlows(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true }).filter((row) => !row.parseError);
  const candidates = learnedFlowCandidates(rows);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Learned Flow Candidates

Date: ${new Date().toISOString()}
Repository: ${repo}
Rows inspected: ${rows.length}

## Candidates

${formatList(candidates)}

## Promotion Rule

- Do not create golden-flow scenarios from theory.
- Promote only repeated real task-flow signatures or high-cost misses.
- Human review is required before adding or changing route scenarios.
- Keep product-specific flow facts in repo/shared context docs; keep reusable process behavior in SDLC scenarios.
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
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
  const openPackets = packets.filter((packet) => !packet.completed && completionTrackedPacketKinds().includes(packet.kind));

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

function processHealth(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true }).filter((row) => !row.parseError);
  const packets = findPackets(repo, {});
  const caps = groupCounts(rows.flatMap((row) => normalizeArray(row.caps)));
  const routeFit = groupCounts(rows.map((row) => row.routeFit).filter(Boolean));
  const openPackets = packets.filter((packet) => !packet.completed && completionTrackedPacketKinds().includes(packet.kind));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Process Health

Date: ${new Date().toISOString()}
Repository: ${repo}
Calibration rows: ${rows.length}
Packets: ${packets.length}
Open packets: ${openPackets.length}

## Repeated Caps

${formatCounts(caps)}

## Route Fit Signals

${formatCounts(routeFit)}

## Open Packets

${formatList(openPackets.map((packet) => `${packet.kind}: ${relative(repo, packet.path)}`))}

## Suggested Improvements

${formatList(processProposals(caps, routeFit, [], [], []))}

## Learned Flow Candidates

${formatList(learnedFlowCandidates(rows))}
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
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
  const stack = detectStack(repo);
  const packageManager = detectPackageManager(repo);
  const testFrameworks = detectTestFrameworks(repo, packageJson);
  const ciSystems = detectCiSystems(repo);
  const deploySystems = detectDeploySystems(repo);

  const lines = [
    '# SDLC Setup Doctor',
    '',
    `Repository: ${repo}`,
    `Profile: ${profilePath}`,
    `Detected stack: ${stack.join(', ') || 'generic'}`,
    `Package manager: ${packageManager || 'not detected'}`,
    `Test framework hints: ${testFrameworks.join(', ') || 'not detected'}`,
    `CI hints: ${ciSystems.join(', ') || 'not detected'}`,
    `Deployment hints: ${deploySystems.join(', ') || 'not detected'}`,
    `Shared context reachable: ${sharedContextReachability(repo, profile.values)}`,
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
    '- Verification maturity: no automated tests / manual QA only / smoke tests / partial automated tests / mature CI',
    '- Release policy: local commit/push only after tests/build pass and human approval',
    '- Human approval gates: commit, push, dependency install, external service calls, destructive commands; merge/deploy/release actions are project-specific human processes',
    '- Approved tools: git, npm scripts, local browser/rendered inspection, SDLC helper',
    '- Blocked tools: credentialed production writes, destructive Git commands, dependency installs without approval',
    '- Sensitive data restrictions: no secrets, credentials, customer data, or private transcripts in tracked docs/evidence',
    '```',
    '',
    '## Stack Detection',
    '',
    ...stack.map((item) => `- ${item}`),
    ...(stack.length ? [] : ['- generic / no known stack markers detected']),
    '',
    '## Tooling Detection',
    '',
    `- Package manager: ${packageManager || 'not detected'}`,
    ...testFrameworks.map((item) => `- Test framework: ${item}`),
    ...(testFrameworks.length ? [] : ['- Test framework: not detected']),
    ...ciSystems.map((item) => `- CI: ${item}`),
    ...(ciSystems.length ? [] : ['- CI: not detected']),
    ...deploySystems.map((item) => `- Deploy/release indicator: ${item}`),
    ...(deploySystems.length ? [] : ['- Deploy/release indicator: not detected']),
    '',
    '## Shared Context Detection',
    '',
    ...sharedContextDetails(repo, profile.values),
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

function setupBootstrap(repo, options = {}) {
  mkdirSync(defaultRunsDir(repo), { recursive: true });
  const profilePath = join(repo, '.ai-local', 'sdlc-profile.md');
  const created = [];
  if (!existsSync(profilePath)) {
    profileInit(repo, { sharedContextRoot: options.sharedContextRoot || '' });
    created.push(relative(repo, profilePath));
  }

  for (const dir of ['.ai-local/sdlc-runs', '.ai-local/rendered']) {
    const path = join(repo, dir);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
      created.push(dir);
    }
  }

  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const stack = detectStack(repo);
  const setupPath = join(repo, '.ai-local', 'repository-setup.md');
  if (!existsSync(setupPath)) {
    const content = `# Repository Setup

Date: ${new Date().toISOString()}
Repository: ${repo}

## Detected Shape

- Stack: ${formatInlineList(stack)}
- Package manager: ${detectPackageManager(repo) || 'not detected'}
- Test frameworks: ${formatInlineList(detectTestFrameworks(repo, packageJson))}
- CI: ${formatInlineList(detectCiSystems(repo))}
- Deployment hints: ${formatInlineList(detectDeploySystems(repo))}

## Commands

- Test command: ${commands.test || 'not configured'}
- Build command: ${commands.build || 'not configured'}
- Lint/typecheck/format commands: ${commands.lint || 'not configured'}
- Rendered UI review command: ${commands.rendered || 'not configured'}

## Human-Controlled Boundaries

- Commit requires explicit human approval.
- Push requires explicit human approval.
- Merge/deploy/release/pipeline/file movement remains project-specific and human-controlled.
`;
    writeFileSync(setupPath, content, 'utf8');
    created.push(relative(repo, setupPath));
  }

  printObject({
    repository: repo,
    created: created.join(', ') || 'none; setup files already existed',
    recommendedNextCommand: 'sdlc setup doctor --fix-plan',
  });
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

function finalGate(repo, options = {}) {
  const task = options.task || '';
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  const hasQa = packets.some((packet) => packet.kind === 'qa-script');

  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    readyToCommit: open.length ? 'no' : 'yes, with explicit human approval only',
    readyToPush: open.length ? 'no' : 'only with explicit human approval',
    readyForQaHandoff: hasQa ? 'yes' : 'no',
    mergeDeployRelease: 'forbidden by SDLC default; use project-specific human process',
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc git packet',
  });
}

function gitPacket(repo, options = {}) {
  const gitInfo = getGitInfo(repo);
  const files = gitInfo.changedFiles;
  const packets = findPackets(repo, {});
  const latestImpact = packets.find((packet) => packet.kind === 'impact');
  const latestQa = packets.find((packet) => packet.kind === 'qa-script');
  const latestVerify = packets.find((packet) => packet.kind === 'developer-verification');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-git-action-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const proposedMessage = proposedCommitMessage(files, latestImpact);

  const content = `# SDLC Git Action Packet

Date: ${new Date().toISOString()}
Repository: ${repo}
Branch: ${gitInfo.branch || 'unknown'}
Upstream: ${gitInfo.upstream || 'not configured'}
Ahead/behind: ${gitInfo.behind} behind / ${gitInfo.ahead} ahead
Head: ${gitInfo.head || 'unknown'}
Status: ${gitInfo.status || 'clean'}

## Policy

- This packet prepares Git action evidence only.
- The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit requires explicit human approval.
- Push requires explicit human approval.
- Merge/deploy/release follows the project-specific human process.

## Proposed Commit

- Proposed message: ${proposedMessage}
- Include files:
${indentList(files)}
- Exclude/review before commit:

## Change Summary

- Impact packet: ${latestImpact ? relative(repo, latestImpact.path) : 'none'}
- QA script: ${latestQa ? relative(repo, latestQa.path) : 'none'}
- Developer verification: ${latestVerify ? relative(repo, latestVerify.path) : 'none'}
- Touched surfaces: ${formatInlineList(dedupe(files.map(classifyTouchedSurface)))}

## Approval Choices

- [ ] No action.
- [ ] Commit only.
- [ ] Commit and push.

## Push Target

- Remote/upstream: ${gitInfo.upstream || 'not configured'}
- Push cap/risk:

## Risks / Notes

- Dirty surfaces: ${formatInlineList(dedupe(files.map(classifyTouchedSurface)))}
- Human approval:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function gates(repo, options = {}) {
  const task = options.task || '';
  const gitInfo = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, gitInfo, packets);
  const openPackets = packets.filter((packet) => !packet.completed && completionTrackedPacketKinds().includes(packet.kind));

  printObject({
    repository: repo,
    task: task || 'not provided',
    dirtyStatus: formatInlineStatus(gitInfo.status),
    openPackets: openPackets.length,
    finalGateBlockers: open.length,
    suggestedNextCommand: open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc git packet',
  });

  console.log('\n## Open Final Gates\n');
  console.log(formatList(open));
  console.log('\n## Open Packets\n');
  console.log(formatList(openPackets.map((packet) => `${relative(repo, packet.path)} (${packet.kind})`)));
}

function handoffDraft(repo, options = {}) {
  const task = options.task || '';
  const gitInfo = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-handoff-draft.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Handoff Draft

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${gitInfo.branch || 'unknown'}
Head: ${gitInfo.head || 'unknown'}
Status: ${gitInfo.status || 'clean'}

## Summary

-

## Evidence Links

${formatList(packets.slice(0, 12).map((packet) => `${packet.kind}: ${relative(repo, packet.path)}`))}

## QA / Verification

- QA script:
- Developer verification:
- Known caps:

## Release / Merge / Deploy Policy

- This is a draft only.
- The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit and push require explicit human approval.
- Project-specific release, MR, AWS pipeline, manual compile, or manual file move processes remain human-controlled.

## Draft Text For MR / Handoff / Release Notes

### GitLab Merge Request Draft

**Summary**
-

**Verification**
-

**QA notes**
-

**Risk/caps**
-

> Do not create or merge the MR automatically. Paste/adapt only after human approval and project-specific branch policy review.

### QA Handoff Draft

Use this section for human QA testers. Keep it source-code-free and pasteable into the tracking ticket.

- Build/branch:
- Environment:
- Primary QA script:
- Regression areas:
- Test data/accounts:
- Known caps:

### Release Branch Note

- Target branch/process:
- Required approvals:
- Included repositories:
- Release order:
- Human-controlled merge/deploy step:

### AWS CodePipeline / CI Note

- Pipeline/job:
- Trigger policy:
- Expected artifact/build:
- Human-controlled trigger/deploy step:
- Rollback/contact:

### Manual Compile / File Move Note

- Compile/build command:
- Output/artifacts:
- Destination:
- Human-controlled copy/move step:
- Smoke check after move:

### What Changed

-

### How It Was Verified

-

### QA Script

-

### Risks / Caps

-
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
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
    changedFiles: status.split(/\r?\n/).filter(Boolean).map(parseStatusPath),
  };
}

function parseStatusPath(line) {
  const text = String(line);
  if (/^\?\? /.test(text)) return text.slice(3).trim();
  if (/^ [A-Z] /.test(text)) return text.slice(3).trim();
  if (/^[A-Z]  /.test(text)) return text.slice(3).trim();
  if (/^[A-Z] /.test(text)) return text.slice(2).trim();
  return text.trim();
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
      name: 'package upgrade maintenance',
      task: 'upgrade package versions for routine maintenance',
      expectedRoute: 'standard',
      expectedSecurityOverlay: true,
    },
    {
      name: 'third party integration',
      task: 'update third-party webhook integration error handling',
      expectedRoute: 'standard',
      expectedSecurityOverlay: true,
    },
    {
      name: 'database heavy change',
      task: 'update SQL data storage behavior and prepare QA data setup',
      expectedRoute: 'standard',
    },
    {
      name: 'no tests manual qa',
      task: 'implement a feature in a no automated tests repo requiring manual QA script',
      expectedRoute: 'standard',
    },
    {
      name: 'workspace multi repo status',
      task: 'inspect workspace with multiple dirty repositories before implementation',
      expectedRoute: 'multi-repo-integration',
    },
    {
      name: 'manual qa script',
      task: 'produce a markdown QA test script for YouTrack for this site change',
      expectedRoute: 'standard',
    },
    {
      name: 'manual smoke packet',
      task: 'manual smoke the changed checkout workflow before QA handoff',
      expectedRoute: 'standard',
    },
    {
      name: 'data packet needed',
      task: 'update SQL data storage behavior and capture a data packet',
      expectedRoute: 'standard',
    },
    {
      name: 'integration packet needed',
      task: 'update third-party webhook behavior and capture integration evidence',
      expectedRoute: 'standard',
      expectedSecurityOverlay: true,
    },
    {
      name: 'no automatic merge deploy',
      task: 'prepare final gate but do not merge deploy release or move code between branches',
      expectedRoute: 'release-push',
      expectedSecurityOverlay: true,
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

function contextFreshnessRow(repo, item, days) {
  if (!existsSync(item.path)) {
    return { label: item.label, status: 'missing', ageDays: '', path: relative(repo, item.path) || item.path };
  }
  const stats = statSync(item.path);
  const ageDays = Math.max(0, Math.floor((Date.now() - stats.mtimeMs) / 86400000));
  return {
    label: item.label,
    status: ageDays > days ? 'stale' : 'fresh',
    ageDays,
    path: relative(repo, item.path) || '.',
  };
}

function contextFreshnessRecommendations(existingRows, staleRows, profile) {
  const recommendations = [];
  if (!existingRows.length) recommendations.push('No context docs found; run setup bootstrap/doctor and create the smallest useful repo or shared context docs.');
  if (staleRows.length) recommendations.push(`Review stale docs before trusting them: ${staleRows.map((row) => row.label).join(', ')}.`);
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) recommendations.push('Configure external shared context root when this repository participates in larger multi-repo systems.');
  if (!recommendations.length) recommendations.push('Context docs are present and within the freshness window; still cross-check source files touched by the task.');
  return recommendations;
}

function detectContextContradictions(repo, profile, commands, docs, related) {
  const values = profile.values;
  const contradictions = [];
  const stack = detectStack(repo);
  if (values.testCommand && !commands.test) contradictions.push('Profile mentions a test command, but command discovery did not find a runnable test command.');
  if (values.buildCommand && !commands.build) contradictions.push('Profile mentions a build command, but command discovery did not find a runnable build command.');
  if (values.repositoryRole && String(values.repositoryRole).toLowerCase().includes('react') && !stack.includes('Node/TypeScript') && !stack.includes('Next.js')) contradictions.push('Profile/repo role suggests React, but no Node/TypeScript or Next markers were detected.');
  if (values.repositoryRole && String(values.repositoryRole).toLowerCase().includes('asp') && !stack.includes('ASP Classic')) contradictions.push('Profile/repo role suggests ASP Classic, but no ASP files were detected in the scan window.');
  if ((values.sharedContextRoot || values.productContext || values.repoContext) && !docs.some((item) => existsSync(item.path) && ['Shared context root', 'Product context', 'Repo context'].includes(item.label))) contradictions.push('External context is configured, but no configured shared/product/repo context path was reachable.');
  for (const item of related) {
    const path = resolve(repo, item);
    if (!existsSync(path)) contradictions.push(`Related repository path is configured but missing: ${item}.`);
  }
  if (!contradictions.length) contradictions.push('No obvious context contradictions detected.');
  return contradictions;
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
  if (matchesAny(text, ['multi-repo', 'multi repo', 'cross repo', 'multiple service', 'multiple repo', 'multiple repositories', 'workspace', 'release order'])) return 'multi-repo-integration';
  if (matchesAny(text, ['contract', 'interface', 'public api', 'sdk', 'cli flag', 'config format', 'event schema', 'message schema'])) return 'contract-first';
  if (matchesAny(text, ['release', 'push', 'deploy', 'merge']) || (text.includes('handoff') && !matchesAny(text, ['qa handoff', 'manual qa', 'test script']))) return 'release-push';
  if (matchesAny(text, ['review', 'inspect', 'audit'])) return 'review-only';
  if (matchesAny(text, ['user interface', 'render', 'layout', 'mobile', 'accessibility', 'button', 'screen', 'page', 'animation', 'animate', 'delay', 'turn feel', 'feels like a turn'])) return 'ui-rendered-review';
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
      area: 'commands',
      status: values.verificationMaturity ? 'ready' : 'partial',
      fix: 'record verification maturity so final gates can choose automated checks versus manual QA scripts',
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
    completed: /## (Review|Release|Developer Verification|QA Script|Manual Smoke) Completion/.test(text),
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
  if (text.includes('# SDLC Touched Surface Ledger')) return 'touched';
  if (text.includes('# SDLC Impact Packet')) return 'impact';
  if (text.includes('# SDLC Developer Verification Packet')) return 'developer-verification';
  if (text.includes('# QA Test Script:')) return 'qa-script';
  if (text.includes('# SDLC Manual Smoke Packet')) return 'manual-smoke';
  if (text.includes('# SDLC Task Ledger')) return 'task-ledger';
  if (text.includes('# SDLC Task Start Contract')) return 'task-start';
  if (text.includes('# SDLC Task Finish Decision')) return 'task-finish';
  if (text.includes('# SDLC Git Action Packet')) return 'git-action';
  if (text.includes('# SDLC Multi-Repo Packet')) return 'multi-repo';
  if (text.includes('# SDLC Contract Packet')) return 'contract';
  if (text.includes('# SDLC Data / Storage Packet')) return 'data';
  if (text.includes('# SDLC Integration Packet')) return 'integration';
  if (text.includes('# SDLC Test Introduction Plan')) return 'test-plan';
  if (text.includes('# SDLC Workspace Packet')) return 'workspace';
  if (text.includes('# SDLC Handoff Draft')) return 'handoff';
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
  if (kind === 'developer-verification') return 'verification';
  if (kind === 'qa-script') return 'qa-script';
  if (kind === 'manual-smoke') return 'manual-smoke';
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

function packetHas(text, needles) {
  const haystack = String(text || '').toLowerCase();
  return needles.some((needle) => haystack.includes(String(needle).toLowerCase()));
}

function doneChecksForRoute(route, gitInfo, packet) {
  const checks = [
    { name: 'Git status known', status: 'pass', detail: formatInlineStatus(gitInfo.status) },
  ];
  const text = packet?.text || '';
  const packetPath = packet ? relative(packet.repo, packet.path) : '';
  const hasCompletion = packet?.completed || packetHas(text, ['## Review Completion', '## Release Completion']);
  const hasChecks = packetHas(text, ['## Checks', '### Checks', 'Verification', 'command results', 'tests', 'git diff --check']);
  const hasCaps = packetHas(text, ['Caps', 'Evidence Gaps', 'cap']);
  const hasCalibration = packetHas(text, ['Calibration Command', 'Calibration Stub', 'sdlc calibrate add']);
  const hasContextUpdate = packetHas(text, ['Context Update', 'context update', 'docs/context', 'Memory Bank', 'context-state']);
  const hasSecurity = packetHas(text, ['Security Overlay', 'Security/tool triggers', 'Consent gates']);

  if (route === 'review-only') {
    checks.push(
      { name: 'Review packet exists', status: packet?.kind === 'review' ? 'pass' : 'open', detail: packetPath || 'missing review packet' },
      { name: 'Review completion exists', status: hasCompletion ? 'pass' : 'open', detail: hasCompletion ? 'completion appended' : 'run sdlc review complete' },
      { name: 'Findings or pass verdict recorded', status: packetHas(text, ['Findings', 'Verdict:']) ? 'pass' : 'open', detail: 'review must have findings or a clear pass verdict' },
      { name: 'Evidence gaps/caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'record missing evidence or explicit none' },
      { name: 'Calibration ready', status: hasCalibration ? 'pass' : 'open', detail: 'packet should include calibration command/stub' },
      { name: 'No edit route preserved', status: 'note', detail: 'confirm review did not mutate tracked files unless rerouted' },
    );
    return checks;
  }

  if (route === 'release-push') {
    checks.push(
      { name: 'Release packet exists', status: packet?.kind === 'release' ? 'pass' : 'open', detail: packetPath || 'missing release packet' },
      { name: 'Release completion exists', status: hasCompletion ? 'pass' : 'open', detail: hasCompletion ? `action: ${packet.action || 'unknown'}` : 'run sdlc release complete' },
      { name: 'Checks recorded', status: hasChecks ? 'pass' : 'open', detail: 'release must name checks or caps' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'release caps must be explicit' },
      { name: 'Human approval gate recorded', status: packet?.text.includes('Human approval') || packet?.text.includes('approval') ? 'pass' : 'open', detail: 'approval must be explicit before credentialed release action' },
      { name: 'Git action evidence recorded', status: packetHas(text, ['Git Action Evidence', 'No git or release action performed', 'exact command/result']) ? 'pass' : 'open', detail: 'record exact action or no-action evidence' },
      { name: 'Calibration ready', status: hasCalibration ? 'pass' : 'open', detail: 'packet should include calibration command/stub' },
    );
    return checks;
  }

  if (route === 'multi-repo-integration') {
    checks.push(
      { name: 'Multi-repo packet exists', status: packet?.kind === 'multi-repo' ? 'pass' : 'open', detail: packetPath || 'run sdlc multi packet' },
      { name: 'Related repositories listed', status: packetHas(text, ['Related Repositories']) ? 'pass' : 'open', detail: 'affected repositories must be listed or capped' },
      { name: 'Contracts/interfaces considered', status: packetHas(text, ['Contracts Or Interfaces']) ? 'pass' : 'open', detail: 'cross-repo contract surfaces must be named or capped' },
      { name: 'Release order considered', status: packet?.text.includes('Release order') ? 'pass' : 'open', detail: 'release order must be named or capped' },
      { name: 'Per-repo checklist present', status: packet?.text.includes('Per-Repo Checklist') ? 'pass' : 'open', detail: 'affected repos need per-repo checks' },
      { name: 'Stop gates recorded', status: packetHas(text, ['Stop Gates']) ? 'pass' : 'open', detail: 'multi-repo ownership/release gates must be visible' },
    );
    return checks;
  }

  if (route === 'contract-first') {
    checks.push(
      { name: 'Contract packet exists', status: packet?.kind === 'contract' ? 'pass' : 'open', detail: packetPath || 'run sdlc contract packet' },
      { name: 'Contract surfaces named', status: packetHas(text, ['Contract Surfaces']) ? 'pass' : 'open', detail: 'public/cross-boundary surfaces must be identified' },
      { name: 'Compatibility decision present', status: packet?.text.includes('Backward compatibility') ? 'pass' : 'open', detail: 'contract compatibility must be decided or capped' },
      { name: 'Producer/consumer ownership considered', status: packetHas(text, ['Producer/consumer ownership']) ? 'pass' : 'open', detail: 'ownership must be explicit or capped' },
      { name: 'Verification path named', status: packetHas(text, ['Verification', 'Test or contract verification path']) ? 'pass' : 'open', detail: 'contract verification path must be named or capped' },
      { name: 'Implementation is gated', status: packetHas(text, ['No implementation plan before', 'Stop Gates']) ? 'pass' : 'open', detail: 'implementation should not start before contract direction is clear' },
    );
    return checks;
  }

  if (route === 'ui-rendered-review') {
    checks.push(
      { name: 'Route or evidence packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Verification/checks recorded', status: hasChecks ? 'pass' : 'open', detail: 'tests/build/rendered checks or caps must be recorded' },
      { name: 'Rendered evidence considered', status: packet?.text.includes('render') || packet?.text.includes('screenshot') ? 'pass' : 'open', detail: 'run render smoke or record cap' },
      { name: 'Accessibility policy considered', status: packet?.text.includes('Accessibility') ? 'pass' : 'note', detail: 'accessibility remains optional unless profile/human requires it' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'render/accessibility caps must be explicit when skipped' },
      { name: 'Context update considered', status: hasContextUpdate ? 'pass' : 'note', detail: 'update feature/context docs only when durable UI truth changed' },
    );
    return checks;
  }

  if (route === 'bugfix-regression') {
    checks.push(
      { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Reproduction or expected behavior recorded', status: packetHas(text, ['reproduction', 'expected behavior', 'root cause', 'Regression']) ? 'pass' : 'open', detail: 'bugfix needs expected behavior and reproduction/root cause evidence' },
      { name: 'Regression verification recorded', status: packetHas(text, ['regression', 'test', 'Verification', 'Checks']) ? 'pass' : 'open', detail: 'bugfix needs regression check or explicit cap' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'missing reproduction/test caps must be explicit' },
      { name: 'Context update considered', status: hasContextUpdate ? 'pass' : 'note', detail: 'update context only if durable behavior changed' },
    );
    return checks;
  }

  if (route === 'weak-test-legacy') {
    checks.push(
      { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Mutation or negative check recorded', status: packetHas(text, ['mutation', 'negative check', 'failing assertion', 'expected failure']) ? 'pass' : 'open', detail: 'weak-test proof needs failing evidence or explicit cap' },
      { name: 'Restoration proof recorded', status: packetHas(text, ['restoration', 'restored', 'post-restore']) ? 'pass' : 'open', detail: 'temporary mutation must be restored cleanly' },
      { name: 'Coverage cap recorded', status: hasCaps || packetHas(text, ['coverage cap']) ? 'pass' : 'open', detail: 'test weakness/residual coverage must be explicit' },
    );
    return checks;
  }

  if (route === 'tiny-docs') {
    checks.push(
      { name: 'Diff hygiene recorded', status: packetHas(text, ['git diff --check', 'diff hygiene']) ? 'pass' : 'open', detail: 'tiny docs should at least pass diff hygiene' },
      { name: 'Source truth checked', status: packetHas(text, ['source truth', 'references', 'links', 'path search']) ? 'pass' : 'note', detail: 'check references when docs point to code/paths/URLs' },
      { name: 'No broad workflow required', status: 'note', detail: 'tiny docs may skip heavier packets when source truth is clear' },
    );
    return checks;
  }

  if (route === 'standard') {
    checks.push(
      { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Scope recorded', status: packetHas(text, ['Scope', 'Intent', 'Task']) ? 'pass' : 'open', detail: 'standard work needs a scoped claim' },
      { name: 'Checks recorded', status: hasChecks ? 'pass' : 'open', detail: 'tests/build/diff checks or explicit caps required' },
      { name: 'Security/tool triggers considered', status: hasSecurity ? 'pass' : 'note', detail: 'security overlay required when triggers exist' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'missing evidence must be explicit' },
      { name: 'Context update considered', status: hasContextUpdate ? 'pass' : 'note', detail: 'update docs only when durable truth changed' },
      { name: 'Calibration ready', status: hasCalibration ? 'pass' : 'open', detail: 'standard work should leave calibration command/stub' },
    );
    return checks;
  }

  checks.push(
    { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
    { name: 'Verification recorded', status: hasChecks ? 'pass' : 'open', detail: 'verification evidence or explicit cap required' },
    { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'missing evidence must be explicit' },
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

function taskType(task) {
  const text = String(task || '').toLowerCase();
  if (matchesAny(text, ['bug', 'fix', 'regression', 'broken', 'failure'])) return 'bugfix';
  if (matchesAny(text, ['upgrade', 'package', 'dependency', 'maintenance'])) return 'maintenance';
  if (matchesAny(text, ['optimize', 'performance', 'speed'])) return 'optimization';
  if (matchesAny(text, ['release', 'handoff', 'push'])) return 'release/handoff';
  if (matchesAny(text, ['review', 'audit', 'inspect'])) return 'review';
  return 'feature/change';
}

function expectedQaNeed(task, files, profile = {}) {
  const text = `${task} ${profile.verificationMaturity || ''}`.toLowerCase();
  if (matchesAny(text, ['no automated tests', 'manual qa', 'youtrack', 'qa script'])) return 'human QA Markdown script expected';
  if (files.some(needsManualQa)) return 'likely human QA or manual smoke';
  if (matchesAny(text, ['docs', 'readme'])) return 'usually no QA script unless behavior is affected';
  return 'decide after impact packet';
}

function taskLedgerRows(repo, packets) {
  const kinds = ['touched', 'impact', 'developer-verification', 'manual-smoke', 'qa-script', 'test-plan', 'data', 'integration', 'git-action'];
  return kinds.map((kind) => {
    const packet = packets.find((item) => item.kind === kind);
    return `| ${kind} | ${packet ? escapeCell(relative(repo, packet.path)) : 'missing'} | ${packet ? (completionTrackedPacketKinds().includes(kind) ? (packet.completed ? 'yes' : 'no') : 'n/a') : 'missing'} |`;
  });
}

function taskMetrics(repo, task, git, packets) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  return {
    changedFiles: git.changedFiles.length,
    touchedSurfaces: dedupe(git.changedFiles.map(classifyTouchedSurface)).length,
    packets: packets.length,
    completedTrackedPackets: packets.filter((packet) => completionTrackedPacketKinds().includes(packet.kind) && packet.completed).length,
    hasQaScript: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no',
    hasManualSmoke: packets.some((packet) => packet.kind === 'manual-smoke' && packet.completed) ? 'yes' : 'no',
    verificationMaturity: verificationMaturity(profile.values, commands),
    route: task ? inferRouteFromTask(task, git, profile.values) : 'unknown',
  };
}

function latestPacketPath(repo, packets, kind) {
  const packet = packets.find((item) => item.kind === kind);
  return packet ? relative(repo, packet.path) : 'missing';
}

function shouldSuggestTestPlan(repo, task, files) {
  const profile = loadProfile(repo);
  const maturity = verificationMaturity(profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')))).toLowerCase();
  return maturity.includes('manual qa') || maturity.includes('no automated') || files.some((file) => classifyTouchedSurface(file) === 'dependencies') || matchesAny(String(task || '').toLowerCase(), ['package', 'dependency', 'upgrade', 'missing test', 'no automated']);
}

function taskEvidenceSummary(repo, packets) {
  const latestByKind = dedupe(packets.map((packet) => packet.kind)).map((kind) => packets.find((packet) => packet.kind === kind));
  return latestByKind.slice(0, 12).map((packet) => `${packet.kind}: ${relative(repo, packet.path)}${completionTrackedPacketKinds().includes(packet.kind) ? ` (${packet.completed ? 'completed' : 'open'})` : ''}`);
}

function suggestedFinalGateCommand(gate, task) {
  if (gate.includes('touched')) return 'sdlc touched packet';
  if (gate.includes('impact')) return `sdlc impact packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('verification')) return `sdlc verify packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('QA')) return `sdlc qa script --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('smoke')) return `sdlc smoke packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('data')) return `sdlc data packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('integration')) return `sdlc integration packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('test introduction')) return `sdlc test plan --task "${escapeCommandArg(task || 'current task')}"`;
  return 'sdlc packet status';
}

function finalGateOpenItems(repo, task, gitInfo, packets) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  const maturity = verificationMaturity(profile.values, commands);
  const modes = detectWorkModes(repo, task, profile.values, gitInfo.changedFiles);
  const surfaces = dedupe(gitInfo.changedFiles.map(classifyTouchedSurface));
  const taskText = String(task || '').toLowerCase();
  const hasTouched = packets.some((packet) => packet.kind === 'touched');
  const hasImpact = packets.some((packet) => packet.kind === 'impact');
  const hasVerify = packets.some((packet) => packet.kind === 'developer-verification' && packet.completed);
  const hasQa = packets.some((packet) => packet.kind === 'qa-script');
  const hasSmoke = packets.some((packet) => packet.kind === 'manual-smoke' && packet.completed);
  const hasData = packets.some((packet) => packet.kind === 'data');
  const hasIntegration = packets.some((packet) => packet.kind === 'integration');
  const hasTestPlan = packets.some((packet) => packet.kind === 'test-plan');
  const manualQaMaturity = ['manual qa only', 'no automated tests'].some((item) => maturity.toLowerCase().includes(item));
  const requiresSmoke =
    manualQaMaturity ||
    surfaces.includes('frontend/UI') ||
    modes.includes('manual-QA-heavy') ||
    matchesAny(taskText, ['manual smoke', 'smoke test', 'no automated tests', 'manual qa']);
  const requiresData = surfaces.includes('database/storage') || modes.includes('database-heavy') || matchesAny(taskText, ['database', 'sql', 'data storage', 'migration']);
  const requiresIntegration = surfaces.includes('external integration') || modes.includes('integration-heavy') || matchesAny(taskText, ['third-party', 'third party', 'webhook', 'integration', 'external system']);
  const requiresTestPlan = manualQaMaturity || surfaces.includes('dependencies') || matchesAny(taskText, ['package', 'dependency', 'upgrade', 'no automated tests', 'missing tests']);
  const open = [];
  if (gitInfo.status && !hasTouched) open.push('touched packet missing for dirty work');
  if (task && !hasImpact) open.push('impact packet missing for scoped task');
  if (['mature CI', 'partial automated tests', 'smoke tests'].some((item) => maturity.toLowerCase().includes(item.toLowerCase())) && !hasVerify) open.push('developer verification packet completion missing or capped');
  if (manualQaMaturity && !hasQa) open.push('human QA Markdown script missing for manual-QA/no-tests workflow');
  if (!hasVerify) open.push('developer verification packet completion missing or capped');
  if (!hasQa && !manualQaMaturity) open.push('human QA Markdown script missing or explicitly not needed');
  if (requiresSmoke && !hasSmoke) open.push('manual smoke packet completion missing or capped');
  if (requiresData && !hasData) open.push('data packet missing for data/storage workflow');
  if (requiresIntegration && !hasIntegration) open.push('integration packet missing for external integration workflow');
  if (requiresTestPlan && !hasTestPlan) open.push('test introduction plan missing for no-tests/dependency workflow');
  return dedupe(open);
}

function qaSourceHints(repo, options = {}) {
  const hints = { scope: [], risks: [] };
  for (const key of ['fromImpact', 'impact']) {
    if (!options[key]) continue;
    const text = readPacketTextIfExists(repo, options[key]);
    hints.scope.push(...extractBulletsAfter(text, '## QA Coverage Areas'));
    hints.risks.push(...extractBulletsAfter(text, '## Risks, Unknowns, And Caps'));
  }
  for (const key of ['fromTouched', 'touched']) {
    if (!options[key]) continue;
    const text = readPacketTextIfExists(repo, options[key]);
    hints.scope.push(...extractTableColumn(text, 1).filter((item) => item && !['Surface', '---'].includes(item)).map((item) => `Validate touched surface: ${item}.`));
  }
  hints.scope = dedupe(hints.scope).slice(0, 12);
  hints.risks = dedupe(hints.risks).slice(0, 12);
  return hints;
}

function workspaceRepos(repo, options = {}) {
  const profile = loadProfile(repo);
  const repos = [{ label: basename(repo), path: repo }];
  const explicit = splitList(options.repos || options.paths);
  for (const item of explicit) repos.push({ label: item, path: resolve(repo, item) });
  for (const item of splitList(profile.values.relatedRepositories)) repos.push({ label: item, path: resolve(repo, item) });

  const workspacePath = options.workspace ? resolve(repo, options.workspace) : findWorkspaceFile(repo);
  if (workspacePath) {
    const workspace = readJsonIfExists(workspacePath);
    for (const folder of workspace?.folders || []) {
      if (folder.path) repos.push({ label: folder.name || folder.path, path: resolve(dirname(workspacePath), folder.path) });
    }
  }

  return dedupeRepos(repos);
}

function findWorkspaceFile(repo) {
  const files = readdirSync(repo).filter((file) => file.endsWith('.code-workspace'));
  return files.length ? join(repo, files[0]) : '';
}

function dedupeRepos(repos) {
  const seen = new Set();
  const out = [];
  for (const item of repos) {
    const path = resolve(item.path);
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ ...item, path });
  }
  return out;
}

function detectStack(repo) {
  const markers = [
    [existsAny(repo, ['package.json']), 'Node/TypeScript'],
    [existsAny(repo, ['deno.json', 'deno.jsonc', 'jsr.json']), 'Deno/JSR'],
    [existsAny(repo, ['next.config.js', 'next.config.mjs', 'next.config.ts']), 'Next.js'],
    [hasFileExt(repo, ['.sln', '.csproj', '.vbproj']), '.NET'],
    [hasFileExt(repo, ['.asp', '.asa']), 'ASP Classic'],
    [hasFileExt(repo, ['.sql']), 'SQL/database'],
    [existsAny(repo, ['Dockerfile', 'docker-compose.yml']) || existsSync(join(repo, '.github')), 'CI/deployment'],
  ];
  return markers.filter(([present]) => present).map(([, label]) => label);
}

function detectPackageManager(repo) {
  if (existsAny(repo, ['pnpm-lock.yaml'])) return 'pnpm';
  if (existsAny(repo, ['yarn.lock'])) return 'yarn';
  if (existsAny(repo, ['package-lock.json'])) return 'npm';
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) return 'deno';
  if (existsAny(repo, ['bun.lockb', 'bun.lock'])) return 'bun';
  if (existsAny(repo, ['packages.lock.json'])) return 'nuget';
  return '';
}

function detectTestFrameworks(repo, packageJson) {
  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const names = Object.keys(deps);
  const frameworks = [];
  if (names.includes('vitest')) frameworks.push('Vitest');
  if (names.includes('jest') || names.includes('@types/jest')) frameworks.push('Jest');
  if (names.includes('@playwright/test') || existsAny(repo, ['playwright.config.ts', 'playwright.config.js'])) frameworks.push('Playwright');
  if (names.includes('cypress') || existsAny(repo, ['cypress.config.ts', 'cypress.config.js'])) frameworks.push('Cypress');
  if (hasFileExt(repo, ['.csproj']) && projectFilesContain(repo, ['xunit', 'nunit', 'mstest'])) frameworks.push('.NET test project');
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) frameworks.push('Deno test');
  return dedupe(frameworks);
}

function detectCiSystems(repo) {
  const systems = [];
  if (existsSync(join(repo, '.github', 'workflows'))) systems.push('GitHub Actions');
  if (existsAny(repo, ['.gitlab-ci.yml'])) systems.push('GitLab CI');
  if (existsAny(repo, ['azure-pipelines.yml'])) systems.push('Azure Pipelines');
  if (existsAny(repo, ['buildspec.yml'])) systems.push('AWS CodeBuild/CodePipeline');
  if (existsAny(repo, ['Jenkinsfile'])) systems.push('Jenkins');
  return systems;
}

function detectDeploySystems(repo) {
  const systems = [];
  if (existsAny(repo, ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'])) systems.push('containerized deploy');
  if (existsAny(repo, ['buildspec.yml'])) systems.push('AWS build/deploy pipeline');
  if (existsAny(repo, ['serverless.yml', 'serverless.ts'])) systems.push('Serverless');
  if (existsAny(repo, ['vercel.json'])) systems.push('Vercel');
  if (existsAny(repo, ['netlify.toml'])) systems.push('Netlify');
  if (existsSync(join(repo, '.ebextensions'))) systems.push('Elastic Beanstalk');
  return systems;
}

function sharedContextReachability(repo, profile) {
  const paths = sharedContextPaths(repo, profile);
  if (!paths.length) return 'not configured';
  const reachable = paths.filter((item) => existsSync(item.path)).length;
  return `${reachable}/${paths.length}`;
}

function sharedContextDetails(repo, profile) {
  const paths = sharedContextPaths(repo, profile);
  if (!paths.length) return ['- Shared/product/repo context paths are not configured.'];
  return paths.map((item) => `- ${item.label}: ${existsSync(item.path) ? 'reachable' : 'missing'} (${item.display})`);
}

function sharedContextPaths(repo, profile) {
  return [
    ['sharedContextRoot', 'Shared context root'],
    ['productContext', 'Product context'],
    ['repoContext', 'Repo context'],
    ['productContextIndex', 'Product context index'],
    ['repoContextIndex', 'Repo context index'],
    ['serviceMap', 'Service map'],
    ['workflowMap', 'Workflow map'],
    ['releaseOrder', 'Release order'],
    ['knownFailureModes', 'Known failure modes'],
  ]
    .filter(([key]) => profile[key])
    .map(([key, label]) => {
      const path = resolveContextPath(repo, profile[key]);
      return { key, label, path, display: profile[key] };
    });
}

function projectFilesContain(repo, needles) {
  let scanned = 0;
  const lowerNeedles = needles.map((needle) => needle.toLowerCase());
  const visit = (dir, depth = 0) => {
    if (depth > 4 || scanned > 200) return false;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory() && visit(path, depth + 1)) return true;
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.csproj')) continue;
      scanned++;
      const text = readFileSync(path, 'utf8').toLowerCase();
      if (lowerNeedles.some((needle) => text.includes(needle))) return true;
    }
    return false;
  };
  return visit(repo);
}

function detectWorkModes(repo, task, profile = {}, files = []) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const stack = detectStack(repo);
  const modes = [];
  if (matchesAny(text, ['personal'])) modes.push('personal product');
  if (matchesAny(text, ['company', 'client', 'customer', 'production'])) modes.push('company/customer product');
  if (matchesAny(text, ['internal', 'admin'])) modes.push('internal tool');
  if (stack.includes('ASP Classic')) modes.push('legacy system');
  if (stack.includes('Node/TypeScript') || stack.includes('Deno/JSR') || stack.includes('Next.js')) modes.push('modern web/app package');
  if (files.some((file) => classifyTouchedSurface(file) === 'backend/API') || matchesAny(text, ['api', 'service'])) modes.push('API/service');
  if (files.some((file) => classifyTouchedSurface(file) === 'database/storage') || matchesAny(text, ['database', 'sql', 'data'])) modes.push('database-heavy');
  if (files.some((file) => classifyTouchedSurface(file) === 'external integration') || matchesAny(text, ['third-party', 'integration', 'webhook', 'vendor'])) modes.push('integration-heavy');
  if (matchesAny(text, ['qa', 'manual test', 'youtrack'])) modes.push('manual-QA-heavy');
  if (matchesAny(text, ['multi repo', 'multi-repo', 'cross repo'])) modes.push('multi-repo');
  return dedupe(modes);
}

function existsAny(repo, paths) {
  return paths.some((item) => existsSync(join(repo, item)));
}

function hasFileExt(repo, extensions) {
  let scanned = 0;
  const visit = (dir, depth = 0) => {
    if (depth > 4 || scanned > 5000) return false;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      scanned++;
      if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory() && visit(path, depth + 1)) return true;
      if (entry.isFile() && extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) return true;
    }
    return false;
  };
  return visit(repo);
}

function verificationMaturity(profile, commands) {
  return profile.verificationMaturity || inferVerificationMaturity(commands);
}

function readPacketTextIfExists(repo, value) {
  const path = resolve(repo, value);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function extractBulletsAfter(text, heading) {
  if (!text) return [];
  const start = text.indexOf(heading);
  if (start < 0) return [];
  const rest = text.slice(start + heading.length);
  const end = rest.search(/\n## /);
  const section = end >= 0 ? rest.slice(0, end) : rest;
  return section.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim()).filter(Boolean);
}

function extractTableColumn(text, columnIndex) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|') && line.includes('|'))
    .map((line) => line.split('|').map((cell) => cell.trim())[columnIndex + 1])
    .filter(Boolean);
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
  const add = (item) => {
    const normalized = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!plan.some((existing) => existing.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === normalized)) plan.push(item);
  };
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) add('Configure shared/product/repo context paths in `.ai-local/sdlc-profile.md`, using external storage when multiple repos need the same context.');
  if (!commands.test) add('Add or record the narrowest reliable test command.');
  if (!commands.build) add('Add or record build/typecheck command when the repo can support it.');
  if (!profile.verificationMaturity) add('Record verification maturity so final gates can choose automated checks versus manual QA scripts.');
  if (!profile.releasePolicy) add('Record release policy and approval gates before using release packets for push/deploy work.');
  if (!profile.approvedTools && !profile.blockedTools) add('Record approved/blocked tools and sensitive-data restrictions.');
  for (const gap of gaps) {
    if (['context', 'commands', 'release', 'security'].includes(gap.area)) continue;
    add(gap.fix);
  }
  return plan;
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

function learnedFlowCandidates(rows) {
  const validRows = rows.filter((row) => !row.parseError);
  const signatures = groupCounts(validRows.map((row) => flowSignature(row)).filter(Boolean));
  const candidates = signatures
    .filter(([, count]) => count >= 3)
    .map(([signature, count]) => `${signature} appeared ${count} times; consider promoting it into a golden-flow scenario after human review.`);
  if (!candidates.length) candidates.push('No repeated task-flow signature has enough evidence to promote into a golden-flow scenario yet.');
  return candidates;
}

function flowSignature(row) {
  const route = row.routeUsed || row.routePredicted || '';
  const checks = normalizeArray(row.checks).filter(Boolean).slice(0, 3).join('+');
  const caps = normalizeArray(row.caps).filter(Boolean).slice(0, 2).join('+');
  if (!route) return '';
  return [route, checks || 'no checks recorded', caps || 'no caps recorded'].join(' / ');
}

function completionTrackedPacketKinds() {
  return ['review', 'release', 'developer-verification', 'qa-script', 'manual-smoke'];
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

function formatInlineList(items) {
  return items.length ? items.join(', ') : 'none';
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

function classifyTouchedSurface(file) {
  const value = String(file || '').toLowerCase();
  if (/\.(asp|asa|aspx|ascx)$/.test(value)) return 'frontend/UI';
  if (/\.(tsx|jsx|css|scss|html|vue|svelte)$/.test(value)) return 'frontend/UI';
  if (/\.(cs|vb|fs|go|rs|java|kt|php|rb|py)$/.test(value)) return 'backend/API';
  if (/\.(sql)$/.test(value) || value.includes('migration') || value.includes('schema')) return 'database/storage';
  if (value.includes('contract') || value.includes('openapi') || value.includes('swagger') || value.includes('proto')) return 'contracts/interfaces';
  if (value.includes('integration') || value.includes('webhook') || value.includes('vendor') || value.includes('third')) return 'external integration';
  if (value.includes('package.json') || value.includes('package-lock') || value.includes('pnpm-lock') || value.includes('yarn.lock') || value.includes('deno.json')) return 'dependencies';
  if (value.includes('.env') || value.includes('config') || value.includes('appsettings') || value.includes('pipeline') || value.includes('docker')) return 'config/environment';
  if (/\.(test|spec)\./.test(value) || value.includes('__tests__') || value.includes('/tests/')) return 'tests';
  if (value.endsWith('.md') || value.includes('/docs/')) return 'docs/context';
  if (value.includes('/scripts/') || value.includes('/tools/') || value.includes('/bin/')) return 'scripts/tooling';
  if (value.includes('/dist/') || value.includes('/build/') || value.includes('/generated/')) return 'generated/build artifacts';
  return 'source/other';
}

function classifyRuntimeSurface(file) {
  const value = String(file || '').toLowerCase();
  if (/\.(asp|asa)$/.test(value)) return 'ASP Classic';
  if (/\.(cs|csproj|sln)$/.test(value)) return '.NET';
  if (/\.(sql)$/.test(value)) return 'SQL/database';
  if (value.includes('deno.json') || value.includes('jsr.json')) return 'Deno/JSR';
  if (value.includes('package.json') || /\.(ts|tsx|js|jsx)$/.test(value)) return 'Node/TypeScript';
  if (value.includes('next.config')) return 'Next.js';
  if (value.includes('docker') || value.includes('pipeline') || value.includes('workflow')) return 'deployment/tooling';
  return 'generic';
}

function needsManualQa(file) {
  return ['frontend/UI', 'backend/API', 'database/storage', 'external integration', 'contracts/interfaces', 'config/environment', 'dependencies'].includes(classifyTouchedSurface(file));
}

function impactAreas(task, files, profile = {}) {
  const text = `${task} ${profile.repositoryRole || ''}`.toLowerCase();
  const areas = [];
  if (files.some((file) => classifyTouchedSurface(file) === 'frontend/UI') || matchesAny(text, ['site', 'page', 'screen', 'ui', 'client', 'animation', 'game', 'turn', 'workflow', 'feature'])) areas.push('user-visible site/application workflow');
  if (files.some((file) => classifyTouchedSurface(file) === 'backend/API') || matchesAny(text, ['api', 'service', 'endpoint'])) areas.push('API/service behavior');
  if (files.some((file) => classifyTouchedSurface(file) === 'database/storage') || matchesAny(text, ['database', 'sql', 'data', 'storage'])) areas.push('data/storage behavior');
  if (files.some((file) => classifyTouchedSurface(file) === 'external integration') || matchesAny(text, ['third party', 'third-party', 'vendor', 'webhook', 'integration'])) areas.push('external integration behavior');
  if (files.some((file) => classifyTouchedSurface(file) === 'dependencies') || matchesAny(text, ['package', 'dependency', 'upgrade'])) areas.push('dependency/package behavior');
  if (!areas.length) areas.push('task-specific behavior to identify during implementation');
  return dedupe(areas);
}

function qaAreas(task, files) {
  const areas = impactAreas(task, files, {});
  const checks = areas.map((area) => `Validate ${area}.`);
  if (files.some((file) => classifyTouchedSurface(file) === 'config/environment')) checks.push('Validate environment/configuration-dependent behavior.');
  if (files.some((file) => classifyTouchedSurface(file) === 'dependencies')) checks.push('Run a regression smoke path for dependency/package upgrade side effects.');
  if (!checks.length) checks.push('Validate the changed behavior described in the task.');
  return dedupe(checks);
}

function changeGraphEdges(task, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const edges = [];
  const add = (from, relationship, to, evidence) => edges.push({ from, relationship, to, evidence });
  if (surfaces.includes('frontend/UI')) add('frontend/UI', 'drives or displays', 'user workflow', 'changed UI files or UI task language');
  if (surfaces.includes('backend/API')) add('user workflow', 'calls', 'API/service behavior', 'backend/API files changed');
  if (surfaces.includes('database/storage')) add('API/service behavior', 'reads or writes', 'data/storage', 'database/storage files or task language');
  if (surfaces.includes('external integration')) add('API/service behavior', 'exchanges data with', 'external provider/system', 'integration files or task language');
  if (surfaces.includes('contracts/interfaces')) add('producer', 'must remain compatible with', 'consumer contract', 'contract/interface files changed');
  if (surfaces.includes('dependencies')) add('runtime/tooling', 'can affect', 'startup/build/test/regression paths', 'dependency files changed');

  const text = String(task || '').toLowerCase();
  if (!edges.length && matchesAny(text, ['api', 'service'])) add('task', 'likely affects', 'API/service behavior', 'task language');
  if (!edges.length && matchesAny(text, ['database', 'sql', 'data'])) add('task', 'likely affects', 'data/storage', 'task language');
  if (!edges.length && matchesAny(text, ['third-party', 'webhook', 'integration'])) add('task', 'likely affects', 'external provider/system', 'task language');
  if (!edges.length && matchesAny(text, ['ui', 'site', 'page', 'react'])) add('task', 'likely affects', 'frontend/UI', 'task language');
  return edges;
}

function changeGraphImplications(graph, task, files) {
  const nodes = new Set(graph.flatMap((edge) => [edge.from, edge.to]));
  const implications = [];
  if (nodes.has('user workflow')) implications.push('QA script should name the primary user workflow and one nearby regression workflow.');
  if (nodes.has('API/service behavior')) implications.push('Developer verification should include the smallest API/service-level check or an explicit cap.');
  if (nodes.has('data/storage')) implications.push('Generate a data packet and define QA-safe test data/persistence checks.');
  if (nodes.has('external provider/system')) implications.push('Generate an integration packet and record sandbox/provider availability.');
  if (nodes.has('consumer contract')) implications.push('Generate a contract packet before implementation if compatibility is unclear.');
  if (nodes.has('startup/build/test/regression paths')) implications.push('Generate a test introduction plan for dependency or tooling work.');
  if (!implications.length && files.length === 0) implications.push('No changed files yet; use this graph after initial implementation or with explicit task surfaces.');
  if (!implications.length) implications.push('No extra graph implication detected; keep evidence scoped to the task.');
  return implications;
}

function qaDomainSections(task, files) {
  const text = String(task || '').toLowerCase();
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const sections = [];

  if (surfaces.includes('frontend/UI') || matchesAny(text, ['ui', 'site', 'page', 'screen', 'workflow', 'react'])) {
    sections.push(`### QA-003: UI / Browser Workflow

**Purpose:** Validate the visible workflow from a tester's point of view.

**Steps**
1. Open the affected page or workflow in the QA environment.
   - Expected: The page loads without visible errors.
2. Complete the changed action in the most common browser/device combination.
   - Expected: The visible state, copy, animation, and success/error behavior match the expected change.
3. Repeat on one secondary viewport or browser when practical.
   - Expected: The layout remains usable and no text overlaps or controls disappear.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('backend/API') || matchesAny(text, ['api', 'service', 'endpoint'])) {
    sections.push(`### QA-004: API-Backed Behavior

**Purpose:** Validate the user-visible result of the changed service/API path.

**Steps**
1. Perform the site/app action that calls the affected service.
   - Expected: The action succeeds and the user-visible result is correct.
2. Try a common validation or error case for the same action.
   - Expected: The site/app shows the expected error or fallback without an unexpected failure.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('database/storage') || matchesAny(text, ['database', 'sql', 'data', 'stored procedure'])) {
    sections.push(`### QA-005: Data Persistence

**Purpose:** Validate that changed data behavior is correct with safe QA data.

**Steps**
1. Create or update QA-safe data through the affected workflow.
   - Expected: The workflow saves the expected data.
2. Refresh, revisit, or search for the same record.
   - Expected: The saved data displays correctly and existing related data is unchanged.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('external integration') || matchesAny(text, ['third-party', 'third party', 'webhook', 'integration', 'vendor'])) {
    sections.push(`### QA-006: External Integration Observable Result

**Purpose:** Validate the integration result that QA can observe.

**Steps**
1. Confirm the sandbox/provider/test configuration is available.
   - Expected: QA has the required non-production integration path or a documented cap.
2. Trigger the affected integration behavior.
   - Expected: The site/app records the expected result, message, status, or fallback.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('dependencies') || matchesAny(text, ['package', 'dependency', 'upgrade'])) {
    sections.push(`### QA-007: Package / Maintenance Regression

**Purpose:** Smoke the most important workflows after a dependency or maintenance change.

**Steps**
1. Open the primary application page or startup workflow.
   - Expected: The application starts and loads normally.
2. Run one high-value existing workflow near the changed package/tooling area.
   - Expected: Existing behavior is unchanged.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  return sections.join('\n\n');
}

function smokeStepSuggestions(task, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const steps = ['Open or invoke the primary changed workflow and confirm the intended behavior.'];
  if (surfaces.includes('frontend/UI') || matchesAny(task.toLowerCase(), ['ui', 'screen', 'page', 'animation', 'game'])) {
    steps.push('Render the affected UI locally and inspect the changed state on desktop and a narrow/mobile viewport when practical.');
  }
  if (surfaces.includes('backend/API')) steps.push('Exercise the affected API/service path with the smallest available local or QA-safe request.');
  if (surfaces.includes('database/storage')) steps.push('Confirm changed data reads/writes with safe test data and record any migration/backfill cap.');
  if (surfaces.includes('external integration')) steps.push('Use a sandbox/mock path or record the exact external integration cap.');
  if (surfaces.includes('dependencies')) steps.push('Run the closest startup/build/test path to catch dependency upgrade regressions.');
  steps.push('Check the nearest unchanged workflow so QA receives one regression path, not only the happy path.');
  return dedupe(steps);
}

function renderedEvidencePlan(task, files, profile = {}) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const text = String(task || '').toLowerCase();
  const plan = [];
  if (profile.renderedUiReviewCommand) plan.push(`Use configured rendered UI command: ${profile.renderedUiReviewCommand}.`);
  if (surfaces.includes('frontend/UI') || matchesAny(text, ['ui', 'site', 'page', 'screen', 'react', 'asp classic'])) {
    plan.push('Start the local/dev server when available and approved.');
    plan.push('Inspect the affected workflow in a browser or record the exact browser-tool cap.');
    plan.push('Check a normal desktop width and one narrow/mobile width when layout can be affected.');
    plan.push('Capture screenshots or note why screenshots are unavailable.');
  }
  if (!plan.length) plan.push('Rendered evidence is not required unless the task affects visible UI.');
  return dedupe(plan);
}

function inferVerificationMaturity(commands) {
  if (commands.test && commands.build && commands.lint) return 'partial automated tests';
  if (commands.test) return 'smoke tests or partial automated tests';
  return 'manual QA only / no automated tests configured';
}

function testPlanRecommendations(maturity, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const recommendations = [];
  if (maturity.toLowerCase().includes('no automated') || maturity.toLowerCase().includes('manual qa')) {
    recommendations.push('Produce a human QA Markdown script and add the smallest future automated test around the touched behavior.');
  }
  if (surfaces.includes('backend/API')) recommendations.push('Prefer an API/service smoke or characterization test for the changed endpoint/service path.');
  if (surfaces.includes('frontend/UI')) recommendations.push('Prefer a rendered smoke check or focused UI interaction test for the changed workflow.');
  if (surfaces.includes('database/storage')) recommendations.push('Add a data/schema validation or migration smoke where practical.');
  if (surfaces.includes('external integration')) recommendations.push('Add a sandbox/mock integration check or record the unavailable integration cap.');
  if (surfaces.includes('dependencies')) recommendations.push('Prefer the smallest startup/build/regression smoke that would fail if the package upgrade broke the touched workflow.');
  if (surfaces.includes('frontend/UI') && surfaces.includes('backend/API')) recommendations.push('For mixed UI/API work, add one task-level test at the narrowest stable boundary and keep the rest as manual QA or smoke caps if the repo lacks harnesses.');
  if (!recommendations.length) recommendations.push('Run existing project checks and record why no new test is needed for this task.');
  return recommendations;
}

function proposedCommitMessage(files, impactPacket) {
  if (impactPacket?.text) {
    const task = firstMatch(impactPacket.text, /^Task:\s*(.+)$/m);
    if (task) return task.length > 72 ? task.slice(0, 69).trimEnd() + '...' : task;
  }
  const surfaces = dedupe(files.map(classifyTouchedSurface)).filter((item) => item !== 'source/other');
  if (surfaces.length === 1) return `Update ${surfaces[0]}`;
  if (files.length) return 'Update task implementation';
  return 'No tracked changes to commit';
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
