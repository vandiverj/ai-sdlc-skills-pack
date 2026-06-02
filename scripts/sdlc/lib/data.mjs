import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, formatList, printObject, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { databaseApprovalGateText, databaseQueryShape, externalEvidenceProfile, externalEvidenceSensitive } from './tools.mjs';

export function dataPacket(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the data packet can be scoped.');
  const classifyTouchedSurface = dependencies.classifyTouchedSurface || (() => 'unknown');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const dataFiles = git.changedFiles.filter((file) => classifyTouchedSurface(file) === 'database/storage');
  const boundary = externalEvidenceProfile(profile.values).database;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-data-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Data / Storage Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Data Surfaces

${formatList(dataFiles.length ? dataFiles : ['No changed data files detected yet; identify tables/collections/files/caches/queues during implementation.'])}

## Data Change Checklist

- Tables/collections/files/caches/queues:
- Schema/migration/scripts:
- Stored procedures/views/functions:
- Data correction or backfill:
- Rollback approach:
- Locking/performance risk:
- QA data setup:
- Downstream workflows/APIs/pages:

## Read-Only Database Evidence

- MCP availability: ${boundary.availability}
- Provider/context: ${boundary.provider}
- Allowed environments: ${boundary.environments}
- Allowed operations: ${boundary.allowedOperations}
- Blocked operations: ${boundary.blockedOperations}
- Sensitive data rules: ${boundary.sensitiveRules}
- Redaction rules: ${boundary.redactionRules}
- Evidence use: optional, route-selected, and never permission for write/migration/backfill/deploy actions.

## Verification

- Automated data/schema check:
- Manual data validation:
- Environment cap:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function dataBoundary(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const boundary = externalEvidenceProfile(profile.values).database;
  const sensitive = externalEvidenceSensitive(task, profile.values, 'database');
  printObject({
    repository: repo,
    task: task || 'not provided',
    provider: boundary.provider,
    mcpAvailability: boundary.availability,
    allowedEnvironments: boundary.environments,
    allowedOperations: boundary.allowedOperations,
    blockedOperations: boundary.blockedOperations,
    sensitiveDataRules: boundary.sensitiveRules,
    redactionRules: boundary.redactionRules,
    approvalNeeded: sensitive ? 'yes for production/private row-level data or sensitive schemas' : 'only if profile requires it or query exceeds metadata/aggregate evidence',
    fallback: boundary.fallback,
  });
}

export function dataQueryPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the database evidence query plan can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const boundary = externalEvidenceProfile(profile.values).database;
  const outPath = options.out ? resolve(repo, options.out) : '';
  const sensitive = externalEvidenceSensitive(task, profile.values, 'database');
  const content = `# SDLC Read-Only Database Query Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}

## Capability Boundary

- Provider/context: ${boundary.provider}
- MCP availability: ${boundary.availability}
- Allowed environments: ${boundary.environments}
- Allowed operations: ${boundary.allowedOperations}
- Blocked operations: ${boundary.blockedOperations}
- Sensitive data rules: ${boundary.sensitiveRules}
- Redaction rules: ${boundary.redactionRules}
- Fallback evidence path: ${boundary.fallback}

## Query Purpose

- Question the evidence should answer:
- Code/API/log behavior this will validate:
- Environment to inspect:
- Tenant/customer/test-data boundary:

## Safe Query Shape

${formatList(databaseQueryShape(task, sensitive))}

## Blocked Query Shape

${formatList([
    'Do not use broad SELECT * row dumps.',
    'Do not select secrets, credentials, tokens, payment data, private customer data, or unrelated tenant data.',
    'Do not run INSERT, UPDATE, DELETE, DDL, migrations, backfills, jobs, or stored procedure execution from this evidence step.',
    'Do not store raw query output in shared .agents learnings or tracked reusable process docs.',
  ])}

## Evidence Summary To Capture

- Environment:
- Retrieved at:
- Query/result type: metadata / aggregate / existence check / bounded sample / human-provided result
- Tables/views/metadata involved:
- Result summary with sensitive values redacted:
- Confidence:
- Caps:

## Approval Gate

${databaseApprovalGateText(boundary, sensitive)}
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function dataEvidence(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the database evidence packet can be scoped.');
  const profile = loadProfile(repo);
  const boundary = externalEvidenceProfile(profile.values).database;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-database-evidence.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Database Evidence Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Capability

- Provider/context: ${boundary.provider}
- MCP availability: ${boundary.availability}
- Access mode: read-only evidence, if available and allowed

## Evidence

- Environment:
- Retrieved at:
- Query purpose:
- Tables/views/metadata involved:
- Sensitive data risk:
- Allowed query shape used:
- Blocked query shape avoided:
- Row limit or aggregation:
- Redaction applied:
- Result confidence:
- Result summary:
- Caps:

## Source Truth Reconciliation

- Code/schema/logs/tests checked:
- Conflicts found:
- Desired product behavior source:
- Follow-up context owner:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}
