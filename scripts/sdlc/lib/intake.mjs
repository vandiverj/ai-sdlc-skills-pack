import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { escapeCommandArg, fail, formatList, printObject, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { inferRouteFromTask } from './routes.mjs';

export function intakePacket(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so intake can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const caseId = deps.taskCaseId(task, options, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-intake-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Intake Packet

Date: ${new Date().toISOString()}
Task: ${task}
Case ID: ${caseId || 'not provided'}
Source system: ${options.source || options.sourceSystem || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Suggested route: ${inferRouteFromTask(task, git, profile.values)}
Task type: ${deps.taskType(task)}

## Identity And Ownership

- Affected product/repo/unit: ${options.unit || 'infer from changed files/profile'}
- QA ownership: ${options.qaOwner || profile.values.qaOwnership || 'decide during impact/QA handoff'}
- Commit-message case ID policy: ${deps.caseIdPolicy(profile.values)}
- Proposed commit prefix: ${caseId ? `${caseId}:` : deps.requiresCaseId(profile.values) ? 'blocked until case ID is known' : 'optional'}

## Required Early Decisions

${formatList(intakeOpenItems(task, profile.values, caseId, deps))}

## Next Commands

\`\`\`bash
sdlc recipe match --task "${escapeCommandArg(task)}"
sdlc run dashboard --task "${escapeCommandArg(task)}"
\`\`\`
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function intakeCheck(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const caseId = deps.taskCaseId(task, options, profile.values);
  const open = intakeOpenItems(task, profile.values, caseId, deps);
  printObject({
    repository: repo,
    task: task || 'not provided',
    caseId: caseId || 'not provided',
    caseIdPolicy: deps.caseIdPolicy(profile.values),
    status: open.length ? 'open' : 'ready',
    openItems: open.join('; ') || 'none',
  });
  if (deps.requiresCaseId(profile.values) && !caseId) process.exitCode = 1;
}

function intakeOpenItems(task, profile = {}, caseId = '', deps = {}) {
  const open = [];
  if (!task) open.push('task statement missing');
  if (deps.requiresCaseId(profile) && !caseId) open.push('case ID required before commit message suggestion');
  if (!profile.releasePolicy) open.push('release/commit/push policy not configured');
  if (!profile.qaOwnership && !profile.qaOwner) open.push('QA ownership model not configured');
  if (!profile.repoContext && !profile.productContext && !profile.sharedContextRoot) open.push('context bucket not configured');
  return open;
}
