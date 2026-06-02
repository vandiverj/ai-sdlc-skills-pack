import { existsSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { dedupe, escapeCell, fail, printTable, readJsonIfExists, safeWriteJsonFile } from './common.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { detectStack, unitRegistry } from './units.mjs';

export function defaultRunsDir(repo) {
  return join(repo, '.ai-local', 'sdlc-runs');
}

export function sanitizePortableObject(value) {
  if (Array.isArray(value)) return value.map(sanitizePortableObject);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = sanitizePortableObject(item);
    return out;
  }
  if (typeof value !== 'string') return value;
  return value
    .replace(/https?:\/\/\S+/g, '[redacted-url]')
    .replace(/\/Users\/[^\s/]+/g, '/Users/[redacted]')
    .replace(/\b[A-Z]{1,10}-\d{1,8}\b/g, '[ticket-id]')
    .replace(/\b(?:client|customer|company|tenant)[-_ ]?[A-Za-z0-9]+\b/gi, '[redacted-entity]')
    .replace(/\s+/g, ' ')
    .trim();
}

export function configNormalize(repo, options = {}) {
  const normalized = normalizedSdlcProfile(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'sdlc-profile.json');
  safeWriteJsonFile(repo, outPath, normalized);
  console.log(relative(repo, outPath));
}

export function configValidate(repo, options = {}) {
  const profile = normalizedSdlcProfile(repo, options);
  const findings = validateNormalizedProfile(profile);
  printTable(['Status', 'Finding'], findings.map((item) => [item.status, item.message]));
  if (findings.some((item) => item.status === 'block' || item.status === 'warn')) process.exitCode = 1;
}

export function configExplain(repo, options = {}) {
  const profile = normalizedSdlcProfile(repo, options);
  const profileSource = loadProfile(repo);
  const lines = [
    '# SDLC Config Explanation', '',
    `Repository: ${repo}`,
    `Profile source: ${profileSource.path ? relative(repo, profileSource.path) : 'none'}`,
    `Schema: ${profile.schemaVersion}`,
    '', '## Route/Evidence Inputs', '',
    `- Repository kind: ${profile.repository.kind || 'not configured'}`,
    `- Units: ${profile.units.map((unit) => `${unit.id || unit.name} (${unit.kind || unit.type || 'generic'} / ${unit.testSurface || 'surface?'})`).join(', ') || 'none'}`,
    `- Commands: ${profile.commands.map((command) => `${command.kind}:${command.command}`).join('; ') || 'none'}`,
    `- Capability overlays: ${Object.entries(profile.capabilities).map(([key, value]) => `${key}=${value}`).join(', ')}`,
    `- Context roots: ${[profile.context.sharedRoot, profile.context.product, profile.context.repo].filter(Boolean).join('; ') || 'not configured'}`,
    '', '## Next Useful Commands', '', '```bash',
    'sdlc config validate', 'sdlc capability snapshot', 'sdlc recipe compile --task "..."', 'sdlc context assemble --phase planning --task "..."', '```',
  ];
  console.log(lines.join('\n'));
}

export function configDiff(repo, options = {}) {
  const tracked = readJsonIfExists(join(repo, 'sdlc.config.json')) || readJsonIfExists(join(repo, '.sdlc', 'profile.json')) || {};
  const local = readJsonIfExists(join(repo, '.ai-local', 'sdlc-profile.json')) || {};
  const left = flattenObject(tracked);
  const right = flattenObject(local);
  const keys = dedupe([...Object.keys(left), ...Object.keys(right)]).sort();
  const rows = keys.map((key) => [key, String(left[key] ?? ''), String(right[key] ?? '')]).filter((row) => row[1] !== row[2]);
  if (!rows.length) console.log('No tracked/local JSON profile differences detected.');
  else printTable(['Key', 'Tracked', 'Local'], rows.slice(0, 80));
}

export function configExport(repo, options = {}) {
  const profile = normalizedSdlcProfile(repo, options);
  const sanitized = sanitizePortableObject(profile);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'sdlc-profile.sanitized.json');
  safeWriteJsonFile(repo, outPath, sanitized);
  console.log(relative(repo, outPath));
}

export function configImport(repo, options = {}) {
  if (!options.file) fail('Pass --file <path>.');
  const input = readJsonIfExists(resolve(repo, options.file));
  if (!input) fail(`Could not read JSON config import file: ${options.file}`);
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'sdlc-profile.json');
  safeWriteJsonFile(repo, outPath, { ...input, importedAt: new Date().toISOString() });
  console.log(relative(repo, outPath));
}

export function normalizedSdlcProfile(repo, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const units = unitRegistry(repo, profile);
  return {
    schemaVersion: 'sdlc-profile-v1',
    generatedAt: new Date().toISOString(),
    repository: { name: profile.values.repository || profile.values.name || basename(repo), path: repo, kind: profile.values.repositoryRole || detectStack(repo).join(', ') || 'generic' },
    context: { sharedRoot: profile.values.sharedContextRoot || '', product: profile.values.productContext || '', repo: profile.values.repoContext || '', output: profile.values.evidenceOutputLocation || defaultRunsDir(repo) },
    commands: Object.entries(commands).filter(([, command]) => command).map(([kind, command]) => ({ kind, command })),
    capabilities: { ticketMcp: profile.values.ticketMcpAvailability || 'unknown', databaseMcp: profile.values.databaseMcpAvailability || 'unknown', browser: profile.values.renderedUiReviewCommand ? 'configured' : 'unknown' },
    units: units.map((unit) => ({ id: unit.name, root: unit.path, kind: unit.type || 'generic', testSurface: unit.testSurface || '', contextBucket: unit.contextBucket || '', buildCommand: unit.buildCommand || '', testCommand: unit.testCommand || '', deployMethod: unit.deployMethod || '', swaggerOpenapi: unit.swaggerOpenapi || '' })),
    policy: { release: profile.values.releasePolicy || '', approvalGates: profile.values.humanApprovalGates || '', sensitiveData: profile.values.sensitiveDataRestrictions || '' },
  };
}

export function validateNormalizedProfile(profile) {
  const findings = [];
  if (!profile.repository?.name) findings.push({ status: 'block', message: 'repository.name missing' });
  if (!profile.units?.length) findings.push({ status: 'warn', message: 'no deployable units configured or inferred' });
  for (const unit of profile.units || []) {
    if (!unit.root) findings.push({ status: 'block', message: `unit ${unit.id || '?'} missing root` });
    if (!unit.testSurface) findings.push({ status: 'warn', message: `unit ${unit.id || '?'} missing testSurface` });
  }
  if (!profile.commands?.some((command) => command.kind === 'test')) findings.push({ status: 'warn', message: 'no test command configured/discovered' });
  if (!profile.context?.sharedRoot && !profile.context?.product && !profile.context?.repo) findings.push({ status: 'warn', message: 'no context root configured' });
  if (!profile.policy?.release && !profile.policy?.approvalGates) findings.push({ status: 'warn', message: 'release/human approval policy not configured' });
  if (!findings.length) findings.push({ status: 'pass', message: 'profile passes local validation' });
  return findings;
}

export function flattenObject(value, prefix = '', out = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) out[prefix] = value;
    return out;
  }
  for (const [key, item] of Object.entries(value)) flattenObject(item, prefix ? `${prefix}.${key}` : key, out);
  return out;
}
