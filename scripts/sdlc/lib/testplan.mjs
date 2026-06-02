import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, fail, formatInlineList, formatList, readJsonIfExists, safeWriteTextFile, stamp, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferDirtySurfaces } from './routes.mjs';
import { matchRecipes } from './recipes.mjs';
import { affectedUnits, existsAny, hasFileExt, inferTestingSurfaces, matchesAny } from './units.mjs';
import { classifyTouchedSurface } from './surface.mjs';

export function fixturePlan(repo, options = {}, dependencies = {}) {
  const { formatValidationLadder, validationLadderRows } = dependencies;
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the fixture validation plan can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-fixture-validation-plan.md`);
  const content = `# SDLC Fixture Validation Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Intent: keep-change / throwaway-test / process-only

## Mixed-Scope Task Set

### Small
- Copy/label polish:
- Minor feedback state:
- One focused test:

### Medium
- Settings/mode behavior:
- Stateful UI/API/CLI flow:
- Validation path:

### Large
- Multi-surface feature:
- Integration or release/QA handoff:
- Cross-module regression:

## Required Proof

- Preflight route and breadth:
- Changed-files scope:
- Tests/build or surface-equivalent verification:
- Rendered/API/CLI/job/data smoke or explicit cap:
- QA Markdown if testers are involved:
- Commit preview when changes are kept:

## Validation Ladder

${formatValidationLadder(validationLadderRows(task, surfaces))}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function testPlan(repo, options = {}, dependencies = {}) {
  const { verificationMaturity } = dependencies;
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

export function testSuggest(repo, options = {}, dependencies = {}) {
  const { detectTestFrameworks, verificationMaturity } = dependencies;
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so test suggestions can be scoped.');
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const git = getGitInfo(repo);
  const maturity = verificationMaturity(profile.values, commands);
  const suggestions = testPlanRecommendations(maturity, git.changedFiles);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Test Suggestion

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Verification maturity: ${maturity}

## Current Harness

- Test command: ${commands.test || 'not configured'}
- Build command: ${commands.build || 'not configured'}
- Test frameworks: ${formatInlineList(detectTestFrameworks(repo, packageJson))}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Unit test commands: ${formatInlineList(dedupe(units.map((unit) => unit.testCommand).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(inferTestingSurfaces(repo, task, git.changedFiles, profile))}

## Smallest Useful Test

${formatList(suggestions)}

## If No Test Is Added Now

- Reason:
- Manual smoke replacing it:
- Future test to add:
- Cap owner:
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function testBootstrapPlan(repo, options = {}, dependencies = {}) {
  const unitName = options.unit || options.name || 'default';
  const framework = String(options.framework || inferBootstrapFramework(repo)).toLowerCase();
  const outPath = options.out ? resolve(repo, options.out) : '';
  const checklist = testBootstrapChecklist(framework);
  const content = `# SDLC Test Bootstrap Plan

Date: ${new Date().toISOString()}
Repository: ${repo}
Unit: ${unitName}
Framework: ${framework}

## Goal

Add the smallest focused test harness needed for the active task without pretending the legacy or multi-project repository is fully covered.

## Checklist

${formatList(checklist)}

## Validation

- Focused test command:
- Broader build/test command when feasible:
- Dependency/package warnings:
- Environment/setup caps:
- Manual smoke or QA replacement when automation cannot be added:

## Guardrails

- Do not backfill broad legacy coverage as part of a narrow task unless explicitly requested.
- Record dependency warnings separately from product/test failures.
- Keep the first test close to the active bug, route, data invariant, or workflow.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function testRegressionPlan(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-regression-plan.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Targeted Regression Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Smallest Useful Regression

${formatList(testRecommendationsForSurfaces(inferDirtySurfaces(task, git), task))}

## Existing Evidence Recipe Matches

${formatList(matchRecipes(task, git, profile.values).map((recipe) => `${recipe.id}: ${recipe.requiredProof.join('; ')}`))}

## Caps

- If no automated test is practical, record why and produce a QA handoff/manual smoke replacement.
- Do not backfill broad legacy coverage as part of a narrow task unless explicitly approved.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function testFoothold(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const footholds = footholdRecommendations(task, git.changedFiles, surfaces, commands);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Test Foothold Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Position

This repo may not have broad automated coverage. The goal is one useful foothold for this task, not a full test backfill.

## Current Signals

- Test command: ${commands.test || 'not configured'}
- Build command: ${commands.build || 'not configured'}
- Changed files: ${git.changedFiles.length}
- Testing surfaces: ${formatInlineList(surfaces)}

## Recommended Footholds

| Priority | Foothold | Effort | Confidence gain | Blast radius |
| --- | --- | --- | --- | --- |
${footholds.map((row, index) => `| ${index === 0 ? 'primary' : 'alternative'} | ${row.name} | ${row.effort} | ${row.confidence} | ${row.blastRadius} |`).join('\n')}

## Next Action

${footholds[0]?.command || 'Create a manual smoke/QA cap if no automated foothold is practical.'}
`;
  writeOrPrint(repo, outPath, content);
}

export function fixtureBattleSoccerPlan(repo, options = {}) {
  const scenarios = battleSoccerScenarios();
  console.log('# Battle Soccer SDLC Evaluation Suite\n');
  console.log('| ID | Scope | Task Shape | Proof |');
  console.log('| --- | --- | --- | --- |');
  for (const item of scenarios) console.log(`| ${item.id} | ${item.scope} | ${item.task} | ${item.proof} |`);
}

export function fixtureBattleSoccerRun(repo, options = {}) {
  const scenario = battleSoccerScenarios().find((item) => item.id === (options.scenario || options.id));
  if (!scenario) fail(`Pass --scenario with one of: ${battleSoccerScenarios().map((item) => item.id).join(', ')}`);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-battle-soccer-${scenario.id}.md`);
  const content = `# Battle Soccer Fixture Scenario

Scenario: ${scenario.id}
Scope: ${scenario.scope}
Task: ${scenario.task}

## Acceptance

${formatList(scenario.acceptance)}

## SDLC Validation

- Start: \`sdlc start --task "${scenario.task}"\`
- Verify: ${scenario.proof}
- QA: produce Markdown if behavior is tester-visible.
- Finish: keep useful game changes; commit only after human approval.
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function inferBootstrapFramework(repo) {
  if (hasFileExt(repo, ['.csproj', '.sln'])) return 'dotnet';
  if (existsAny(repo, ['package.json'])) return 'node';
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) return 'deno';
  return 'generic';
}

function footholdRecommendations(task, files, surfaces, commands) {
  const text = String(task || '').toLowerCase();
  if (surfaces.includes('api-contract') || /api|openapi|swagger/.test(text)) return [
    foothold('API contract check', 'low-medium', 'high for API boundary', 'API/developer surface', 'sdlc qa api --task "<task>"'),
    foothold('Request/response smoke script', 'medium', 'medium-high', 'single endpoint/workflow', 'sdlc smoke packet --task "<task>"'),
    foothold('Manual Swagger/OpenAPI QA script', 'low', 'medium', 'human developer testing', 'sdlc qa script --task "<task>"'),
  ];
  if (surfaces.includes('data-persistence') || /sql|database|data/.test(text)) return [
    foothold('Read-only query evidence plan', 'low', 'medium-high for data bug', 'bounded data shape only', 'sdlc data query-plan --task "<task>"'),
    foothold('Characterization test around data mapper', 'medium', 'high if code-local', 'changed unit only', 'sdlc test suggest --task "<task>"'),
    foothold('Manual data regression checklist', 'low', 'medium', 'QA/test environment', 'sdlc qa data --task "<task>"'),
  ];
  if (surfaces.includes('rendered-product-ui')) return [
    foothold('Rendered smoke check', 'low-medium', 'high for UI state', 'targeted screen/flow', 'sdlc render plan --task "<task>"'),
    foothold('Component/interaction test', 'medium', 'high if harness exists', 'changed component only', 'sdlc test suggest --task "<task>"'),
    foothold('Human QA Markdown script', 'low', 'medium', 'tester-visible workflow', 'sdlc qa ui --task "<task>"'),
  ];
  if (commands.test) return [
    foothold('Focused existing test command', 'low', 'medium', 'existing harness', commands.test),
    foothold('Changed-function wrapper test', 'medium', 'medium-high', 'changed unit only', 'sdlc test suggest --task "<task>"'),
    foothold('Manual smoke cap', 'low', 'low-medium', 'task workflow only', 'sdlc smoke packet --task "<task>"'),
  ];
  return [
    foothold('Manual smoke packet', 'low', 'medium for legacy/no-test work', 'task workflow only', 'sdlc smoke packet --task "<task>"'),
    foothold('Characterization test', 'medium', 'high for regression prevention', 'changed unit only', 'sdlc test suggest --task "<task>"'),
    foothold('Human QA Markdown script', 'low', 'medium', 'tester-visible workflow', 'sdlc qa script --task "<task>"'),
  ];
}

function foothold(name, effort, confidence, blastRadius, command) {
  return { name, effort, confidence, blastRadius, command };
}

function battleSoccerScenarios() {
  return [
    { id: 'tiny-visual-polish', scope: 'tiny', task: 'Battle Soccer improve one board label or visual state', proof: 'unit test or rendered smoke if UI-visible', acceptance: ['one small visual change', 'no gameplay regression', 'finish-ready explains QA need'] },
    { id: 'medium-interaction', scope: 'medium', task: 'Battle Soccer add a turn feedback animation or delay', proof: 'npm run test plus rendered/manual smoke', acceptance: ['turn still advances correctly', 'feedback is visible', 'QA script covers player/computer turn'] },
    { id: 'large-gameplay', scope: 'large', task: 'Battle Soccer add manual component placement before match start', proof: 'tests plus human QA Markdown', acceptance: ['player can place components', 'invalid placement is blocked', 'game start uses placed components'] },
    { id: 'bugfix-regression', scope: 'bugfix', task: 'Battle Soccer reproduce and fix an invalid attack or placement edge case', proof: 'failing regression test then pass', acceptance: ['bug is reproduced', 'fix is scoped', 'regression evidence captured'] },
    { id: 'finish-readiness', scope: 'finish', task: 'Battle Soccer review current task readiness for commit', proof: 'finish packet and action preview', acceptance: ['commit/push not automatic', 'open gates listed', 'human decision requested'] },
  ];
}

function testBootstrapChecklist(framework) {
  if (framework === 'dotnet') return [
    'Create or identify the focused test project.',
    'Add project reference to the unit under test.',
    'Add required test packages through the package manager.',
    'Add the test project to the solution when the repo uses a solution file.',
    'Add the smallest regression/invariant test for the active task.',
    'Run the focused test project.',
    'Run solution build/test when feasible.',
    'Record dependency warnings separately from failures.',
  ];
  if (framework === 'node') return [
    'Detect package manager and existing test runner.',
    'Add or verify the focused test runner without broad tool churn.',
    'Add the smallest regression/unit/component test for the active task.',
    'Run the focused test.',
    'Run build/typecheck when feasible.',
    'Record missing test harness as a cap if adding one is out of scope.',
  ];
  if (framework === 'deno') return [
    'Confirm deno.json/deno.jsonc task conventions.',
    'Add the smallest Deno test near the changed unit.',
    'Run the focused deno test command.',
    'Run broader Deno check/task when feasible.',
  ];
  return [
    'Identify the smallest testable unit.',
    'Choose the lowest-friction test harness already used by the repo.',
    'Add a focused regression/invariant check.',
    'Run the focused check.',
    'Record harness/setup caps separately from product failures.',
  ];
}

function testRecommendationsForSurfaces(surfaces = [], task = '') {
  const text = String(task || '').toLowerCase();
  const recommendations = [];
  const surfaceText = surfaces.join(' ').toLowerCase();
  if (matchesAny(`${text} ${surfaceText}`, ['foreign key', 'relationship', 'ef core', 'sql', 'database', 'data'])) recommendations.push('Add the smallest data/ORM invariant test that fails for the observed root cause.');
  if (matchesAny(`${text} ${surfaceText}`, ['route', 'endpoint', 'download', 'api'])) recommendations.push('Add focused API/controller/route coverage for old/new behavior when a harness exists.');
  if (matchesAny(`${text} ${surfaceText}`, ['ui', 'screen', 'page', 'layout'])) recommendations.push('Add rendered/manual smoke coverage for the changed user-visible path.');
  if (matchesAny(`${text} ${surfaceText}`, ['no automated tests', 'manual qa', 'weak test', 'legacy'])) recommendations.push('Create a test-bootstrap plan or record why manual QA is the accepted cap.');
  if (matchesAny(`${text} ${surfaceText}`, ['dependency', 'package', 'upgrade'])) recommendations.push('Run startup/build/focused regression checks that would catch the dependency break.');
  if (!recommendations.length) recommendations.push('Use the existing test command when available, or record why no new test is needed.');
  return dedupe(recommendations);
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
