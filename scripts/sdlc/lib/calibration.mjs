import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defaultCalibrationPath, defaultRunsDir } from './paths.mjs';
import { fail, formatList, printObject, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';

export function calibrateAdd(repo, options = {}) {
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
    runtime: options.runtime || '',
    modelTier: options.modelTier || '',
    retryCount: options.retryCount || '',
    misrouteTax: options.misrouteTax || '',
    task: options.task || '',
    repositoryId: options.repositoryId || options.repoId || '',
    treatment: options.treatment || options.treatmentLabel || '',
    pilot: options.pilot || '',
    manualActionCount: options.manualActionCount || '',
    estimatedMinutes: options.estimatedMinutes || '',
    tokenTurnSignal: options.tokenTurnSignal || '',
    evidenceGap: options.evidenceGap || '',
    helperReducible: options.helperReducible || '',
    candidateHelper: options.candidateHelper || '',
    evidencePath: options.evidencePath || '',
    acceptedCounterpointFindings: options.acceptedCounterpointFindings || '',
    rejectedCounterpointFindings: options.rejectedCounterpointFindings || '',
    semanticTailQuestions: options.semanticTailQuestions || '',
    contextMissing: splitList(options.contextMissing),
    verificationMissing: splitList(options.verificationMissing),
    agentMissedStep: options.agentMissedStep || '',
    docsUpdated: options.docsUpdated || '',
    issueCaught: options.issueCaught || '',
    friction: options.friction || '',
    humanOverride: options.humanOverride || '',
    humanCorrection: options.humanCorrection || '',
    processChangeProposed: options.processChangeProposed || '',
  };
  appendFileSync(outPath, `${JSON.stringify(row)}\n`, 'utf8');
  console.log(relative(repo, outPath));
}

export function calibratePilotReport(repo, options = {}) {
  const rows = readPilotRows(repo, options);
  const report = buildPilotReport(repo, rows, options);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    if (report.status === 'fail') process.exitCode = 1;
    return;
  }
  const content = formatPilotReport(report);
  const outPath = options.out ? resolve(repo, options.out) : '';
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
  if (report.status === 'fail') process.exitCode = 1;
}

export function calibratePilotTest(repo, options = {}) {
  const rows = pilotRegressionRows();
  const report = buildPilotReport(repo, rows, { ...options, minNonAgents: 2 });
  const missingTreatment = buildPilotReport(repo, rows.filter((row) => row.treatment !== 'treatment'), { ...options, minNonAgents: 2 });
  const agentsOnly = buildPilotReport(repo, rows.filter((row) => row.repositoryId === '.agents'), { ...options, minNonAgents: 2 });
  const checks = [
    {
      name: 'multi-repo baseline and treatment passes',
      status: report.status === 'pass' && report.nonAgentsRepositories >= 2 ? 'pass' : 'fail',
      detail: `status=${report.status}; nonAgents=${report.nonAgentsRepositories}; caps=${report.caps.join('; ') || 'none'}`,
    },
    {
      name: 'missing treatment caps',
      status: missingTreatment.status === 'capped' && missingTreatment.caps.some((cap) => cap.includes('missing treatment')) ? 'pass' : 'fail',
      detail: `status=${missingTreatment.status}; caps=${missingTreatment.caps.join('; ') || 'none'}`,
    },
    {
      name: 'agents-only evidence caps',
      status: agentsOnly.status === 'capped' && agentsOnly.caps.some((cap) => cap.includes('fewer than 2 non-.agents')) ? 'pass' : 'fail',
      detail: `status=${agentsOnly.status}; nonAgents=${agentsOnly.nonAgentsRepositories}; caps=${agentsOnly.caps.join('; ') || 'none'}`,
    },
  ];
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc.cycle4_pilot_regression.v1', repository: repo, rows: checks }, null, 2));
  } else {
    console.log('| Case | Status | Detail |');
    console.log('| --- | --- | --- |');
    for (const check of checks) console.log(`| ${check.name} | ${check.status} | ${check.detail} |`);
  }
  if (checks.some((check) => check.status !== 'pass')) process.exitCode = 1;
}

export function calibrateSummary(repo, options = {}) {
  const inputPath = options.in ? resolve(repo, options.in) : defaultCalibrationPath(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-calibration-summary.md`);
  if (!existsSync(inputPath)) fail(`Calibration log not found: ${relative(repo, inputPath)}`);

  const rows = readCalibrationRows(repo, options);
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

export function calibrateInspect(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true });
  const validRows = rows.filter((row) => !row.parseError);
  const caps = groupCounts(validRows.flatMap((row) => normalizeArray(row.caps)));
  const routeFit = groupCounts(validRows.map((row) => row.routeFit).filter(Boolean));
  const contextMissing = groupCounts(validRows.flatMap((row) => normalizeArray(row.contextMissing)));
  const verificationMissing = groupCounts(validRows.flatMap((row) => normalizeArray(row.verificationMissing)));
  const friction = groupCounts(validRows.map((row) => row.friction).filter(Boolean));
  const proposals = groupCounts(validRows.map((row) => row.processChangeProposed).filter(Boolean));

  printObject({
    repository: repo,
    rows: validRows.length,
    repeatedCaps: caps.length,
    routeFitSignals: routeFit.length,
    missingContextSignals: contextMissing.length,
    missingVerificationSignals: verificationMissing.length,
  });
  console.log('\n## Repeated Caps\n');
  console.log(formatCounts(caps));
  console.log('\n## Route Fit\n');
  console.log(formatCounts(routeFit));
  console.log('\n## Missing Context\n');
  console.log(formatCounts(contextMissing));
  console.log('\n## Missing Verification\n');
  console.log(formatCounts(verificationMissing));
  console.log('\n## Friction\n');
  console.log(formatCounts(friction));
  console.log('\n## Process Proposals\n');
  console.log(formatCounts(proposals));
}

export function calibratePropose(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true }).filter((row) => !row.parseError);
  const caps = groupCounts(rows.flatMap((row) => normalizeArray(row.caps)));
  const routeFit = groupCounts(rows.map((row) => row.routeFit).filter(Boolean));
  const contextMissing = groupCounts(rows.flatMap((row) => normalizeArray(row.contextMissing)));
  const verificationMissing = groupCounts(rows.flatMap((row) => normalizeArray(row.verificationMissing)));
  const friction = groupCounts(rows.map((row) => row.friction).filter(Boolean));
  const proposals = processProposals(caps, routeFit, contextMissing, verificationMissing, friction);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-calibration-proposals.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Calibration Proposals

Date: ${new Date().toISOString()}
Repository: ${repo}
Rows inspected: ${rows.length}

## Proposed Improvements

${formatList(proposals)}

## Decision Rule

- Promote repeated signals into route recipes, setup profiles, context templates, or CLI helpers only after they repeat or create high-cost failure.
- Keep project-specific facts in repo or shared context docs, not in the reusable SDLC pack.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function calibrateFlows(repo, options = {}) {
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true }).filter((row) => !row.parseError);
  const candidates = learnedFlowCandidates(rows);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Learned Flow Candidates

Date: ${new Date().toISOString()}
Repository: ${repo}
Rows inspected: ${rows.length}

## Candidates

${formatList(candidates)}

## Promotion Rule

- Do not create golden-flow scenarios from theory.
- Promote only repeated real task-flow signatures or high-cost misses.
- Human review is required before adding or changing route scenarios.
- Keep product-specific flow facts in repo/shared context docs; keep reusable process behavior in SDLC scenarios.
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function calibratePromote(repo, options = {}) {
  const candidate = options.candidate || options.signature || '';
  if (!candidate) fail('Pass --candidate "..." to draft a learned-flow promotion.');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learned-flow-promotion.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learned Flow Promotion Draft

Date: ${new Date().toISOString()}
Repository: ${repo}
Candidate: ${candidate}

## Evidence Requirement

- [ ] At least three similar real task runs, or one reviewed high-cost miss.
- [ ] Human reviewed the candidate.
- [ ] Product-specific facts are kept in repo/shared context.
- [ ] Reusable process behavior belongs in route recipes or scenarios.

## Proposed Promotion

- Scenario name:
- Route recipe change:
- Setup/context template change:
- CLI helper change:

## Approval

- Human approval:
- Date:
- Notes:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function readCalibrationRows(repo, options = {}) {
  const inputPath = options.in ? resolve(repo, options.in) : defaultCalibrationPath(repo);
  if (!existsSync(inputPath)) {
    if (options.allowMissing) return [];
    fail(`Calibration log not found: ${relative(repo, inputPath)}`);
  }
  return readFileSync(inputPath, 'utf8')
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
}

export function processProposals(caps, routeFit, contextMissing, verificationMissing, friction) {
  const proposals = [];
  for (const [cap, count] of caps.filter(([, itemCount]) => itemCount >= 2)) proposals.push(`Repeated cap "${cap}" appeared ${count} times; consider setup/profile, route recipe, or tooling support.`);
  for (const [fit, count] of routeFit.filter(([fit, itemCount]) => itemCount >= 2 && ['too heavy', 'too light'].includes(fit))) proposals.push(`Route fit "${fit}" appeared ${count} times; tune route inference or recipe gates.`);
  for (const [item, count] of contextMissing.filter(([, itemCount]) => itemCount >= 2)) proposals.push(`Missing context "${item}" appeared ${count} times; add it to setup doctor or context-root templates.`);
  for (const [item, count] of verificationMissing.filter(([, itemCount]) => itemCount >= 2)) proposals.push(`Missing verification "${item}" appeared ${count} times; add command rails or done-check coverage.`);
  for (const [item, count] of friction.filter(([, itemCount]) => itemCount >= 2)) proposals.push(`Friction "${item}" appeared ${count} times; simplify CLI/docs or add a packet helper.`);
  if (!proposals.length) proposals.push('No repeated calibration signal has crossed the proposal threshold yet.');
  return proposals;
}

export function learnedFlowCandidates(rows) {
  const validRows = rows.filter((row) => !row.parseError);
  const signatures = groupCounts(validRows.map((row) => flowSignature(row)).filter(Boolean));
  const candidates = signatures
    .filter(([, count]) => count >= 3)
    .map(([signature, count]) => `${signature} appeared ${count} times; consider promoting it into a golden-flow scenario after human review.`);
  if (!candidates.length) candidates.push('No repeated task-flow signature has enough evidence to promote into a golden-flow scenario yet.');
  return candidates;
}

function flowSignature(row) {
  const route = row.routeUsed || row.routePredicted || '';
  const checks = normalizeArray(row.checks).filter(Boolean).slice(0, 3).join('+');
  const caps = normalizeArray(row.caps).filter(Boolean).slice(0, 2).join('+');
  if (!route) return '';
  return [route, checks || 'no checks recorded', caps || 'no caps recorded'].join(' / ');
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

function groupCounts(values) {
  const counts = new Map();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function formatCounts(counts) {
  if (!counts.length) return '- none';
  return counts.map(([key, count]) => `- ${key}: ${count}`).join('\n');
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  return splitList(value);
}

function readPilotRows(repo, options = {}) {
  const inputs = splitList(options.inputs || options.in);
  const paths = inputs.length ? inputs.map((input) => resolve(repo, input)) : [defaultCalibrationPath(repo)];
  const rows = [];
  for (const inputPath of paths) {
    if (!existsSync(inputPath)) {
      rows.push({ parseError: `missing input: ${inputPath}`, sourceFile: inputPath });
      continue;
    }
    for (const row of readCalibrationRows(repo, { in: inputPath, allowMissing: true })) rows.push({ ...row, sourceFile: inputPath });
  }
  return rows;
}

function buildPilotReport(repo, rows, options = {}) {
  const validRows = rows.filter((row) => !row.parseError);
  const invalidRows = rows.filter((row) => row.parseError);
  const pilotRows = validRows.filter((row) => row.treatment || row.pilot || row.manualActionCount || row.estimatedMinutes || row.evidenceGap || row.helperReducible);
  const groups = groupPilotRows(pilotRows);
  const groupReports = groups.map(([key, groupRows]) => analyzePilotGroup(key, groupRows));
  const repositories = [...new Set(pilotRows.map((row) => repoId(row, repo)).filter(Boolean))].sort();
  const nonAgentsRepositories = repositories.filter((id) => id !== '.agents').length;
  const caps = [];
  if (!pilotRows.length) caps.push('no Cycle 4 pilot rows found');
  if (invalidRows.length) caps.push(`${invalidRows.length} invalid or missing input row(s) ignored`);
  const minNonAgents = Number(options.minNonAgents || 2);
  if (nonAgentsRepositories < minNonAgents) caps.push(`fewer than ${minNonAgents} non-.agents repositories measured; .agents is smoke evidence only`);
  for (const group of groupReports) caps.push(...group.caps.map((cap) => `${group.repositoryId}/${group.task}: ${cap}`));
  const failingGroups = groupReports.filter((group) => group.status === 'fail');
  const completeGroups = groupReports.filter((group) => group.status === 'pass');
  const status = failingGroups.length ? 'fail' : caps.length ? 'capped' : completeGroups.length ? 'pass' : 'capped';
  return {
    schema: 'sdlc.cycle4_pilot_report.v1',
    generatedAt: new Date().toISOString(),
    repository: repo,
    status,
    rows: pilotRows.length,
    invalidRows: invalidRows.length,
    repositories,
    nonAgentsRepositories,
    minNonAgents,
    groups: groupReports,
    totals: pilotTotals(groupReports),
    caps,
    recommendation: pilotRecommendation(status, groupReports, caps),
  };
}

function groupPilotRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = [repoId(row), row.task || row.taskId || 'unspecified-task'].join('::');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function analyzePilotGroup(key, rows) {
  const [repositoryId, task] = key.split('::');
  const baselineRows = rows.filter((row) => treatmentOf(row) === 'baseline');
  const treatmentRows = rows.filter((row) => treatmentOf(row) === 'treatment');
  const caps = [];
  if (!baselineRows.length) caps.push('missing baseline row');
  if (!treatmentRows.length) caps.push('missing treatment row');
  const baseline = summarizePilotRows(baselineRows);
  const treatment = summarizePilotRows(treatmentRows);
  const delta = {
    manualActionCount: numericDelta(baseline.manualActionCount, treatment.manualActionCount),
    estimatedMinutes: numericDelta(baseline.estimatedMinutes, treatment.estimatedMinutes),
    retryCount: numericDelta(baseline.retryCount, treatment.retryCount),
    misrouteTax: numericDelta(baseline.misrouteTax, treatment.misrouteTax),
    humanCorrection: numericDelta(baseline.humanCorrection, treatment.humanCorrection),
  };
  if (!baseline.tokenTurnSignals.length && !treatment.tokenTurnSignals.length) caps.push('no token/turn signal; do not claim token savings');
  const status = caps.some((cap) => cap.startsWith('missing')) ? 'capped' : 'pass';
  return {
    repositoryId,
    task,
    status,
    baseline,
    treatment,
    delta,
    evidenceGaps: dedupeStrings(rows.map((row) => row.evidenceGap).filter(Boolean)),
    helperReducibleFriction: dedupeStrings(rows.filter((row) => truthy(row.helperReducible)).map((row) => row.friction || row.candidateHelper || 'unspecified helper-reducible friction')),
    acceptedCounterpointFindings: sumNumber(rows.map((row) => row.acceptedCounterpointFindings)),
    rejectedCounterpointFindings: sumNumber(rows.map((row) => row.rejectedCounterpointFindings)),
    semanticTailQuestions: sumNumber(rows.map((row) => row.semanticTailQuestions)),
    caps,
  };
}

function summarizePilotRows(rows) {
  return {
    rows: rows.length,
    route: dedupeStrings(rows.map((row) => row.routeUsed || row.routePredicted || row.route).filter(Boolean)).join(', ') || 'unknown',
    routeFit: dedupeStrings(rows.map((row) => row.routeFit).filter(Boolean)).join(', ') || '',
    manualActionCount: sumNumber(rows.map((row) => row.manualActionCount)),
    estimatedMinutes: sumNumber(rows.map((row) => row.estimatedMinutes)),
    retryCount: sumNumber(rows.map((row) => row.retryCount)),
    misrouteTax: sumNumber(rows.map((row) => row.misrouteTax)),
    humanCorrection: sumNumber(rows.map((row) => row.humanCorrection)),
    tokenTurnSignals: dedupeStrings(rows.map((row) => row.tokenTurnSignal).filter(Boolean)),
    checks: dedupeStrings(rows.flatMap((row) => normalizeArray(row.checks))),
    caps: dedupeStrings(rows.flatMap((row) => normalizeArray(row.caps))),
  };
}

function pilotTotals(groups) {
  return {
    measuredGroups: groups.length,
    passGroups: groups.filter((group) => group.status === 'pass').length,
    cappedGroups: groups.filter((group) => group.status === 'capped').length,
    manualActionDelta: sumNumber(groups.map((group) => group.delta.manualActionCount)),
    estimatedMinutesDelta: sumNumber(groups.map((group) => group.delta.estimatedMinutes)),
    retryDelta: sumNumber(groups.map((group) => group.delta.retryCount)),
    misrouteTaxDelta: sumNumber(groups.map((group) => group.delta.misrouteTax)),
    humanCorrectionDelta: sumNumber(groups.map((group) => group.delta.humanCorrection)),
  };
}

function formatPilotReport(report) {
  return `# Cycle 4 Pilot Report

Date: ${report.generatedAt}
Repository: ${report.repository}
Status: ${report.status}
Rows: ${report.rows}
Repositories: ${report.repositories.join(', ') || 'none'}
Non-.agents repositories: ${report.nonAgentsRepositories}/${report.minNonAgents}

## Totals

- measured groups: ${report.totals.measuredGroups}
- pass groups: ${report.totals.passGroups}
- capped groups: ${report.totals.cappedGroups}
- manual action delta: ${formatDelta(report.totals.manualActionDelta)}
- estimated minutes delta: ${formatDelta(report.totals.estimatedMinutesDelta)}
- retry delta: ${formatDelta(report.totals.retryDelta)}
- misroute tax delta: ${formatDelta(report.totals.misrouteTaxDelta)}
- human correction delta: ${formatDelta(report.totals.humanCorrectionDelta)}

## Groups

${report.groups.length ? report.groups.map(formatPilotGroup).join('\n\n') : '- none'}

## Caps

${formatList(report.caps)}

## Recommendation

${report.recommendation}
`;
}

function formatPilotGroup(group) {
  return `### ${group.repositoryId}: ${group.task}

Status: ${group.status}
Baseline route: ${group.baseline.route}
Treatment route: ${group.treatment.route}
Manual action delta: ${formatDelta(group.delta.manualActionCount)}
Estimated minutes delta: ${formatDelta(group.delta.estimatedMinutes)}
Retry delta: ${formatDelta(group.delta.retryCount)}
Misroute tax delta: ${formatDelta(group.delta.misrouteTax)}
Human correction delta: ${formatDelta(group.delta.humanCorrection)}
Evidence gaps: ${group.evidenceGaps.join(', ') || 'none'}
Helper-reducible friction: ${group.helperReducibleFriction.join(', ') || 'none'}
Counterpoint findings: accepted ${group.acceptedCounterpointFindings}, rejected ${group.rejectedCounterpointFindings}
Semantic-tail questions: ${group.semanticTailQuestions}
Caps: ${group.caps.join('; ') || 'none'}`;
}

function pilotRecommendation(status, groups, caps) {
  if (status === 'fail') return 'defer: fix invalid pilot data before using Cycle 4 evidence.';
  if (caps.length) return 'repeat: collect missing baseline/treatment or non-.agents repository evidence before automation expansion.';
  const helpfulGroups = groups.filter((group) => group.delta.manualActionCount < 0 || group.delta.estimatedMinutes < 0 || group.delta.retryCount < 0 || group.delta.humanCorrection < 0);
  if (helpfulGroups.length === groups.length && groups.length) return 'promote cautiously: repeat on another active repository set before delegated execution.';
  if (helpfulGroups.length) return 'narrow: keep helper-compiled treatment only where measured deltas improved.';
  return 'defer: no measured orchestration or repair-loop improvement.';
}

function pilotRegressionRows() {
  return [
    pilotRow('.agents', 'control-plane smoke', 'baseline', 4, 20),
    pilotRow('.agents', 'control-plane smoke', 'treatment', 3, 15),
    pilotRow('api-service', 'standard service task', 'baseline', 6, 45),
    pilotRow('api-service', 'standard service task', 'treatment', 4, 32),
    pilotRow('ui-app', 'standard ui task', 'baseline', 7, 55),
    pilotRow('ui-app', 'standard ui task', 'treatment', 5, 38),
  ];
}

function pilotRow(repositoryId, task, treatment, manualActionCount, estimatedMinutes) {
  return {
    repositoryId,
    task,
    treatment,
    routeUsed: 'standard',
    routeFit: 'right-sized',
    manualActionCount,
    estimatedMinutes,
    retryCount: treatment === 'baseline' ? 1 : 0,
    misrouteTax: 0,
    humanCorrection: treatment === 'baseline' ? 1 : 0,
    tokenTurnSignal: treatment === 'baseline' ? 'baseline turns recorded' : 'treatment turns recorded',
    friction: treatment === 'baseline' ? 'manual evidence translation' : 'helper-compiled evidence',
    helperReducible: treatment === 'baseline' ? 'yes' : 'no',
    checks: ['synthetic'],
  };
}

function treatmentOf(row) {
  const treatment = String(row.treatment || row.treatmentLabel || '').toLowerCase();
  if (['baseline', 'control', 'current'].includes(treatment)) return 'baseline';
  if (['treatment', 'helper', 'helper-compiled'].includes(treatment)) return 'treatment';
  return treatment || 'unknown';
}

function repoId(row, fallback = '') {
  const value = row.repositoryId || row.repoId || row.repository || row.repo || fallback;
  const text = String(value || '').trim();
  if (!text) return 'unknown-repo';
  if (text.endsWith('/.agents') || text === '.agents') return '.agents';
  return text.split(/[\\/]/).filter(Boolean).pop() || text;
}

function numericDelta(baseline, treatment) {
  return Number((Number(treatment || 0) - Number(baseline || 0)).toFixed(3));
}

function sumNumber(values) {
  return Number(values.reduce((sum, value) => sum + Number(value || 0), 0).toFixed(3));
}

function truthy(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value || '').toLowerCase());
}

function dedupeStrings(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function formatDelta(value) {
  const number = Number(value || 0);
  return number > 0 ? `+${number}` : String(number);
}
