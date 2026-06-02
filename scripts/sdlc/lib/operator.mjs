import { join, relative, resolve } from 'node:path';
import { escapeCommandArg, fail, formatList, printObject, safeWriteJsonFile } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadTaskJournal, upsertTaskJournal, validateJournal } from './journal.mjs';
import { analyzePrompt } from './prompt.mjs';
import { buildLocalFirstPlan, buildToolInventory } from './tools.mjs';
import { inferMode } from './modes.mjs';
import { recommendAgentPackets } from './agentpackets.mjs';
import { buildCommandRecommendation } from './commandplan.mjs';

export function operatorStart(repo, options = {}) {
  const task = requireTask(options);
  const promptAnalysis = analyzePrompt(task, repo, options);
  const localFirst = buildLocalFirstPlan(repo, task, options);
  const mode = inferMode(repo, task, options).mode;
  const journal = upsertTaskJournal(repo, task, {
    mode,
    promptAnalysis,
    localFirst,
    decisions: [`Operator start recorded mode ${mode}.`],
    nextRecommendedAction: `sdlc operator next --task "${escapeCommandArg(task)}"`,
  }, options);
  const result = operatorResult(repo, task, 'start', {
    mode,
    route: journal.route,
    proved: ['prompt analyzed', 'tool inventory/capability plan generated', 'run journal updated'],
    missing: validateJournal(journal).filter((row) => row.status !== 'pass').map((row) => `${row.check}: ${row.detail}`),
    nextLocalAction: `sdlc operator inspect --task "${escapeCommandArg(task)}"`,
    journal: relative(repo, journal.paths.markdown),
  }, options);
  outputOperator(result, options);
}

export function operatorInspect(repo, options = {}) {
  const task = requireTask(options);
  const journal = loadTaskJournal(repo, task, options);
  const git = getGitInfo(repo);
  const agents = recommendAgentPackets(repo, task, options);
  const verify = buildCommandRecommendation(repo, task, { ...options, phase: 'verify' });
  outputOperator(operatorResult(repo, task, 'inspect', {
    route: journal.route || 'unknown',
    branch: git.branch || 'unknown',
    changedFiles: git.changedFiles,
    journalChecks: validateJournal(journal),
    agentRecommendations: agents,
    commandRecommendations: verify.recommendations.slice(0, 5),
    nextLocalAction: `sdlc operator next --task "${escapeCommandArg(task)}"`,
  }, options), options);
}

export function operatorPhase(repo, phase, options = {}) {
  const task = requireTask(options);
  const rec = buildCommandRecommendation(repo, task, { ...options, phase });
  const journal = loadTaskJournal(repo, task, options);
  const result = operatorResult(repo, task, `${phase}-ready`, {
    route: journal.route || rec.route,
    phase,
    proved: rec.recommendations.filter((row) => row.evidenceClass === 'deterministic-proof').map((row) => row.command),
    missing: rec.recommendations.filter((row) => row.priority !== 'next').map((row) => row.command).slice(0, 4),
    recommendations: rec.recommendations,
    nextLocalAction: rec.recommendations[0]?.command || `sdlc operator next --task "${escapeCommandArg(task)}"`,
  }, options);
  outputOperator(result, options);
}

export function operatorNext(repo, options = {}) {
  const task = requireTask(options);
  const journal = loadTaskJournal(repo, task, options);
  const checks = validateJournal(journal);
  const firstWarn = checks.find((row) => row.status === 'block' || row.status === 'warn');
  let action = firstWarn?.detail?.startsWith('missing; run ') ? firstWarn.detail.replace('missing; run ', '') : '';
  if (!action) action = buildCommandRecommendation(repo, task, { ...options, phase: 'verify' }).recommendations[0]?.command || `sdlc finish-ready --task "${escapeCommandArg(task)}"`;
  outputOperator(operatorResult(repo, task, 'next', {
    route: journal.route || 'unknown',
    reason: firstWarn ? `${firstWarn.check}: ${firstWarn.detail}` : 'No journal consistency blockers detected; use next verification/finish action.',
    nextLocalAction: action,
  }, options), options);
}

function requireTask(options) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  return task;
}

function operatorResult(repo, task, phase, data, options) {
  const result = {
    schema: 'sdlc-operator-result-v1',
    generatedAt: new Date().toISOString(),
    repository: repo,
    task,
    phase,
    ...data,
    boundaries: ['no automatic commit/push', 'no merge/deploy/release automation', 'human approval gates remain active'],
  };
  if (options.out) safeWriteJsonFile(repo, resolve(repo, options.out), result);
  return result;
}

function outputOperator(result, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  printObject({
    task: result.task,
    phase: result.phase,
    route: result.route || 'unknown',
    nextLocalAction: result.nextLocalAction || 'none',
  });
  if (result.proved) {
    console.log('\n## Proved / Checked\n');
    console.log(formatList(result.proved));
  }
  if (result.missing) {
    console.log('\n## Missing / Follow-Up\n');
    console.log(formatList(result.missing));
  }
  if (result.recommendations) {
    console.log('\n## Recommendations\n');
    console.log(formatList(result.recommendations.map((row) => `${row.command} - ${row.why}`)));
  }
}
