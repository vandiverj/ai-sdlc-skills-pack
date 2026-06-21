import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { delimiter, join, relative, resolve } from 'node:path';
import { escapeCell, fail, formatList, optionFiles, printObject, printTable, readJsonIfExists, safeWriteJsonFile, safeWriteTextFile, splitList } from './common.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { getGitInfo } from './git.mjs';
import { detectPackageManager, inferTestingSurfaces } from './units.mjs';
import { upsertTaskJournal } from './journal.mjs';

function matchesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

export function externalEvidenceProfile(profile = {}) {
  return {
    ticket: {
      provider: profile.ticketSystemProvider || profile.ticketSystem || 'not configured',
      availability: profile.ticketMcpAvailability || 'unknown',
      readIssue: profile.ticketReadIssue || 'unknown',
      readComments: profile.ticketReadComments || 'unknown',
      readAttachments: profile.ticketReadAttachmentsArticles || profile.ticketReadAttachments || 'unknown',
      writeComments: profile.ticketWriteComments || 'approval required',
      updateFields: profile.ticketUpdateFieldsStatusAssignee || profile.ticketUpdateFields || 'approval required',
      sensitiveRules: profile.ticketSensitiveDataRules || profile.sensitiveDataRestrictions || 'not configured',
      fallbackFields: profile.ticketFallbackIntakeFields || 'summary, acceptance criteria, relevant comments, QA expectations',
    },
    database: {
      provider: profile.databaseEvidenceProvider || profile.databaseProviderContext || 'not configured',
      availability: profile.databaseMcpAvailability || 'unknown',
      environments: profile.databaseEnvironmentsAllowed || 'not configured',
      allowedOperations: profile.databaseAllowedOperations || 'metadata read / aggregate SELECT / bounded row-level SELECT when approved',
      blockedOperations: profile.databaseBlockedOperations || 'INSERT, UPDATE, DELETE, DDL, migration, backfill, job execution, stored procedure execution',
      sensitiveRules: profile.databaseSensitiveSchemasTablesDataClasses || profile.sensitiveDataRestrictions || 'not configured',
      rowLimit: profile.databaseRowLimitDefaultAggregation || 'prefer aggregate/existence checks; row samples only when justified',
      redactionRules: profile.databaseRedactionRules || profile.sensitiveLogHandling || 'redact secrets, customer data, private URLs, identifiers, and raw row values before shared learning',
      fallback: profile.databaseFallbackEvidencePath || 'human-provided sanitized log/query result or local code/schema/test evidence',
    },
  };
}


export function externalEvidenceSensitive(task, profile = {}, kind = 'database') {
  const text = `${task} ${profile.classification || ''} ${profile.repositoryRole || ''}`.toLowerCase();
  if (matchesAny(text, ['production', 'prod', 'customer', 'client', 'private', 'secret', 'credential', 'token', 'payment', 'financial', 'health', 'tenant', 'soc'])) return true;
  if (kind === 'database' && matchesAny(text, ['row-level', 'raw row', 'select *', 'backfill', 'migration', 'delete', 'update'])) return true;
  if (kind === 'ticket' && matchesAny(text, ['attachment', 'screenshot', 'private comment', 'customer report'])) return true;
  return false;
}

export function databaseQueryShape(task, sensitive) {
  const text = task.toLowerCase();
  const shape = [
    'Start with metadata checks: table/view existence, column mapping, constraints, indexes, trigger/provider metadata, or stored procedure definition when allowed.',
    'Use aggregate/existence checks before row-level reads: counts, min/max timestamps, status distribution, or existence of expected related records.',
    'Scope by environment, tenant/test account, time window, and known case identifier.',
    'Capture summarized results, not raw row dumps.',
  ];
  if (matchesAny(text, ['api', 'swagger', 'openapi', 'endpoint'])) shape.push('Map query purpose to the API response field or status being validated.');
  if (matchesAny(text, ['ef core', 'trigger', 'output clause', 'foreign key', 'fk'])) shape.push('Inspect provider-specific metadata or generated SQL evidence before changing save order or schema.');
  if (sensitive) shape.push('Stop for approval before production/private row-level inspection; prefer redacted aggregate evidence or human-provided sanitized result.');
  return shape;
}

export function databaseApprovalGateText(boundary, sensitive) {
  if (sensitive) return '- Approval required before inspecting production/private row-level or sensitive data.';
  if (boundary.availability !== 'available') return '- Database MCP capability is not confirmed available; use fallback evidence or ask before relying on MCP access.';
  return '- No extra approval when staying inside configured read-only metadata/aggregate/test-data boundary; ask if uncertain.';
}

export function ticketFallbackFields(ticket) {
  const fields = splitList(ticket.fallbackFields);
  return fields.length ? fields : ['issue summary', 'acceptance criteria', 'relevant comments', 'QA expectations'];
}

export function toolsDetect(repo, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const detected = toolCapabilityRows(repo, profile.values, commands);
  console.log('| Capability | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const row of detected) console.log(`| ${escapeCell(row.name)} | ${row.status} | ${escapeCell(row.detail)} |`);
}

export function toolsStatus(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const rows = toolCapabilityRows(repo, profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json'))));
  const unavailable = rows.filter((row) => row.status !== 'available');
  printObject({
    task: task || 'not provided',
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    unavailable: unavailable.map((row) => row.name).join(', ') || 'none detected',
  });
  console.log('\n## Fallbacks\n');
  console.log(formatList(toolFallbacksForTask(task, surfaces, profile.values)));
}

export function toolsFallback(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const surfaces = inferTestingSurfaces(repo, task, getGitInfo(repo).changedFiles, profile);
  console.log(formatList(toolFallbacksForTask(task, surfaces, profile.values)));
}

export function toolsInventory(repo, options = {}) {
  const inventory = buildToolInventory(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'sdlc-cache', 'tools.json');
  safeWriteJsonFile(repo, outPath, inventory);
  if (options.json) {
    console.log(JSON.stringify(inventory, null, 2));
    return;
  }
  printTable(
    ['Tool', 'Status', 'Trust', 'Detail', 'Install Hint'],
    inventory.tools.map((tool) => [tool.name, tool.status, tool.trust, tool.detail, tool.installHint || '']),
  );
  console.log(`\nCache: ${relative(repo, outPath)}`);
}

export function toolsSetup(repo, options = {}) {
  const inventory = buildToolInventory(repo);
  const rows = inventory.tools
    .filter((tool) => options.includeInstalled || tool.status !== 'available')
    .map((tool) => [tool.name, tool.status, tool.installHint || 'no install hint configured', tool.detail]);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-tools-setup-v1', repository: repo, platform: process.platform, tools: inventory.tools }, null, 2));
    return;
  }
  printObject({ repository: repo, platform: process.platform, mode: 'recommend-only', installPolicy: 'Do not install automatically; use these commands only after human approval.' });
  printTable(['Tool', 'Status', 'Install Hint', 'Why It Matters'], rows.length ? rows : [['none', 'available', '', 'All tracked tools are available.']]);
}
export function toolsGaps(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const inventory = readToolInventory(repo) || buildToolInventory(repo);
  const rows = toolGapRows(repo, task, inventory, optionFiles(options, getGitInfo(repo).changedFiles));
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-tool-gaps-v1', task, repository: repo, gaps: rows }, null, 2));
    return;
  }
  const content = `# SDLC Tool Gaps

Task: ${task}
Repository: ${repo}

| Gap | Severity | Trust | Suggestion |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.gap)} | ${row.severity} | ${row.trust || 'weak-signal'} | ${escapeCell(row.suggestion)} |`).join('\n')}
`;
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'sdlc-cache', 'tool-gaps.md');
  safeWriteTextFile(repo, outPath, content);
  console.log(content.trimEnd());
  console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function toolsRecommend(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const inventory = readToolInventory(repo) || buildToolInventory(repo);
  const recommendations = localEvidenceRecommendations(repo, task, inventory, optionFiles(options, getGitInfo(repo).changedFiles));
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-tool-recommendations-v1', task, repository: repo, recommendations }, null, 2));
    return;
  }
  printObject({ task, repository: repo, recommendationCount: recommendations.length });
  console.log(formatList(recommendations));
}

export function toolsExperimentAdd(repo, options = {}) {
  const name = options.name || '';
  const command = options.command || '';
  if (!name || !command) fail('Pass --name <name> and --command "...".');
  const allowed = command.includes('.agents') || command.includes('.ai-local') || command.startsWith('sdlc ');
  const row = {
    name,
    command,
    status: allowed ? 'recorded-for-review' : 'needs-human-review',
    guardrail: allowed
      ? 'Allowed experiment scope: SDLC-owned or repo-local process tooling.'
      : 'Third-party or external command detected; do not make default until reviewed.',
    createdAt: new Date().toISOString(),
  };
  const path = join(repo, '.ai-local', 'sdlc-cache', 'tool-experiments.json');
  const existing = readJsonIfExists(path) || { schema: 'sdlc-tool-experiments-v1', experiments: [] };
  existing.experiments = [...(existing.experiments || []).filter((item) => item.name !== name), row];
  safeWriteJsonFile(repo, path, existing);
  printObject({ name, status: row.status, path: relative(repo, path), guardrail: row.guardrail });
}

export function toolsExperimentReview(repo, options = {}) {
  const path = join(repo, '.ai-local', 'sdlc-cache', 'tool-experiments.json');
  const data = readJsonIfExists(path) || { experiments: [] };
  const rows = (data.experiments || []).map((item) => [
    item.name,
    item.status || 'unknown',
    item.command || '',
    item.guardrail || '',
  ]);
  printTable(['Experiment', 'Status', 'Command', 'Guardrail'], rows.length ? rows : [['none', 'n/a', '', 'Add with sdlc tools experiment add.']]);
}

export function capabilitiesNegotiate(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const plan = buildLocalFirstPlan(repo, task, options);
  const outPath = options.out ? resolve(repo, options.out) : null;
  const content = renderLocalFirstPlan(plan);
  if (outPath) safeWriteTextFile(repo, outPath, content);
  upsertTaskJournal(repo, task, {
    localFirst: plan,
    decisions: [`Local-first capability negotiation recorded: ${plan.recommendedNextLocalCommand}`],
  }, options);
  if (options.json) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  console.log(content.trimEnd());
  if (outPath) console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function localFirstPlan(repo, options = {}) {
  return capabilitiesNegotiate(repo, options);
}

export function buildLocalFirstPlan(repo, task, options = {}) {
  const inventory = readToolInventory(repo) || buildToolInventory(repo);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const tool = (name) => inventory.tools.find((item) => item.name === name);
  const availableScripts = inventory.scripts.filter((script) => /test|build|lint|typecheck|check/i.test(script.name));
  const docsOnly = surfaces.length === 1 && surfaces.includes('docs-process');
  const canProve = [];
  if (git.branch) canProve.push(`Git scope and branch state (${git.branch}).`);
  if (docsOnly) canProve.push('Docs/process evidence through focused Markdown diff or manual README inspection.');
  else if (availableScripts.length) canProve.push(`Local command evidence via ${availableScripts.map((script) => script.command).slice(0, 4).join(', ')}.`);
  if (surfaces.includes('api-contract') || /api|swagger|openapi/i.test(task)) canProve.push('API contract shape when OpenAPI/Swagger files or endpoint tests are present.');
  if (surfaces.includes('data-persistence') || /database|sql|data/i.test(task)) canProve.push('Data behavior through code/schema/tests or approved read-only aggregate evidence.');
  const needsLlm = [
    'Architecture, code-design, and risk tradeoff judgment.',
    'Interpreting ambiguous acceptance criteria or cross-repo business intent.',
  ];
  const unavailable = toolGapRows(repo, task, inventory, files).filter((row) => row.severity !== 'suggest').map((row) => row.gap);
  const fallback = toolFallbacksForTask(task, surfaces, profile.values);
  const humanApproval = [];
  if (/commit|push/i.test(task)) humanApproval.push('Commit/push decision remains explicit human approval.');
  if (/merge|deploy|release|production|prod/i.test(task)) humanApproval.push('Merge, deploy, release, and production-sensitive actions require project-specific human approval.');
  if (/(^|[^a-z0-9])(database|sql|customer|client|soc|private)([^a-z0-9]|$)/i.test(task)) humanApproval.push('Sensitive database/ticket evidence may require approval and redaction.');
  const recommendedNextLocalCommand = docsOnly ? docsEvidenceCommand(task, files) : availableScripts[0]?.command || (tool('git')?.status === 'available' ? 'git status --short' : 'sdlc tools inventory');
  return {
    schema: 'sdlc-local-first-plan-v1',
    task,
    repository: repo,
    generatedAt: new Date().toISOString(),
    testingSurfaces: surfaces,
    canProveLocally: canProve.length ? canProve : ['Repository/profile/tool availability facts can be collected locally.'],
    needsLlmJudgment: needsLlm,
    unavailable: unavailable.length ? unavailable : ['No major local evidence gap detected from current inventory.'],
    fallbackEvidence: fallback,
    humanApprovalNeeded: humanApproval.length ? humanApproval : ['No special approval detected beyond normal human finish decision.'],
    recommendedNextLocalCommand,
    trustBoundary: 'Local deterministic facts are evidence; recommendations are suggestions; model output remains judgment unless verified.',
  };
}

function docsEvidenceCommand(task, files = []) {
  const docsFiles = files.filter((file) => /\.md$/i.test(file));
  if (docsFiles.length) return `git diff -- ${docsFiles.join(' ')}`;
  if (/\breadme(?:\.md)?\b/i.test(task)) return 'git diff -- README.md';
  return 'manual focused inspection or markdown diff';
}

export function renderLocalFirstPlan(plan) {
  return `# SDLC Local-First Capability Plan

Task: ${plan.task}
Repository: ${plan.repository}
Generated: ${plan.generatedAt}
Testing surfaces: ${(plan.testingSurfaces || []).join(', ') || 'unknown'}

## Can Prove Locally

${formatList(plan.canProveLocally || [])}

## Needs LLM Judgment

${formatList(plan.needsLlmJudgment || [])}

## Unavailable

${formatList(plan.unavailable || [])}

## Fallback Evidence

${formatList(plan.fallbackEvidence || [])}

## Human Approval Needed

${formatList(plan.humanApprovalNeeded || [])}

## Recommended Next Local Command

${plan.recommendedNextLocalCommand || 'sdlc next --task "..."'}

## Trust Boundary

${plan.trustBoundary}
`;
}

export function buildToolInventory(repo) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const scripts = [
    ...scriptsFromPackageJson(packageJson, '.'),
    ...nestedPackageScripts(repo),
    ...makefileTargets(repo),
  ];
  const commands = discoverCommands(profile.values, packageJson);
  const toolNames = [
    'git', 'rg', 'jq', 'yq', 'node', 'npm', 'pnpm', 'yarn', 'bun', 'deno', 'dotnet', 'cargo', 'pip', 'uv',
    'docker', 'podman', 'gitleaks', 'semgrep', 'shellcheck', 'hadolint', 'osv-scanner', 'lychee',
    'markdownlint-cli2', 'vale', 'spectral', 'ast-grep', 'cspell', 'codespell', 'typos', 'aspell', 'hunspell', 'npx',
  ];
  const tools = toolNames.map((name) => ({
    name,
    status: commandExists(name) ? 'available' : 'missing',
    trust: toolTrust(name),
    detail: toolDetail(name, repo),
    installHint: toolInstallHint(name),
  }));
  const files = detectEvidenceFiles(repo);
  const units = detectInventoryUnits(repo, files, scripts);
  return {
    schema: 'sdlc-tool-inventory-v1',
    generatedAt: new Date().toISOString(),
    repository: repo,
    packageManager: detectPackageManager(repo) || 'unknown',
    profile: existsSync(join(repo, '.ai-local', 'sdlc-profile.json')) ? '.ai-local/sdlc-profile.json' : 'not detected',
    commands,
    scripts,
    files,
    units,
    tools,
  };
}

export function readToolInventory(repo) {
  return readJsonIfExists(join(repo, '.ai-local', 'sdlc-cache', 'tools.json'));
}

function toolGapRows(repo, task, inventory, files = []) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const touchedFiles = files.length ? files : git.changedFiles;
  const surfaces = inferTestingSurfaces(repo, task, touchedFiles, profile);
  const hasScript = (pattern) => inventory.scripts.some((script) => pattern.test(script.name) || pattern.test(script.command));
  const hasTool = (name) => inventory.tools.some((tool) => tool.name === name && tool.status === 'available');
  const rows = [];
  if (!hasScript(/test/i)) rows.push({ gap: 'No discovered test script.', severity: 'warn', trust: 'local-configuration', suggestion: 'Use build/typecheck/smoke/manual QA evidence and consider adding a focused foothold test.' });
  if (!hasScript(/build/i) && (hasTool('npm') || hasTool('dotnet') || hasTool('deno'))) rows.push({ gap: 'No discovered build script.', severity: 'suggest', trust: 'optional-suggestion', suggestion: 'Configure a build command in the repo profile or package/tool config.' });
  if (surfaces.includes('rendered-product-ui') && !hasTool('npx')) rows.push({ gap: 'Rendered UI tooling not obvious.', severity: 'suggest', trust: 'optional-suggestion', suggestion: 'Use configured rendered evidence command, browser smoke, or manual QA cap.' });
  if (/api|swagger|openapi/i.test(task) && !inventory.files.some((file) => /openapi|swagger/i.test(file.path))) rows.push({ gap: 'API task without detected OpenAPI/Swagger artifact.', severity: 'suggest', trust: 'weak-signal', suggestion: 'Use endpoint tests, API client evidence, or profile the API contract source.' });
  if (/database|sql|data/i.test(task) && externalEvidenceProfile(profile.values).database.availability !== 'available') rows.push({ gap: 'Database MCP unavailable or unknown.', severity: 'warn', trust: 'human-judgment-required', suggestion: 'Use code/schema/test evidence or ask for approved sanitized aggregate evidence.' });
  for (const recommendation of deterministicToolRecommendations({ task, files: touchedFiles, surfaces, inventory })) {
    if (recommendation.status === 'missing') rows.push({
      gap: `${recommendation.tool} unavailable for ${recommendation.id}.`,
      severity: 'suggest',
      trust: 'optional-suggestion',
      suggestion: recommendation.fallback,
    });
  }
  return rows.length ? rows : [{ gap: 'No major gaps detected.', severity: 'record', trust: 'deterministic-proof', suggestion: 'Continue with local-first evidence plan.' }];
}

function localEvidenceRecommendations(repo, task, inventory, files = []) {
  const rows = [];
  const commands = inventory.scripts.map((script) => script.command);
  const first = (pattern) => commands.find((command) => pattern.test(command));
  const surfaces = inferTestingSurfaces(repo, task, files, loadProfile(repo));
  if (first(/test/i)) rows.push(`Run focused developer verification: ${first(/test/i)}.`);
  if (first(/typecheck|check/i)) rows.push(`Run type/static check evidence: ${first(/typecheck|check/i)}.`);
  if (first(/build/i)) rows.push(`Run build evidence when behavior or packaging changed: ${first(/build/i)}.`);
  for (const recommendation of deterministicToolRecommendations({ task, files, surfaces, inventory })) {
    const availability = recommendation.status === 'available' ? recommendation.command : `${recommendation.tool} unavailable; ${recommendation.fallback}`;
    rows.push(`${recommendation.reason}: ${availability}.`);
  }
  if (/qa|tester|manual/i.test(task)) rows.push('Generate tester-readable Markdown with `sdlc qa script --task "..."` and lint it with `sdlc qa human-lint --packet <path>`.');
  if (/api|swagger|openapi/i.test(task)) rows.push('Treat Swagger/OpenAPI/API client evidence as a testing surface, not rendered product UI.');
  if (/database|sql|data/i.test(task)) rows.push('Prefer metadata/aggregate/read-only evidence and redact sensitive details in learnings.');
  if (!rows.length) rows.push('Start with `sdlc local-first plan --task "..."`, then run the closest available verification command.');
  return rows;
}

export function deterministicToolRecommendations({ task = '', files = [], surfaces = [], inventory = {} } = {}) {
  const text = String(task || '').toLowerCase();
  const touched = files.map((file) => String(file || '').replace(/\\/g, '/'));
  const hasTool = (name) => (inventory.tools || []).some((tool) => tool.name === name && tool.status === 'available');
  const rows = [];
  const add = (id, tool, command, reason, fallback) => {
    if (rows.some((row) => row.id === id && row.tool === tool)) return;
    rows.push({ id, tool, command, reason, fallback, status: hasTool(tool) ? 'available' : 'missing' });
  };
  const selected = (pattern) => touched.filter((file) => pattern.test(file));
  const docs = selected(/\.(md|mdx|txt|adoc|rst)$/i);
  const shell = selected(/\.(sh|bash|zsh|ksh)$/i);
  const docker = selected(/(^|\/)Dockerfile[^/]*$|\.dockerfile$/i);
  const json = selected(/\.(json|jsonc)$/i);
  const yaml = selected(/\.(ya?ml)$/i);
  const apiSpecs = selected(/(^|\/)(openapi|swagger|asyncapi)[^/]*\.(json|ya?ml)$/i);
  const dependencyFiles = selected(/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|deno\.lock|requirements.*\.txt|pyproject\.toml|poetry\.lock|go\.mod|go\.sum|Cargo\.lock|packages\.lock\.json|.*\.(csproj|fsproj|vbproj))$/i);
  const sourceFiles = selected(/\.(js|jsx|ts|tsx|mjs|cjs|py|cs|vb|fs|go|rs|java|kt|php|rb)$/i);
  const configOrSensitive = selected(/(^|\/)(\.env|.*secret.*|.*credential.*|.*token.*|.*config.*|.*adapter.*|.*mcp.*|.*agent.*)/i);
  const securityText = /\b(secret|credential|token|auth|oauth|session|cookie|permission|policy|security|mcp|adapter|sandbox|external service|provider)\b/.test(text);
  const refactorText = /\b(refactor|rename|codemod|mechanical rewrite|structural search|large edit)\b/.test(text);

  if (docs.length) {
    add('markdown-lint', 'markdownlint-cli2', `markdownlint-cli2 ${quotePaths(docs)}`, 'Lint changed Markdown/prose structure deterministically', 'use focused changed-file review and `git diff --check`');
    add('link-check', 'lychee', `lychee ${quotePaths(docs)}`, 'Check changed documentation links deterministically', 'manually inspect changed links and avoid claiming link health');
    add('prose-style', 'vale', `vale ${quotePaths(docs)}`, 'Check public/team-facing prose consistency when styles are configured', 'perform focused terminology/readability review');
  }
  if (shell.length) add('shell-lint', 'shellcheck', `shellcheck ${quotePaths(shell)}`, 'Lint changed shell scripts deterministically', 'review shell quoting, errexit behavior, inputs, and sandbox assumptions manually');
  if (docker.length) add('dockerfile-lint', 'hadolint', `hadolint ${quotePaths(docker)}`, 'Lint changed Dockerfiles deterministically', 'review Dockerfile layers, base image, user, and shell commands manually');
  if (dependencyFiles.length || surfaces.includes('package-tooling') || /\b(dependency|package|vulnerability|supply chain)\b/.test(text)) {
    add('dependency-vulnerability-scan', 'osv-scanner', 'osv-scanner --recursive .', 'Scan dependency manifests and lockfiles for known vulnerabilities', 'use package-manager audit or record vulnerability-scan cap');
  }
  if (apiSpecs.length || surfaces.includes('api-contract')) add('api-spec-lint', 'spectral', `spectral lint ${quotePaths(apiSpecs.length ? apiSpecs : ['openapi.yaml'])}`, 'Lint OpenAPI/AsyncAPI contract files deterministically', 'use API contract tests or manual schema review');
  if (json.length) add('json-parse', 'jq', `jq empty ${quotePaths(json)}`, 'Validate changed JSON syntax deterministically', 'use language parser or focused syntax review');
  if (yaml.length) add('yaml-parse', 'yq', `yq eval '.' ${quotePaths(yaml)}`, 'Validate changed YAML syntax deterministically', 'use repo-native YAML parser or focused syntax review');
  if (securityText || configOrSensitive.length) add('secret-scan', 'gitleaks', 'gitleaks detect --source . --redact --no-banner', 'Scan for accidental secrets after sensitive/config/tooling changes', 'review changed config for secrets and avoid sharing raw values');
  if (securityText && sourceFiles.length) add('sast-scan', 'semgrep', 'semgrep scan --config auto', 'Run deterministic static analysis for security-sensitive source changes', 'use focused code review and configured lint/typecheck evidence');
  if (refactorText) add('structural-search', 'ast-grep', 'ast-grep scan', 'Use configured structural rules for broad mechanical code changes', 'use `rg` plus focused review for representative before/after examples');
  return rows;
}

function quotePaths(files) {
  return files.slice(0, 24).map(quotePath).join(' ');
}

function quotePath(file) {
  const value = String(file);
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `"${value.replace(/(["\\$`])/g, '\\$1')}"`;
}

function detectEvidenceFiles(repo) {
  const candidates = ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'deno.json', 'deno.jsonc', 'deno.lock', 'Makefile', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.gitlab-ci.yml', 'playwright.config.ts', 'playwright.config.js', 'cypress.config.ts', 'cypress.config.js', 'openapi.yaml', 'openapi.yml', 'swagger.json', 'asyncapi.yaml', 'asyncapi.yml'];
  const files = candidates.filter((name) => existsSync(join(repo, name))).map((path) => ({ path, kind: 'root-config' }));
  for (const path of boundedWalk(repo, 4, 900)) {
    if (/\.(sln|csproj|fsproj|vbproj)$/.test(path)) files.push({ path, kind: 'dotnet-project' });
    else if (/(^|\/)(openapi|swagger|asyncapi).*\.(json|ya?ml)$/i.test(path)) files.push({ path, kind: 'api-contract' });
    else if (/(^|\/)Dockerfile[^/]*$|\.dockerfile$/i.test(path)) files.push({ path, kind: 'container-build' });
    else if (/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|deno\.lock|Cargo\.lock|packages\.lock\.json)$/i.test(path)) files.push({ path, kind: 'dependency-lockfile' });
    else if (/(^|\/)(playwright|cypress|vitest|jest)\.config\.[cm]?[jt]s$/i.test(path)) files.push({ path, kind: 'test-tool-config' });
    else if (/(^|\/)deno\.jsonc?$/i.test(path)) files.push({ path, kind: 'deno-config' });
  }
  return files;
}

function scriptsFromPackageJson(packageJson, dir) {
  return packageJson?.scripts
    ? Object.entries(packageJson.scripts).map(([name, command]) => ({ name, command: dir === '.' ? `npm run ${name}` : `npm --prefix ${dir} run ${name}`, detail: command, unit: dir, trust: 'local-configuration' }))
    : [];
}

function nestedPackageScripts(repo) {
  const scripts = [];
  for (const path of boundedWalk(repo, 3, 400)) {
    if (!path.endsWith('package.json') || path === 'package.json') continue;
    const json = readJsonIfExists(join(repo, path));
    const dir = path.replace(/\/package\.json$/, '');
    scripts.push(...scriptsFromPackageJson(json, dir));
  }
  return scripts.slice(0, 80);
}

function makefileTargets(repo) {
  const path = join(repo, 'Makefile');
  if (!existsSync(path)) return [];
  return [{ name: 'make', command: 'make', detail: 'Makefile detected; inspect targets before use.', unit: '.', trust: 'weak-signal' }];
}

function detectInventoryUnits(repo, files, scripts) {
  const paths = new Set();
  for (const file of files) {
    const parts = file.path.split('/');
    if (parts.length > 1) paths.add(parts.slice(0, -1).join('/'));
  }
  for (const script of scripts) if (script.unit && script.unit !== '.') paths.add(script.unit);
  return [...paths].slice(0, 80).map((path) => ({ path, kind: inferUnitKind(path, files), trust: 'weak-signal' }));
}

function inferUnitKind(path, files) {
  if (files.some((file) => file.path.startsWith(`${path}/`) && file.kind === 'dotnet-project')) return 'dotnet-codebase';
  if (files.some((file) => file.path.startsWith(`${path}/`) && file.kind === 'api-contract')) return 'api-contract-unit';
  return 'project-unit';
}

function boundedWalk(repo, maxDepth, maxFiles) {
  const skip = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.nuxt', 'bin', 'obj', '.ai-local']);
  const results = [];
  function walk(dir, depth, prefix) {
    if (depth > maxDepth || results.length >= maxFiles) return;
    let entries = [];
    try {
      entries = readdirSync(dir).slice(0, 300);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry) || results.length >= maxFiles) continue;
      const abs = join(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      let stat;
      try {
        stat = statSync(abs);
      } catch {
        continue;
      }
      if (stat.isDirectory()) walk(abs, depth + 1, rel);
      else results.push(rel);
    }
  }
  walk(repo, 1, '');
  return results;
}

function toolTrust(name) {
  if (['git', 'rg', 'jq', 'yq', 'node'].includes(name)) return 'deterministic-proof';
  if (['npm', 'pnpm', 'yarn', 'bun', 'deno', 'dotnet', 'cargo', 'pip', 'uv', 'npx'].includes(name)) return 'local-configuration';
  if (['docker', 'podman'].includes(name)) return 'optional-suggestion';
  if (['gitleaks', 'semgrep', 'shellcheck', 'hadolint', 'osv-scanner', 'lychee', 'markdownlint-cli2', 'vale', 'spectral', 'ast-grep'].includes(name)) return 'optional-deterministic-tool';
  if (['cspell', 'codespell', 'typos', 'aspell', 'hunspell', 'vale'].includes(name)) return 'optional-suggestion';
  return 'weak-signal';
}

function toolDetail(name, repo) {
  if (name === 'git') return 'scope, branch, and diff evidence';
  if (name === 'gitleaks') return 'optional redacted secret scanning';
  if (name === 'semgrep') return 'optional static analysis/security scanning';
  if (name === 'shellcheck') return 'optional shell script linting';
  if (name === 'hadolint') return 'optional Dockerfile linting';
  if (name === 'osv-scanner') return 'optional dependency vulnerability scanning';
  if (name === 'lychee') return 'optional documentation link checking';
  if (name === 'markdownlint-cli2') return 'optional Markdown linting';
  if (name === 'vale') return 'optional prose style linting';
  if (name === 'spectral') return 'optional API specification linting';
  if (name === 'ast-grep') return 'optional structural search/lint/rewrite support';
  if (name === 'yq') return 'optional YAML parsing/query support';
  if (['cspell', 'codespell', 'typos', 'aspell', 'hunspell', 'vale'].includes(name)) return 'optional prompt/prose hygiene support';
  if (name === detectPackageManager(repo)) return 'detected package manager';
  return 'local command availability';
}

export function toolCapabilityRows(repo, profile = {}, commands = {}) {
  const external = externalEvidenceProfile(profile);
  const packageManager = detectPackageManager(repo);
  return [
    { name: 'git', status: commandExists('git') ? 'available' : 'unavailable', detail: 'required for scope and branch evidence' },
    { name: 'node', status: commandExists('node') ? 'available' : 'unavailable', detail: 'required for SDLC helper execution' },
    { name: packageManager || 'package-manager', status: packageManager && commandExists(packageManager === 'nuget' ? 'dotnet' : packageManager) ? 'available' : packageManager ? 'unavailable' : 'unknown', detail: packageManager || 'not detected' },
    { name: 'test-command', status: commands.test ? 'available' : 'unknown', detail: commands.test || 'not configured/discovered' },
    { name: 'build-command', status: commands.build ? 'available' : 'unknown', detail: commands.build || 'not configured/discovered' },
    { name: 'rendered-ui', status: profile.renderedUiReviewCommand ? 'available' : 'unknown', detail: profile.renderedUiReviewCommand || 'profile has no rendered UI command' },
    { name: 'ticket-mcp', status: external.ticket.availability === 'available' ? 'available' : 'optional', detail: external.ticket.availability },
    { name: 'database-mcp', status: external.database.availability === 'available' ? 'available' : 'optional', detail: external.database.availability },
    { name: 'evidence-root', status: 'available', detail: defaultRunsDir(repo) },
  ];
}

function toolInstallHint(name) {
  const platform = process.platform;
  const windows = {
    rg: 'winget install BurntSushi.ripgrep.MSVC',
    jq: 'winget install jqlang.jq',
    yq: 'winget install MikeFarah.yq',
    node: 'winget install OpenJS.NodeJS.LTS',
    npm: 'Install Node.js LTS; npm is bundled.',
    npx: 'Install Node.js LTS; npx is bundled.',
    pnpm: 'corepack enable pnpm or npm install -g pnpm',
    yarn: 'corepack enable yarn or npm install -g yarn',
    bun: 'winget install Oven-sh.Bun',
    deno: 'winget install DenoLand.Deno',
    git: 'winget install Git.Git',
    gitleaks: 'winget install Gitleaks.Gitleaks',
    semgrep: 'python -m pip install semgrep',
    shellcheck: 'winget install koalaman.shellcheck',
    hadolint: 'winget install hadolint.hadolint',
    'osv-scanner': 'winget install Google.OSVScanner',
    lychee: 'winget install lycheeverse.lychee',
    'markdownlint-cli2': 'npm install -g markdownlint-cli2',
    vale: 'winget install errata-ai.Vale',
    spectral: 'npm install -g @stoplight/spectral-cli',
    'ast-grep': 'npm install -g @ast-grep/cli',
    cspell: 'npm install -g cspell',
    codespell: 'python -m pip install codespell',
    typos: 'winget install Crate-CI.Typos',
    aspell: 'Install GNU Aspell manually or use cspell/codespell fallback.',
    hunspell: 'Install Hunspell manually or use cspell/codespell fallback.',
    docker: 'winget install Docker.DockerDesktop',
    dotnet: 'winget install Microsoft.DotNet.SDK.8',
    pip: 'Install Python; pip is usually bundled.',
    cargo: 'winget install Rustlang.Rustup',
    uv: 'winget install astral-sh.uv',
    podman: 'winget install RedHat.Podman',
  };
  const unix = {
    rg: 'install ripgrep with the OS package manager',
    jq: 'install jq with the OS package manager',
    yq: 'install yq with the OS package manager',
    gitleaks: 'install gitleaks with the OS package manager or vendor instructions',
    semgrep: 'python -m pip install semgrep',
    'markdownlint-cli2': 'npm install -g markdownlint-cli2',
    spectral: 'npm install -g @stoplight/spectral-cli',
    'ast-grep': 'npm install -g @ast-grep/cli',
    cspell: 'npm install -g cspell',
    codespell: 'python -m pip install codespell',
  };
  return (platform === 'win32' ? windows : unix)[name] || '';
}

export function commandExists(command) {
  return Boolean(resolveCommand(command));
}

function resolveCommand(command) {
  const pathValue = process.env.PATH || process.env.Path || process.env.path || '';
  const pathExt = process.platform === 'win32'
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.PS1').split(';')
    : [''];
  const names = process.platform === 'win32' && !/\.[A-Za-z0-9]+$/.test(command)
    ? [command, ...pathExt.map((ext) => `${command}${ext.toLowerCase()}`), ...pathExt.map((ext) => `${command}${ext.toUpperCase()}`)]
    : [command];
  for (const dir of pathValue.split(delimiter).filter(Boolean)) {
    for (const name of names) {
      if (existsSync(join(dir, name))) return join(dir, name);
    }
  }
  const probe = process.platform === 'win32' ? 'where.exe' : 'which';
  const result = spawnSync(probe, [command], { encoding: 'utf8', shell: false });
  return result.status === 0 ? String(result.stdout || '').split(/\r?\n/).find(Boolean) || command : '';
}

export function toolFallbacksForTask(task, surfaces, profile = {}) {
  const external = externalEvidenceProfile(profile);
  const fallbacks = [];
  if (external.ticket.availability !== 'available') fallbacks.push('Ticket MCP unavailable/unknown: ask for pasted summary, acceptance criteria, comments, and QA expectations.');
  if (external.database.availability !== 'available' && (surfaces.includes('data-persistence') || matchesAny(String(task).toLowerCase(), ['database', 'sql']))) fallbacks.push('Database MCP unavailable/unknown: use local code/schema/tests or sanitized human-provided query/log results.');
  if (surfaces.includes('rendered-product-ui') && !profile.renderedUiReviewCommand) fallbacks.push('Rendered UI command unavailable: use build/typecheck plus manual smoke/render cap.');
  if (!fallbacks.length) fallbacks.push('No special fallback needed from current task/tool signals.');
  return fallbacks;
}

export function capabilitySnapshot(repo, options = {}) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  const rows = capabilityRows(repo, profile.values, commands);
  const snapshot = { schema: 'sdlc-capability-snapshot-v1', timestamp: new Date().toISOString(), repo, rows };
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'capability-snapshot.json');
  safeWriteJsonFile(repo, outPath, snapshot);
  printTable(['Capability', 'Status', 'Detail'], rows.map((row) => [row.name, row.status, row.detail]));
  console.log(`Snapshot: ${relative(repo, outPath)}`);
}

export function capabilityDoctor(repo, options = {}) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  const rows = capabilityRows(repo, profile.values, commands);
  const warnings = rows.filter((row) => ['missing', 'unknown', 'unavailable'].includes(row.status));
  printTable(['Capability', 'Status', 'Recovery'], rows.map((row) => [row.name, row.status, capabilityRecovery(row.name, row.status)]));
  if (warnings.length) process.exitCode = 1;
}

export function capabilityFallback(repo, options = {}) {
  const capability = options.capability || options.name || '';
  const task = options.task || '';
  const profile = loadProfile(repo);
  const surfaces = inferTestingSurfaces(repo, task, getGitInfo(repo).changedFiles, profile);
  const fallback = capability ? fallbackForCapability(capability, task, surfaces) : toolFallbacksForTask(task, surfaces, profile.values).join('\n');
  console.log(fallback);
}

export function capabilityRows(repo, profile, commands) {
  return [
    ...toolCapabilityRows(repo, profile, commands),
    { name: 'workspace-profile', status: existsSync(join(repo, '.ai-local', 'workspace-profile.json')) ? 'available' : 'unknown', detail: '.ai-local/workspace-profile.json' },
    { name: 'local-index', status: existsSync(join(repo, '.ai-local', 'sdlc-index.json')) ? 'available' : 'unknown', detail: '.ai-local/sdlc-index.json' },
  ];
}

export function capabilityRecovery(name, status) {
  if (status === 'available') return 'none';
  if (name === 'ticket-mcp') return 'paste ticket summary/acceptance criteria or configure optional ticket MCP';
  if (name === 'database-mcp') return 'use code/schema/log evidence or configure read-only database MCP';
  if (name === 'rendered-ui') return 'configure rendered UI command or record manual smoke cap';
  if (name === 'test-command') return 'add focused test command to profile or record no-tests cap';
  if (name === 'local-index') return 'run sdlc index build';
  return 'configure profile or use explicit cap';
}

export function fallbackForCapability(capability, task, surfaces) {
  if (capability.includes('ticket')) return 'Ticket MCP fallback: ask for pasted issue summary, acceptance criteria, relevant comments, and QA expectations; record source as human-provided.';
  if (capability.includes('database')) return 'Database MCP fallback: use source code, schema files, migrations, tests, sanitized logs, or human-provided aggregate results; never invent data evidence.';
  if (capability.includes('browser') || capability.includes('render')) return 'Rendered UI fallback: use build/typecheck/unit checks plus a manual smoke cap and QA Markdown steps.';
  if (capability.includes('test')) return 'Test fallback: run build/typecheck/smoke if available and create a focused manual QA script plus future test recommendation.';
  return toolFallbacksForTask(task, surfaces, loadProfile(process.cwd()).values).join('\n');
}
