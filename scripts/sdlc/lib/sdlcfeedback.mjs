import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { appendControlJsonLine, fail, formatList, printObject, splitList } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { defaultSdlcFeedbackPath } from './paths.mjs';

export const SDLC_FEEDBACK_SCHEMA_VERSION = 'airtera.sdlc.feedback.v1';

const EVENT_TYPES = new Set([
  'task-completion',
  'friction',
  'route-fit',
  'verification-gap',
  'context-gap',
  'agent-miss',
  'process-suggestion',
]);

const ROUTE_FITS = new Set(['right-sized', 'too-heavy', 'too-light', 'unknown']);
const SENSITIVITY_LEVELS = new Set(['public', 'internal', 'restricted']);
const RAW_FIELD_NAMES = new Set([
  'rawSource',
  'rawCode',
  'rawDiff',
  'rawLog',
  'rawTicketText',
  'rawDatabaseOutput',
  'databaseOutput',
  'secret',
  'secrets',
  'fullPrompt',
  'promptTranscript',
  'chatTranscript',
]);

export function sdlcFeedbackAdd(repo, options = {}) {
  const event = buildSdlcFeedbackEvent(repo, options);
  const errors = validateSdlcFeedbackEvent(event);
  if (errors.length) fail(`Invalid SDLC feedback event:\n${formatList(errors)}`);

  const outPath = options.out ? resolve(repo, options.out) : defaultSdlcFeedbackPath(repo);
  appendControlJsonLine(repo, outPath, event);
  console.log(relative(repo, outPath));
}

export function sdlcFeedbackValidate(repo, options = {}) {
  const inputPath = resolveInputPath(repo, options);
  const events = readSdlcFeedbackEvents(inputPath);
  const results = events.map((event, index) => ({
    index: index + 1,
    errors: event.parseError ? [`Invalid JSON: ${event.parseError}`] : validateSdlcFeedbackEvent(event),
  }));
  const invalid = results.filter((result) => result.errors.length);
  const summary = {
    schema: 'sdlc.feedback_validation.v1',
    input: relative(repo, inputPath),
    events: events.length,
    valid: events.length - invalid.length,
    invalid: invalid.length,
    errors: invalid,
  };

  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else {
    printObject({
      input: summary.input,
      events: summary.events,
      valid: summary.valid,
      invalid: summary.invalid,
    });
    if (invalid.length) {
      console.log('\nErrors:');
      for (const result of invalid) console.log(`- event ${result.index}: ${result.errors.join('; ')}`);
    }
  }

  if (invalid.length) process.exitCode = 1;
}

export function sdlcFeedbackExport(repo, options = {}) {
  const inputPath = resolveInputPath(repo, options);
  const events = readSdlcFeedbackEvents(inputPath).filter((event) => !event.parseError);
  const invalid = events.map(validateSdlcFeedbackEvent).filter((errors) => errors.length);
  if (invalid.length && !options.allowInvalid) fail(`Cannot export invalid SDLC feedback:\n${formatList(invalid.flat())}`);

  const payload = {
    schema: 'sdlc.feedback_export.v1',
    exportedAt: new Date().toISOString(),
    input: relative(repo, inputPath),
    eventCount: events.length,
    events,
  };
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  if (options.out) {
    const outPath = resolve(repo, options.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function sdlcFeedbackTest(repo, options = {}) {
  const valid = buildSdlcFeedbackEvent(repo, {
    repoId: 'example-repo',
    task: 'example Standard cleanup',
    workClass: 'standard',
    routeUsed: 'standard',
    routeFit: 'right-sized',
    source: 'src/example.js',
    suggestedAction: 'review if repeated',
    checks: 'git diff --check',
  });
  const rawRejected = { ...valid, rawContentIncluded: true };
  const missingSourceRejected = { ...valid, sourcePointers: [] };
  const checks = [
    { name: 'valid sanitized event accepted', status: validateSdlcFeedbackEvent(valid).length === 0 ? 'pass' : 'fail' },
    { name: 'raw content flag rejected', status: validateSdlcFeedbackEvent(rawRejected).length > 0 ? 'pass' : 'fail' },
    { name: 'missing source pointer rejected', status: validateSdlcFeedbackEvent(missingSourceRejected).length > 0 ? 'pass' : 'fail' },
  ];

  if (options.json) console.log(JSON.stringify({ schema: 'sdlc.feedback_regression.v1', repository: repo, checks }, null, 2));
  else {
    console.log('| Case | Status |');
    console.log('| --- | --- |');
    for (const check of checks) console.log(`| ${check.name} | ${check.status} |`);
  }
  if (checks.some((check) => check.status !== 'pass')) process.exitCode = 1;
}

export function buildSdlcFeedbackEvent(repo, options = {}) {
  const git = getGitInfo(repo);
  return {
    schemaVersion: SDLC_FEEDBACK_SCHEMA_VERSION,
    eventType: options.eventType || 'task-completion',
    timestamp: options.timestamp || new Date().toISOString(),
    repoId: options.repoId || options.repositoryId || basename(repo),
    repoPathHint: options.repoPathHint || basename(repo),
    taskSummary: options.taskSummary || options.task || '',
    workClass: options.workClass || options.route || options.routeUsed || 'unknown',
    routeUsed: options.routeUsed || options.route || 'unknown',
    routeFit: options.routeFit || 'unknown',
    sensitivity: options.sensitivity || 'internal',
    rawContentIncluded: parseBoolean(options.rawContentIncluded, false),
    sourcePointers: buildSourcePointers(options),
    evidence: {
      checksRun: splitList(options.checksRun || options.checks),
      caps: splitList(options.caps),
      evidenceGaps: splitList(options.evidenceGaps || options.evidenceGap),
    },
    signals: {
      friction: splitList(options.friction),
      humanCorrections: splitList(options.humanCorrections || options.humanCorrection),
      agentMissedSteps: splitList(options.agentMissedSteps || options.agentMissedStep),
      candidateDelegation: options.candidateDelegation || options.candidateHelper || '',
    },
    suggestedAction: options.suggestedAction || options.processChangeProposed || 'review if repeated',
    git: {
      branch: git.branch,
      commit: git.head,
      dirty: Boolean(git.status),
    },
    runtime: options.runtime || '',
    modelTier: options.modelTier || '',
  };
}

export function validateSdlcFeedbackEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object' || Array.isArray(event)) return ['event must be an object'];
  if (event.schemaVersion !== SDLC_FEEDBACK_SCHEMA_VERSION) errors.push(`schemaVersion must be ${SDLC_FEEDBACK_SCHEMA_VERSION}`);
  if (!EVENT_TYPES.has(event.eventType)) errors.push(`eventType must be one of ${[...EVENT_TYPES].join(', ')}`);
  if (!event.timestamp) errors.push('timestamp is required');
  if (!event.repoId) errors.push('repoId is required');
  if (!event.taskSummary) errors.push('taskSummary is required');
  if (!event.workClass) errors.push('workClass is required');
  if (!event.routeUsed) errors.push('routeUsed is required');
  if (!ROUTE_FITS.has(event.routeFit)) errors.push(`routeFit must be one of ${[...ROUTE_FITS].join(', ')}`);
  if (!SENSITIVITY_LEVELS.has(event.sensitivity)) errors.push(`sensitivity must be one of ${[...SENSITIVITY_LEVELS].join(', ')}`);
  if (event.rawContentIncluded !== false) errors.push('rawContentIncluded must be false');
  if (!Array.isArray(event.sourcePointers) || event.sourcePointers.length === 0) errors.push('sourcePointers must include at least one sanitized pointer');
  if (!event.evidence || typeof event.evidence !== 'object' || Array.isArray(event.evidence)) errors.push('evidence object is required');
  if (!event.signals || typeof event.signals !== 'object' || Array.isArray(event.signals)) errors.push('signals object is required');
  if (!event.suggestedAction) errors.push('suggestedAction is required');
  for (const key of Object.keys(event)) {
    if (RAW_FIELD_NAMES.has(key)) errors.push(`raw content field is not allowed: ${key}`);
  }
  return errors;
}

function buildSourcePointers(options) {
  const values = splitList(options.sourcePointers || options.source || options.files || options.evidencePath);
  return values.map((value) => ({
    kind: options.sourceKind || 'path',
    pointer: value,
  }));
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function resolveInputPath(repo, options) {
  const inputPath = resolve(repo, options.in || options.file || defaultSdlcFeedbackPath(repo));
  if (!existsSync(inputPath)) fail(`SDLC feedback log not found: ${relative(repo, inputPath)}`);
  return inputPath;
}

function readSdlcFeedbackEvents(inputPath) {
  const raw = readFileSync(inputPath, 'utf8').trim();
  if (!raw) return [];
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.events) ? parsed.events : [parsed];
    } catch (error) {
      if (!raw.includes('\n')) return [{ parseError: error.message || String(error) }];
    }
  }
  return raw.split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      return { parseError: error.message || String(error) };
    }
  });
}
