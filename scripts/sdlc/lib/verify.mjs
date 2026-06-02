import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, fail, formatInlineStatus, formatOptionList, printObject, readJsonIfExists, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { ensureControlRunDir } from './state.mjs';
import { inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';

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

export function verifyLadder(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const ladder = buildVerifyLadder(repo, task, options);
  printObject({ task, route: ladder.route, qaMode: ladder.qaMode, surfaces: ladder.surfaces.join(', ') || 'unknown' });
  console.log('\n| Level | Command or method | Why |');
  console.log('| --- | --- | --- |');
  for (const row of ladder.rows) console.log(`| ${row.level} | ${row.command || row.method} | ${row.why} |`);
}

export function verifyRun(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const command = options.command || commandForLevel(repo, task, options.level || 'targeted', options);
  if (!command) fail('No command discovered for this level. Pass --command "...", or record an explicit cap.');
  const started = Date.now();
  const result = spawnSync(process.env.SHELL || '/bin/sh', ['-lc', command], { cwd: repo, encoding: 'utf8' });
  const durationMs = Date.now() - started;
  const runDir = ensureControlRunDir(repo, options, task);
  const row = { timestamp: new Date().toISOString(), task, level: options.level || 'targeted', command, status: result.status ?? 1, durationMs, stdout: summarizeOutput(result.stdout), stderr: summarizeOutput(result.stderr) };
  appendControlJsonLine(repo, join(runDir, 'verification-runs.jsonl'), row);
  printObject({ command, status: row.status, durationMs, evidence: relative(repo, join(runDir, 'verification-runs.jsonl')) });
  if (result.stdout) console.log(summarizeOutput(result.stdout));
  if (result.stderr) console.error(summarizeOutput(result.stderr));
  process.exitCode = result.status ?? 1;
}

function buildVerifyLadder(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const rows = [
    { level: 'targeted', command: commands.test || commands.build || 'manual focused inspection', why: 'smallest fresh proof for changed unit' },
    { level: 'broad', command: commands.build || commands.test || 'broader project check unavailable', why: 'catch integration/type/build regressions when feasible' },
  ];
  if (surfaces.includes('rendered-product-ui')) rows.push({ level: 'surface', command: 'sdlc render evidence --task "<task>"', why: 'actual rendered UI surface changed' });
  if (surfaces.includes('api-contract')) rows.push({ level: 'surface', command: 'sdlc qa api --task "<task>"', why: 'API/OpenAPI surface needs developer/API validation' });
  if (surfaces.includes('data-persistence')) rows.push({ level: 'surface', command: 'sdlc data evidence --task "<task>"', why: 'data/storage behavior needs bounded evidence' });
  rows.push({ level: 'qa', command: `sdlc qa ${qaMode === 'api-contract' ? 'api' : qaMode === 'rendered-ui' ? 'ui' : 'script'} --task "<task>"`, why: 'human QA or handoff coverage when tester-visible' });
  return { task, route, surfaces, qaMode, rows };
}

function commandForLevel(repo, task, level, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  if (level === 'broad') return commands.build || commands.test || '';
  return commands.test || commands.build || '';
}

function summarizeOutput(value) {
  return String(value || '').split(/\r?\n/).slice(-20).join('\n').trim();
}
