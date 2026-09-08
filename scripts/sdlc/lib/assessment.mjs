import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { dedupe, escapeCell, escapeCommandArg, fail, formatInlineList, formatInlineStatus, formatList, optionFiles, printObject, readJsonIfExists, safeWriteTextFile, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { behaviorChangeSignals, experienceImpactRequired, isExplicitlyLocalBehaviorTask, isExplicitlyMechanicalTask, securityTriggers } from './routes.mjs';
import { affectedUnits, detectStack, inferTestingSurfaces, matchesAny } from './units.mjs';
import { classifyTouchedSurface } from './surface.mjs';

export function verificationMaturity(profile, commands) {
  return profile.verificationMaturity || inferVerificationMaturity(commands);
}

export function inferVerificationMaturity(commands) {
  if (commands.test && commands.build && commands.lint) return 'partial automated tests';
  if (commands.test) return 'smoke tests or partial automated tests';
  return 'manual QA only / no automated tests configured';
}

function profileToken(value) {
  return Array.isArray(value) ? value.join(' ') : String(value || '');
}

export function detectWorkModes(repo, task, profile = {}, files = []) {
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

export function fastPassAssessment(repo, task, route, git, profile, units, surfaces, triggers) {
  const reasons = [];
  const files = git.changedFiles || [];
  const breadth = taskBreadthAssessment(task, files, surfaces);
  const related = splitList(profile.values.relatedRepositories);
  const riskyRoute = ['release-push', 'multi-repo-integration', 'contract-first', 'bugfix-live-system', 'weak-test-legacy'].includes(route);
  const securityLike = triggers.length > 0;
  const multiContext = related.length > 0 || units.length > 1 || dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)).length > 1;
  const irreversible = matchesAny(task, ['delete', 'drop', 'truncate', 'migrate production', 'deploy', 'release', 'merge', 'pipeline']);
  const docsOnly = files.length > 0 && files.every((file) => /\.(md|mdx|txt|adoc|rst)$/i.test(file));
  const localBehavior = isExplicitlyLocalBehaviorTask(task) && files.length === 1;
  const broadTask = breadth.level === 'broad' && !localBehavior;
  const explicitFastPath = docsOnly || isExplicitlyMechanicalTask(task) || localBehavior;
  const needsExperienceImpact = experienceImpactRequired({ task, route, files, surfaces });
  const eligible = explicitFastPath && (!needsExperienceImpact || localBehavior) && !riskyRoute && !securityLike && !multiContext && !irreversible && !broadTask && files.length <= 5;
  reasons.push(eligible ? 'Eligible: bounded work with direct proof and no risk or multi-context trigger.' : 'Not eligible for micro/tiny fast-pass.');
  if (!explicitFastPath) reasons.push('Task is not explicitly docs-only, mechanical, or bounded behavior with direct proof; normal route judgment is required.');
  if (needsExperienceImpact && !localBehavior) reasons.push('Observable behavior needs an outcome, connected-impact, and proof trace.');
  if (localBehavior) reasons.push('Local reversible behavior may stay Tiny because the task names direct focused proof.');
  if (riskyRoute) reasons.push(`Route ${route} needs normal preflight.`);
  if (securityLike) reasons.push(`Security/tool triggers present: ${triggers.join('; ')}.`);
  if (multiContext) reasons.push('Multiple repos, units, or context buckets require normal preflight.');
  if (irreversible) reasons.push('Task wording suggests irreversible/release/data action.');
  if (broadTask) reasons.push(`Task breadth is ${breadth.level}: ${breadth.signals.join('; ')}.`);
  if (files.length > 5) reasons.push(`Changed files count ${files.length} exceeds fast-pass threshold.`);
  if (surfaces.includes('rendered-product-ui')) reasons.push('Rendered UI work can still be fast-pass only with rendered/behavior evidence.');
  return { eligible, reasons };
}

export function taskBreadthAssessment(task, files = [], surfaces = []) {
  const text = String(task || '').toLowerCase();
  const signals = [];
  const broadPhrases = [
    'full game',
    'fuller product',
    'closer to a full',
    'more fully developed',
    'complete experience',
    'polish experience',
    'multiple improvements',
    'bring it more',
    'whole workflow',
    'end-to-end',
  ];
  const interactionPhrases = ['interactive', 'stateful', 'workflow', 'settings', 'mode', 'difficulty', 'animation', 'feedback', 'dashboard', 'wizard', 'multi-step', 'gameplay', 'turn'];
  if (matchesAny(text, broadPhrases)) signals.push('broad product/experience wording');
  if (matchesAny(text, interactionPhrases)) signals.push('interactive/stateful behavior');
  if (matchesAny(text, ['logic', 'rules', 'ai behavior', 'computer opponent', 'smart opponent'])) signals.push('domain logic or AI behavior');
  if (behaviorChangeSignals(task, files, surfaces).length) signals.push('observable behavior needs outcome/connected-impact/proof closure');
  if (matchesAny(text, ['qa', 'test plan', 'human tester', 'manual test'])) signals.push('QA/handoff expectation');
  const surfaceCount = dedupe(surfaces.filter(Boolean)).length;
  if (surfaceCount > 1) signals.push(`${surfaceCount} testing surfaces`);
  if (files.length > 5) signals.push(`${files.length} changed files`);
  const level = signals.length >= 2 || files.length > 5 ? 'broad' : signals.length === 1 ? 'moderate' : 'narrow';
  return { level, signals };
}

export function routeConfidence({ task, route, files, units, surfaces, profile, triggers }) {
  let score = 60;
  if (task) score += 10;
  if (route && route !== 'standard') score += 5;
  if (files.length) score += 5;
  if (units.length && units.every((unit) => unit.contextBucket && unit.testSurface)) score += 10;
  if (surfaces.length) score += 5;
  if (profile.path) score += 5;
  if (triggers.length) score -= 10;
  if (score >= 85) return 'high';
  if (score >= 65) return 'medium';
  return 'low';
}

export function qualityFloorRows({ task, git, units, surfaces, qaMode, packets }) {
  const hasVerificationPacket = packets.some((packet) => ['developer-verification', 'manual-smoke', 'route', 'review', 'release'].includes(packet.kind));
  const hasQa = packets.some((packet) => packet.kind === 'qa-script');
  const durableContextLikely = matchesAny(task, ['context', 'docs', 'learning', 'process', 'workflow', 'scenario', 'api contract', 'deployable unit']);
  const rows = [
    { item: 'Changed-files awareness', status: git.changedFiles.length || git.status === '' ? 'pass' : 'note', detail: `${git.changedFiles.length} changed file(s); status ${formatInlineStatus(git.status)}` },
    { item: 'One verification path', status: hasVerificationPacket ? 'pass' : 'open', detail: hasVerificationPacket ? 'evidence packet present' : 'run/check one relevant automated, manual, rendered, API, or data path' },
    { item: 'Surface-correct evidence', status: surfaces.length ? 'pass' : 'open', detail: surfaces.join(', ') || 'surface not detected' },
    { item: 'Context placement decision', status: durableContextLikely || units.some((unit) => unit.contextBucket) ? 'note' : 'open', detail: durableContextLikely ? 'durable context likely; decide bucket' : formatInlineList(units.map((unit) => unit.contextBucket).filter(Boolean)) || 'not configured' },
    { item: 'Human QA readiness', status: qaMode && (hasQa || !requiresHumanQa(task, surfaces)) ? 'note' : 'open', detail: requiresHumanQa(task, surfaces) ? 'QA Markdown needed when handing to testers' : 'QA optional for this route' },
    { item: 'Developer finish control', status: 'pass', detail: 'commit/push require approval; merge/deploy/release forbidden by default' },
    { item: 'Confidence summary', status: 'open', detail: 'include proved/inferred/human-judgment/safe-next-action at final response' },
  ];
  if (experienceImpactRequired({ task, files: git.changedFiles, surfaces })) rows.splice(3, 0, { item: 'Behavior impact', status: 'open', detail: 'state the observable outcome, material connected impact, and proof/recovery path' });
  return rows;
}

function requiresHumanQa(task, surfaces) {
  return matchesAny(task, ['qa', 'tester', 'youtrack', 'ticket', 'production issue']) || surfaces.some((surface) => ['rendered-product-ui', 'api-contract', 'data-persistence', 'integration-provider'].includes(surface));
}

export function formatQualityFloorTable(rows) {
  return `| Item | Status | Detail |
| --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.item)} | ${row.status} | ${escapeCell(row.detail)} |`).join('\n')}`;
}

export function safeDefaultsForPreflight(route, fast, profile) {
  return [
    fast.eligible ? 'Use inline fast-pass unless new risk appears.' : 'Use normal preflight packet before implementation.',
    'Do not commit or push without explicit human approval.',
    'Do not merge, deploy, release, create MR/PR, trigger pipeline, or move files between environments.',
    profile.accessibilityReviewPolicy ? `Accessibility policy: ${profile.accessibilityReviewPolicy}.` : 'Accessibility is optional unless profile/human requires it.',
    `Route ${route} uses the minimum evidence needed for the likely failure mode.`,
  ];
}

export function preflightProved(route, units, surfaces, git) {
  return [`route selected as ${route}`, `${units.length} affected unit candidate(s)`, `${surfaces.length || 1} testing surface candidate(s)`, `git status observed as ${formatInlineStatus(git.status)}`];
}

export function preflightInferred(route, qaMode) {
  return [`QA mode inferred as ${qaMode}`, `artifact budget inferred from route ${route}`];
}

export function preflightHumanJudgment(fast, triggers) {
  const items = [];
  if (!fast.eligible) items.push('confirm normal-route scope before implementation when ambiguity matters');
  if (triggers.length) items.push('approve or cap security/tool-triggered actions before use');
  items.push('approve commit/push choice at finish');
  return items;
}

export function confidenceBlock({ proved = [], inferred = [], human = [], nextAction = '' }) {
  return `### Proved

${formatList(proved)}

### Inferred

${formatList(inferred)}

### Needs Human Judgment

${formatList(human)}

### Safe Next Action

- ${nextAction || 'continue with the smallest route that satisfies the quality floor'}`;
}

export function validationLadderRows(task, surfaces = []) {
  const text = String(task || '').toLowerCase();
  const rows = [];
  const add = (surface, steps) => rows.push({ surface, steps });
  if (surfaces.includes('rendered-product-ui') || matchesAny(text, ['ui', 'screen', 'browser', 'rendered', 'interactive', 'game', 'dashboard', 'form'])) {
    add('UI / rendered product', ['browser/rendered automation', 'local dev server smoke', 'screenshot or manual rendered notes', 'build-only cap']);
  }
  if (surfaces.includes('api-contract') || matchesAny(text, ['api', 'swagger', 'openapi', 'endpoint', 'contract'])) {
    add('API / contract', ['automated API/integration test', 'Swagger/API-client smoke', 'contract/static review', 'build-only cap']);
  }
  if (matchesAny(text, ['cli', 'command line', 'terminal command'])) {
    add('CLI / command workflow', ['command execution test', 'golden output or snapshot', 'help/version command smoke', 'static review cap']);
  }
  if (surfaces.includes('background-job') || matchesAny(text, ['worker', 'job', 'queue', 'import', 'export', 'scheduled'])) {
    add('Backend job / worker', ['unit/integration test', 'local job dry-run', 'log/queue/data evidence', 'static review cap']);
  }
  if (surfaces.includes('data-persistence') || matchesAny(text, ['database', 'sql', 'migration', 'data'])) {
    add('Database / data', ['migration/schema test', 'read-only safe evidence', 'generated SQL/log review', 'manual DBA/developer cap']);
  }
  if (surfaces.includes('integration-provider') || matchesAny(text, ['webhook', 'provider', 'third-party', 'integration'])) {
    add('External integration', ['sandbox integration test', 'provider/API callback smoke', 'contract/log evidence', 'integration cap']);
  }
  if (surfaces.includes('docs-process') || matchesAny(text, ['docs', 'readme', 'process'])) {
    add('Docs / process', ['render/link/example check', 'source-truth comparison', 'reader-path review', 'docs-only cap']);
  }
  if (!rows.length) add('Generic service behavior', ['focused unit/integration test', 'build/typecheck', 'manual smoke', 'static review cap']);
  return rows;
}

export function formatValidationLadder(rows) {
  return rows.map((row) => `### ${row.surface}\n\n${row.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`).join('\n\n');
}

export function workmodeDetect(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const modes = deps.detectWorkModes(repo, task, profile.values, git.changedFiles);
  printObject({
    repository: repo,
    task: task || 'not provided',
    workModes: modes.join(', ') || 'generic',
    verificationMaturity: deps.verificationMaturity(profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')))),
    stack: detectStack(repo).join(', ') || 'generic',
    recommendedNextCommand: `sdlc impact packet --task "${escapeCommandArg(task || 'current task')}"`,
  });
}

export function routeFastPass(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile.values);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const route = options.route || inferRouteFromTaskForFastPass(task, git, profile.values, files);
  const triggers = securityTriggersForFastPass(task, profile.values);
  const base = fastPassAssessment(repo, task, route, { ...git, changedFiles: files }, profile, units, surfaces, triggers);
  const docsOnly = isDocsOnlyTask(task, files, surfaces);
  const mechanical = isExplicitlyMechanicalTask(task);
  const needsExperienceImpact = experienceImpactRequired({ task, route, files, surfaces });
  const blockedBy = [];
  if (!base.eligible) blockedBy.push(...base.reasons.filter((reason) => !reason.startsWith('Eligible:')));
  const localBehavior = isExplicitlyLocalBehaviorTask(task);
  if (!docsOnly && !mechanical && !localBehavior) blockedBy.push('Task is not explicitly docs-only, mechanical, or bounded local behavior with direct proof.');
  if (needsExperienceImpact && !localBehavior) blockedBy.push('Observable behavior requires outcome/connected-impact/proof closure.');
  if (files.length > 1 && !docsOnly) blockedBy.push('Multiple non-doc changed files require normal route judgment.');
  const eligible = blockedBy.length === 0;
  const requiredChecks = fastPassChecks({ route, docsOnly, localBehavior, files, surfaces });
  const result = {
    schema: 'sdlc.fast_pass.v1',
    task,
    repository: repo,
    eligible,
    route: eligible ? (docsOnly ? 'tiny-docs' : route) : route,
    reasons: eligible ? [...base.reasons, docsOnly ? 'Docs/process-only surface can use minimal deterministic checks.' : localBehavior ? 'Bounded local behavior has a direct focused proof path.' : 'Small mechanical scope can use deterministic checks before LLM review.'] : base.reasons,
    blockedBy: [...new Set(blockedBy)],
    requiredChecks,
    delegation: eligible ? 'none' : 'route-dependent',
    tokenGuidance: eligible ? 'Use deterministic checks and a short final handoff; do not spawn subagents unless new risk appears.' : 'Use normal SDLC context/evidence planning.',
  };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else renderFastPass(result);
  if (!eligible) process.exitCode = 1;
}

function inferRouteFromTaskForFastPass(task, git, profile, files) {
  if (files.length && files.every((file) => /\.(md|mdx|txt|adoc|rst)$/i.test(file))) return 'tiny-docs';
  if (isDocsOnlyTask(task, files, [])) return 'tiny-docs';
  return 'standard';
}

function securityTriggersForFastPass(task, profile) {
  return securityTriggers(task, profile).filter((trigger) => !/generated runtime adapter or skill surface/.test(trigger));
}

function isDocsOnlyTask(task, files, surfaces) {
  const text = String(task || '').toLowerCase();
  const taskDocs = matchesAny(text, ['docs', 'readme', 'markdown', 'typo', 'wording', 'comment only', 'comments only']);
  const fileDocs = files.length > 0 && files.every((file) => /\.(md|mdx|txt|adoc|rst)$/i.test(file) || /^docs\//.test(file));
  const surfaceDocs = surfaces.length > 0 && surfaces.every((surface) => ['docs-process', 'documentation'].includes(surface));
  return taskDocs || fileDocs || surfaceDocs;
}

function fastPassChecks({ route, docsOnly, localBehavior, files, surfaces }) {
  const checks = ['git diff --check'];
  if (docsOnly || route === 'tiny-docs' || surfaces.includes('docs-process')) checks.push('changed-file review');
  if (localBehavior) checks.push('focused behavior/regression check named by the task or repository');
  if (files.some((file) => /SKILL\.md$/.test(file))) checks.push('node scripts/test-skill-files.mjs');
  if (files.some((file) => /^templates\/adapters\//.test(file) || /^agents\//.test(file))) checks.push('node scripts/test-agent-contracts.mjs');
  return [...new Set(checks)];
}

function renderFastPass(result) {
  printObject({
    task: result.task,
    eligible: result.eligible,
    route: result.route,
    delegation: result.delegation,
    tokenGuidance: result.tokenGuidance,
  });
  console.log('\n## Reasons\n');
  console.log(formatList(result.reasons));
  console.log('\n## Blocked By\n');
  console.log(formatList(result.blockedBy));
  console.log('\n## Required Checks\n');
  console.log(formatList(result.requiredChecks));
}

export function validationLadder(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the validation ladder can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const rows = deps.validationLadderRows(task, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Validation Surface Ladder

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Detected surfaces: ${formatInlineList(surfaces)}

${deps.formatValidationLadder(rows)}

## Rule

Use the strongest available validation surface. If a stronger surface is unavailable, record the fallback and cap instead of claiming it passed.
`;
  if (outPath) {
    safeWriteTextFile(repo, outPath, content);
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function verify(repo, options = {}) {
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

function renderVerification(results) {
  const lines = ['# SDLC Verification', '', `Date: ${new Date().toISOString()}`, '', '| Check | Command | Result | Exit code |', '| --- | --- | --- | --- |'];
  for (const result of results) lines.push(`| ${result.key} | ${escapeCell(result.command || 'not configured')} | ${result.status} | ${result.code ?? ''} |`);
  return `${lines.join('\n')}\n`;
}
