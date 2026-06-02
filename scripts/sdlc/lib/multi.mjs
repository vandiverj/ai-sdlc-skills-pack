import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, escapeCell, fail, formatInlineStatus, formatList, printObject, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferContracts } from './routes.mjs';
import { workspaceRepoRole, workspaceRepos } from './workspace.mjs';

export function multiStatus(repo) {
  const profile = loadProfile(repo);
  const related = splitList(profile.values.relatedRepositories);
  const rows = related.map((item) => {
    const path = resolve(repo, item);
    const info = getGitInfo(path);
    return {
      repo: item,
      path,
      branch: info.branch || 'unavailable',
      status: info.branch ? formatInlineStatus(info.status) : 'not a git repository or unavailable',
      upstream: info.upstream || '',
      aheadBehind: info.branch ? `${info.behind} behind / ${info.ahead} ahead` : '',
    };
  });
  printObject({ repository: repo, relatedRepositories: related.length || 0, serviceMap: profile.values.serviceMap || 'not configured', releaseOrder: profile.values.releaseOrder || 'not configured' });
  if (!rows.length) {
    console.log('\n- No related repositories configured. Add them to the SDLC profile for multi-repo tasks.');
    return;
  }
  console.log('\n| Repository | Branch | Status | Upstream | Ahead/behind |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const row of rows) console.log(`| ${escapeCell(row.repo)} | ${escapeCell(row.branch)} | ${escapeCell(row.status)} | ${escapeCell(row.upstream)} | ${row.aheadBehind} |`);
}

export function multiPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the multi-repo packet can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const related = splitList(profile.values.relatedRepositories);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-multi-repo-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Multi-Repo Packet

Date: ${new Date().toISOString()}
Task: ${task}
Primary repository: ${repo}
Primary branch: ${git.branch || 'unknown'}
Primary status: ${git.status || 'clean'}

## Related Repositories

${formatList(related)}

## Service And Release Context

- Service map: ${profile.values.serviceMap || 'not configured'}
- Workflow map: ${profile.values.workflowMap || 'not configured'}
- Release order: ${profile.values.releaseOrder || 'not configured'}
- Product context index: ${profile.values.productContextIndex || 'not configured'}
- Repo context index: ${profile.values.repoContextIndex || 'not configured'}

## Contracts Or Interfaces Likely Involved

${formatList(contracts)}

## Per-Repo Checklist

| Repository | Scope | Checks | Release order note | Status |
| --- | --- | --- | --- | --- |
${(related.length ? related : ['primary repository only']).map((item) => `| ${escapeCell(item)} |  |  |  | pending |`).join('\n')}

## Cross-Repo QA Handoff

- Tester-visible workflow:
- Repositories/services involved:
- Required QA environment:
- Test data/accounts:
- Provider/sandbox dependencies:
- Regression paths:

## Human-Controlled Release Notes

- Commit/push may be prepared only after explicit approval.
- Merge requests, release branches, AWS pipelines, compiled artifact movement, deploys, and production releases remain project-specific human processes.

## Stop Gates

- Missing service map, release order, or ownership for affected repositories.
- Unclear contract direction across services.
- Dirty unrelated work in any affected repository.
- Human approval needed for coordinated push/release.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function multiLedger(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the multi-repo ledger can be scoped.');
  const classifyTouchedSurface = dependencies.classifyTouchedSurface || (() => 'unknown');
  const repos = workspaceRepos(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-multi-repo-task-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const rows = repos.map((item) => {
    const info = getGitInfo(item.path);
    return `| ${escapeCell(item.label)} | ${escapeCell(workspaceRepoRole(item.path))} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(info.branch ? formatInlineStatus(info.status) : 'not a git repository')} | ${escapeCell(dedupe(info.changedFiles.map(classifyTouchedSurface)).join(', ') || 'none')} | pending |`;
  });
  const content = `# SDLC Multi-Repo Task Ledger

Date: ${new Date().toISOString()}
Task: ${task}
Workspace root: ${repo}

## Per-Repo State

| Repository | Role | Branch | Status | Surfaces | Verification |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Cross-Repo Workflow

- User-visible workflow:
- Repo call chain:
- Contract/data/integration risk:
- QA script:
- Release order:
- Caps:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function multiQa(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the multi-repo QA script can be scoped.');
  const repos = workspaceRepos(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-multi-repo-qa-script.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# QA Test Script: ${task}

## Summary

Validate the end-to-end changed workflow across the affected repositories/services. This script is for human QA testers and can be pasted into YouTrack. It does not assume QA will use AI or inspect source code.

## Affected Repository Context

${formatList(repos.map((item) => `${item.label}: ${workspaceRepoRole(item.path)}`))}

## Preconditions

- QA environment:
- Build/version identifiers:
- Test account/role:
- Test data:
- Feature flags/config:
- External provider/sandbox availability:

## Test Cases

### QA-001: End-To-End Changed Workflow

1. Navigate to the affected workflow in QA.
   - Expected: The workflow loads without visible errors.
2. Complete the primary changed action.
   - Expected: The visible result matches the task expectation.
3. Confirm the downstream result that proves the API/data/integration path worked.
   - Expected: Status, saved data, message, or provider result is correct.

### QA-002: Cross-Service Regression

1. Run the closest existing workflow that uses the same page/API/data/integration.
   - Expected: Existing behavior still works.

## Known Caps

- Repositories are listed for build/context only; QA should follow the user-visible workflow.
- Merge/deploy/release/pipeline/file movement remains human-controlled outside this script.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}
