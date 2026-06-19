import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defaultCalibrationPath } from './paths.mjs';
import { escapeCell, formatList, printObject, printTable, readJsonIfExists, readJsonLines, writeOrPrint } from './common.mjs';

const DEFAULT_LOCAL_MODELS = [
  {
    modelId: 'google/gemma-4-26b-a4b-qat',
    modelFamily: 'Gemma',
    modelVersionBuild: '4 26B A4B QAT',
    runtime: 'unknown / local runtime to be measured',
    providerSource: 'google',
    quantization: 'A4B QAT',
    contextWindow: 'unknown',
    runsFullyLocal: 'expected when loaded in a local runtime; unverified by Cycle 1',
    hardwareProfile: 'unknown',
    toolCallSupport: 'unknown',
    structuredOutputReliability: 'unknown',
    bestSuspectedRoles: ['read-only summarization', 'context organization', 'speculative review'],
    weakForbiddenRoles: ['final orchestration', 'security/privacy judgment', 'release approval', 'write-capable automation without later-cycle approval'],
    privacyLoggingNotes: 'Treat as local-only only after the runtime and logging path are verified.',
    metadataSource: 'Cycle 1 seed; local measurement required before routing decisions.',
    fieldsRequiringLocalMeasurement: ['contextWindow', 'hardwareProfile', 'toolCallSupport', 'structuredOutputReliability', 'latency', 'role quality'],
    lastEvaluated: 'not evaluated',
  },
];

export function modelsInventory(repo, options = {}) {
  const inventory = loadModelInventory(repo, options);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-local-model-inventory-v1', repository: repo, models: inventory }, null, 2));
    return;
  }
  printObject({ repository: repo, models: inventory.length });
  printTable(
    ['Model id', 'Runtime', 'Local', 'Structured output', 'Best suspected roles', 'Last evaluated'],
    inventory.map((model) => [
      model.modelId || model.id || 'unknown',
      model.runtime || 'unknown',
      model.runsFullyLocal || 'unknown',
      model.structuredOutputReliability || 'unknown',
      Array.isArray(model.bestSuspectedRoles) ? model.bestSuspectedRoles.join(', ') : String(model.bestSuspectedRoles || 'unknown'),
      model.lastEvaluated || 'unknown',
    ]),
  );
  console.log('\n## Measurement Gaps\n');
  console.log(formatList([...new Set(inventory.flatMap((model) => model.fieldsRequiringLocalMeasurement || []))]));
}

export function modelsRevalidate(repo, options = {}) {
  const inventory = loadModelInventory(repo, options);
  const calibrationPath = options.calibration ? resolve(repo, options.calibration) : defaultCalibrationPath(repo);
  const calibrationRows = readJsonLines(calibrationPath).filter((row) => !row.parseError);
  const rows = inventory.map((model) => modelRevalidationRow(model, calibrationRows));
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc.model_revalidation_report.v1', repository: repo, calibration: calibrationPath, rows }, null, 2));
    return;
  }
  const content = `# SDLC Model Revalidation Report

Date: ${new Date().toISOString()}
Repository: ${repo}
Calibration: ${relative(repo, calibrationPath)}
Models: ${rows.length}

| Model | Runtime | Status | Unknown fields | Drift signals | Revalidation action |
| --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.modelId)} | ${escapeCell(row.runtime)} | ${row.status} | ${escapeCell(row.unknownFields.join(', ') || 'none')} | ${escapeCell(row.driftSignals.join('; ') || 'none')} | ${escapeCell(row.revalidationAction)} |`).join('\n') || '| none | n/a | capped | none | no inventory | add local inventory before model routing |'}

## Boundary

- This report emits revalidation prompts only.
- It does not promote a model, scorecard, learned router, or write-capable local automation.
- Vendor metadata and seed inventory are not model capability evidence.
`;
  writeOrPrint(repo, options.out, content);
}

function loadModelInventory(repo, options) {
  const explicit = options.file ? join(repo, options.file) : '';
  const candidates = [
    explicit,
    join(repo, '.ai-local', 'local-models.json'),
    join(repo, 'templates', 'config', 'local-models.example.json'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const data = readJsonIfExists(candidate);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.models)) return data.models;
    try {
      const parsed = JSON.parse(readFileSync(candidate, 'utf8'));
      if (Array.isArray(parsed?.models)) return parsed.models;
    } catch {
      // Fall through to the seed profile below.
    }
  }
  return DEFAULT_LOCAL_MODELS;
}

function modelRevalidationRow(model, calibrationRows) {
  const modelId = model.modelId || model.id || 'unknown';
  const runtime = model.runtime || 'unknown';
  const unknownFields = [
    ...new Set([
      ...unknownProfileFields(model),
      ...(model.fieldsRequiringLocalMeasurement || []),
    ]),
  ];
  const matchingCalibration = calibrationRows.filter((row) => row.modelId === modelId || row.modelTier === modelId || row.modelTier === model.modelTier || row.runtime === runtime);
  const driftSignals = [];
  if (!matchingCalibration.length) driftSignals.push('no calibration rows for this model/runtime');
  if (!model.lastEvaluated || /not evaluated|unknown/i.test(String(model.lastEvaluated))) driftSignals.push('lastEvaluated missing or seed-level');
  if (matchingCalibration.some((row) => row.humanCorrection)) driftSignals.push('human correction recorded in calibration');
  if (matchingCalibration.some((row) => row.misrouteTax)) driftSignals.push('misroute tax recorded in calibration');
  if (matchingCalibration.some((row) => Number(row.retryCount || 0) > 1)) driftSignals.push('retry count above one in calibration');
  const status = unknownFields.length || driftSignals.length ? 'needs-revalidation' : 'current-with-local-evidence';
  return {
    modelId,
    runtime,
    status,
    unknownFields,
    calibrationRows: matchingCalibration.length,
    driftSignals,
    revalidationAction: status === 'needs-revalidation'
      ? 'run role-specific smoke evals before using this model for routing decisions'
      : 'keep using only inside previously validated role boundaries',
  };
}

function unknownProfileFields(model) {
  const fields = ['runtime', 'contextWindow', 'hardwareProfile', 'toolCallSupport', 'structuredOutputReliability', 'latency', 'lastEvaluated'];
  return fields.filter((field) => !model[field] || /unknown|not evaluated|unverified/i.test(String(model[field])));
}
