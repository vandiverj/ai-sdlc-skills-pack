import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, dedupe, fail, formatInlineList, formatList, indentList, printGateRows, printObject, safeWriteTextFile, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferDirtySurfaces, inferRouteFromTask } from './routes.mjs';
import { policyRowsForAction } from './policy.mjs';

export function completeCheck(repo, options = {}, dependencies = {}) {
  const { controlGateRows, synthesizeState, writeGateRows } = dependencies;
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state && !options.task) fail('No current state found. Run `sdlc state init --task "..."` or pass --task.');
  const task = options.task || stateInfo.state.task;
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task);
  const state = stateInfo.state || synthesizeState(repo, task, options);
  const rows = controlGateRows(repo, state, runDir, options);
  const blocked = rows.filter((row) => row.status === 'block');
  writeGateRows(repo, runDir, rows);
  printObject({ task, route: state.route, result: blocked.length ? 'blocked' : 'pass', blocked: blocked.length, nextAction: blocked[0]?.next || 'sdlc finish packet --task "..."' });
  printGateRows(rows);
  if (blocked.length) process.exitCode = 1;
}

export function completeExplain(repo, options = {}, dependencies = {}) {
  const { readControlJsonLines } = dependencies;
  completeCheck(repo, options, dependencies);
  const stateInfo = readCurrentStateInfo(repo, options);
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, options.task || 'current-task');
  const checks = readControlJsonLines(join(runDir, 'checks.jsonl'));
  const waivers = readControlJsonLines(join(runDir, 'waivers.jsonl'));
  console.log('\n## Recorded Checks\n');
  console.log(formatList(checks.map((check) => `${check.name}: ${check.status}${check.command ? ` (${check.command})` : ''}`)));
  console.log('\n## Waivers\n');
  console.log(formatList(waivers.map((waiver) => `${waiver.gate}: ${waiver.reason} (${waiver.owner || 'owner not provided'})`)));
}

export function completeWaive(repo, options = {}, dependencies = {}) {
  const { appendControlEvent } = dependencies;
  const gate = options.gate || '';
  const reason = options.reason || '';
  if (!gate || !reason) fail('Pass --gate <id> and --reason "...".');
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) fail('No current state found. Run `sdlc state init --task "..."` first.');
  const waiver = { gate, reason, owner: options.owner || 'human', createdAt: new Date().toISOString() };
  appendControlJsonLine(repo, join(stateInfo.runDir, 'waivers.jsonl'), waiver);
  appendControlEvent(repo, stateInfo.runDir, 'waiver', `waived ${gate}`, waiver);
  printObject(waiver);
}

export function gitGuard(repo, options = {}, dependencies = {}) {
  const { gitScopeRows } = dependencies;
  const action = options.action || '';
  if (!action) fail('Pass --action commit|push.');
  const policy = policyRowsForAction(repo, options.task || '', action, loadProfile(repo).values);
  const scopeRows = gitScopeRows(repo, options);
  const rows = [...policy, ...scopeRows];
  const blocked = rows.filter((row) => row.status === 'block');
  printObject({ action, result: blocked.length ? 'blocked' : 'pass-with-human-approval', blocked: blocked.length });
  printGateRows(rows);
  if (blocked.length) process.exitCode = 1;
}

export function finalGate(repo, options = {}, dependencies = {}) {
  const { finalGateOpenItems, findPackets, suggestedFinalGateCommand } = dependencies;
  const task = options.task || '';
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  const hasQa = packets.some((packet) => packet.kind === 'qa-script');
  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    readyToCommit: open.length ? 'no' : 'yes, with explicit human approval only',
    readyToPush: open.length ? 'no' : 'only with explicit human approval',
    readyForQaHandoff: hasQa ? 'yes' : 'no',
    mergeDeployRelease: 'forbidden by SDLC default; use project-specific human process',
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc git packet',
  });
}

export function gitPacket(repo, options = {}, dependencies = {}) {
  const { caseIdPolicy, classifyTouchedSurface, findPackets, proposedCommitMessage, taskCaseId } = dependencies;
  const gitInfo = getGitInfo(repo);
  const files = gitInfo.changedFiles;
  const profile = loadProfile(repo);
  const packets = findPackets(repo, {});
  const latestImpact = packets.find((packet) => packet.kind === 'impact');
  const latestQa = packets.find((packet) => packet.kind === 'qa-script');
  const latestVerify = packets.find((packet) => packet.kind === 'developer-verification');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-git-action-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const caseId = taskCaseId(options.task || '', options, profile.values);
  const proposedMessage = proposedCommitMessage(files, latestImpact, { caseId, profile: profile.values });
  const content = `# SDLC Git Action Packet

Date: ${new Date().toISOString()}
Repository: ${repo}
Branch: ${gitInfo.branch || 'unknown'}
Upstream: ${gitInfo.upstream || 'not configured'}
Ahead/behind: ${gitInfo.behind} behind / ${gitInfo.ahead} ahead
Head: ${gitInfo.head || 'unknown'}
Status: ${gitInfo.status || 'clean'}

## Policy

- This packet prepares Git action evidence only.
- The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit requires explicit human approval.
- Push requires explicit human approval.
- Merge/deploy/release follows the project-specific human process.

## Proposed Commit

- Case ID: ${caseId || 'not provided'}
- Case ID policy: ${caseIdPolicy(profile.values)}
- Proposed message: ${proposedMessage}
- Include files:
${indentList(files)}
- Exclude/review before commit:

## Change Summary

- Impact packet: ${latestImpact ? relative(repo, latestImpact.path) : 'none'}
- QA script: ${latestQa ? relative(repo, latestQa.path) : 'none'}
- Developer verification: ${latestVerify ? relative(repo, latestVerify.path) : 'none'}
- Touched surfaces: ${formatInlineList(dedupe(files.map(classifyTouchedSurface)))}

## Approval Choices

- [ ] No action.
- [ ] Commit only.
- [ ] Commit and push.

## Push Target

- Remote/upstream: ${gitInfo.upstream || 'not configured'}
- Push cap/risk:

## Risks / Notes

- Dirty surfaces: ${formatInlineList(dedupe(files.map(classifyTouchedSurface)))}
- Human approval:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function finishPacket(repo, options = {}, dependencies = {}) {
  const {
    finalGateOpenItems,
    findPackets,
    finishCommitReadiness,
    finishIntentNotes,
    suggestedFinalGateCommand,
    taskCaseId,
    taskEvidenceSummary,
  } = dependencies;
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const recipes = matchRecipes(task, git, profile.values);
  const open = finalGateOpenItems(repo, task, git, packets);
  const intent = options.intent || 'normal';
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-finish-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Unified Finish Packet

Task: ${task}
Case ID: ${taskCaseId(task, options, profile.values) || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Route: ${inferRouteFromTask(task, git, profile.values)}
Finish intent: ${intent}

## Selected Recipes

${formatList(recipes.map((recipe) => `${recipe.id} (${recipe.confidence})`))}

## Proved

${formatList(taskEvidenceSummary(repo, packets))}

## Inferred

${formatList(inferDirtySurfaces(task, git))}

## Capped Or Open

${formatList(open.length ? open : ['none detected by local packets'])}

## Human QA Owns

- ${packets.some((packet) => packet.kind === 'qa-script') ? 'QA Markdown exists; tester executes it manually.' : 'QA handoff not found; generate or explicitly cap if QA is needed.'}

## Finish Intent Notes

${finishIntentNotes(intent)}

## Git / Release Decision

- Commit readiness: ${finishCommitReadiness(intent, open)}
- Push readiness: explicit human approval only
- Merge/deploy/release/MR/PR/pipeline/manual file movement: never automatic

## Recommended Next Action

\`\`\`bash
${open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc action preview --action commit'}
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function actionPreview(repo, options = {}, dependencies = {}) {
  const { actionCommandHint, actionRisk, caseIdPolicy } = dependencies;
  const action = options.action || '';
  if (!action) fail('Pass --action commit|push|tool|network|dependency|learning-promotion.');
  const git = getGitInfo(repo);
  const profile = loadProfile(repo);
  const risk = actionRisk(action, options.command || '');
  printObject({
    repository: repo,
    action,
    exactCommand: options.command || actionCommandHint(action),
    targetBranch: git.branch || 'unknown',
    changedFiles: git.changedFiles.join(', ') || 'none',
    risk,
    reversible: ['commit'].includes(action) ? 'mostly yes before push' : ['push', 'network', 'dependency', 'learning-promotion'].includes(action) ? 'partially or no' : 'depends',
    approvalRequired: 'yes',
    nonActions: 'no merge/deploy/release/MR/PR/pipeline/manual file movement unless separately approved',
    caseIdPolicy: caseIdPolicy(profile.values),
  });
}
