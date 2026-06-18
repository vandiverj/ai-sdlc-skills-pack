import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatList, printObject, printTable, readJsonIfExists } from './common.mjs';

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
