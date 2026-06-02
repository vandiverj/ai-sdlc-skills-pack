import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, formatInlineStatus, formatOptionList, readJsonIfExists, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask } from './routes.mjs';

export function verifyPacket(repo, options = {}, dependencies = {}) {
  const { formatCommandList, inferVerificationMaturity } = dependencies;
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the developer verification packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-developer-verification-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Developer Verification Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Head: ${git.head || 'unknown'}
Verification maturity: ${profile.values.verificationMaturity || inferVerificationMaturity(commands)}

## Developer / Agent Verification

This packet records verification performed by the developer or coding agent. It is separate from the human QA Markdown test script.

## Recommended Checks

${formatCommandList(commands, inferRouteFromTask(task, git, profile.values))}

## Checks Run

| Check | Command / Method | Result | Notes |
| --- | --- | --- | --- |
|  |  |  |  |

## Manual Smoke / Rendered / API / Data Checks

- Manual smoke:
- Rendered UI:
- API or service:
- Data/storage:
- Integration:

## Test Introduction Opportunity

- Existing test harness:
- Smallest useful test for this change:
- If not adding a test now, cap/rationale:

## Verification Caps

- No automated tests:
- Environment unavailable:
- Data/integration unavailable:
- Other:

## Completion Command

\`\`\`bash
sdlc verify complete --packet ${relative(repo, outPath)} --checks "" --caps ""
\`\`\`
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function verifyComplete(repo, options = {}, dependencies = {}) {
  const { appendPacketCompletion, resolvePacketPath } = dependencies;
  const packetPath = resolvePacketPath(repo, options.packet);
  const git = getGitInfo(repo);
  const entry = `## Developer Verification Completion

Completed: ${new Date().toISOString()}
Repository status: ${formatInlineStatus(git.status)}
Head: ${git.head || 'unknown'}

### Checks

${formatOptionList(options.checks)}

### Caps

${formatOptionList(options.caps)}

### Result

- Outcome: ${options.outcome || 'not provided'}
- Notes: ${options.notes || ''}
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}
