import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { escapeCell, formatInlineStatus, formatList, printObject, readJsonIfExists, safeWriteTextFile, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { readCurrentState, readCurrentStateInfo } from './state.mjs';
import { loadRunState } from './runstate.mjs';
import { artifactFindings } from './artifacts.mjs';

export function readiness(repo, deps = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const related = splitList(profile.values.relatedRepositories);
  const checks = deps.readinessChecks(repo, profile, commands, existingDocs, related);
  const score = Math.round((checks.filter((item) => item.status === 'ready').length / checks.length) * 100);
  const fixes = checks.filter((item) => item.status !== 'ready').map((item) => item.fix);

  printObject({
    repository: repo,
    score: `${score}%`,
    profile: profile.path ? relative(repo, profile.path) : 'not found',
    branch: git.branch || 'unknown',
    gitStatus: git.status || 'clean',
    context: deps.readinessStatus(checks, 'context'),
    commands: deps.readinessStatus(checks, 'commands'),
    release: deps.readinessStatus(checks, 'release'),
    security: deps.readinessStatus(checks, 'security'),
    multiRepo: deps.readinessStatus(checks, 'multi-repo'),
    recommendedSetupFixes: fixes.join('; ') || 'none',
    recommendedNextCommand: score < 75 ? 'sdlc setup doctor' : 'sdlc context pack --task "..."',
  });
}

export function handoff(repo) {
  const git = getGitInfo(repo);
  printObject({
    repository: repo,
    branch: git.branch,
    upstream: git.upstream,
    aheadBehind: `${git.behind} behind / ${git.ahead} ahead`,
    latestCommit: git.head,
    status: git.status || 'clean',
    changedFiles: git.changedFiles.join(', ') || 'none',
    suggestedNextAction: git.status ? 'review dirty working tree before handoff' : 'ready for release/review decision',
  });
}

export function gates(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const gitInfo = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const open = deps.finalGateOpenItems(repo, task, gitInfo, packets);
  const openPackets = packets.filter((packet) => !packet.completed && deps.completionTrackedPacketKinds().includes(packet.kind));

  printObject({
    repository: repo,
    task: task || 'not provided',
    dirtyStatus: formatInlineStatus(gitInfo.status),
    openPackets: openPackets.length,
    finalGateBlockers: open.length,
    suggestedNextCommand: open[0] ? deps.suggestedFinalGateCommand(open[0], task) : 'sdlc git packet',
  });

  console.log('\n## Open Final Gates\n');
  console.log(formatList(open));
  console.log('\n## Open Packets\n');
  console.log(formatList(openPackets.map((packet) => `${relative(repo, packet.path)} (${packet.kind})`)));
}

export function handoffDraft(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const gitInfo = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-handoff-draft.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Handoff Draft

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${gitInfo.branch || 'unknown'}
Head: ${gitInfo.head || 'unknown'}
Status: ${gitInfo.status || 'clean'}

## Summary

-

## Evidence Links

${formatList(packets.slice(0, 12).map((packet) => `${packet.kind}: ${relative(repo, packet.path)}`))}

## QA / Verification

- QA script:
- Developer verification:
- Known caps:

## Release / Merge / Deploy Policy

- This is a draft only.
- The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit and push require explicit human approval.
- Project-specific release, MR, AWS pipeline, manual compile, or manual file move processes remain human-controlled.

## Draft Text For MR / Handoff / Release Notes

### GitLab Merge Request Draft

**Summary**
-

**Verification**
-

**QA notes**
-

**Risk/caps**
-

> Do not create or merge the MR automatically. Paste/adapt only after human approval and project-specific branch policy review.

### QA Handoff Draft

Use this section for human QA testers. Keep it source-code-free and pasteable into the tracking ticket.

- Build/branch:
- Environment:
- Primary QA script:
- Regression areas:
- Test data/accounts:
- Known caps:

### Release Branch Note

- Target branch/process:
- Required approvals:
- Included repositories:
- Release order:
- Human-controlled merge/deploy step:

### AWS CodePipeline / CI Note

- Pipeline/job:
- Trigger policy:
- Expected artifact/build:
- Human-controlled trigger/deploy step:
- Rollback/contact:

### Manual Compile / File Move Note

- Compile/build command:
- Output/artifacts:
- Destination:
- Human-controlled copy/move step:
- Smoke check after move:

### What Changed

-

### How It Was Verified

-

### QA Script

-

### Risks / Caps

-
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function handoffSplit(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const outDir = options.outDir ? resolve(repo, options.outDir) : join(defaultRunsDir(repo), 'handoff');
  mkdirSync(outDir, { recursive: true });
  const gitInfo = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const common = {
    task: task || 'not provided',
    repo,
    branch: gitInfo.branch || 'unknown',
    head: gitInfo.head || 'unknown',
    status: gitInfo.status || 'clean',
  };
  const agentEvidence = `# SDLC Agent Evidence

Task: ${common.task}
Repository: ${common.repo}
Branch: ${common.branch}
Head: ${common.head}
Status: ${common.status}

## Packet Links

${formatList(packets.map((packet) => `${packet.kind}: ${relative(repo, packet.path)}`))}

## Agent Notes

- Include route reasoning, caps, command evidence, and internal process notes here.
- Keep this local unless explicitly approved for sharing.
`;
  const humanHandoff = `# Human Handoff

Task: ${common.task}
Branch: ${common.branch}
Status: ${common.status}

## Summary

-

## What Changed

-

## Verification

-

## Risks Or Caps

-

## Next Human Decision

- Commit/push/release actions require explicit human approval.
`;
  const qaScript = `# QA Script

Task: ${common.task}

## Scope

-

## Preconditions

-

## Test Steps

1.

## Expected Results

-

## Regression Areas

-

## Notes

- This script is for human QA testers. It does not require AI.
`;
  const files = [
    ['agent-evidence.md', agentEvidence],
    ['human-handoff.md', humanHandoff],
    ['qa-script.md', qaScript],
  ];
  for (const [name, text] of files) safeWriteTextFile(repo, join(outDir, name), text);
  printObject({
    agentEvidence: relative(repo, join(outDir, 'agent-evidence.md')),
    humanHandoff: relative(repo, join(outDir, 'human-handoff.md')),
    qaScript: relative(repo, join(outDir, 'qa-script.md')),
  });
}

export function dashboard(repo, options = {}, deps = {}) {
  const state = readCurrentState(repo, options) || loadRunState(repo, options.task || '') || deps.synthesizeState(repo, options.task || '', options);
  const runDir = readCurrentStateInfo(repo, options).runDir || defaultRunsDir(repo);
  const findings = artifactFindings(runDir);
  const lines = [
    '# SDLC Dashboard',
    '',
    `Task: ${state.task || options.task || 'not provided'}`,
    `Route: ${state.route || 'unknown'}`,
    `Stage: ${state.stage || state.status || 'unknown'}`,
    '',
    '## Artifact Health',
    '',
    '| Status | Artifact | Detail |',
    '| --- | --- | --- |',
    ...findings.map((item) => `| ${item.status} | ${escapeCell(item.artifact)} | ${escapeCell(item.detail)} |`),
    '',
    '## Next Action',
    '',
    deps.nextActionForStage(state.stage || 'intake', state.task || options.task || ''),
  ];
  const outPath = options.out ? resolve(repo, options.out) : join(runDir, 'dashboard.md');
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}
