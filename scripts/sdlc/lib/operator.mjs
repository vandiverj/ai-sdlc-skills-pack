import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { escapeCommandArg, fail, formatList, printObject, readJsonLines, safeWriteJsonFile } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadTaskJournal, upsertTaskJournal, validateJournal } from './journal.mjs';
import { analyzePrompt } from './prompt.mjs';
import { buildLocalFirstPlan, buildToolInventory } from './tools.mjs';
import { inferMode } from './modes.mjs';
import { recommendAgentPackets } from './agentpackets.mjs';
import { buildCommandRecommendation } from './commandplan.mjs';
import { defaultRunsDir, defaultScratchScriptsDir } from './paths.mjs';

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
    missing: [
      ...rec.recommendations.filter((row) => row.priority !== 'next').map((row) => row.command).slice(0, 4),
      ...(phase === 'finish' ? buildScopeSummary(repo).warnings : []),
    ],
    scope: phase === 'finish' ? buildScopeSummary(repo) : undefined,
    recommendations: rec.recommendations,
    nextLocalAction: rec.recommendations[0]?.command || `sdlc operator next --task "${escapeCommandArg(task)}"`,
  }, options);
  outputOperator(result, options);
}

function buildScopeSummary(repo) {
  const git = getGitInfo(repo);
  const warnings = [];
  const changedScripts = git.changedFiles.filter((file) => /\.(ps1|sh|cmd|bat)$/i.test(file) && !String(file).replace(/\\/g, '/').startsWith('.ai-local/sdlc-scratch/scripts/'));
  const protectedSurfaces = git.changedFiles.filter((file) => /(^|\/)(test|tests|__tests__|snapshots?|baselines?|scripts|tools|\.github\/workflows)(\/|$)/i.test(String(file).replace(/\\/g, '/')) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(file));
  if (changedScripts.length) warnings.push(`Temporary scripts outside controlled scratch folder: ${changedScripts.join(', ')}`);
  if (protectedSurfaces.length) warnings.push(`Protected evidence/tooling surfaces changed: ${protectedSurfaces.join(', ')}`);
  return {
    changedFiles: git.changedFiles.length,
    changedScripts,
    protectedSurfaces,
    warnings,
  };
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

export function operatorDashboard(repo, options = {}) {
  const task = requireTask(options);
  const journal = loadTaskJournal(repo, task, options);
  const git = getGitInfo(repo);
  const journalChecks = validateJournal(journal);
  const commandRec = buildCommandRecommendation(repo, task, { ...options, phase: options.phase || 'verify' });
  const captures = readJsonLines(join(defaultRunsDir(repo), 'command-captures.jsonl')).filter((row) => row.task === task);
  const passedCaptures = captures.filter((row) => row.status === 'pass');
  const cappedCaptures = captures.filter((row) => row.status === 'cap');
  const missing = [
    ...journalChecks.filter((row) => row.status !== 'pass').map((row) => `${row.check}: ${row.detail}`),
    ...(captures.length ? [] : ['No command evidence captured yet.']),
  ];
  const scratchWarnings = scratchScriptWarnings(repo, git.changedFiles);
  const agentRows = recommendAgentPackets(repo, task, options);
  const nextLocalAction = chooseDashboardAction({
    missing,
    scratchWarnings,
    passedCaptures,
    commandRec,
    task,
  });
  const result = operatorResult(repo, task, 'dashboard', {
    route: journal.route || commandRec.route || 'unknown',
    mode: journal.mode || inferMode(repo, task, options).mode,
    branch: git.branch || 'unknown',
    changedFiles: git.changedFiles.slice(0, 40),
    proved: [
      ...passedCaptures.map((row) => row.summary || row.command),
      ...(journal.promptAnalysis ? ['prompt analysis present'] : []),
      ...(journal.localFirst ? ['local-first plan present'] : []),
    ],
    inferred: [
      journal.route ? `route: ${journal.route}` : '',
      journal.qaMode ? `qa mode: ${journal.qaMode}` : '',
      agentRows.some((row) => row.recommendation !== 'skip') ? 'agent handoff packet may help' : 'single-agent path likely enough',
    ].filter(Boolean),
    capped: cappedCaptures.map((row) => row.capReason || row.summary || row.command),
    missing,
    needsHumanDecision: dashboardDecisionRows(git, scratchWarnings, cappedCaptures),
    scratchWarnings,
    commandRecommendations: commandRec.recommendations.slice(0, 5),
    agentRecommendations: agentRows,
    nextLocalAction,
    summary: dashboardSummary({ git, passedCaptures, cappedCaptures, missing, scratchWarnings, nextLocalAction }),
  }, options);
  outputOperator(result, options);
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
  if (result.summary) {
    console.log('\n## Summary\n');
    console.log(result.summary);
  }
  if (result.needsHumanDecision?.length) {
    console.log('\n## Needs Human Decision\n');
    console.log(formatList(result.needsHumanDecision));
  }
}

function chooseDashboardAction({ missing, scratchWarnings, passedCaptures, commandRec, task }) {
  if (scratchWarnings.length) return 'sdlc artifact scratch-audit';
  const missingJournalCommand = missing.find((row) => row.includes('missing; run '));
  if (missingJournalCommand) return missingJournalCommand.replace(/^.*missing; run /, '');
  if (!passedCaptures.length) return commandRec.recommendations[0]?.command || `sdlc command recommend --task "${escapeCommandArg(task)}" --phase verify`;
  return `sdlc operator finish-ready --task "${escapeCommandArg(task)}"`;
}

function scratchScriptWarnings(repo, changedFiles = []) {
  const scratchRel = relative(repo, defaultScratchScriptsDir(repo)).replace(/\\/g, '/');
  return changedFiles
    .filter((file) => /\.(ps1|sh|cmd|bat)$/i.test(file))
    .filter((file) => !String(file).replace(/\\/g, '/').startsWith(`${scratchRel}/`))
    .map((file) => `${file} is a changed script outside ${scratchRel}/`);
}

function dashboardDecisionRows(git, scratchWarnings, cappedCaptures) {
  const rows = [];
  if (scratchWarnings.length) rows.push('Move, delete, or intentionally keep temporary scripts before commit.');
  if (cappedCaptures.length) rows.push('Accept or resolve capped verification before claiming high confidence.');
  if (git.ahead > 0) rows.push('Branch has unpushed commits; push still requires explicit human approval.');
  if (git.behind > 0) rows.push('Branch is behind upstream; decide whether to pull/rebase before further work.');
  return rows;
}

function dashboardSummary({ git, passedCaptures, cappedCaptures, missing, scratchWarnings, nextLocalAction }) {
  return [
    `Changed files: ${git.changedFiles.length}.`,
    `Passed command evidence: ${passedCaptures.length}.`,
    `Caps: ${cappedCaptures.length}.`,
    `Open gaps: ${missing.length}.`,
    `Scratch warnings: ${scratchWarnings.length}.`,
    `Next: ${nextLocalAction}.`,
  ].join(' ');
}
