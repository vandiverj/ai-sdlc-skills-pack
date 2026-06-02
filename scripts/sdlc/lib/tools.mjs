import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';
import { escapeCell, formatList, printObject, printTable, readJsonIfExists, safeWriteJsonFile, splitList } from './common.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { getGitInfo } from './git.mjs';
import { detectPackageManager, inferTestingSurfaces } from './units.mjs';

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

export function commandExists(command) {
  const result = spawnSync('which', [command], { encoding: 'utf8' });
  return result.status === 0;
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
