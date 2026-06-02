import { appendFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, fail, formatList, printObject, readJsonLines, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir, defaultTracePath } from './paths.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';

export function traceAttach(repo, options = {}, dependencies = {}) {
  const { controlTraceRow } = dependencies;
  const type = options.type || 'event';
  const summary = options.summary || '';
  if (!summary) fail('Pass --summary "...".');
  const stateInfo = readCurrentStateInfo(repo, options);
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, options.task || 'current-task');
  const row = controlTraceRow(repo, { ...options, type, summary });
  appendControlJsonLine(repo, join(runDir, 'trace.jsonl'), row);
  console.log(relative(repo, join(runDir, 'trace.jsonl')));
}

export function traceStart(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the trace can be scoped.');
  const tracePath = options.out ? resolve(repo, options.out) : defaultTracePath(repo, task);
  mkdirSync(dirname(tracePath), { recursive: true });
  appendFileSync(tracePath, `${JSON.stringify(traceRow(repo, { type: 'start', task, summary: 'SDLC run started', route: inferRouteFromTask(task, getGitInfo(repo), loadProfile(repo).values) }))}\n`, 'utf8');
  console.log(relative(repo, tracePath));
}

export function traceEvent(repo, options = {}) {
  const type = options.type || '';
  const summary = options.summary || '';
  if (!type || !summary) fail('Pass --type <type> and --summary "...".');
  const task = options.task || '';
  const tracePath = options.trace ? resolve(repo, options.trace) : defaultTracePath(repo, task || 'current-task');
  mkdirSync(dirname(tracePath), { recursive: true });
  appendFileSync(tracePath, `${JSON.stringify(traceRow(repo, { ...options, type, summary }))}\n`, 'utf8');
  console.log(relative(repo, tracePath));
}

export function traceFinish(repo, options = {}) {
  const task = options.task || '';
  const tracePath = options.trace ? resolve(repo, options.trace) : defaultTracePath(repo, task || 'current-task');
  mkdirSync(dirname(tracePath), { recursive: true });
  appendFileSync(tracePath, `${JSON.stringify(traceRow(repo, { ...options, type: 'finish', summary: options.summary || 'SDLC run finished' }))}\n`, 'utf8');
  console.log(relative(repo, tracePath));
}

export function traceExport(repo, options = {}) {
  const tracePath = options.trace ? resolve(repo, options.trace) : defaultTracePath(repo, options.task || 'current-task');
  const rows = readJsonLines(tracePath);
  const format = options.format || 'json';
  const exported = format === 'otel-lite' ? rows.map(toOtelLiteSpan) : rows;
  const text = JSON.stringify(exported, null, 2);
  if (options.out) {
    const outPath = resolve(repo, options.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${text}\n`, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(text);
  }
}

export function scorecardTask(repo, options = {}, dependencies = {}) {
  const { humanize, resolvePacketPath } = dependencies;
  const tracePath = resolvePacketPath(repo, options.trace);
  const rows = readJsonLines(tracePath);
  const score = scoreTraceRows(rows);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-scorecard.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Task Scorecard

Date: ${new Date().toISOString()}
Trace: ${relative(repo, tracePath)}

## Scores

${formatList(Object.entries(score).map(([key, value]) => `${humanize(key)}: ${value}`))}

## Interpretation

- Process quality is about route clarity, evidence, verification, low rework, and safe finish state.
- Passing tests do not prove a good trajectory if exploration, verification, or safety gates were skipped.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function scorecardSummary(repo, options = {}) {
  const traces = findTraceFiles(repo);
  const rows = traces.flatMap((file) => readJsonLines(file));
  const score = scoreTraceRows(filterSince(rows, options.since || ''));
  printObject({ repository: repo, traces: traces.length, events: rows.length, processQuality: score.processQuality, evidenceCompleteness: score.evidenceCompleteness, reworkCount: score.reworkCount, safetyInterventions: score.safetyInterventions });
}

export function scorecardTrends(repo, options = {}, dependencies = {}) {
  return scorecardSummary(repo, options, dependencies);
}


function filterSince(rows, since) {
  if (!since) return rows;
  return rows.filter((row) => String(row.timestamp || '').slice(0, 10) >= since);
}

function traceRow(repo, options = {}) {
  const git = getGitInfo(repo);
  return { timestamp: new Date().toISOString(), type: options.type || 'event', task: options.task || '', route: options.route || '', summary: sanitizeOneLine(options.summary || ''), command: sanitizeOneLine(options.command || ''), status: options.status || '', filesChanged: git.changedFiles.length, branch: git.branch || '', safety: options.safety || '' };
}

function scoreTraceRows(rows) {
  const valid = rows.filter((row) => !row.parseError);
  const types = new Set(valid.map((row) => row.type));
  const commandFailures = valid.filter((row) => Number(row.status) > 0 || /fail|blocked/i.test(row.summary || '')).length;
  const reworkCount = valid.filter((row) => /rework|retry|rerun|again/i.test(`${row.type} ${row.summary}`)).length;
  const safetyInterventions = valid.filter((row) => /safety|approval|permission|secret|credential|destructive/i.test(`${row.type} ${row.summary} ${row.safety}`)).length;
  const evidenceCompleteness = ['start', 'finish'].every((type) => types.has(type)) && valid.some((row) => /verify|evidence|test|qa/i.test(`${row.type} ${row.summary}`)) ? 'good' : 'partial';
  const processQuality = commandFailures > 2 || reworkCount > 3 ? 'needs review' : evidenceCompleteness === 'good' ? 'good' : 'partial';
  return { events: valid.length, evidenceCompleteness, processQuality, reworkCount, redundantToolCallCount: valid.filter((row, index) => index > 0 && row.command && row.command === valid[index - 1].command).length, missingVerificationRisk: valid.some((row) => /verify|evidence|test|qa/i.test(`${row.type} ${row.summary}`)) ? 'low' : 'medium', safetyInterventions };
}

function findTraceFiles(repo) {
  const dir = defaultRunsDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith('-trace.jsonl')).map((file) => join(dir, file));
}

function toOtelLiteSpan(row) {
  return { name: row.type === 'command' || row.command ? `execute_tool ${row.command || 'sdlc'}` : `sdlc.${row.type || 'event'}`, attributes: { 'gen_ai.operation.name': row.command ? 'execute_tool' : 'invoke_agent', 'sdlc.event.type': row.type || 'event', 'sdlc.task': row.task || '', 'sdlc.route': row.route || '', 'sdlc.summary': row.summary || '', 'sdlc.status': row.status || '', 'sdlc.branch': row.branch || '', 'sdlc.files_changed': row.filesChanged || 0 } };
}

function sanitizeOneLine(value) {
  return String(value || '').replace(/https?:\/\/\S+/g, '[redacted-url]').replace(/\b(secret|token|password|credential|api key)\s*[:=]\s*\S+/gi, '$1=[redacted]').replace(/\s+/g, ' ').trim();
}
