import { join, relative, resolve } from 'node:path';
import { fail, formatList, printObject, printTable, safeWriteJsonFile, safeWriteTextFile, slug } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';
import { buildToolInventory } from './tools.mjs';

export function commandPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const plan = buildCommandPlan(repo, task, options);
  if (options.json || options.format === 'json') {
    const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${slug(task)}-command-plan.json`);
    safeWriteJsonFile(repo, outPath, plan);
    console.log(relative(repo, outPath));
    return;
  }
  printCommandPlan(plan);
}

export function commandNext(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const plan = buildCommandPlan(repo, task, options);
  const next = plan.commands.find((row) => row.priority === 'next') || plan.commands[0];
  if (!next) fail('No command recommendation found.');
  printObject({ task, route: plan.route, nextCommand: next.command, why: next.why });
}

export function commandRecommend(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const result = buildCommandRecommendation(repo, task, options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  printObject({ task, route: result.route, phase: result.phase, recommendationCount: result.recommendations.length });
  printTable(['Priority', 'Command', 'Evidence', 'Why'], result.recommendations.map((row) => [row.priority, row.command, row.evidenceClass, row.why]));
}

export function buildCommandRecommendation(repo, task, options = {}) {
  const plan = buildCommandPlan(repo, task, options);
  const phase = options.phase || plan.phase || 'verify';
  const localRows = localCommandRows(repo, phase);
  const phaseRows = plan.commands.filter((row) => row.phase === phase || row.phase === 'verification' && phase === 'verify' || row.phase === 'qa' && phase === 'qa' || row.phase === 'finish' && phase === 'finish');
  const rows = [...localRows, ...(phaseRows.length ? phaseRows : plan.commands)].slice(0, 8).map((row, index) => ({
    ...row,
    priority: index === 0 ? 'next' : row.priority || 'supporting',
    evidenceClass: evidenceClassForCommand(row.command),
    fallback: fallbackForCommand(row.command, task),
  }));
  return {
    schema: 'sdlc-command-recommendation-v1',
    generatedAt: new Date().toISOString(),
    task,
    route: plan.route,
    phase,
    testingSurfaces: plan.testingSurfaces,
    recommendations: rows,
  };
}

function localCommandRows(repo, phase) {
  const inventory = buildToolInventory(repo);
  const patterns = {
    verify: /test|typecheck|check/i,
    verification: /test|typecheck|check/i,
    implementation: /build|lint|typecheck|check/i,
    qa: /dev|preview|test/i,
    finish: /test|build|lint|typecheck|check/i,
  };
  const pattern = patterns[phase] || patterns.verify;
  return inventory.scripts
    .filter((script) => pattern.test(script.name) || pattern.test(script.command))
    .slice(0, 3)
    .map((script) => ({
      id: `local-${script.name}`,
      priority: 'supporting',
      phase: phase === 'verification' ? 'verify' : phase,
      command: script.command,
      why: `Local ${script.name} script from tool inventory: ${script.detail}`,
      avoid: 'Do not treat recommendation as executed evidence until captured.',
      output: 'local command result',
    }));
}

export function commandExplain(repo, options = {}) {
  const command = options.command || options._?.join(' ') || '';
  const task = options.task || '';
  if (!command) fail('Pass --command "...".');
  const plan = task ? buildCommandPlan(repo, task, options) : null;
  const item = commandRegistry().find((row) => command.startsWith(row.command.split(' ')[0]) || command.includes(row.area));
  printObject({
    command,
    task: task || 'not provided',
    route: plan?.route || 'unknown',
    phase: item?.phase || 'unknown',
    purpose: item?.purpose || 'No registry match; treat as advanced/manual command.',
    caution: item?.avoid || 'Confirm it is route-appropriate and does not bypass approval gates.',
  });
}

export function commandHelpRoute(repo, route, options = {}) {
  if (!route) fail('Pass a route name.');
  const rows = commandRegistry().filter((row) => row.routes.includes(route) || row.routes.includes('any'));
  console.log(`# SDLC Command Help: ${route}\n`);
  printTable(['Phase', 'Command', 'Purpose'], rows.map((row) => [row.phase, row.command, row.purpose]));
}

export function commandHelpPhase(repo, phase, options = {}) {
  if (!phase) fail('Pass a phase name.');
  const rows = commandRegistry().filter((row) => row.phase === phase || row.phase === 'any');
  console.log(`# SDLC Command Help: ${phase}\n`);
  printTable(['Route', 'Command', 'Purpose'], rows.map((row) => [row.routes.join(', '), row.command, row.purpose]));
}

export function buildCommandPlan(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const phase = options.phase || 'intake';
  const recipes = matchRecipes(task, git, profile.values);
  const triggers = securityTriggers(task, profile.values);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const context = { repo, task, route, phase, recipes, triggers, surfaces, qaMode, git, profile };
  const commands = recommendedCommands(context);
  return {
    schema: 'sdlc-command-plan-v1',
    generatedAt: new Date().toISOString(),
    task,
    route,
    phase,
    recipes: recipes.map((row) => row.id),
    securityTriggers: triggers,
    testingSurfaces: surfaces,
    qaMode,
    commands,
    note: 'Paved-path recommendations are advisory. Explain any heavier command or skipped evidence command.',
  };
}

function recommendedCommands(context) {
  const rows = [];
  const add = (id, priority = 'supporting') => {
    const item = commandRegistry().find((row) => row.id === id);
    if (item && !rows.some((row) => row.id === id)) rows.push(commandRow(item, priority, context));
  };

  add('task-preflight', 'next');
  add('context-assemble');
  add('evidence-required');

  if (context.phase === 'planning' || context.route !== 'tiny-docs') add('task-contract');
  if (context.route !== 'tiny-docs') add('evidence-matrix');
  if (context.triggers.length) add('policy-check');
  if (context.triggers.some((item) => /ticket/i.test(item)) || /yt-|youtrack|ticket/i.test(context.task)) add('ticket-evidence');
  if (context.triggers.some((item) => /database/i.test(item)) || /database|sql|data/i.test(context.task)) add('data-query-plan');
  if (context.route === 'multi-repo-integration') {
    add('workspace-status');
    add('workspace-ledger');
    add('multi-qa');
  }
  if (context.route === 'review-only') add('review-packet');
  if (context.route === 'release-push') add('action-preview');
  if (context.route === 'weak-test-legacy') {
    add('test-regression-plan');
    add('qa-script');
  }
  if (context.route === 'bugfix-live-system') add('bug-live-evidence');
  if (context.surfaces.includes('rendered-product-ui')) add('render-plan');
  if (context.surfaces.includes('api-contract')) add('qa-api');
  if (context.surfaces.includes('data-persistence')) add('data-evidence');
  if (context.surfaces.includes('integration-provider')) add('integration-packet');
  for (const recipe of context.recipes) add(`recipe-${recipe.id}`);

  add('verify-ladder');
  if (context.route !== 'tiny-docs') add('qa-coverage');
  add('complete-check');
  add('finish-packet');
  return rows;
}

function commandRow(item, priority, context) {
  return {
    id: item.id,
    priority,
    phase: item.phase,
    command: renderCommand(item.command, context),
    why: item.purpose,
    avoid: item.avoid,
    output: item.output,
  };
}

function renderCommand(command, context) {
  return command.replaceAll('<task>', escapeDouble(context.task)).replaceAll('<route>', context.route).replaceAll('<qaMode>', context.qaMode);
}

function escapeDouble(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function printCommandPlan(plan) {
  printObject({ task: plan.task, route: plan.route, phase: plan.phase, recipes: plan.recipes.join(', ') || 'none', testingSurfaces: plan.testingSurfaces.join(', ') || 'unknown', qaMode: plan.qaMode, securityTriggers: plan.securityTriggers.join(', ') || 'none' });
  console.log('\nRecommended commands');
  printTable(['Priority', 'Phase', 'Command', 'Why'], plan.commands.map((row) => [row.priority, row.phase, row.command, row.why]));
  console.log(`\n${plan.note}`);
}

function evidenceClassForCommand(command) {
  if (/npm run|dotnet test|deno test|pytest|cargo test|build|typecheck|lint/i.test(command)) return 'deterministic-proof';
  if (/qa script|qa api|render|smoke/i.test(command)) return 'local-or-human-evidence';
  if (/policy|complete|guard|action preview/i.test(command)) return 'approval-boundary';
  if (/context|recipe|plan|packet/i.test(command)) return 'structured-guidance';
  return 'recommendation';
}

function fallbackForCommand(command, task) {
  if (/test|verify/i.test(command)) return `Use sdlc verify packet --task "${escapeDouble(task)}" with an explicit cap if no local command exists.`;
  if (/qa/i.test(command)) return `Use sdlc qa outline --task "${escapeDouble(task)}" if a full script is too heavy.`;
  if (/render/i.test(command)) return 'Use manual smoke or cap rendered evidence when browser tooling is unavailable.';
  return 'Record why this command was skipped or replaced.';
}

export function commandRegistry() {
  return [
    reg('task-preflight', 'sdlc task preflight --task "<task>"', 'intake', ['any'], 'Summarize route, unit, surface, QA, artifact, and confidence before editing.', 'Do not use as a substitute for evidence after implementation.', 'preflight packet'),
    reg('context-assemble', 'sdlc context assemble --phase planning --task "<task>"', 'context', ['any'], 'Assemble compact task-relevant context without loading the whole SDLC.', 'Avoid broad context dumps when phase-specific context is enough.', 'context packet'),
    reg('evidence-required', 'sdlc evidence required --task "<task>"', 'intake', ['any'], 'Create route-specific required evidence manifest.', 'Avoid claiming complete without satisfying or waiving required evidence.', 'evidence manifest'),
    reg('task-contract', 'sdlc contract task --task "<task>"', 'planning', ['standard', 'multi-repo-integration', 'contract-first', 'bugfix-regression', 'bugfix-live-system', 'weak-test-legacy'], 'Normalize acceptance criteria, non-goals, constraints, QA expectations, and open questions.', 'Do not invent acceptance criteria when the human/ticket is unclear.', 'task contract'),
    reg('evidence-matrix', 'sdlc evidence matrix --task "<task>"', 'verification', ['any'], 'Map acceptance criteria to proof, gaps, QA, and caps.', 'Do not treat inferred proof as equivalent to executed evidence.', 'evidence matrix'),
    reg('policy-check', 'sdlc policy check --task "<task>" --action commit', 'safety', ['any'], 'Check consent boundaries when security/tool/release triggers appear.', 'Never use policy checks to bypass human approval.', 'policy rows'),
    reg('ticket-evidence', 'sdlc ticket evidence --task "<task>"', 'intake', ['standard', 'multi-repo-integration', 'bugfix-regression'], 'Capture ticket acceptance criteria or fallback needs.', 'Do not post or update tickets without approval.', 'ticket packet'),
    reg('data-query-plan', 'sdlc data query-plan --task "<task>"', 'planning', ['standard', 'bugfix-live-system', 'bugfix-regression'], 'Plan bounded read-only database evidence and redaction.', 'Do not execute writes, migrations, or row-level production queries without approval.', 'data query plan'),
    reg('workspace-status', 'sdlc workspace status', 'intake', ['multi-repo-integration'], 'Identify workspace repositories before broad implementation.', 'Avoid assuming one repo owns all behavior.', 'workspace status'),
    reg('workspace-ledger', 'sdlc workspace ledger --task "<task>"', 'implementation', ['multi-repo-integration'], 'Track touched repositories and changed units.', 'Do not hide repo mechanics when they affect QA or release order.', 'workspace ledger'),
    reg('multi-qa', 'sdlc multi qa --task "<task>"', 'qa', ['multi-repo-integration'], 'Create one tester-visible QA handoff across affected repos.', 'Do not make human QA execute developer-only repo commands.', 'multi QA packet'),
    reg('review-packet', 'sdlc review packet --task "<task>"', 'review', ['review-only'], 'Create read-only review evidence.', 'Do not edit during review-only route.', 'review packet'),
    reg('action-preview', 'sdlc action preview --action commit --task "<task>"', 'finish', ['release-push', 'any'], 'Preview commit/push risk before human approval.', 'Do not merge, deploy, release, or push without explicit approval.', 'action preview'),
    reg('test-regression-plan', 'sdlc test regression-plan --task "<task>"', 'verification', ['weak-test-legacy'], 'Plan targeted regression coverage or a manual cap when tests are weak.', 'Do not pretend broad automated coverage exists.', 'regression plan'),
    reg('qa-script', 'sdlc qa script --task "<task>"', 'qa', ['standard', 'weak-test-legacy', 'multi-repo-integration'], 'Generate Markdown QA instructions for human testers.', 'Do not include AI-only instructions for QA testers.', 'QA script'),
    reg('bug-live-evidence', 'sdlc bug live-evidence --task "<task>"', 'intake', ['bugfix-live-system'], 'Capture exact sanitized live/log/request evidence or cap.', 'Do not broaden the fix before exact evidence is understood.', 'live bug evidence'),
    reg('render-plan', 'sdlc render plan --task "<task>"', 'verification', ['ui-rendered-review'], 'Plan rendered/browser evidence for actual UI surfaces.', 'Do not use rendered review for API-only surfaces.', 'render plan'),
    reg('qa-api', 'sdlc qa api --task "<task>"', 'qa', ['standard'], 'Produce API/developer testing steps for API-only surfaces.', 'Do not present Swagger-only work as rendered UI.', 'API QA packet'),
    reg('data-evidence', 'sdlc data evidence --task "<task>"', 'verification', ['standard', 'bugfix-regression'], 'Capture redacted data evidence shape or cap.', 'Do not expose raw database rows or customer data.', 'data evidence'),
    reg('integration-packet', 'sdlc integration packet --task "<task>"', 'verification', ['standard'], 'Capture provider/integration evidence expectations.', 'Do not call external systems without approval when risky.', 'integration packet'),
    reg('verify-ladder', 'sdlc verify ladder --task "<task>"', 'verification', ['any'], 'Recommend surface-correct validation levels.', 'Do not treat recommended commands as already executed.', 'verification ladder'),
    reg('qa-coverage', 'sdlc qa coverage --task "<task>"', 'qa', ['any'], 'Check whether QA covers changed surfaces and acceptance criteria.', 'Do not let QA replace developer validation.', 'QA coverage'),
    reg('scratch-audit', 'sdlc artifact scratch-audit', 'finish', ['any'], 'Detect one-off agent helper scripts that were created outside the controlled `.ai-local` scratch folder.', 'Do not leave temporary scripts dirtying product source folders.', 'scratch artifact audit'),
    reg('complete-check', 'sdlc complete check --task "<task>"', 'finish', ['any'], 'Check deterministic completion gates before claiming done.', 'Open gates require evidence, waiver, or human-accepted cap.', 'completion check'),
    reg('finish-packet', 'sdlc finish packet --task "<task>"', 'finish', ['any'], 'Prepare final evidence and next action summary.', 'Do not commit or push from the packet alone.', 'finish packet'),
    ...recipeCommandRows(),
  ];
}

function recipeCommandRows() {
  const recipeIds = ['route-retirement', 'live-system-bug', 'interactive-stateful-feature', 'fixture-validation-kept-change', 'efcore-sqlserver-trigger-output', 'efcore-fk-relationship', 'no-test-legacy', 'api-only-openapi', 'multi-repo-qa-handoff', 'test-bootstrap', 'command-tooling-failure', 'context-bucket-save', 'ticket-evidence', 'database-evidence', 'spa-artifact-promotion'];
  return recipeIds.map((id) => reg(`recipe-${id}`, `sdlc recipe explain --recipe ${id}`, 'planning', ['any'], `Review recipe overlay ${id} when it matched the task.`, 'Do not treat recipes as mandatory golden flows.', 'recipe explanation'));
}

function reg(id, command, phase, routes, purpose, avoid, output) {
  return { id, area: command.split(/\s+/)[1] || id, command, phase, routes, purpose, avoid, output };
}
