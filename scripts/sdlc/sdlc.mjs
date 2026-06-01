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
  if (area === 'recipe' && action === 'show') return recipeShow(rest[0] || options.route);
  if (area === 'route' && action === 'start') return routeStart(repo, rest[0] || options.route, options);
  if (area === 'evidence' && action === 'init') return evidenceInit(repo, options);
  if (area === 'verify') return verify(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'calibrate' && action === 'add') return calibrateAdd(repo, options);
  if (area === 'calibrate' && action === 'summary') return calibrateSummary(repo, options);
  if (area === 'readiness') return readiness(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'setup' && action === 'doctor') return setupDoctor(repo);
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
  sdlc recipe show <route>
  sdlc route start <route> [--task "..."] [--repo <path>] [--out <path>]
  sdlc evidence init --route <route> [--repo <path>] [--out <path>]
  sdlc verify [--repo <path>] [--commands test,build]
  sdlc calibrate add --route <route> [--repo <path>] [--out <path>]
  sdlc calibrate summary [--repo <path>] [--in <path>] [--out <path>]
  sdlc readiness [--repo <path>]
  sdlc setup doctor [--repo <path>]
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

function setupDoctor(repo) {
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
      name: 'dirty release handoff',
      task: 'prepare release handoff and push the current branch',
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
      name: 'review only',
      task: 'review the existing diff without making edits',
      expectedRoute: 'review-only',
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
  if (matchesAny(text, ['multi-repo', 'multi repo', 'cross repo', 'service', 'contract', 'event', 'schema', 'api', 'release order'])) return 'multi-repo-integration';
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
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''} ${profile.sensitiveDataRestrictions || ''}`.toLowerCase();
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

function humanize(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatList(items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
