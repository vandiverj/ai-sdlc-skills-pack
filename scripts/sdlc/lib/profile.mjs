import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonIfExists, toCamel } from './common.mjs';

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
