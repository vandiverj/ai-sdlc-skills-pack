import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fail, printObject, slug } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';

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
  if (options.verbose) {
    console.log(`\nScenarios tested: ${results.length}`);
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
      task: 'use the Battle Soccer fixture app to test SDLC and keep useful changes with a commit preview',
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

function matchesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function externalEvidenceProfile(profile = {}) {
  return {
    ticket: {
      provider: profile.ticketSystemProvider || profile.ticketSystem || 'not configured',
      availability: profile.ticketMcpAvailability || 'unknown',
      readIssue: profile.ticketReadIssue || 'unknown',
      readComments: profile.ticketReadComments || 'unknown',
      readAttachments: profile.ticketReadAttachmentsArticles || profile.ticketReadAttachments || 'unknown',
      writeComments: profile.ticketWriteComments || 'approval required',
      updateFields: profile.ticketUpdateFieldsStatusAssignee || profile.ticketUpdateFields || 'approval required',
      sensitiveRules: profile.ticketSensitiveDataRules || profile.sensitiveDataRestrictions || 'not configured',
      fallbackFields: profile.ticketFallbackIntakeFields || 'summary, acceptance criteria, relevant comments, QA expectations',
    },
    database: {
      provider: profile.databaseEvidenceProvider || profile.databaseProviderContext || 'not configured',
      availability: profile.databaseMcpAvailability || 'unknown',
      environments: profile.databaseEnvironmentsAllowed || 'not configured',
      allowedOperations: profile.databaseAllowedOperations || 'metadata read / aggregate SELECT / bounded row-level SELECT when approved',
      blockedOperations: profile.databaseBlockedOperations || 'INSERT, UPDATE, DELETE, DDL, migration, backfill, job execution, stored procedure execution',
      sensitiveRules: profile.databaseSensitiveSchemasTablesDataClasses || profile.sensitiveDataRestrictions || 'not configured',
      rowLimit: profile.databaseRowLimitDefaultAggregation || 'prefer aggregate/existence checks; row samples only when justified',
      redactionRules: profile.databaseRedactionRules || profile.sensitiveLogHandling || 'redact secrets, customer data, private URLs, identifiers, and raw row values before shared learning',
      fallback: profile.databaseFallbackEvidencePath || 'human-provided sanitized log/query result or local code/schema/test evidence',
    },
  };
}

function externalEvidenceSensitive(task, profile = {}, kind = 'database') {
  const text = `${task} ${profile.classification || ''} ${profile.repositoryRole || ''}`.toLowerCase();
  if (matchesAny(text, ['production', 'prod', 'customer', 'client', 'private', 'secret', 'credential', 'token', 'payment', 'financial', 'health', 'tenant', 'soc'])) return true;
  if (kind === 'database' && matchesAny(text, ['row-level', 'raw row', 'select *', 'backfill', 'migration', 'delete', 'update'])) return true;
  if (kind === 'ticket' && matchesAny(text, ['attachment', 'screenshot', 'private comment', 'customer report'])) return true;
  return false;
}

function databaseQueryShape(task, sensitive) {
  const text = task.toLowerCase();
  const shape = [
    'Start with metadata checks: table/view existence, column mapping, constraints, indexes, trigger/provider metadata, or stored procedure definition when allowed.',
    'Use aggregate/existence checks before row-level reads: counts, min/max timestamps, status distribution, or existence of expected related records.',
    'Scope by environment, tenant/test account, time window, and known case identifier.',
    'Capture summarized results, not raw row dumps.',
  ];
  if (matchesAny(text, ['api', 'swagger', 'openapi', 'endpoint'])) shape.push('Map query purpose to the API response field or status being validated.');
  if (matchesAny(text, ['ef core', 'trigger', 'output clause', 'foreign key', 'fk'])) shape.push('Inspect provider-specific metadata or generated SQL evidence before changing save order or schema.');
  if (sensitive) shape.push('Stop for approval before production/private row-level inspection; prefer redacted aggregate evidence or human-provided sanitized result.');
  return shape;
}

function databaseApprovalGateText(boundary, sensitive) {
  if (sensitive) return '- Approval required before inspecting production/private row-level or sensitive data.';
  if (boundary.availability !== 'available') return '- Database MCP capability is not confirmed available; use fallback evidence or ask before relying on MCP access.';
  return '- No extra approval when staying inside configured read-only metadata/aggregate/test-data boundary; ask if uncertain.';
}

function ticketFallbackFields(ticket) {
  const fields = splitList(ticket.fallbackFields);
  return fields.length ? fields : ['issue summary', 'acceptance criteria', 'relevant comments', 'QA expectations'];
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

function contextConflictSeverity({ stale, missing, contradictions, profile }) {
  const realContradictions = contradictions.filter((item) => !String(item).toLowerCase().includes('no obvious context contradictions detected'));
  const contradictionText = realContradictions.join(' ').toLowerCase();
  if (contradictionText.includes('contradict') || contradictionText.includes('configured but missing')) return 'conflicting-sources';
  if (stale.length && (profile.sharedContextRoot || profile.productContext || profile.repoContext)) return 'stale-but-usable';
  if (stale.length > 2) return 'stale-and-risky';
  if (missing.length > 5) return 'missing-owner';
  return 'current-or-low-risk';
}

function feedbackRow(repo, options = {}) {
  const gitInfo = getGitInfo(repo);
  const task = options.task || '';
  const profile = loadProfile(repo);
  return {
    timestamp: new Date().toISOString(),
    repo: basename(repo),
    repoPath: repo,
    agentsVersion: git(agentsRoot, ['rev-parse', '--short', 'HEAD']) || 'unknown',
    runtime: options.runtime || options.tool || 'unknown',
    source: options.source || 'developer',
    repoProfileType: profile.path ? relative(repo, profile.path) : 'none',
    task,
    route: options.route || inferRouteFromTask(task, gitInfo, profile.values),
    setupCompleted: boolText(options.setupCompleted),
    finishReached: boolText(options.finishReached),
    evidenceUnderstood: boolText(options.evidenceUnderstood),
    qaScriptUseful: options.qaScriptUseful || 'not-applicable',
    friction: options.friction || options.category || 'other',
    note: sanitizeOneLine(options.note || options.summary || ''),
    suggestedImprovement: sanitizeOneLine(options.suggestedImprovement || options.improvement || ''),
    shareStatus: options.shareStatus || 'local-only',
  };
}

function appendFeedbackRow(repo, row) {
  const outPath = defaultFeedbackPath(repo);
  mkdirSync(dirname(outPath), { recursive: true });
  appendFileSync(outPath, `${JSON.stringify(row)}\n`, 'utf8');
}

function renderFeedbackPacket(row) {
  return `# SDLC Developer Feedback Packet

Date: ${row.timestamp}
Task: ${row.task}
Route: ${row.route}
Runtime: ${row.runtime}
Agents version: ${row.agentsVersion}
Share status: ${row.shareStatus}

## Outcome

- Setup completed: ${row.setupCompleted}
- Finish reached: ${row.finishReached}
- Evidence understood: ${row.evidenceUnderstood}
- QA script useful: ${row.qaScriptUseful}

## Friction

- Category: ${row.friction}
- Note: ${row.note || 'not provided'}
- Suggested improvement: ${row.suggestedImprovement || 'not provided'}

## Privacy

- Local by default.
- Do not include raw prompts, source snippets, production logs, private URLs, customer/client names, credentials, or secrets.
`;
}

function readFeedbackRows(repo, options = {}) {
  const path = options.in ? resolve(repo, options.in) : defaultFeedbackPath(repo);
  if (!existsSync(path)) return [];
  return readJsonLines(path);
}

function filterSince(rows, since) {
  if (!since) return rows;
  return rows.filter((row) => String(row.timestamp || '').slice(0, 10) >= since);
}

function feedbackOwner(row) {
  const category = String(row.friction || '').toLowerCase();
  if (category.includes('install') || category.includes('setup')) return 'setup';
  if (category.includes('type') || category.includes('guidance')) return 'README/onboarding';
  if (category.includes('route')) return 'run-sdlc';
  if (category.includes('context')) return 'context';
  if (category.includes('verification')) return 'quality/verification';
  if (category.includes('qa')) return 'QA';
  if (category.includes('safety') || category.includes('approval')) return 'safety/release';
  if (category.includes('runtime')) return 'runtime adapters';
  if (category.includes('completion')) return 'run dashboard/final gate';
  return 'triage';
}

function feedbackImprovementCandidates(rows) {
  const candidates = [];
  for (const [category, count] of groupCounts(rows.map((row) => row.friction || 'other')).filter(([, count]) => count >= 2)) {
    candidates.push(`Repeated friction "${category}" appeared ${count} times; owner: ${feedbackOwner({ friction: category })}.`);
  }
  for (const row of rows.filter((item) => ['blocked', 'unsafe', 'data-risk', 'wrong-route'].includes(String(item.friction || '').toLowerCase()))) {
    candidates.push(`High-severity event ${row.friction}: ${row.note || row.suggestedImprovement || 'review needed'}.`);
  }
  if (!candidates.length) candidates.push('No feedback signal has crossed the improvement threshold yet.');
  return candidates;
}

function countTruthy(rows, key) {
  return rows.filter((row) => ['yes', 'true', true].includes(row[key])).length;
}

function buildRunState(repo, task, options = {}) {
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

function loadRunState(repo, task) {
  const explicit = task ? runStatePath(repo, task) : '';
  if (explicit && existsSync(explicit)) return { ...readJsonIfExists(explicit), path: explicit };
  const dir = defaultRunsDir(repo);
  if (!existsSync(dir)) return {};
  const files = readdirSync(dir).filter((file) => file.endsWith('-run-state.json')).map((file) => join(dir, file));
  if (!files.length) return {};
  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return { ...readJsonIfExists(files[0]), path: files[0] };
}

function runNextAction(repo, state, git) {
  const task = state.task || '';
  if (!state.path) return task ? `sdlc run plan --task "${escapeCommandArg(task)}"` : 'sdlc run plan --task "..."';
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  if (!packets.some((packet) => packet.kind === 'task-preflight')) return `sdlc task preflight --task "${escapeCommandArg(task)}" --lock`;
  if (git.changedFiles.length && !packets.some((packet) => packet.kind === 'touched')) return 'sdlc touched packet';
  if (!packets.some((packet) => packet.kind === 'developer-verification')) return `sdlc verify packet --task "${escapeCommandArg(task)}"`;
  if (open.length) return suggestedFinalGateCommand(open[0], task);
  return `sdlc task finish --task "${escapeCommandArg(task)}"`;
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

function intakePacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so intake can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const caseId = taskCaseId(task, options, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-intake-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Intake Packet

Date: ${new Date().toISOString()}
Task: ${task}
Case ID: ${caseId || 'not provided'}
Source system: ${options.source || options.sourceSystem || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Suggested route: ${inferRouteFromTask(task, git, profile.values)}
Task type: ${taskType(task)}

## Identity And Ownership

- Affected product/repo/unit: ${options.unit || 'infer from changed files/profile'}
- QA ownership: ${options.qaOwner || profile.values.qaOwnership || 'decide during impact/QA handoff'}
- Commit-message case ID policy: ${caseIdPolicy(profile.values)}
- Proposed commit prefix: ${caseId ? `${caseId}:` : requiresCaseId(profile.values) ? 'blocked until case ID is known' : 'optional'}

## Required Early Decisions

${formatList(intakeOpenItems(task, profile.values, caseId))}

## Next Commands

\`\`\`bash
sdlc recipe match --task "${escapeCommandArg(task)}"
sdlc run dashboard --task "${escapeCommandArg(task)}"
\`\`\`
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}
