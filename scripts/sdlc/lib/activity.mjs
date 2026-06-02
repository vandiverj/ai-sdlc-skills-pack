import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { appendControlJsonLine, fail, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteJsonFile, safeWriteTextFile, slug } from './common.mjs';
import { defaultRunsDir } from './paths.mjs';
import { readCurrentStateInfo } from './state.mjs';

const schema = 'sdlc-activity-event-v1';
const modes = new Set(['off', 'light', 'full', 'debug']);
const directEvents = new Set(['start', 'event', 'command', 'cap', 'finish']);

export function activityCommand(repo, action, options = {}, rest = []) {
  if (action === 'config') return activityConfig(repo, options);
  if (action === 'status') return activityStatus(repo, options);
  if (action === 'on') return activityConfig(repo, { ...options, mode: options.mode || 'light', enabled: true });
  if (action === 'off') return activityConfig(repo, { ...options, mode: 'off', enabled: false });
  if (action === 'sanitize') return activitySanitize(options);
  if (action === 'start') return activityStart(repo, options);
  if (action === 'event') return activityEvent(repo, options);
  if (action === 'command') return activityCommandEvent(repo, options);
  if (action === 'cap') return activityCap(repo, options);
  if (action === 'finish') return activityFinish(repo, options);
  if (action === 'summary') return activitySummary(repo, options);
  if (action === 'redundancy') return activityRedundancy(repo, options);
  if (action === 'export') return activityExport(repo, options);
  if (action === 'learn') return activityLearn(repo, options);
  if (action === 'quickstart') return activityQuickstart(repo, options);
  if (action === 'wrap') return activityWrap(repo, options, rest);
  fail(`Unknown activity command: ${action || ''}`);
}

export function activitySummaryData(repo, options = {}) {
  const rows = activityRows(repo, options);
  const signals = redundancySignals(rows);
  return {
    mode: activityMode(repo, options),
    events: rows.length,
    localOnlyEvents: rows.filter((row) => row.privacy?.level === 'local-only').length,
    redundancySignals: signals.length,
    commands: rows.filter((row) => row.event === 'command.run').length,
    caps: rows.filter((row) => row.status === 'cap').length,
    signals,
  };
}

export function shouldRecordActivity(repo, options = {}) {
  const mode = activityMode(repo, options);
  return mode !== 'off';
}

export function recordActivity(repo, options = {}, event = {}) {
  const direct = directEvents.has(event.action || '');
  const mode = activityMode(repo, options);
  if (!direct && mode === 'off') return null;
  const row = activityRow(repo, { ...event, mode });
  const outPath = activityPath(repo, options, row.taskId);
  appendControlJsonLine(repo, outPath, row);
  return { path: outPath, row };
}

export function activityMode(repo, options = {}) {
  const explicit = options.activity || options.mode;
  if (explicit) return normalizeMode(explicit);
  const config = readActivityConfig(repo);
  if (config.mode) return normalizeMode(config.mode);
  if (config.enabled === true) return 'light';
  return 'off';
}

export function readActivityConfig(repo) {
  const config = readJsonIfExists(activityConfigPath(repo)) || {};
  return {
    enabled: config.enabled === true && config.mode !== 'off',
    mode: normalizeMode(config.mode || (config.enabled ? 'light' : 'off')),
    redactSensitiveValues: config.redactSensitiveValues !== false,
    localOnly: config.localOnly !== false,
    updatedAt: config.updatedAt || '',
  };
}

function activityConfig(repo, options = {}) {
  const current = readActivityConfig(repo);
  const mode = normalizeMode(options.mode || (options.enabled === false ? 'off' : current.mode || 'off'));
  const next = {
    enabled: mode !== 'off',
    mode,
    redactSensitiveValues: options.redactSensitiveValues === false ? false : current.redactSensitiveValues !== false,
    localOnly: options.localOnly === false ? false : current.localOnly !== false,
    updatedAt: new Date().toISOString(),
  };
  safeWriteJsonFile(repo, activityConfigPath(repo), next);
  printObject({ activityTelemetry: next.enabled ? 'enabled' : 'disabled', mode: next.mode, config: relative(repo, activityConfigPath(repo)), localOnly: next.localOnly, redaction: next.redactSensitiveValues ? 'on' : 'off' });
}

function activityStatus(repo, options = {}) {
  const config = readActivityConfig(repo);
  const mode = activityMode(repo, options);
  printObject({ activityTelemetry: mode === 'off' ? 'off' : 'on', mode, config: relative(repo, activityConfigPath(repo)), localOnly: config.localOnly, redaction: config.redactSensitiveValues ? 'on' : 'off', note: mode === 'off' ? 'passive and hook capture disabled; direct activity commands still work' : 'activity capture available for this repo/run' });
}

function activitySanitize(options = {}) {
  console.log(sanitizeActivityText(options.text || options.value || options._?.join(' ') || ''));
}

function activityStart(repo, options = {}) {
  const task = requiredTask(options);
  const result = recordActivity(repo, options, {
    action: 'start',
    task,
    phase: 'intake',
    event: 'task.start',
    surface: 'sdlc-cli',
    target: task,
    status: 'pass',
    intent: options.intent || 'start activity telemetry for task',
    runtime: options.runtime || 'unknown',
  });
  console.log(relative(repo, result.path));
}

function activityEvent(repo, options = {}) {
  const event = options.event || options.type || '';
  if (!event) fail('Pass --event <name>.');
  const result = recordActivity(repo, options, {
    action: 'event',
    task: options.task || '',
    phase: options.phase || 'implementation',
    event,
    surface: options.surface || 'agent',
    target: options.target || '',
    status: options.status || 'pass',
    intent: options.intent || options.summary || '',
    runtime: options.runtime || 'unknown',
    durationMs: options.durationMs,
  });
  console.log(relative(repo, result.path));
}

function activityCommandEvent(repo, options = {}) {
  const command = options.command || '';
  if (!command) fail('Pass --command "...".');
  const result = recordActivity(repo, options, {
    action: 'command',
    task: options.task || '',
    phase: options.phase || 'verification',
    event: 'command.run',
    surface: options.surface || commandSurface(command),
    target: command,
    command,
    status: normalizeStatus(options.status || 'pass'),
    intent: options.intent || 'run command',
    runtime: options.runtime || 'unknown',
    durationMs: options.durationMs,
    exitCode: options.exitCode,
  });
  console.log(relative(repo, result.path));
}

function activityCap(repo, options = {}) {
  const reason = options.reason || options.summary || '';
  if (!reason) fail('Pass --reason "...".');
  const result = recordActivity(repo, options, {
    action: 'cap',
    task: options.task || '',
    phase: options.phase || 'verification',
    event: 'cap.recorded',
    surface: options.surface || 'unknown',
    target: options.target || options.surface || '',
    status: 'cap',
    intent: reason,
    runtime: options.runtime || 'unknown',
    privacyLevel: 'local-only',
  });
  console.log(relative(repo, result.path));
}

function activityFinish(repo, options = {}) {
  const result = recordActivity(repo, options, {
    action: 'finish',
    task: options.task || '',
    phase: 'finish',
    event: 'task.finish',
    surface: 'sdlc-cli',
    target: options.task || '',
    status: normalizeStatus(options.status || 'pass'),
    intent: options.summary || 'finish activity telemetry for task',
    runtime: options.runtime || 'unknown',
  });
  console.log(relative(repo, result.path));
}

function activitySummary(repo, options = {}) {
  const rows = activityRows(repo, options);
  const summary = activitySummaryData(repo, options);
  const signals = summary.signals;
  const byEvent = countsBy(rows, (row) => row.event || 'unknown');
  const byPhase = countsBy(rows, (row) => row.phase || 'unknown');
  printObject({
    activityMode: summary.mode,
    events: summary.events,
    localOnlyEvents: summary.localOnlyEvents,
    redundancySignals: summary.redundancySignals,
    commands: summary.commands,
    caps: summary.caps,
  });
  console.log('\nEvents by phase');
  printCountTable(byPhase);
  console.log('\nEvents by type');
  printCountTable(byEvent);
  if (signals.length) {
    console.log('\nRedundancy signals');
    printTable(['Severity', 'Owner', 'Signal', 'Recommendation'], signals.map((signal) => [signal.severity, signal.owner, signal.signal, signal.recommendation]));
  }
}

function activityRedundancy(repo, options = {}) {
  const signals = redundancySignals(activityRows(repo, options));
  if (!signals.length) {
    console.log('No redundancy signals detected.');
    return;
  }
  printTable(['Severity', 'Owner', 'Signal', 'Evidence', 'Recommendation'], signals.map((signal) => [signal.severity, signal.owner, signal.signal, signal.evidence, signal.recommendation]));
}

function activityExport(repo, options = {}) {
  const rows = activityRows(repo, options);
  const format = options.format || 'json';
  const exported = format === 'otel-lite' ? rows.map(activityToOtelLite) : rows;
  const text = JSON.stringify(exported, null, 2);
  if (options.out) {
    const outPath = resolve(repo, options.out);
    safeWriteTextFile(repo, outPath, `${text}\n`);
    console.log(relative(repo, outPath));
    return;
  }
  console.log(text);
}

function activityLearn(repo, options = {}) {
  const signals = redundancySignals(activityRows(repo, options));
  const strong = signals.filter((signal) => signal.severity !== 'note');
  const evidence = strong.length ? strong.map((signal) => `- ${signal.signal}: ${signal.evidence}`).join('\n') : '- no strong repeated activity signals detected';
  const owner = strong[0]?.owner || 'process-learning';
  const change = strong[0]?.recommendation || 'No durable process change recommended from this activity set yet.';
  console.log(`Learning task:
Review SDLC activity telemetry for process improvement.

Evidence:
${evidence}

Candidate owner:
${owner}

Recommended change:
${change}

Validation needed:
Replay on another task or collect at least three similar signals before promoting a durable rule.

Rollback/deprecation path:
Remove or archive the proposed learning if later activity shows the signal was task-specific or caused by legitimate verification.`);
}

function activityQuickstart(repo, options = {}) {
  const task = options.task || '<task>';
  const mode = activityMode(repo, options);
  console.log(`Activity telemetry quickstart

Mode: ${mode}

Use when the task is medium+, cross-repo, interrupted, repeatedly failing, or process-improvement focused.

Suggested commands:
- sdlc activity on --repo "${repo}"
- sdlc activity start --task "${task}" --runtime codex --repo "${repo}"
- sdlc activity command --task "${task}" --phase verification --command "npm run test" --status pass --repo "${repo}"
- sdlc activity cap --task "${task}" --phase verification --surface browser --reason "browser unavailable" --repo "${repo}"
- sdlc activity summary --task "${task}" --repo "${repo}"

Do not record raw ticket text, production rows, secrets, customer data, or multiline logs.`);
}

function activityWrap(repo, options = {}, rest = []) {
  const separatorIndex = rest.indexOf('--');
  const commandTokens = separatorIndex >= 0 ? rest.slice(separatorIndex + 1) : rest;
  const command = options.command || commandTokens.join(' ');
  if (!command) fail('Pass a command after --, for example: sdlc activity wrap -- npm run test');
  const startedAt = Date.now();
  const shell = process.env.SHELL || '/bin/sh';
  const result = spawnSync(shell, ['-lc', command], { cwd: repo, encoding: 'utf8', stdio: 'inherit' });
  const durationMs = Date.now() - startedAt;
  recordActivity(repo, options, {
    action: 'command',
    task: options.task || '',
    phase: options.phase || 'verification',
    event: 'command.run',
    surface: options.surface || commandSurface(command),
    target: command,
    command,
    status: result.status === 0 ? 'pass' : 'fail',
    intent: options.intent || 'wrapped command',
    runtime: options.runtime || 'manual',
    durationMs,
    exitCode: result.status ?? 1,
  });
  process.exit(result.status ?? 1);
}

function activityRows(repo, options = {}) {
  const files = activityFiles(repo, options);
  const rows = files.flatMap((file) => readJsonLines(file).map((row) => ({ ...row, _file: file }))).filter((row) => !row.parseError);
  const task = options.task ? taskId(options.task) : '';
  return task ? rows.filter((row) => row.taskId === task || row.task === options.task) : rows;
}

function activityFiles(repo, options = {}) {
  if (options.activityFile) return [resolve(repo, options.activityFile)];
  const state = readCurrentStateInfo(repo, options);
  const candidates = [];
  if (state.runDir) candidates.push(join(state.runDir, 'activity.jsonl'));
  const dir = defaultRunsDir(repo);
  if (existsSync(dir)) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('-activity.jsonl')) candidates.push(join(dir, entry.name));
      if (entry.isDirectory()) {
        const nested = join(dir, entry.name, 'activity.jsonl');
        if (existsSync(nested)) candidates.push(nested);
      }
    }
  }
  return [...new Set(candidates)].filter((file) => existsSync(file));
}

function activityPath(repo, options = {}, task = '') {
  if (options.out) return resolve(repo, options.out);
  const state = readCurrentStateInfo(repo, options);
  if (state.runDir) return join(state.runDir, 'activity.jsonl');
  return join(defaultRunsDir(repo), `${slug(task || options.task || 'current-task')}-activity.jsonl`);
}

function activityConfigPath(repo) {
  return join(repo, '.ai-local', 'sdlc-activity-config.json');
}

function activityRow(repo, options = {}) {
  const config = readActivityConfig(repo);
  const privacyLevel = options.privacyLevel || (options.mode === 'debug' || config.localOnly ? 'local-only' : 'safe');
  const task = options.task || '';
  return {
    schema,
    timestamp: new Date().toISOString(),
    task,
    taskId: taskId(task || 'current-task'),
    runId: options.runId || '',
    runtime: sanitizeActivityText(options.runtime || 'unknown'),
    mode: normalizeMode(options.mode || 'off'),
    phase: sanitizeActivityText(options.phase || 'implementation'),
    event: sanitizeActivityText(options.event || 'tool.call'),
    surface: sanitizeActivityText(options.surface || 'agent'),
    intent: sanitizeActivityText(options.intent || ''),
    target: sanitizeActivityText(options.target || ''),
    command: sanitizeActivityText(options.command || ''),
    status: normalizeStatus(options.status || 'pass'),
    durationMs: Number(options.durationMs || 0),
    counts: options.counts || {},
    links: options.links || {},
    exitCode: options.exitCode === undefined ? '' : Number(options.exitCode),
    privacy: {
      level: privacyLevel,
      redacted: true,
    },
    repo: sanitizeActivityText(relative(repo, repo) || '.'),
  };
}

function redundancySignals(rows) {
  const signals = [];
  addRepeatedSignal(signals, rows, (row) => row.command && row.event === 'command.run' ? row.command : '', 'repeated command', 'tooling', 'Consider wrapping this command with run-check or revising the route recipe if it repeats without progress.');
  addRepeatedSignal(signals, rows, (row) => row.event && /search/i.test(row.event) ? `${row.event}:${row.target}` : '', 'repeated search/read pattern', 'context', 'Add a context note or search retirement rule when the same lookup repeats.');
  addRepeatedSignal(signals, rows, (row) => row.event === 'file.read' ? row.target : '', 'repeated file read', 'context', 'Promote durable findings into the repo context pack to avoid rediscovery.');
  addRepeatedSignal(signals, rows, (row) => row.status === 'cap' ? `${row.surface}:${row.intent}` : '', 'repeated runtime cap', 'runtime adapter', 'Update adapter guidance or setup checks for this cap.');
  addRepeatedSignal(signals, rows, (row) => row.event === 'artifact.write' ? `${row.phase}:${row.target}` : '', 'artifact churn', 'artifacts', 'Tighten artifact budget or reuse existing packet.');

  const editsByFile = new Map();
  for (const row of rows.filter((item) => item.event === 'file.edit' && item.target)) editsByFile.set(row.target, (editsByFile.get(row.target) || 0) + 1);
  for (const [file, count] of editsByFile) {
    if (count >= 4) signals.push({ severity: 'review', owner: 'implementation', signal: `edit churn on ${file}`, evidence: `${count} edits recorded`, recommendation: 'Review whether a tighter implementation slice or test-first loop would reduce rework.' });
  }
  return signals;
}

function addRepeatedSignal(signals, rows, keyFn, name, owner, recommendation) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const [key, count] of counts) {
    if (count < 2) continue;
    signals.push({ severity: count >= 3 ? 'warn' : 'note', owner, signal: `${name}: ${key}`, evidence: `${count} occurrences`, recommendation });
  }
}

function countsBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function printCountTable(rows) {
  if (!rows.length) {
    console.log('none');
    return;
  }
  printTable(['Name', 'Count'], rows.map(([name, count]) => [name, count]));
}

function activityToOtelLite(row) {
  return {
    name: `sdlc.activity.${row.event || 'event'}`,
    time_unix_nano: Date.parse(row.timestamp || new Date().toISOString()) * 1000000,
    attributes: {
      'sdlc.schema': row.schema || schema,
      'sdlc.task.id': row.taskId || '',
      'sdlc.activity.mode': row.mode || 'off',
      'sdlc.phase': row.phase || '',
      'sdlc.surface': row.surface || '',
      'sdlc.status': row.status || '',
      'sdlc.runtime': row.runtime || '',
      'sdlc.privacy.level': row.privacy?.level || '',
      'gen_ai.operation.name': row.event?.startsWith('command.') ? 'execute_tool' : 'invoke_agent',
    },
  };
}

function normalizeMode(value) {
  if (value === true) return 'light';
  const mode = String(value || 'off').toLowerCase();
  if (!modes.has(mode)) fail(`Invalid activity mode: ${value}. Use off, light, full, or debug.`);
  return mode;
}

function normalizeStatus(value) {
  const status = String(value || 'pass').toLowerCase();
  if (['pass', 'fail', 'cap', 'warn', 'repeat', 'skipped'].includes(status)) return status;
  return status === '0' ? 'pass' : 'fail';
}

function requiredTask(options) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  return task;
}

function taskId(task) {
  return slug(task || 'current-task');
}

function commandSurface(command) {
  const first = String(command || '').trim().split(/\s+/)[0] || 'shell';
  if (first === 'git') return 'git';
  if (first === 'npm' || first === 'pnpm' || first === 'yarn' || first === 'deno' || first === 'node') return 'shell';
  if (first === 'curl') return 'network';
  return 'shell';
}

export function sanitizeActivityText(value) {
  return String(value || '')
    .replace(/https?:\/\/\S+/g, '[redacted-url]')
    .replace(/\b(secret|token|password|credential|api[-_ ]?key|authorization)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi, '$1 [redacted]')
    .replace(/\bselect\s+.+?\s+from\s+.+/gi, '[redacted-sql]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}
