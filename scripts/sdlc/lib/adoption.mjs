import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultFeedbackPath, defaultRunsDir } from './paths.mjs';
import { escapeCommandArg, fail, formatList, printObject, readJsonLines, stamp } from './common.mjs';
import { git, getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { inferRouteFromTask } from './routes.mjs';

const modulePath = fileURLToPath(import.meta.url);
const agentsRoot = resolve(dirname(modulePath), '..', '..', '..');

export function automationBudget(repo, options = {}) {
  const route = options.route || inferRouteFromTask(options.task || '', getGitInfo(repo), loadProfile(repo).values);
  const budget = automationBudgetForRoute(route);
  printObject({
    repository: repo,
    route,
    level: budget.level,
    defaultMode: budget.mode,
    stopBehavior: budget.stopBehavior,
  });
  console.log('\n## Automation\n');
  console.log(formatList(budget.actions));
}

export function sdlcEvent(repo, action, options = {}) {
  const task = options.task || options.prompt || '';
  const route = task ? inferRouteFromTask(task, getGitInfo(repo), loadProfile(repo).values) : 'unknown';
  const budget = automationBudgetForRoute(route);
  const recommendations = eventRecommendations(action, task, route, budget);
  printObject({
    repository: repo,
    event: action,
    task: task || 'not provided',
    route,
    automationMode: budget.mode,
  });
  console.log('\n## Recommendations\n');
  console.log(formatList(recommendations));
}

export function onboardingPilot(repo, options = {}) {
  void options;
  const profile = loadProfile(repo);
  const gitInfo = getGitInfo(repo);
  const content = `# SDLC First-Use Pilot

Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Branch: ${gitInfo.branch || 'unknown'}

## Goal

Prove the SDLC can set up a repository, run one tiny safe task, review completion, and capture feedback without relying on private chat history.

## Prompt 1: Setup

\`\`\`text
Use SDLC to set up this repository for AI-assisted work. Explain what files you propose to create or update before changing them.
\`\`\`

Expected output:
- repository/profile gaps,
- local context/evidence location,
- commands and verification maturity,
- human approval boundaries.

## Prompt 2: Tiny Safe Task

\`\`\`text
Use SDLC for this tiny safe task: <small docs or low-risk code change>. Determine scope, implement, verify, and stop at the finish decision before commit or push.
\`\`\`

Expected output:
- route,
- changed files,
- one verification path or cap,
- QA need or not-needed rationale,
- finish decision.

## Prompt 3: Completion Review

\`\`\`text
Use SDLC to review the current completion state of this task: <task>. Tell me what evidence exists, what is missing, whether QA is ready, and what you recommend next.
\`\`\`

## Prompt 4: Feedback

\`\`\`text
Use SDLC to capture feedback on this SDLC run. Keep it sanitized and local unless I approve sharing.
\`\`\`

CLI shortcut:

\`\`\`bash
sdlc feedback quick --task "<task>" --friction "<category>" --note "<sanitized note>"
\`\`\`

## Boundaries

- Commit/push require explicit human approval.
- Merge/deploy/release/MR/PR/pipeline/manual file movement are not automatic.
- Feedback is about improving the SDLC, not measuring the developer.
`;
  console.log(content.trimEnd());
}

export function welcome(repo, options = {}) {
  console.log(`# Welcome To The AI SDLC

This pack is usually installed once under your user-level \`.agents\` folder so multiple coding agents and repositories can use the same process.

Start in chat:

\`\`\`text
Use SDLC for this task: <task>. Determine scope, gather context, implement, verify, generate QA Markdown if needed, and stop before commit or push.
\`\`\`

Small CLI fallback:

\`\`\`bash
sdlc console help
sdlc start --task "<task>"
sdlc next --task "<task>"
sdlc finish-ready --task "<task>"
\`\`\`

The SDLC will not automatically merge, deploy, release, push, post ticket updates, or mutate databases.
`);
}

export function setupWizard(repo, options = {}) {
  const profile = loadProfile(repo);
  const gitInfo = getGitInfo(repo);
  printObject({
    repository: repo,
    branch: gitInfo.branch || 'unknown',
    profile: profile.path ? relative(repo, profile.path) : 'missing',
    nextSetupCommand: profile.path ? 'sdlc setup doctor --fix-plan' : 'sdlc setup bootstrap',
    firstTaskCommand: 'sdlc start --task "<small safe task>"',
  });
  console.log('\n## Wizard Steps\n');
  console.log(formatList([
    'Confirm this repo can keep .ai-local ignored/local.',
    'Create or review .ai-local/sdlc-profile.md.',
    'Map deployable units when one repo contains multiple projects.',
    'Configure shared context root only for sanitized/local product memory.',
    'Run one tiny pilot task before high-risk production work.',
  ]));
}

export function demo(repo, options = {}) {
  const task = options.task || 'tiny safe SDLC demo task';
  console.log(`# SDLC Demo

Try this in chat:

\`\`\`text
Use SDLC for this tiny safe task: ${task}. Determine scope, make the change, verify it, and stop at the finish decision before commit or push.
\`\`\`

Or inspect the CLI path:

\`\`\`bash
sdlc start --task "${escapeCommandArg(task)}"
sdlc next --task "${escapeCommandArg(task)}"
sdlc console status --task "${escapeCommandArg(task)}"
\`\`\`

After the run:

\`\`\`text
Use SDLC to capture feedback on this run. Keep it sanitized and local unless I approve sharing.
\`\`\`
`);
}

export function feedbackQuick(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so feedback can be tied to a run.');
  const row = feedbackRow(repo, {
    ...options,
    source: options.source || 'developer',
    task,
    friction: options.friction || options.category || 'other',
    note: options.note || options.summary || '',
  });
  appendFeedbackRow(repo, row);
  printObject({
    repository: repo,
    feedback: 'captured locally',
    friction: row.friction,
    shareStatus: row.shareStatus,
    nextCommand: 'sdlc feedback review --since ' + row.timestamp.slice(0, 10),
  });
}

export function feedbackFriction(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const type = options.type || options.friction || 'confusion';
  const row = feedbackRow(repo, {
    ...options,
    task,
    source: options.source || 'developer',
    friction: type,
    note: options.note || options.summary || '',
  });
  appendFeedbackRow(repo, row);
  printObject({ feedback: 'captured locally', task, type, shareStatus: row.shareStatus, next: 'sdlc feedback synthesize' });
}

export function feedbackSynthesize(repo, options = {}) {
  const rows = filterSince(readFeedbackRows(repo, options), options.since || '');
  const groups = groupCounts(rows.map((row) => normalizeFriction(row.friction || 'other')));
  const result = {
    schema: 'sdlc-feedback-synthesis-v1',
    generatedAt: new Date().toISOString(),
    since: options.since || 'all',
    total: rows.length,
    groups,
    topActions: groupEntries(groups).slice(0, 5).map(([type, count]) => `${type}: ${count}`),
    candidateStatuses: feedbackCandidateStatuses(groups),
    candidatePlan: feedbackCandidatePlan(groups),
  };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    printObject({ feedbackItems: result.total, since: result.since });
    console.log(formatList(result.topActions));
  }
}

export function feedbackActionPlan(repo, options = {}) {
  const rows = filterSince(readFeedbackRows(repo, options), options.since || '');
  const groups = groupCounts(rows.map((row) => normalizeFriction(row.friction || 'other')));
  const content = `# SDLC Feedback Action Plan

Date: ${new Date().toISOString()}
Since: ${options.since || 'all'}

## Top Friction

${formatList(groupEntries(groups).map(([type, count]) => `${type}: ${count}`))}

## Recommended Actions

${formatList(groupEntries(groups).map(([type]) => actionForFriction(type)))}

## Review Status

${formatList(feedbackCandidateStatuses(groups).map((row) => `${row.category}: ${row.status}`))}

## Candidate Implementation Plan

${formatList(feedbackCandidatePlan(groups))}
`;
  if (options.out) {
    const outPath = resolve(repo, options.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else console.log(content.trimEnd());
}

export function feedbackCapture(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so feedback can be tied to a run.');
  const row = feedbackRow(repo, options);
  appendFeedbackRow(repo, row);
  const outPath = join(defaultRunsDir(repo), `${stamp()}-feedback-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderFeedbackPacket(row), 'utf8');
  console.log(relative(repo, outPath));
}

export function feedbackReview(repo, options = {}) {
  const rows = readFeedbackRows(repo, options);
  const since = options.since || '';
  const filtered = filterSince(rows, since);
  const groups = groupCounts(filtered.map((row) => row.friction || 'other'));
  const owners = groupCounts(filtered.map(feedbackOwner));
  const highSeverity = filtered.filter((row) => ['blocked', 'unsafe', 'data-risk', 'wrong-route'].includes(String(row.friction || '').toLowerCase()));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Feedback Review

Date: ${new Date().toISOString()}
Repository: ${repo}
Since: ${since || 'all'}
Rows reviewed: ${filtered.length}

## Friction Categories

${formatCounts(groups)}

## Proposed Owners

${formatCounts(owners)}

## High-Severity Events

${formatList(highSeverity.map((row) => `${row.timestamp}: ${row.friction} - ${row.note || row.suggestedImprovement || 'no note'}`))}

## Improvement Candidates

${formatList(feedbackImprovementCandidates(filtered))}

## Privacy Rule

- Do not promote raw prompts, source snippets, production logs, private URLs, customer/client names, credentials, or secrets.
- Promote only sanitized summaries into shared learnings.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function feedbackSummary(repo, options = {}) {
  const rows = filterSince(readFeedbackRows(repo, options), options.since || '');
  printObject({
    repository: repo,
    rows: rows.length,
    setupCompleted: countTruthy(rows, 'setupCompleted'),
    finishReached: countTruthy(rows, 'finishReached'),
    evidenceUnderstood: countTruthy(rows, 'evidenceUnderstood'),
    qaUseful: rows.filter((row) => row.qaScriptUseful === 'yes').length,
    topFriction: groupCounts(rows.map((row) => row.friction || 'other'))[0]?.join(': ') || 'none',
  });
  console.log('\n## Friction\n');
  console.log(formatCounts(groupCounts(rows.map((row) => row.friction || 'other'))));
  console.log('\n## Suggested Improvements\n');
  console.log(formatList(feedbackImprovementCandidates(rows)));
}

function automationBudgetForRoute(route) {
  if (['tiny-docs', 'tiny-code-cleanup'].includes(route)) return { level: 'minimal', mode: 'suggest', stopBehavior: 'optional summary', actions: ['changed-files awareness', 'one cheap check or explicit cap'] };
  if (['bugfix-live-system', 'multi-repo-integration', 'contract-first'].includes(route)) return { level: 'expanded', mode: 'run safe local / ask on gates', stopBehavior: 'block on open high-risk gates', actions: ['preflight', 'context resolve', 'active search when relevant', 'risk check', 'QA handoff'] };
  if (route === 'release-push') return { level: 'guarded', mode: 'block/ask', stopBehavior: 'block before credentialed action', actions: ['permission policy', 'git packet', 'final gates', 'human approval'] };
  return { level: 'standard', mode: 'suggest / run safe local', stopBehavior: 'warn on open gates', actions: ['preflight', 'verification packet', 'finish confidence'] };
}

function eventRecommendations(action, task, route, budget) {
  if (action === 'prompt-submit') return [`route candidate: ${route}`, `automation budget: ${budget.level}`, task ? `next: sdlc task preflight --task "${escapeCommandArg(task)}"` : 'capture task text before routing'];
  if (action === 'post-edit') return ['run changed-file awareness', `route-appropriate check mode: ${budget.mode}`, `consider: sdlc task review --task "${escapeCommandArg(task || 'current task')}"`];
  if (action === 'pre-stop') return ['run `sdlc gates --task "..."`', 'ensure final confidence block exists', 'ensure commit/push choice remains human-controlled'];
  if (action === 'approval-request') return ['summarize tool/risk/action requested', 'confirm no merge/deploy/release/pipeline/manual movement is hidden', 'record approval or cap'];
  return ['no recommendation'];
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

function actionForFriction(type) {
  const text = String(type || '').toLowerCase();
  if (text.includes('confusion')) return 'Improve help/operator wording for confusing workflow steps.';
  if (text.includes('slow')) return 'Look for redundant commands or context reads and add a faster local-first path.';
  if (text.includes('wrong')) return 'Add a scenario regression for the wrong recommendation or route.';
  if (text.includes('missing')) return 'Add a setup/profile/recommendation hint for the missing command or artifact.';
  if (text.includes('too-much')) return 'Reduce artifact/prompt surface or move command to expert help.';
  if (text.includes('context')) return 'Tighten context projection and warn on broad document loads.';
  if (text.includes('verification')) return 'Improve verification ladder, recommendation wording, or command capture guidance.';
  if (text.includes('artifact')) return 'Harden local artifact lifecycle and cleanup hints.';
  if (text.includes('runtime')) return 'Improve adapter doctor/fallback guidance for missing tools.';
  if (text.includes('sensitive')) return 'Strengthen sanitize checks and local evidence guardrails.';
  return `Review ${type} feedback and decide whether it is one-off or repeated.`;
}

function normalizeFriction(type) {
  const text = String(type || '').toLowerCase();
  if (text.includes('confusion')) return 'command confusion';
  if (text.includes('slow') || text.includes('delay') || text.includes('redundancy')) return 'workflow delay/redundancy';
  if (text.includes('wrong') || text.includes('route') || text.includes('surface')) return 'wrong route or surface detection';
  if (text.includes('context')) return 'context overload';
  if (text.includes('verify') || text.includes('evidence') || text.includes('cap')) return 'verification gap';
  if (text.includes('artifact') || text.includes('scratch')) return 'artifact clutter';
  if (text.includes('runtime') || text.includes('tool') || text.includes('mcp') || text.includes('hook')) return 'runtime/tool cap';
  if (text.includes('qa')) return 'qa script problem';
  if (text.includes('sensitive') || text.includes('data-risk') || text.includes('unsafe')) return 'sensitive evidence issue';
  return text || 'other';
}

function feedbackCandidateStatuses(groups) {
  return groupEntries(groups).slice(0, 8).map(([category, count]) => ({
    category,
    status: count >= 4 ? 'implement' : count >= 3 ? 'validate with fixture' : count >= 2 ? 'observe' : 'ignore',
  }));
}

function feedbackCandidatePlan(groups) {
  return feedbackCandidateStatuses(groups)
    .filter((row) => row.status !== 'ignore')
    .map((row) => `${row.category}: ${row.status}; ${actionForFriction(row.category)}`)
    .concat(feedbackCandidateStatuses(groups).every((row) => row.status === 'ignore') ? ['No repeated signal is strong enough to justify implementation yet.'] : []);
}

function groupEntries(groups) {
  const entries = Array.isArray(groups) ? groups : Object.entries(groups || {});
  return entries.sort((a, b) => Number(b[1]) - Number(a[1]));
}

function feedbackImprovementCandidates(rows) {
  const candidates = [];
  for (const [category, count] of groupCounts(rows.map((row) => row.friction || 'other')).filter(([, itemCount]) => itemCount >= 2)) {
    candidates.push(`Repeated friction "${category}" appeared ${count} times; owner: ${feedbackOwner({ friction: category })}.`);
  }
  for (const row of rows.filter((item) => ['blocked', 'unsafe', 'data-risk', 'wrong-route'].includes(String(item.friction || '').toLowerCase()))) {
    candidates.push(`High-severity event ${row.friction}: ${row.note || row.suggestedImprovement || 'review needed'}.`);
  }
  if (!candidates.length) candidates.push('No feedback signal has crossed the improvement threshold yet.');
  return candidates;
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

function countTruthy(rows, key) {
  return rows.filter((row) => ['yes', 'true', true].includes(row[key])).length;
}

function boolText(value) {
  if (['yes', 'true', true].includes(value)) return 'yes';
  if (['no', 'false', false].includes(value)) return 'no';
  return 'unknown';
}

function sanitizeOneLine(value) {
  return String(value || '')
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[email]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}
