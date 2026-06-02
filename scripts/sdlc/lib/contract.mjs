import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, formatList, printObject, readJsonIfExists, safeWriteJsonFile, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferContracts } from './routes.mjs';
import { inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';

export function contractPacket(repo, options = {}) {
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

export function contractTask(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const contract = taskContract(repo, task, { ...options, route, git, profile, surfaces, qaMode });
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slugTask(task)}-task-contract.json`);
  safeWriteJsonFile(repo, outPath, contract);
  console.log(relative(repo, outPath));
}

export function contractCheck(repo, options = {}) {
  const packet = options.packet || options.file || '';
  if (!packet) fail('Pass --packet <path>.');
  const contract = readJsonIfExists(resolve(repo, packet));
  if (!contract) fail(`Could not read contract packet: ${packet}`);
  const findings = contractFindings(contract);
  printObject({ task: contract.task || 'unknown', route: contract.route || 'unknown', result: findings.some((row) => row.status === 'open') ? 'open' : 'ready' });
  console.log('\n| Area | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const row of findings) console.log(`| ${row.area} | ${row.status} | ${row.detail} |`);
  if (findings.some((row) => row.status === 'open' && row.required)) process.exitCode = 1;
}

export function taskContract(repo, task, context = {}) {
  const profile = context.profile || loadProfile(repo);
  const git = context.git || getGitInfo(repo);
  const route = context.route || inferRouteFromTask(task, git, profile.values);
  const surfaces = context.surfaces || inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const qaMode = context.qaMode || qaModeForSurfaces(surfaces, task);
  const recipes = matchRecipes(task, git, profile.values);
  const triggers = securityTriggers(task, profile.values);
  const criteria = criteriaFromOptions(context);
  return {
    schema: 'sdlc-task-contract-v1',
    generatedAt: new Date().toISOString(),
    task,
    route,
    repository: repo,
    branch: git.branch || '',
    source: context.ticket ? 'ticket' : 'human-task',
    ticket: context.ticket || '',
    intent: context.intent || task,
    acceptanceCriteria: criteria,
    nonGoals: listOption(context.nonGoals),
    affectedActors: listOption(context.actors),
    testingSurfaces: surfaces,
    qaMode,
    qaExpectations: qaExpectations(task, qaMode),
    constraints: constraintsForTask(task, triggers),
    securityTriggers: triggers,
    recipes: recipes.map((row) => row.id),
    commitPushIntent: context.finishIntent || 'human decides at finish; no automatic merge/deploy/release',
    openQuestions: openQuestions(task, criteria, triggers),
    evidenceRequired: criteria.map((criterion, index) => ({ criterionId: criterion.id, proofNeeded: proofForCriterion(criterion.text, surfaces, qaMode), status: 'open' })),
  };
}

function criteriaFromOptions(options = {}) {
  const criteria = listOption(options.acceptance || options.criteria);
  if (criteria.length) return criteria.map((text, index) => ({ id: `ac-${index + 1}`, text, source: 'provided' }));
  const task = String(options.task || options.intent || '');
  return [{ id: 'ac-1', text: task || 'Task outcome is clarified and completed.', source: 'task-summary' }];
}

function qaExpectations(task, qaMode) {
  if (/qa|quality assurance|tester|youtrack/i.test(task)) return ['produce Markdown QA script for human testers'];
  if (qaMode === 'api-contract') return ['produce API/developer validation steps, not rendered UI review'];
  if (qaMode === 'rendered-ui') return ['include visible workflow and expected UI behavior'];
  if (qaMode === 'data') return ['include safe data setup and expected persisted state'];
  return ['state developer validation evidence and QA cap or handoff need'];
}

function constraintsForTask(task, triggers) {
  const constraints = ['do not merge, deploy, release, or push without explicit human approval'];
  if (triggers.some((trigger) => /ticket/i.test(trigger))) constraints.push('do not post ticket updates or change ticket status without approval');
  if (triggers.some((trigger) => /database/i.test(trigger))) constraints.push('use read-only database evidence only when bounded and redacted; no writes/migrations/backfills');
  if (/sensitive|production|prod|customer|private/i.test(task)) constraints.push('keep sensitive details local and sanitized');
  return constraints;
}

function openQuestions(task, criteria, triggers) {
  const questions = [];
  if (!criteria.length || criteria[0].source === 'task-summary') questions.push('Are the acceptance criteria complete enough, or should the ticket/human clarify expected behavior?');
  if (triggers.some((trigger) => /ticket/i.test(trigger))) questions.push('Is ticket-system access available, and is read-only evidence sufficient?');
  if (triggers.some((trigger) => /database/i.test(trigger))) questions.push('What environment and query boundary are approved for database evidence?');
  if (/commit|push/i.test(task)) questions.push('At finish, should this stop at commit preview, commit, or push approval?');
  return questions;
}

function proofForCriterion(text, surfaces, qaMode) {
  if (surfaces.includes('rendered-product-ui')) return 'rendered/browser smoke, UI test, or explicit cap';
  if (surfaces.includes('api-contract') || qaMode === 'api-contract') return 'API request/response, contract test, Swagger/developer validation, or cap';
  if (surfaces.includes('data-persistence')) return 'data evidence, regression test, or redacted query/evidence cap';
  if (/docs|readme|markdown/i.test(text)) return 'diff inspection and docs hygiene check';
  return 'targeted automated check, smoke/manual evidence, or explicit cap';
}

function contractFindings(contract) {
  return [
    { area: 'acceptance criteria', status: contract.acceptanceCriteria?.length ? 'ready' : 'open', required: true, detail: contract.acceptanceCriteria?.length ? `${contract.acceptanceCriteria.length} criterion/criteria` : 'missing acceptance criteria' },
    { area: 'testing surface', status: contract.testingSurfaces?.length ? 'ready' : 'open', required: true, detail: (contract.testingSurfaces || []).join(', ') || 'missing testing surface' },
    { area: 'qa expectations', status: contract.qaExpectations?.length ? 'ready' : 'open', required: false, detail: (contract.qaExpectations || []).join('; ') || 'missing QA expectations' },
    { area: 'approval boundary', status: /no automatic|human/i.test(contract.commitPushIntent || '') ? 'ready' : 'open', required: true, detail: contract.commitPushIntent || 'missing commit/push/release boundary' },
    { area: 'open questions', status: contract.openQuestions?.length ? 'open' : 'ready', required: false, detail: contract.openQuestions?.length ? contract.openQuestions.join('; ') : 'none' },
  ];
}

function listOption(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || '').split(/[\n;|]/).map((item) => item.trim()).filter(Boolean);
}

function slugTask(task) {
  return String(task || 'task').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'task';
}
