import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fail, printObject, readJsonIfExists, safeWriteTextFile, toCamel } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { defaultCalibrationPath, defaultRunsDir } from './paths.mjs';
import { detectStack } from './units.mjs';

export function loadProfile(repo) {
  const candidates = [
    join(repo, 'sdlc.config.json'),
    join(repo, '.sdlc', 'profile.json'),
    join(repo, '.ai-local', 'sdlc-profile.json'),
    join(repo, '.sdlc', 'profile.md'),
    join(repo, '.ai-local', 'sdlc-profile.md'),
    join(repo, '.ai-local', 'repository-setup.md'),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (candidate.endsWith('.json')) {
      const json = readJsonIfExists(candidate) || {};
      return { path: candidate, values: normalizeProfileJsonValues(json), units: normalizeUnits(json.units || []) };
    }
    const text = readFileSync(candidate, 'utf8');
    return { path: candidate, values: parseMarkdownProfile(text), units: parseProfileUnits(text) };
  }

  return { path: '', values: {}, units: [] };
}

export function parseMarkdownProfile(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-\s*)?([^:#|]+):\s*(.*)$/);
    if (!match) continue;
    values[toCamel(match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))] = match[2].trim();
  }
  return values;
}

export function normalizeProfileJsonValues(json = {}) {
  const values = normalizeKeys(json);
  if (json.repository && typeof json.repository === 'object') {
    values.repository = json.repository.name || values.repository || '';
    values.repositoryRole = json.repository.kind || values.repositoryRole || '';
  }
  if (json.context && typeof json.context === 'object') {
    values.sharedContextRoot = json.context.sharedRoot || values.sharedContextRoot || '';
    values.productContext = json.context.product || values.productContext || '';
    values.repoContext = json.context.repo || values.repoContext || '';
    values.evidenceOutputLocation = json.context.output || values.evidenceOutputLocation || '';
  }
  for (const item of Array.isArray(json.commands) ? json.commands : []) {
    if (item.kind === 'test') values.testCommand = item.command;
    if (item.kind === 'build') values.buildCommand = item.command;
    if (item.kind === 'lint') values.lintTypecheckFormatCommands = item.command;
    if (item.kind === 'dev') values.devServerCommand = item.command;
    if (item.kind === 'rendered') values.renderedUiReviewCommand = item.command;
  }
  if (json.capabilities && typeof json.capabilities === 'object') {
    values.ticketMcpAvailability = json.capabilities.ticketMcp || values.ticketMcpAvailability || '';
    values.databaseMcpAvailability = json.capabilities.databaseMcp || values.databaseMcpAvailability || '';
  }
  if (json.policy && typeof json.policy === 'object') {
    values.releasePolicy = json.policy.release || values.releasePolicy || '';
    values.humanApprovalGates = json.policy.approvalGates || values.humanApprovalGates || '';
    values.sensitiveDataRestrictions = json.policy.sensitiveData || values.sensitiveDataRestrictions || '';
  }
  return values;
}

export function normalizeKeys(value) {
  const out = {};
  for (const [key, item] of Object.entries(value)) out[toCamel(key)] = item;
  return out;
}

export function parseProfileUnits(text) {
  const units = [];
  let current = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    const heading = line.match(/^#{2,4}\s+Unit:\s*(.+)$/i);
    if (heading) {
      if (current) units.push(current);
      current = { name: heading[1].trim() };
      continue;
    }
    const field = line.match(/^\s*-\s*([^:#|]+):\s*(.*)$/);
    if (!field || !current) continue;
    current[toCamel(field[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))] = field[2].trim();
  }
  if (current) units.push(current);
  return normalizeUnits(units);
}

export function normalizeUnits(units) {
  return (Array.isArray(units) ? units : [])
    .map((unit, index) => normalizeKeys(unit || { name: `unit-${index + 1}` }))
    .map((unit) => ({
      name: unit.name || unit.unit || unit.id || 'default',
      path: unit.path || unit.root || '.',
      type: unit.type || unit.kind || unit.stack || '',
      testSurface: unit.testSurface || unit.testingSurface || '',
      contextBucket: unit.contextBucket || '',
      durableContextFile: unit.durableContextFile || unit.contextFile || '',
      buildCommand: unit.buildCommand || '',
      testCommand: unit.testCommand || '',
      deployMethod: unit.deployMethod || '',
      swaggerOpenapi: unit.swaggerOpenapi || unit.swagger || unit.openapi || '',
    }));
}

export function discoverCommands(profile, packageJson) {
  const scripts = packageJson?.scripts || {};
  return {
    install: profile.installCommand || '',
    dev: profile.devServerCommand || (scripts.dev ? 'npm run dev' : ''),
    test: profile.testCommand || (scripts.test ? 'npm run test' : ''),
    build: profile.buildCommand || (scripts.build ? 'npm run build' : ''),
    lint: profile.lintTypecheckFormatCommands || (scripts.lint ? 'npm run lint' : ''),
    rendered: profile.renderedUiReviewCommand || '',
  };
}



function accessibilityPolicy(profile = {}) {
  return profile.accessibilityReviewPolicy || profile.accessibilityPolicy || 'optional';
}

export function profileShow(repo) {
  const profile = loadProfile(repo);
  printObject({
    repository: repo,
    profilePath: profile.path ? relative(repo, profile.path) : 'not found',
    repositoryName: profile.values.repository || profile.values.name || basename(repo),
    sharedContextRoot: profile.values.sharedContextRoot || '',
    productContext: profile.values.productContext || '',
    repoContext: profile.values.repoContext || '',
    productContextIndex: profile.values.productContextIndex || '',
    repoContextIndex: profile.values.repoContextIndex || '',
    serviceMap: profile.values.serviceMap || '',
    workflowMap: profile.values.workflowMap || '',
    releaseOrder: profile.values.releaseOrder || '',
    knownFailureModes: profile.values.knownFailureModes || '',
    testCommand: profile.values.testCommand || '',
    buildCommand: profile.values.buildCommand || '',
    lintTypecheckFormatCommands: profile.values.lintTypecheckFormatCommands || '',
    renderedUiReviewCommand: profile.values.renderedUiReviewCommand || '',
    accessibilityReviewPolicy: accessibilityPolicy(profile.values),
    verificationMaturity: profile.values.verificationMaturity || 'not configured',
    ticketSystem: profile.values.ticketSystemProvider || profile.values.ticketSystem || 'not configured',
    ticketMcpAvailability: profile.values.ticketMcpAvailability || 'unknown',
    databaseEvidenceProvider: profile.values.databaseEvidenceProvider || profile.values.databaseProviderContext || 'not configured',
    databaseMcpAvailability: profile.values.databaseMcpAvailability || 'unknown',
    detectedStack: detectStack(repo).join(', ') || 'generic',
    evidenceOutputLocation: profile.values.evidenceOutputLocation || defaultRunsDir(repo),
    calibrationLog: profile.values.calibrationLog || defaultCalibrationPath(repo),
  });
}

export function profileInit(repo, options) {
  const target = join(repo, '.ai-local', 'sdlc-profile.md');
  if (existsSync(target) && !options.force) {
    fail(`${relative(repo, target)} already exists. Pass --force to overwrite.`);
  }

  mkdirSync(dirname(target), { recursive: true });
  const git = getGitInfo(repo);
  const sharedContextRoot = options.sharedContextRoot || '';
  const content = `# SDLC Profile

Purpose: local repository profile for SDLC helper automation. Keep this file ignored/local unless the team approves sharing a sanitized variant.

## Repository
- Repository: ${basename(repo)}
- Path: ${repo}
- Branch: ${git.branch}
- Source host:
- Classification: personal / work / team / production
- Repository role:
- Related repositories:

## Context
- Shared context root: ${sharedContextRoot}
- Product context:
- Repo context:
- Product context index:
- Repo context index:
- Service map:
- Workflow map:
- Release order:
- Known failure modes:
- Durable docs:
- Agent-local docs: .ai-local/
- Evidence output location: .ai-local/sdlc-runs/
- Calibration log: .ai-local/sdlc-calibration.jsonl

## Commands
- Install command:
- Dev server command:
- Test command:
- Build command:
- Lint/typecheck/format commands:
- Rendered UI review command:
- Accessibility review policy: optional
- Verification maturity: no automated tests / manual QA only / smoke tests / partial automated tests / mature CI

## External Evidence Capabilities
- Ticket system provider:
- Ticket MCP availability: available / unavailable / blocked / unknown
- Ticket read issue: allowed / blocked / approval required
- Ticket read comments: allowed / blocked / approval required
- Ticket read attachments/articles: allowed / blocked / approval required
- Ticket write comments: approval required
- Ticket update fields/status/assignee: approval required
- Ticket sensitive data rules:
- Ticket fallback intake fields: summary, acceptance criteria, relevant comments, QA expectations
- Database evidence provider:
- Database MCP availability: available / unavailable / blocked / unknown
- Database environments allowed: dev / QA / staging / production / read replica
- Database allowed operations: metadata read / aggregate SELECT / row-level SELECT / explain plan
- Database blocked operations: INSERT, UPDATE, DELETE, DDL, migration, backfill, job execution, stored procedure execution
- Database sensitive schemas/tables/data classes:
- Database row limit/default aggregation:
- Database redaction rules:
- Database fallback evidence path:

## Release
- Release policy:
- Human approval gates:
- Require case ID in commit messages: false
- Commit message format: CASE_ID: concise summary
- Case ID convention:
- QA ownership:

## Deployable Units

Use one block per codebase/deployable unit when a repository contains multiple projects. Unit-local profiles under \`<unit>/.ai-local/sdlc-profile.md\` may add details, but this repo-level registry should stay the default routing map.

### Unit: default
- Path: .
- Type:
- Test surface:
- Context bucket:
- Durable context file:
- Build command:
- Test command:
- Deploy method:
- Swagger/OpenAPI:

## Tool Boundaries
- Approved tools:
- Blocked tools:
- Sensitive data restrictions:
- Sensitive log handling:
- Archived paths:
- Generated paths:
- Dependency paths:
- Context aliases:
- QA scenario library:

## Last Reviewed
- Date:
- Reviewer:
`;

  safeWriteTextFile(repo, target, content);
  console.log(`Created ${relative(repo, target)}`);
}
