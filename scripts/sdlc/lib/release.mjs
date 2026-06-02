import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, fail, formatInlineList, formatInlineStatus, formatList, formatOptionList, indentList, readJsonIfExists, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';
import { affectedUnits } from './units.mjs';

export function reviewPacket(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the review packet can be scoped.');

  const {
    contextDocCandidates,
    formatContextDocs,
  } = dependencies;

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const inferredRoute = inferRouteFromTask(task, git, profile.values);
  const route = 'review-only';
  const triggers = securityTriggers(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-review-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Review Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Head: ${git.head || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Suggested route: ${route}
Other route signals: ${inferredRoute === route ? 'none' : inferredRoute}

## Read-Only Scope

- Do not edit code, docs, tests, or generated files while using this packet unless the work is explicitly rerouted.
- Review task: ${task}
- Changed files:
${indentList(git.changedFiles)}

## Context To Inspect

${formatContextDocs(repo, existingDocs)}

## Diff / Artifact Targets

${formatReviewTargets(git)}

## Suggested Checks

${formatReviewChecks(commands, route)}

## Security Overlay

${formatSecurityOverlay(triggers)}

## Findings

| Severity | File/line | Finding | Recommendation |
| --- | --- | --- | --- |
|  |  |  |  |

## Evidence Gaps

- Record missing requirements, missing tests, unavailable local services, skipped optional checks, or unavailable rendered evidence here.

## Review Verdict

- Pass / Pass with notes / Changes requested / Blocked:
- Rationale:
- Residual risk:

## Calibration Stub

\`\`\`bash
sdlc calibrate add --route review-only --checks "" --caps "" --outcome "" --route-fit "" --context-missing "" --verification-missing "" --friction "" --process-change-proposed ""
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function reviewComplete(repo, options = {}, dependencies = {}) {
  const { appendPacketCompletion, escapeCommandArg, resolvePacketPath } = dependencies;
  const packetPath = resolvePacketPath(repo, options.packet);
  if (!options.verdict) fail('Pass --verdict "..." so the review completion has a clear outcome.');

  const git = getGitInfo(repo);
  const entry = `## Review Completion

Completed: ${new Date().toISOString()}
Repository status: ${formatInlineStatus(git.status)}
Head: ${git.head || 'unknown'}
Verdict: ${options.verdict}

### Findings

${formatOptionList(options.findings)}

### Checks

${formatOptionList(options.checks)}

### Caps

${formatOptionList(options.caps)}

### Calibration Command

\`\`\`bash
sdlc calibrate add --route review-only --checks "${escapeCommandArg(options.checks || '')}" --caps "${escapeCommandArg(options.caps || '')}" --outcome "${escapeCommandArg(options.outcome || options.verdict)}" --route-fit "${escapeCommandArg(options.routeFit || '')}" --context-missing "${escapeCommandArg(options.contextMissing || '')}" --verification-missing "${escapeCommandArg(options.verificationMissing || '')}" --friction "${escapeCommandArg(options.friction || '')}" --process-change-proposed "${escapeCommandArg(options.processChangeProposed || '')}"
\`\`\`
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

export function releasePacket(repo, options = {}, dependencies = {}) {
  const {
    contextDocCandidates,
    formatContextDocs,
  } = dependencies;
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const triggers = securityTriggers(options.task || 'release handoff push', profile.values);
  const commits = recentCommits(repo, 5);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-release-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Release Packet

Date: ${new Date().toISOString()}
Task: ${options.task || 'release / handoff readiness'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Head: ${git.head || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Release Scope

- No commit, push, merge, deploy, publish, or destructive action was taken by packet generation.
- The SDLC prepares release readiness/handoff evidence only; it must not automatically merge, deploy, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit and push require explicit human approval.
- Changed files:
${indentList(git.changedFiles)}
- Recent commits:
${indentList(commits)}

## Context To Inspect

${formatContextDocs(repo, existingDocs)}

## Release Policy

- Policy: ${profile.values.releasePolicy || 'not configured'}
- Human approval gates: ${profile.values.humanApprovalGates || 'not configured'}

## Expected Checks

${formatReleaseChecks(commands)}

## Stop Gates

${formatReleaseStopGates(git, profile.values)}

## Security Overlay

${formatSecurityOverlay(triggers)}

## Release Decision

| Item | Evidence | Status |
| --- | --- | --- |
| Scope reviewed |  | pending |
| Working tree appropriate |  | pending |
| Required checks pass |  | pending |
| Branch/upstream correct |  | pending |
| Human approval captured |  | pending |
| Git action performed | none by packet generation | pending |

## Handoff Notes

- Release action requested:
- Verification evidence:
- Caps:
- Next actor:

## Calibration Stub

\`\`\`bash
sdlc calibrate add --route release-push --checks "" --caps "" --outcome "" --route-fit "" --context-missing "" --verification-missing "" --friction "" --process-change-proposed ""
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function formatReviewTargets(gitInfo) {
  if (gitInfo.changedFiles.length) {
    return `${formatList(gitInfo.changedFiles)}

Suggested diff commands:

\`\`\`bash
git diff --stat
git diff
\`\`\``;
  }

  return `- No dirty working-tree files detected.
- Review the latest commit, branch state, or explicit artifact named in the task.

Suggested read-only commands:

\`\`\`bash
git show --stat --oneline HEAD
git show --check --stat HEAD
\`\`\``;
}

function formatReviewChecks(commands, route) {
  const lines = [
    '- Read the relevant diff/artifacts before running broader checks.',
    '- `git diff --check` when reviewing a dirty working tree.',
    '- `git show --check --stat HEAD` when reviewing the latest committed change.',
  ];
  if (commands.test) lines.push(`- test: \`${commands.test}\``);
  if (commands.build && route !== 'review-only') lines.push(`- build: \`${commands.build}\``);
  if (commands.lint) lines.push(`- lint/typecheck/format: \`${commands.lint}\``);
  if (commands.rendered && route === 'ui-rendered-review') lines.push(`- rendered: \`${commands.rendered}\``);
  return lines.join('\n');
}

function formatReleaseChecks(commands) {
  const lines = ['- `git diff --check` for dirty work or `git show --check --stat HEAD` for committed-only release review.'];
  if (commands.test) lines.push(`- test: \`${commands.test}\``);
  if (commands.build) lines.push(`- build: \`${commands.build}\``);
  if (commands.lint) lines.push(`- lint/typecheck/format: \`${commands.lint}\``);
  if (!commands.test && !commands.build && !commands.lint) lines.push('- No project test/build/lint commands discovered; record this as a release cap.');
  return lines.join('\n');
}

function formatReleaseStopGates(gitInfo, profile) {
  const gates = [];
  if (gitInfo.status) gates.push('Dirty working tree is present; confirm whether each file belongs in the release before committing or pushing.');
  if (!gitInfo.upstream) gates.push('No upstream branch is configured; confirm push target before any credentialed write.');
  if (gitInfo.behind > 0) gates.push(`Branch is ${gitInfo.behind} commit(s) behind upstream; pull/rebase/merge policy must be confirmed before release.`);
  if (!profile.releasePolicy) gates.push('Release policy is not configured in the SDLC profile.');
  if (!profile.humanApprovalGates) gates.push('Human approval gates are not configured in the SDLC profile.');
  gates.push('Explicit human approval is required before commit, push, merge, deploy, publish, or destructive Git actions.');
  return formatList(gates);
}

function recentCommits(repo, count = 5) {
  try {
    return execFileSync('git', ['log', '--oneline', `-${count}`], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

export function accessibilityPolicy(profile) {
  const value = String(profile.accessibilityReviewPolicy || 'optional').trim().toLowerCase();
  return ['optional', 'suggested', 'required'].includes(value) ? value : 'optional';
}

export function formatAccessibilityPolicy(policy, route) {
  const routeText = route === 'ui-rendered-review' ? 'This route touches rendered UI.' : 'This route does not inherently require accessibility evidence.';
  if (policy === 'required') {
    return `Policy: required
${routeText}
Required evidence: run the repository accessibility check or record the work as incomplete/capped until a human waives it.`;
  }
  if (policy === 'suggested') {
    return `Policy: suggested
${routeText}
Suggested evidence: run accessibility checks when UI changes affect real users, keyboard use, forms, navigation, focus, semantics, contrast, or production-facing surfaces. If skipped, record a cap.`;
  }
  return `Policy: optional
${routeText}
Default behavior: accessibility checks are available but not a stopping gate. For internal tools, skipped accessibility is not a failure unless the repository or human requires it.`;
}

export function formatSecurityOverlay(triggers) {
  if (!triggers.length) {
    return `Security/tool triggers:
- none detected

Consent gates:
- use normal route gates

Mitigations or caps:
- none`;
  }

  return `Security/tool triggers:
${formatList(triggers)}

Consent gates:
- get explicit approval before credentialed writes, destructive actions, dependency/tool installs, production effects, or external service calls

Mitigations or caps:
- load threat-model/security review guidance when data, auth, dependency, tool, external integration, prompt/tool injection, or production risk is present
- document unavailable security evidence as an explicit cap`;
}

export function releaseComplete(repo, options = {}, dependencies = {}) {
  const { appendPacketCompletion, escapeCommandArg, resolvePacketPath } = dependencies;
  const packetPath = resolvePacketPath(repo, options.packet);
  const action = options.action || '';
  if (!action) fail('Pass --action "none|commit|push|handoff" so the release completion records what happened.');
  if (!['none', 'commit', 'push', 'handoff'].includes(action)) fail('Use --action "none", "commit", "push", or "handoff".');

  const git = getGitInfo(repo);
  const entry = `## Release Completion

Completed: ${new Date().toISOString()}
Repository status: ${formatInlineStatus(git.status)}
Branch: ${git.branch || 'unknown'}
Upstream: ${git.upstream || 'not configured'}
Ahead/behind: ${git.behind} behind / ${git.ahead} ahead
Head: ${git.head || 'unknown'}
Action: ${action}
Verdict: ${options.verdict || 'not provided'}

### Checks

${formatOptionList(options.checks)}

### Caps

${formatOptionList(options.caps)}

### Git Action Evidence

${formatOptionList(options.evidence || (action === 'none' ? 'No git or release action performed.' : 'Record exact command/result here.'))}

### Calibration Command

\`\`\`bash
sdlc calibrate add --route release-push --checks "${escapeCommandArg(options.checks || '')}" --caps "${escapeCommandArg(options.caps || '')}" --outcome "${escapeCommandArg(options.outcome || options.verdict || action)}" --route-fit "${escapeCommandArg(options.routeFit || '')}" --context-missing "${escapeCommandArg(options.contextMissing || '')}" --verification-missing "${escapeCommandArg(options.verificationMissing || '')}" --friction "${escapeCommandArg(options.friction || '')}" --process-change-proposed "${escapeCommandArg(options.processChangeProposed || '')}"
\`\`\`
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

export function releaseOrderNote(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-release-order-note.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Release Order Note

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}

## Configured Release Context

- Release policy: ${profile.values.releasePolicy || 'not configured'}
- Release order: ${profile.values.releaseOrder || 'not configured'}
- Service map: ${profile.values.serviceMap || 'not configured'}
- Related repositories: ${formatInlineList(splitList(profile.values.relatedRepositories))}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Unit deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}

## Human-Controlled Release Notes

- Target branch/process:
- Required approvals:
- Included repositories:
- Included units:
- Release order:
- Pipeline/deploy/manual move owner:
- Smoke check after release/move:

## Hard Stop

- This note does not authorize merge, deploy, release, MR/PR creation, pipeline trigger, branch movement, or manual file movement.
- Commit and push still require explicit human approval.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}
