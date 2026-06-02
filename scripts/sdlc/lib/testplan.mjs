import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, fail, formatInlineList, formatList, readJsonIfExists, safeWriteTextFile, stamp } from './common.mjs';
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

function inferBootstrapFramework(repo) {
  if (hasFileExt(repo, ['.csproj', '.sln'])) return 'dotnet';
  if (existsAny(repo, ['package.json'])) return 'node';
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) return 'deno';
  return 'generic';
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
