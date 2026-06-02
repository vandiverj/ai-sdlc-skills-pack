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
  printObject({
    changedFiles: git.changedFiles.length,
    expectedFiles: expected.files?.length || 0,
    unexpected: unexpected.join(', ') || 'none',
    generatedOrNonActive: generated.join(', ') || 'none',
    result: unexpected.length || generated.length ? 'review' : 'pass',
  });
  if (unexpected.length || generated.length) process.exitCode = 1;
}
