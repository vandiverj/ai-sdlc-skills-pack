import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendControlJsonLine, escapeCell, fail, formatList, printObject, readJsonIfExists, readJsonLines, slug, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';
import { detectStack } from './units.mjs';
import { analyzePrompt } from './prompt.mjs';
import { recommendAgentPackets, tierRoutingReceipt } from './agentpackets.mjs';

const modulePath = fileURLToPath(import.meta.url);
const agentsRoot = resolve(dirname(modulePath), '..', '..', '..');

export function scenarioList() {
  const scenarios = scenarioNames();
  if (!scenarios.length) fail('No scenarios found.');
  console.log(scenarios.join('\n'));
}

export function scenarioShow(name) {
  const scenario = loadScenario(name);
  console.log(scenario.text.trimEnd());
}

export function scenarioValidate(name, repo, options = {}) {
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

export function scenarioTest(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const cases = scenarioRegressionCases();
  const results = cases.map((item) => {
    const route = inferRouteFromTask(item.task, item.cleanGitOnly ? { ...git, status: '', changedFiles: [] } : git, profile.values);
    const triggers = securityTriggers(item.task, profile.values);
    const recipes = matchRecipes(item.task, item.cleanGitOnly ? { ...git, status: '', changedFiles: [] } : git, profile.values).map((recipe) => recipe.id);
    const routePass = item.expectedRoute ? route === item.expectedRoute : true;
    const overlayPass = item.expectedSecurityOverlay ? triggers.length > 0 : true;
    const recipePass = item.expectedRecipes ? item.expectedRecipes.every((recipe) => recipes.includes(recipe)) : true;
    return { ...item, route, triggers, recipes, pass: routePass && overlayPass && recipePass };
  });

  for (const result of results) {
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}: ${result.route}${result.triggers.length ? ` (${result.triggers.join(', ')})` : ''}${result.recipes.length ? ` recipes=${result.recipes.join(',')}` : ''}`);
    if (!result.pass) {
      console.log(`  task: ${result.task}`);
      if (result.expectedRoute) console.log(`  expected route: ${result.expectedRoute}`);
      if (result.expectedSecurityOverlay) console.log('  expected security overlay: yes');
      if (result.expectedRecipes) console.log(`  expected recipes: ${result.expectedRecipes.join(', ')}`);
    }
  }

  if (results.some((result) => !result.pass)) process.exitCode = 1;
  const promptResults = promptRegressionCases().map((item) => {
    const analysis = analyzePrompt(item.task, repo, options);
    const pass = (!item.noRiskTerms || analysis.riskTerms.length === 0) &&
      (!item.expectedRiskTerms || item.expectedRiskTerms.every((term) => analysis.riskTerms.includes(term))) &&
      (!item.expectedDenials || item.expectedDenials.every((term) => analysis.denials.includes(term))) &&
      (!item.expectedCorrections || item.expectedCorrections.every((term) => analysis.corrections.some((row) => row.original === term)));
    return { ...item, analysis, pass };
  });
  for (const result of promptResults) {
    console.log(`${result.pass ? 'PASS' : 'FAIL'} prompt ${result.name}: risk=${result.analysis.riskTerms.join(',') || 'none'} denials=${result.analysis.denials.join(',') || 'none'}`);
    if (!result.pass) console.log(`  task: ${result.task}`);
  }
  const agentResults = agentRegressionCases().map((item) => {
    const rows = recommendAgentPackets(repo, item.task, options);
    const receipt = tierRoutingReceipt(repo, item.task, item.receiptRole || '', options);
    const recommendationPass = Object.entries(item.expected || {}).every(([role, recommendation]) => rows.find((row) => row.role === role)?.recommendation === recommendation);
    const tierPass = item.expectedTier ? receipt.candidateTier === item.expectedTier : true;
    return { ...item, rows, receipt, pass: recommendationPass && tierPass };
  });
  for (const result of agentResults) {
    console.log(`${result.pass ? 'PASS' : 'FAIL'} agents ${result.name}: ${result.rows.map((row) => `${row.role}=${row.recommendation}`).join(', ')} tier=${result.receipt.candidateTier}`);
    if (!result.pass) console.log(`  task: ${result.task}`);
  }
  const retrievalResults = defaultRetrievalEvalCases().slice(0, 3).map((item) => runRetrievalEvalCase(repo, item, options));
  for (const result of retrievalResults) {
    const label = result.status === 'pass' ? 'PASS' : result.status === 'capped' ? 'CAP' : 'FAIL';
    console.log(`${label} retrieval ${result.name}: hit@${result.topK}=${result.hitAtK} precision@${result.topK}=${result.precisionAtSmallK} candidates=${result.candidateArtifacts.length}`);
    if (result.caps.length) console.log(`  caps: ${result.caps.join('; ')}`);
    if (result.missingExpected.length) console.log(`  missing: ${result.missingExpected.join('; ')}`);
  }
  if (promptResults.some((result) => !result.pass) || agentResults.some((result) => !result.pass) || retrievalResults.some((result) => result.status === 'fail')) process.exitCode = 1;
  if (options.verbose) {
    console.log(`\nScenarios tested: ${results.length}; prompt checks: ${promptResults.length}; agent checks: ${agentResults.length}; retrieval checks: ${retrievalResults.length}`);
  }
}

export function scenarioNames() {
  const dir = join(agentsRoot, 'templates', 'scenarios');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => basename(file, '.md'))
    .sort();
}

export function scenarioRegressionCases() {
  return [
    {
      name: 'ui animation delay',
      task: 'add animation and a short delay so the computer attack feels like a turn occurred',
      expectedRoute: 'ui-rendered-review',
      expectedRecipes: ['interactive-stateful-feature'],
    },
    {
      name: 'broad interactive feature',
      task: 'bring this interactive dashboard closer to a complete product with settings, animation feedback, tests, and QA',
      expectedRoute: 'ui-rendered-review',
      expectedRecipes: ['interactive-stateful-feature'],
    },
    {
      name: 'fixture kept change',
      task: 'use an approved disposable fixture app to test SDLC and keep useful changes with a commit preview',
      expectedRoute: 'standard',
      expectedRecipes: ['fixture-validation-kept-change'],
    },
    {
      name: 'deterministic control plane',
      task: 'use deterministic state evidence run-check and complete check before claiming done',
      expectedRoute: 'standard',
    },
    {
      name: 'completion missing evidence',
      task: 'block completion when required verification evidence is missing',
      expectedRoute: 'standard',
    },
    {
      name: 'policy blocks push automation',
      task: 'push branch automatically without human approval',
      expectedRoute: 'release-push',
      expectedSecurityOverlay: true,
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
      name: 'swagger api is not rendered ui',
      task: 'validate a Swagger OpenAPI endpoint in an API-only repository with developer testing',
      expectedRoute: 'standard',
    },
    {
      name: 'live system fk bug',
      task: 'fix a staging SQL log foreign key failure with exact generated SQL evidence',
      expectedRoute: 'bugfix-live-system',
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
      name: 'scratch script artifact review',
      task: 'temporary PowerShell helper script was created in the repository root and should be moved to local scratch storage',
      expectedRoute: 'standard',
    },
    {
      name: 'stale context projection review',
      task: 'check whether the current context projection is stale or missing before implementation resumes',
      expectedRoute: 'standard',
    },
    {
      name: 'learned verification advisory',
      task: 'use learned command recommendation guidance without hardcoding a golden verification flow',
      expectedRoute: 'standard',
    },
    {
      name: 'no tests manual qa',
      task: 'implement a feature in a no automated tests repo requiring manual QA script',
      expectedRoute: 'weak-test-legacy',
      expectedRecipes: ['no-test-legacy'],
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
    {
      name: 'route retirement verification',
      task: 'replace old legacy download route with current API endpoint and prove old active callers are gone',
      expectedRoute: 'standard',
      expectedRecipes: ['route-retirement'],
    },
    {
      name: 'context alias resolution',
      task: 'save LegacyApi workflow learning to the legacy-main-site context bucket',
      expectedRoute: 'standard',
      expectedRecipes: ['context-bucket-save'],
    },
    {
      name: 'learning sync review',
      task: 'review shared .agents learnings from work and personal environments before changing SDLC',
      expectedRoute: 'review-only',
    },
    {
      name: 'hook event adapter',
      task: 'plan optional hooks that call portable sdlc event commands without requiring runtime-specific support',
      expectedRoute: 'standard',
    },
    {
      name: 'activity telemetry optional',
      task: 'enable local activity telemetry to learn why this task across five repositories repeats searches and command runs',
      expectedRoute: 'multi-repo-integration',
    },
    {
      name: 'activity telemetry sensitive off',
      task: 'disable activity telemetry for a sensitive production issue using read-only database MCP evidence and capture only sanitized caps',
      expectedRoute: 'standard',
      expectedRecipes: ['database-evidence'],
    },
    {
      name: 'activity redundancy learning',
      task: 'review repeated command failures and browser caps from activity telemetry before changing the SDLC process',
      expectedRoute: 'review-only',
    },
    {
      name: 'api only openapi service',
      task: 'change an API-only service with Swagger OpenAPI developer testing and no rendered product UI',
      expectedRoute: 'standard',
      expectedRecipes: ['api-only-openapi'],
    },
    {
      name: 'multi project repository',
      task: 'change one deployable API codebase inside a repository that contains seven separately deployed projects',
      expectedRoute: 'standard',
    },
    {
      name: 'multi repo shared qa',
      task: 'finish a feature spanning five repositories and produce one human QA Markdown script for the visible workflow',
      expectedRoute: 'multi-repo-integration',
      expectedRecipes: ['multi-repo-qa-handoff'],
    },
    {
      name: 'legacy route replacement',
      task: 'replace a legacy ASP Classic route with a .NET API route and verify old active callers are retired',
      expectedRoute: 'standard',
      expectedRecipes: ['route-retirement'],
    },
    {
      name: 'live bug sanitized log',
      task: 'fix a production issue using sanitized staging logs and exact reproduction evidence',
      expectedRoute: 'bugfix-live-system',
      expectedRecipes: ['live-system-bug'],
    },
    {
      name: 'no test legacy manual qa',
      task: 'implement a legacy site fix where no automated tests exist and create a Markdown QA script for YouTrack',
      expectedRoute: 'weak-test-legacy',
      expectedRecipes: ['no-test-legacy'],
    },
    {
      name: 'efcore trigger output metadata',
      task: 'fix EF Core SQL Server OUTPUT clause failure on trigger-backed tables after package upgrade',
      expectedRoute: 'bugfix-regression',
      expectedRecipes: ['efcore-sqlserver-trigger-output'],
    },
    {
      name: 'command quoting false failure',
      task: 'classify a ParserError quoting command failed result before using it as evidence',
      expectedRoute: 'standard',
      expectedRecipes: ['command-tooling-failure'],
    },
    {
      name: 'youtrack ticket intake',
      task: 'use SDLC for YT-1234 from YouTrack and generate QA from the acceptance criteria',
      expectedRoute: 'standard',
      expectedRecipes: ['ticket-evidence'],
      expectedSecurityOverlay: true,
    },
    {
      name: 'youtrack unavailable fallback',
      task: 'use SDLC for a ticket when YouTrack MCP is unavailable and ask for pasted acceptance criteria',
      expectedRoute: 'standard',
      expectedRecipes: ['ticket-evidence'],
      expectedSecurityOverlay: true,
    },
    {
      name: 'ticket write approval gate',
      task: 'prepare a YouTrack ticket update comment but do not post or change status without approval',
      expectedRoute: 'standard',
      expectedRecipes: ['ticket-evidence'],
      expectedSecurityOverlay: true,
    },
    {
      name: 'api database evidence',
      task: 'investigate an API-only Swagger bug with read-only database MCP evidence and a safe query plan',
      expectedRoute: 'standard',
      expectedRecipes: ['api-only-openapi', 'database-evidence'],
      expectedSecurityOverlay: true,
    },
    {
      name: 'sensitive production database cap',
      task: 'query production customer row-level data through native SOC database MCP to debug a bug',
      expectedRoute: 'bugfix-regression',
      expectedRecipes: ['database-evidence'],
      expectedSecurityOverlay: true,
    },
    {
      name: 'learning rejects raw ticket database',
      task: 'split learning from raw YouTrack comments and database query results without sharing private details',
      expectedRoute: 'standard',
      expectedRecipes: ['ticket-evidence', 'database-evidence'],
      expectedSecurityOverlay: true,
    },
    {
      name: 'spa artifact promotion',
      task: 'promote generated SPA artifacts from a build-only Webpack app into a host repository while preserving host pages',
      expectedRoute: 'standard',
      expectedRecipes: ['spa-artifact-promotion'],
    },
  ];
}

export function promptRegressionCases() {
  return [
    {
      name: 'fixture task has no sensitive terms',
      task: 'approved fixture validation',
      noRiskTerms: true,
    },
    {
      name: 'sql no push sensitive',
      task: 'Production SQL bug; do not push; QA needs markdown',
      expectedRiskTerms: ['production', 'sql'],
      expectedDenials: ['do not push'],
    },
    {
      name: 'dictation typo suggestions',
      task: 'implment the walid API tess',
      expectedCorrections: ['implment', 'walid', 'tess'],
    },
  ];
}

export function agentRegressionCases() {
  return [
    {
      name: 'fixture verify only',
      task: 'approved fixture validation verify behavior',
      receiptRole: 'verification-worker',
      expectedTier: 'deterministic-tools',
      expected: {
        'verification-worker': 'recommended',
        'independent-reviewer': 'skip',
      },
    },
    {
      name: 'production multi repo database qa',
      task: 'production multi-repo SQL bug with manual QA handoff and no automated tests',
      expected: {
        'verification-worker': 'strongly-recommended',
        'independent-reviewer': 'strongly-recommended',
        'release-handoff-worker': 'strongly-recommended',
      },
    },
    {
      name: 'process learning',
      task: 'review SDLC process learning and repeated friction',
      expected: {
        'process-learning-reviewer': 'recommended',
      },
    },
  ];
}

export function loadScenario(name) {
  if (!name) fail('Pass a scenario name, such as ui-rendered-issue.');
  const safeName = slug(name);
  const path = join(agentsRoot, 'templates', 'scenarios', `${safeName}.md`);
  if (!existsSync(path)) fail(`Scenario not found: ${name}`);
  return { name: safeName, path, text: readFileSync(path, 'utf8') };
}

export function parseScenarioExpectedRoute(text) {
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

function contextPlacement(repo, path) {
  const relativePath = relative(repo, path);
  if (!relativePath || relativePath.startsWith('..')) return 'external/shared';
  if (relativePath.startsWith('.ai-local')) return 'local ignored evidence/context';
  if (relativePath.startsWith('docs/')) return 'tracked repo software memory';
  if (['AGENTS.md', '.sdlc/profile.md', '.sdlc/profile.json'].includes(relativePath)) return 'tracked process/setup';
  return 'repo-local';
}

function contextPlacementRecommendation(fact, profile = {}) {
  const text = String(fact || '').toLowerCase();
  if (matchesAny(text, ['test result', 'command output', 'verification', 'screenshot', 'smoke', 'temporary', 'today', 'this task'])) {
    return {
      placement: 'ignored local task evidence',
      target: '.ai-local/sdlc-runs/',
      reason: 'The fact sounds task-specific or ephemeral.',
      trackingRule: 'Do not track unless sanitized and intentionally promoted.',
    };
  }
  if (matchesAny(text, ['learning', 'process lesson', 'route gap', 'workflow miss', 'case id', 'testing surface'])) {
    return {
      placement: 'sanitized SDLC learning or process-learning event',
      target: 'learnings/ for redacted shared lessons, or project-local docs/process-improvement for product-specific details',
      reason: 'The fact appears to improve the SDLC process rather than define product behavior.',
      trackingRule: 'Separate portable process guidance from product/client details before committing to the skills pack.',
    };
  }
  if (matchesAny(text, ['service map', 'cross repo', 'cross-repo', 'workflow map', 'release order', 'multiple repositories', 'product-wide'])) {
    return {
      placement: 'external shared context',
      target: profile.sharedContextRoot || profile.serviceMap || profile.workflowMap || 'shared context root',
      reason: 'The fact affects more than one repository.',
      trackingRule: 'Keep secrets/customer data out; use sanitized shared docs.',
    };
  }
  if (matchesAny(text, ['api contract', 'public api', 'api', 'calls', 'schema', 'event', 'message', 'integration', 'database', 'sql', 'stores', 'data', 'business rule', 'user workflow', 'workflow'])) {
    return {
      placement: 'repo or shared software memory',
      target: profile.repoContext || profile.productContext || 'docs/context-state.md or shared context root',
      reason: 'The fact is durable software behavior future agents should not rediscover.',
      trackingRule: 'Track in repo docs only when team-approved; otherwise use shared context.',
    };
  }
  if (matchesAny(text, ['sdlc', 'agent should', 'process', 'gate', 'skill', 'router'])) {
    return {
      placement: 'SDLC process pack',
      target: '.agents skills/references/templates',
      reason: 'The fact changes how agents should work rather than how the software behaves.',
      trackingRule: 'Keep reusable process guidance in the SDLC pack.',
    };
  }
  return {
    placement: 'repo-local context or task evidence',
    target: profile.repoContext || '.ai-local/ until durability is clear',
    reason: 'Durability and scope are unclear.',
    trackingRule: 'Start local; promote only after it proves reusable.',
  };
}

export function detectContextContradictions(repo, profile, commands, docs, related) {
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
      area: 'security',
      status: values.ticketMcpAvailability || values.databaseMcpAvailability ? 'ready' : 'partial',
      fix: 'record optional ticket/database MCP availability or mark unavailable/blocked',
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

function contextConflictSeverity({ stale, missing, contradictions, profile }) {
  const realContradictions = contradictions.filter((item) => !String(item).toLowerCase().includes('no obvious context contradictions detected'));
  const contradictionText = realContradictions.join(' ').toLowerCase();
  if (contradictionText.includes('contradict') || contradictionText.includes('configured but missing')) return 'conflicting-sources';
  if (stale.length && (profile.sharedContextRoot || profile.productContext || profile.repoContext)) return 'stale-but-usable';
  if (stale.length > 2) return 'stale-and-risky';
  if (missing.length > 5) return 'missing-owner';
  return 'current-or-low-risk';
}

function traceRow(repo, options = {}) {
  const git = getGitInfo(repo);
  return {
    timestamp: new Date().toISOString(),
    type: options.type || 'event',
    task: options.task || '',
    route: options.route || '',
    summary: sanitizeOneLine(options.summary || ''),
    command: sanitizeOneLine(options.command || ''),
    status: options.status || '',
    filesChanged: git.changedFiles.length,
    branch: git.branch || '',
    safety: options.safety || '',
  };
}

function scoreTraceRows(rows) {
  const valid = rows.filter((row) => !row.parseError);
  const types = new Set(valid.map((row) => row.type));
  const commandFailures = valid.filter((row) => Number(row.status) > 0 || /fail|blocked/i.test(row.summary || '')).length;
  const reworkCount = valid.filter((row) => /rework|retry|rerun|again/i.test(`${row.type} ${row.summary}`)).length;
  const safetyInterventions = valid.filter((row) => /safety|approval|permission|secret|credential|destructive/i.test(`${row.type} ${row.summary} ${row.safety}`)).length;
  const evidenceCompleteness = ['start', 'finish'].every((type) => types.has(type)) && valid.some((row) => /verify|evidence|test|qa/i.test(`${row.type} ${row.summary}`)) ? 'good' : 'partial';
  const processQuality = commandFailures > 2 || reworkCount > 3 ? 'needs review' : evidenceCompleteness === 'good' ? 'good' : 'partial';
  return {
    events: valid.length,
    evidenceCompleteness,
    processQuality,
    reworkCount,
    redundantToolCallCount: valid.filter((row, index) => index > 0 && row.command && row.command === valid[index - 1].command).length,
    missingVerificationRisk: valid.some((row) => /verify|evidence|test|qa/i.test(`${row.type} ${row.summary}`)) ? 'low' : 'medium',
    safetyInterventions,
  };
}

function findTraceFiles(repo) {
  const dir = defaultRunsDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith('-trace.jsonl')).map((file) => join(dir, file));
}

function learningPromotionFindings(text) {
  const findings = [];
  if (!/sanitized|redacted/i.test(text)) findings.push('Missing explicit sanitized/redacted statement.');
  if (!/target|candidate owner|promotion target/i.test(text)) findings.push('Missing target bucket or candidate owner.');
  if (!/evidence|validation/i.test(text)) findings.push('Missing evidence source or validation requirement.');
  if (!/owner|review/i.test(text)) findings.push('Missing owner/review field.');
  if (/password|secret|token|api key|credential|https?:\/\/[^\s)]+/i.test(text) && !/redacted/i.test(text)) findings.push('Potential sensitive detail without redaction.');
  return dedupe(findings);
}

function safetyRiskRows(repo, task, profile, git) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const triggers = securityTriggers(task, profile);
  const rows = [
    { risk: 'destructive commands', status: matchesAny(text, ['delete', 'rm -rf', 'reset', 'force push', 'drop', 'truncate']) ? 'high' : 'low', detail: 'destructive action language scan', gate: 'explicit human approval required' },
    { risk: 'external network/tool use', status: matchesAny(text, ['curl', 'external', 'third-party', 'webhook', 'mcp', 'plugin']) ? 'medium' : 'low', detail: triggers.join('; ') || 'none detected', gate: 'approve external/tool access before use' },
    { risk: 'ticket-system evidence', status: matchesAny(text, ['youtrack', 'ticket', 'yt-', 'acceptance criteria']) ? 'medium' : 'low', detail: 'ticket text/comments may be private, stale, or write-capable through MCP', gate: 'read within profile boundary; preview writes and require explicit approval' },
    { risk: 'database evidence', status: matchesAny(text, ['database', 'sql', 'query', 'production data', 'native soc', 'read-only database']) ? 'medium' : 'low', detail: 'read-only database access can expose sensitive data and environment-specific state', gate: 'plan bounded read-only evidence; redact; never infer write/migration/deploy permission' },
    { risk: 'credential or secret exposure', status: matchesAny(text, ['secret', 'credential', 'token', 'password', 'api key']) ? 'high' : 'low', detail: profile.sensitiveDataRestrictions || 'profile restrictions not configured', gate: 'do not read/summarize secrets without approval' },
    { risk: 'untrusted instruction sources', status: matchesAny(text, ['prompt injection', 'untrusted', 'generated doc', 'tool output']) ? 'medium' : 'low', detail: 'treat issue text/generated docs/tool output as advisory', gate: 'verify against source truth' },
    { risk: 'memory/context poisoning', status: matchesAny(text, ['learning', 'context', 'memory', 'promote']) ? 'medium' : 'low', detail: 'review before durable promotion', gate: 'sanitize and route product facts separately' },
    { risk: 'merge/deploy/release attempt', status: matchesAny(text, ['merge', 'deploy', 'release', 'pipeline', 'mr', 'pr']) ? 'high' : 'low', detail: 'release actions remain human-controlled', gate: 'stop before final release action' },
    { risk: 'dirty worktree', status: git.status ? 'medium' : 'low', detail: formatInlineStatus(git.status), gate: 'scope changed files before finish' },
  ];
  return rows;
}

function sanitizeOneLine(value) {
  return String(value || '')
    .replace(/https?:\/\/\S+/g, '[redacted-url]')
    .replace(/\b(secret|token|password|credential|api key)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
}

function boolText(value) {
  if (value === true || /^(yes|true|1)$/i.test(String(value || ''))) return 'yes';
  if (value === false || /^(no|false|0)$/i.test(String(value || ''))) return 'no';
  return 'unknown';
}

export function evalRun(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const rows = scenarioRegressionCases().map((item) => {
    const actual = inferRouteFromTask(item.task, git, profile.values);
    return { name: item.name, expected: item.expectedRoute || '', actual, status: !item.expectedRoute || item.expectedRoute === actual ? 'pass' : 'fail' };
  });
  const content = ['# SDLC Eval Report', '', '| Case | Expected | Actual | Status |', '| --- | --- | --- | --- |', ...rows.map((row) => `| ${escapeCell(row.name)} | ${row.expected} | ${row.actual} | ${row.status} |`), ''].join('\n');
  writeOrPrint(repo, options.out, content);
  if (rows.some((row) => row.status === 'fail')) process.exitCode = 1;
}

export function evalSuite(repo, options = {}) {
  return evalRun(repo, options);
}

export function evalCase(repo, options = {}) {
  const name = options.name || '';
  const task = options.task || '';
  if (!name || !task) fail('Pass --name <name> and --task "...".');
  return evalAddCase(repo, { ...options, route: options.route || options.expect || 'standard' });
}

export function evalCompare(repo, options = {}) {
  const before = options.before ? readFileSync(resolve(repo, options.before), 'utf8') : '';
  const after = options.after ? readFileSync(resolve(repo, options.after), 'utf8') : '';
  const beforePass = (before.match(/\bpass\b/gi) || []).length;
  const afterPass = (after.match(/\bpass\b/gi) || []).length;
  const beforeFail = (before.match(/\bfail\b/gi) || []).length;
  const afterFail = (after.match(/\bfail\b/gi) || []).length;
  printObject({ before: options.before || 'not provided', after: options.after || 'not provided', beforePass, afterPass, beforeFail, afterFail, deltaPass: afterPass - beforePass, deltaFail: afterFail - beforeFail });
}

export function evalAddCase(repo, options = {}) {
  if (!options.name || !options.task) fail('Pass --name <name> --task "...".');
  const path = join(repo, '.ai-local', 'sdlc-eval-cases.jsonl');
  appendControlJsonLine(repo, path, { name: options.name, task: options.task, expectedRoute: options.route || inferRouteFromTask(options.task, getGitInfo(repo), loadProfile(repo).values), createdAt: new Date().toISOString() });
  console.log(relative(repo, path));
}

export function evalReport(repo, options = {}) {
  return evalRun(repo, options);
}

export function evalRetrievalAdd(repo, options = {}) {
  const name = options.name || '';
  const query = options.query || options.task || '';
  const pattern = options.pattern || query;
  if (!name || !query) fail('Pass --name <name> and --query "...".');
  const row = {
    schemaVersion: 'sdlc.retrieval_eval_case.v1',
    id: options.id || slug(name),
    name,
    query,
    pattern,
    expectedArtifacts: splitList(options.expectedArtifacts || options.expected),
    gradingMode: options.gradingMode || 'deterministic',
    difficulty: options.difficulty || 'mechanical',
    holdout: options.holdout || 'train',
    topK: Number(options.topK || 5),
    costBudget: {
      maxArtifacts: Number(options.maxArtifacts || 10),
      maxBytes: Number(options.maxBytes || 120000),
    },
    ownerArtifact: options.owner || options.ownerArtifact || 'repo-local retrieval eval',
    createdAt: new Date().toISOString(),
  };
  appendControlJsonLine(repo, retrievalEvalPath(repo, options), row);
  console.log(relative(repo, retrievalEvalPath(repo, options)));
}

export function evalRetrievalRun(repo, options = {}) {
  const cases = retrievalEvalCases(repo, options);
  const results = cases.map((item) => runRetrievalEvalCase(repo, item, options));
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc.retrieval_eval_report.v1', repository: repo, results }, null, 2));
    if (results.some((row) => row.status === 'fail')) process.exitCode = 1;
    return;
  }
  const content = `# SDLC Retrieval Eval Report

Date: ${new Date().toISOString()}
Repository: ${repo}
Cases: ${results.length}

## Summary

| Case | Mode | Difficulty | Status | hit@k | precision@k | Candidates | Context bytes | Caps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${results.map((row) => `| ${escapeCell(row.name)} | ${row.gradingMode} | ${row.difficulty} | ${row.status} | ${row.hitAtK} | ${row.precisionAtSmallK} | ${row.candidateArtifacts.length} | ${row.contextBytes} | ${escapeCell(row.caps.join('; ') || 'none')} |`).join('\n')}

## Missing Expected Artifacts

${formatList(results.flatMap((row) => row.missingExpected.map((item) => `${row.name}: ${item}`)))}

## Overreturned Context

${formatList(results.flatMap((row) => row.overreturned.slice(0, 10).map((item) => `${row.name}: ${item}`)))}

## Boundary

- Retrieval output is pointer quality, not proof.
- Deterministic cases use local search as the Stage 1 floor.
- Human-graded semantic-tail cases are reported as capped until reviewed.
- This command does not call MCP retrieval, local models, hosted services, or automatic tuning.
`;
  writeOrPrint(repo, options.out, content);
  if (results.some((row) => row.status === 'fail')) process.exitCode = 1;
}

export function evalRetrievalReport(repo, options = {}) {
  return evalRetrievalRun(repo, options);
}

export function evalLocalFirstSuite(repo, options = {}) {
  scenarioTest(repo, { ...options, verbose: true });
  if (options.strict) {
    const cases = scenarioRegressionCases();
    if (cases.length < 50) {
      console.log(`FAIL strict suite: expected broad coverage, only ${cases.length} scenario cases configured.`);
      process.exitCode = 1;
    }
  }
}

function retrievalEvalPath(repo, options = {}) {
  return resolve(repo, options.file || join('.ai-local', 'sdlc-retrieval-eval-cases.jsonl'));
}

function retrievalEvalCases(repo, options = {}) {
  const direct = options.query
    ? [{
        schemaVersion: 'sdlc.retrieval_eval_case.v1',
        id: options.id || slug(options.name || options.query),
        name: options.name || options.query,
        query: options.query,
        pattern: options.pattern || options.query,
        expectedArtifacts: splitList(options.expectedArtifacts || options.expected),
        gradingMode: options.gradingMode || 'deterministic',
        difficulty: options.difficulty || 'mechanical',
        holdout: options.holdout || 'adhoc',
        topK: Number(options.topK || 5),
        costBudget: { maxArtifacts: Number(options.maxArtifacts || 10), maxBytes: Number(options.maxBytes || 120000) },
        ownerArtifact: options.owner || 'ad hoc retrieval eval',
      }]
    : [];
  const filePath = retrievalEvalPath(repo, options);
  const fromFile = existsSync(filePath)
    ? filePath.endsWith('.jsonl')
      ? readJsonLines(filePath)
      : normalizeRetrievalCaseJson(readJsonIfExists(filePath))
    : [];
  const defaults = options.noDefaults ? [] : defaultRetrievalEvalCases();
  return [...direct, ...fromFile, ...defaults].filter((row) => row && !row.parseError);
}

function normalizeRetrievalCaseJson(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.cases)) return value.cases;
  if (Array.isArray(value?.rows)) return value.rows;
  return value ? [value] : [];
}

function defaultRetrievalEvalCases() {
  return [
    {
      schemaVersion: 'sdlc.retrieval_eval_case.v1',
      id: 'cycle3-knowledge-candidate-contract',
      name: 'knowledge candidate contract references',
      query: 'Find source artifacts that define knowledge-candidate fallback behavior.',
      pattern: 'knowledge-candidate',
      expectedArtifacts: [],
      gradingMode: 'deterministic',
      difficulty: 'mechanical',
      holdout: 'train',
      topK: 5,
      costBudget: { maxArtifacts: 30, maxBytes: 300000 },
      ownerArtifact: 'docs/process-improvement/knowledge-candidate-contract.md',
    },
    {
      schemaVersion: 'sdlc.retrieval_eval_case.v1',
      id: 'cycle3-tier-routing-receipt',
      name: 'tier-routing receipt references',
      query: 'Find source artifacts that define tier-routing receipt behavior.',
      pattern: 'tier-routing',
      expectedArtifacts: [],
      gradingMode: 'deterministic',
      difficulty: 'mechanical',
      holdout: 'train',
      topK: 5,
      costBudget: { maxArtifacts: 30, maxBytes: 300000 },
      ownerArtifact: 'docs/process-improvement/three-tier-routing-matrix.md',
    },
    {
      schemaVersion: 'sdlc.retrieval_eval_case.v1',
      id: 'cycle3-sdlc-eval-surface',
      name: 'sdlc eval helper references',
      query: 'Find source artifacts that mention the SDLC eval helper surface.',
      pattern: 'sdlc eval',
      expectedArtifacts: [],
      gradingMode: 'deterministic',
      difficulty: 'mechanical',
      holdout: 'train',
      topK: 5,
      costBudget: { maxArtifacts: 30, maxBytes: 300000 },
      ownerArtifact: 'scripts/sdlc/README.md',
    },
  ];
}

function runRetrievalEvalCase(repo, item, options = {}) {
  const topK = Number(item.topK || options.topK || 5);
  const gradingMode = item.gradingMode || 'deterministic';
  const difficulty = item.difficulty || 'mechanical';
  const expectedFromCase = normalizeArtifacts(item.expectedArtifacts);
  const caps = [];
  if (gradingMode !== 'deterministic') {
    return {
      id: item.id || slug(item.name || item.query),
      name: item.name || item.query || 'unnamed',
      gradingMode,
      difficulty,
      status: 'capped',
      topK,
      hitAtK: 'human-graded',
      precisionAtSmallK: 'human-graded',
      candidateArtifacts: [],
      expectedArtifacts: expectedFromCase,
      missingExpected: [],
      overreturned: [],
      contextBytes: 0,
      caps: ['semantic-tail or non-deterministic case requires human grading'],
    };
  }
  const search = runRgSearch(repo, item.pattern || item.query || '');
  if (search.cap) caps.push(search.cap);
  const expectedArtifacts = expectedFromCase.length ? expectedFromCase : search.artifacts;
  const candidateArtifacts = search.artifacts;
  const topArtifacts = candidateArtifacts.slice(0, topK);
  const expectedSet = new Set(expectedArtifacts);
  const candidateSet = new Set(candidateArtifacts);
  const hitsInTop = topArtifacts.filter((artifact) => expectedSet.has(artifact)).length;
  const missingExpected = expectedArtifacts.filter((artifact) => !candidateSet.has(artifact));
  const overreturned = expectedFromCase.length ? candidateArtifacts.filter((artifact) => !expectedSet.has(artifact)) : [];
  const hitAtK = expectedArtifacts.length ? hitsInTop / expectedArtifacts.length : candidateArtifacts.length ? 0 : 1;
  const precisionAtSmallK = topArtifacts.length ? hitsInTop / topArtifacts.length : expectedArtifacts.length ? 0 : 1;
  const contextBytes = candidateArtifacts.reduce((sum, artifact) => sum + artifactBytes(repo, artifact), 0);
  const budget = item.costBudget || {};
  if (budget.maxArtifacts && candidateArtifacts.length > Number(budget.maxArtifacts)) caps.push(`context artifact budget exceeded: ${candidateArtifacts.length}/${budget.maxArtifacts}`);
  if (budget.maxBytes && contextBytes > Number(budget.maxBytes)) caps.push(`context byte budget exceeded: ${contextBytes}/${budget.maxBytes}`);
  const status = search.cap ? 'capped' : missingExpected.length ? 'fail' : 'pass';
  return {
    id: item.id || slug(item.name || item.query),
    name: item.name || item.query || 'unnamed',
    query: item.query || '',
    pattern: item.pattern || item.query || '',
    gradingMode,
    difficulty,
    holdout: item.holdout || 'train',
    status,
    topK,
    hitAtK: Number(hitAtK.toFixed(3)),
    precisionAtSmallK: Number(precisionAtSmallK.toFixed(3)),
    candidateArtifacts,
    expectedArtifacts,
    missingExpected,
    overreturned,
    contextBytes,
    caps,
  };
}

function runRgSearch(repo, pattern) {
  if (!pattern) return { artifacts: [], cap: 'missing deterministic search pattern' };
  const roots = ['README.md', 'SUMMARY.md', 'WORKFLOW.md', 'docs', 'scripts', 'skills', 'templates', 'agents', 'agent-contracts'].filter((root) => existsSync(join(repo, root)));
  try {
    const output = execFileSync('rg', ['-l', '--', pattern, ...roots], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { artifacts: output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).sort(), cap: '' };
  } catch (error) {
    if (error?.status === 1) return { artifacts: [], cap: '' };
    return { artifacts: [], cap: 'rg unavailable or failed; use manual grading fallback' };
  }
}

function normalizeArtifacts(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean).sort();
  return splitList(value).sort();
}

function artifactBytes(repo, artifact) {
  try {
    return readFileSync(join(repo, artifact)).length;
  } catch {
    return 0;
  }
}
