import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';

// Conservative fallback: bind proof to HEAD, tracked edits, and untracked input.
// Ignored run records are excluded so capturing evidence does not invalidate it.
export function evidenceRevision(repo) {
  const hash = createHash('sha256');
  const run = (args) => execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const head = git(repo, ['rev-parse', '--verify', 'HEAD']);
    hash.update(head);
    const tracked = head ? run(['diff', '--name-only', '--no-renames', '-z', 'HEAD']) : run(['ls-files', '-z']);
    const untracked = run(['ls-files', '--others', '--exclude-standard', '-z']);
    const files = [...new Set((tracked.toString() + untracked.toString()).split('\0').filter(Boolean))].sort();
    for (const file of files) {
      const path = join(repo, file);
      hash.update(file + '\0');
      let stat;
      try { stat = lstatSync(path); } catch (error) { if (error.code === 'ENOENT') { hash.update('deleted'); continue; } throw error; }
      hash.update(String(stat.mode));
      if (stat.isSymbolicLink()) hash.update(readlinkSync(path));
      else if (stat.isFile()) hash.update(run(['hash-object', '--', file]));
    }
    return hash.digest('hex');
  } catch {
    // Unreadable inputs cannot establish freshness.
    return '';
  }
}

export function fileSnapshots(repo, files) {
  return Object.fromEntries(files.map((file) => {
    try {
      const path = join(repo, file);
      const stat = lstatSync(path);
      const content = stat.isSymbolicLink() ? readlinkSync(path) : readFileSync(path);
      return [file, createHash('sha256').update(String(stat.mode)).update(content).digest('hex')];
    } catch { return [file, null]; }
  }));
}

export function getGitInfo(repo) {
  const branch = git(repo, ['branch', '--show-current']) || '';
  const upstream = git(repo, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']) || '';
  const counts = upstream ? (git(repo, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]) || '0\t0').split(/\s+/) : ['0', '0'];
  const status = git(repo, ['status', '--short', '--untracked-files=all']) || '';
  const head = git(repo, ['rev-parse', '--short', 'HEAD']) || '';
  return {
    branch,
    upstream,
    behind: Number(counts[0] || 0),
    ahead: Number(counts[1] || 0),
    status,
    head,
    changedFiles: status.split(/\r?\n/).filter(Boolean).map(parseStatusPath),
  };
}

export function parseStatusPath(line) {
  const text = String(line);
  if (/^\?\? /.test(text)) return text.slice(3).trim();
  if (/^ [A-Z] /.test(text)) return text.slice(3).trim();
  if (/^[A-Z]  /.test(text)) return text.slice(3).trim();
  if (/^[A-Z] /.test(text)) return text.slice(2).trim();
  return text.trim();
}

export function git(repo, args) {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}
