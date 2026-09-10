import { evidenceContractRevision } from './evidence.mjs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { appendControlJsonLine, dedupeBy, escapeCell, fail, printObject, printTable, readJsonIfExists, safeWriteJsonFile, safeWriteTextFile, slug, stamp, writeOrPrint } from './common.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';
import { unitRegistry } from './units.mjs';
import { evidenceRevision } from './git.mjs';

function readEvidenceManifest(runDir) {
  return readJsonIfExists(join(runDir, 'evidence.json')) || { captured: [] };
}

export function runCheck(repo, options = {}, rawTokens = [], dependencies = {}) {
  const name = options.name || options.kind || 'check';
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task || '';
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task || 'current-task');
  const delimiter = rawTokens.indexOf('--');
  const commandTokens = delimiter >= 0 ? rawTokens.slice(delimiter + 1) : [];
  const start = new Date();
  const revision = evidenceRevision(repo);
  const contractRevision = evidenceContractRevision(repo, task, options);
  let result;
  if (options.cap) {
    result = {
      name,
      kind: name,
      mode: 'cap',
      command: '',
      status: 'cap',
      exitCode: '',
      summary: options.reason || options.cap,
      startedAt: start.toISOString(),
      endedAt: new Date().toISOString(),
    };
  } else if (options.manual) {
    result = {
      name,
      kind: name,
      mode: 'manual',
      command: '',
      status: options.status || 'pass',
      exitCode: '',
      summary: options.manual,
      startedAt: start.toISOString(),
      endedAt: new Date().toISOString(),
    };
  } else {
    if (!commandTokens.length) fail('Pass a command after --, or use --manual "..." / --cap "...".');
    const command = commandTokens[0];
    const commandArgs = commandTokens.slice(1);
    const child = spawnSync(command, commandArgs, { cwd: repo, encoding: 'utf8' });
    const endedAt = new Date().toISOString();
    const output = `${child.stdout || ''}${child.stderr ? `\nSTDERR:\n${child.stderr}` : ''}`;
    const outputPath = join(runDir, 'outputs', `${stamp()}-${slug(name)}.log`);
    safeWriteTextFile(repo, outputPath, output);
    result = {
      name,
      kind: name,
      mode: 'command',
      command: commandTokens.join(' '),
      cwd: repo,
      status: child.status === 0 ? 'pass' : classifyRunCheckFailure(child),
      exitCode: child.status ?? '',
      signal: child.signal || '',
      summary: summarizeCommandOutput(output),
      outputPath: relative(repo, outputPath),
      startedAt: start.toISOString(),
      endedAt,
    };
  }
  result.revision = revision === evidenceRevision(repo) ? revision : '';
  result.contractRevision = contractRevision === evidenceContractRevision(repo, task, options) ? contractRevision : '';
  result.task = task;
  result.criterionId = options.criterionId || options.criterion || '';
  appendControlJsonLine(repo, join(runDir, 'checks.jsonl'), result);
  addEvidenceFromCheck(repo, runDir, result);
  dependencies.appendControlEvent(repo, runDir, 'check', `${name}: ${result.status}`, result);
  printObject(result);
  if (result.status !== 'pass') process.exitCode = Number(result.exitCode) || 1;
}

export function checksPlan(repo, options = {}) {
  const commands = checkCommandRecords(repo, options);
  const lines = ['# SDLC Check Plan', '', '| Kind | Unit | Command | Required |', '| --- | --- | --- | --- |', ...commands.map((cmd) => `| ${cmd.kind} | ${escapeCell(cmd.unit || 'repo')} | ${escapeCell(cmd.command || 'not configured')} | ${cmd.required ? 'yes' : 'no'} |`), ''];
  writeOrPrint(repo, options.out, lines.join('\n'));
}

export function checksRun(repo, options = {}) {
  const commands = checkCommandRecords(repo, options).filter((item) => item.command);
  if (!commands.length) fail('No configured build/test/check commands found. Run sdlc checks doctor or configure the repo profile.');
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task;
  if (!task) fail('Pass --task or initialize state before running checks.');
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, { ...options, task }, task);
  for (const item of commands) {
    const revision = evidenceRevision(repo);
  const contractRevision = evidenceContractRevision(repo, task, options);
    const result = spawnSync(item.command, { cwd: repo, shell: true, encoding: 'utf8' });
    const check = { timestamp: new Date().toISOString(), name: `${item.kind}-${item.unit || 'repo'}`, kind: item.kind, command: item.command, status: result.status === 0 ? 'pass' : classifyRunCheckFailure(result), exitCode: result.status, summary: summarizeCommandOutput(`${result.stdout || ''}\n${result.stderr || ''}`) };
    check.revision = revision === evidenceRevision(repo) ? revision : '';
    check.contractRevision = contractRevision === evidenceContractRevision(repo, task, options) ? contractRevision : '';
    check.task = task;
    appendControlJsonLine(repo, join(runDir, 'checks.jsonl'), check);
    addEvidenceFromCheck(repo, runDir, check);
    console.log(`${check.name}: ${check.status}`);
    if (result.status !== 0) process.exitCode = 1;
  }
}

export function checksDoctor(repo, options = {}) {
  const commands = checkCommandRecords(repo, options);
  const missing = commands.filter((item) => item.required && !item.command);
  printTable(['Kind', 'Unit', 'Status', 'Detail'], commands.map((item) => [item.kind, item.unit || 'repo', item.command ? 'configured' : item.required ? 'missing' : 'optional', item.command || 'configure in profile/unit']));
  if (missing.length) process.exitCode = 1;
}

export function checkCommandRecords(repo, options = {}) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  const rows = [];
  if (commands.build) rows.push({ kind: 'build', unit: '', command: commands.build, required: false });
  rows.push({ kind: 'test', unit: '', command: commands.test || '', required: true });
  if (commands.lint) rows.push({ kind: 'lint', unit: '', command: commands.lint, required: false });
  for (const unit of unitRegistry(repo, profile)) {
    if (unit.buildCommand) rows.push({ kind: 'build', unit: unit.name, command: unit.buildCommand, required: false });
    if (unit.testCommand) rows.push({ kind: 'test', unit: unit.name, command: unit.testCommand, required: true });
  }
  return dedupeBy(rows, (row) => `${row.kind}:${row.unit}:${row.command}`);
}

export function classifyRunCheckFailure(child) {
  const stderr = String(child.stderr || '').toLowerCase();
  if (child.error) return 'tool-failure';
  if (stderr.includes('operation not permitted') || stderr.includes('permission denied') || stderr.includes('eacces') || stderr.includes('eperm')) return 'sandbox-failure';
  if (stderr.includes('command not found') || stderr.includes('enoent')) return 'tool-unavailable';
  return 'fail';
}

export function summarizeCommandOutput(output) {
  const lines = String(output || '').split(/\r?\n/).filter(Boolean);
  return lines.slice(-8).join(' | ').slice(0, 1000) || 'no output';
}

export function addEvidenceFromCheck(repo, runDir, check) {
  const manifest = readEvidenceManifest(runDir);
  manifest.captured = [...(manifest.captured || []), {
    id: `check-${check.name}-${Date.now()}`,
    kind: check.kind || check.name,
    summary: `${check.status}: ${check.summary || check.command || check.name}`,
    path: check.outputPath || '',
    status: check.status,
    revision: check.revision,
    contractRevision: check.contractRevision,
    task: check.task,
    criterionId: check.criterionId || '',
    command: check.command || '',
    capturedAt: new Date().toISOString(),
  }];
  manifest.updatedAt = new Date().toISOString();
  safeWriteJsonFile(repo, join(runDir, 'evidence.json'), manifest);
}
