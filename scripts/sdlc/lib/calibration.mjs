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
