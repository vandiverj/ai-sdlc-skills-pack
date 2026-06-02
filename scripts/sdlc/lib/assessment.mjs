import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { escapeCell, fail, formatInlineList, printObject, readJsonIfExists, safeWriteTextFile, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { detectStack, inferTestingSurfaces } from './units.mjs';

export function workmodeDetect(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const modes = deps.detectWorkModes(repo, task, profile.values, git.changedFiles);
  printObject({
    repository: repo,
    task: task || 'not provided',
    workModes: modes.join(', ') || 'generic',
    verificationMaturity: deps.verificationMaturity(profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')))),
    stack: detectStack(repo).join(', ') || 'generic',
    recommendedNextCommand: `sdlc impact packet --task "${escapeCommandArg(task || 'current task')}"`,
  });
}

export function validationLadder(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the validation ladder can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const rows = deps.validationLadderRows(task, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Validation Surface Ladder

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Detected surfaces: ${formatInlineList(surfaces)}

${deps.formatValidationLadder(rows)}

## Rule

Use the strongest available validation surface. If a stronger surface is unavailable, record the fallback and cap instead of claiming it passed.
`;
  if (outPath) {
    safeWriteTextFile(repo, outPath, content);
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function verify(repo, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const requested = options.commands ? String(options.commands).split(',').map((value) => value.trim()) : ['test', 'build'];
  const results = [];

  for (const key of requested) {
    const command = commands[key];
    if (!command) {
      results.push({ key, command: '', status: 'missing', code: null });
      continue;
    }

    const result = spawnSync(command, {
      cwd: repo,
      shell: true,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    });
    results.push({ key, command, status: result.status === 0 ? 'pass' : 'fail', code: result.status, stdout: result.stdout, stderr: result.stderr });
  }

  const outPath = join(defaultRunsDir(repo), `${stamp()}-verification.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderVerification(results), 'utf8');
  console.log(renderVerification(results));
  console.log(`\nEvidence: ${relative(repo, outPath)}`);

  if (results.some((result) => result.status === 'fail')) process.exitCode = 1;
}

function optionFiles(options, fallback = []) {
  if (!options.files) return fallback;
  return splitList(options.files).map((file) => file.trim()).filter(Boolean);
}

function renderVerification(results) {
  const lines = ['# SDLC Verification', '', `Date: ${new Date().toISOString()}`, '', '| Check | Command | Result | Exit code |', '| --- | --- | --- | --- |'];
  for (const result of results) lines.push(`| ${result.key} | ${escapeCell(result.command || 'not configured')} | ${result.status} | ${result.code ?? ''} |`);
  return `${lines.join('\n')}\n`;
}

function escapeCommandArg(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
