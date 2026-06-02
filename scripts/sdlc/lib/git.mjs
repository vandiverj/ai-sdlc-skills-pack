import { execFileSync } from 'node:child_process';

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
