import { join, relative } from 'node:path';
import { dedupe, fail, printObject, readJsonIfExists, safeWriteJsonFile, splitList } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';

export function scopeExpect(repo, options = {}, dependencies = {}) {
  const { appendControlEvent, classifyTouchedSurface } = dependencies;
  const files = splitList(options.files || '');
  if (!files.length) fail('Pass --files "a,b".');
  const stateInfo = readCurrentStateInfo(repo, options);
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, options.task || 'current-task');
  const scope = { files, surfaces: dedupe(files.map(classifyTouchedSurface)), createdAt: new Date().toISOString() };
  safeWriteJsonFile(repo, join(runDir, 'expected-scope.json'), scope);
  appendControlEvent(repo, runDir, 'scope', 'expected scope recorded', scope);
  printObject({ files: files.length, surfaces: scope.surfaces.join(', ') || 'none', path: relative(repo, join(runDir, 'expected-scope.json')) });
}

export function scopeCheck(repo, options = {}, dependencies = {}) {
  const { classifyControlPathActivity } = dependencies;
  const stateInfo = readCurrentStateInfo(repo, options);
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, options.task || 'current-task');
  const expected = readJsonIfExists(join(runDir, 'expected-scope.json')) || { files: [] };
  const git = getGitInfo(repo);
  const unexpected = expected.files?.length ? git.changedFiles.filter((file) => !expected.files.includes(file)) : [];
  const generated = git.changedFiles.filter((file) => classifyControlPathActivity(file) !== 'active-source');
  const scratch = git.changedFiles.filter((file) => /\.(ps1|sh|cmd|bat)$/i.test(file) && !normalize(file).startsWith('.ai-local/sdlc-scratch/scripts/'));
  const protectedEvidence = git.changedFiles.filter(isProtectedEvidenceSurface);
  const units = dedupe(git.changedFiles.map(unitRoot).filter(Boolean));
  const warnings = [
    ...unexpected.map((file) => `Unexpected changed file: ${file}`),
    ...generated.map((file) => `Generated/non-active path changed: ${file}`),
    ...scratch.map((file) => `Temporary script outside controlled scratch folder: ${file}`),
    ...protectedEvidence.map((file) => `Protected evidence surface changed: ${file}`),
    ...(units.length > 1 ? [`Multiple apparent units touched: ${units.join(', ')}`] : []),
  ];
  const result = {
    changedFiles: git.changedFiles.length,
    expectedFiles: expected.files?.length || 0,
    unexpected: unexpected.join(', ') || 'none',
    generatedOrNonActive: generated.join(', ') || 'none',
    scratchScripts: scratch.join(', ') || 'none',
    protectedEvidence: protectedEvidence.join(', ') || 'none',
    apparentUnits: units.join(', ') || 'none',
    warnings,
    result: warnings.length ? 'review' : 'pass',
  };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else printObject(result);
  if (warnings.length) process.exitCode = 1;
}

function normalize(file) {
  return String(file || '').replace(/\\/g, '/');
}

function isProtectedEvidenceSurface(file) {
  const value = normalize(file);
  return /(^|\/)(test|tests|__tests__|spec|snapshots?|baselines?)(\/|$)/i.test(value) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/i.test(value) ||
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|vitest\.config|jest\.config|playwright\.config|tsconfig|\.github\/workflows)(\/|$|\.)/i.test(value) ||
    /(^|\/)(scripts|tools)\/.+\.(ps1|sh|cmd|bat|mjs|js|ts)$/i.test(value);
}

function unitRoot(file) {
  const parts = normalize(file).split('/').filter(Boolean);
  if (!parts.length) return '';
  if (parts[0] === '.ai-local') return '.ai-local';
  if (['src', 'test', 'tests', 'docs', 'scripts', 'tools'].includes(parts[0])) return parts[0];
  return parts.length > 1 ? parts[0] : '.';
}
