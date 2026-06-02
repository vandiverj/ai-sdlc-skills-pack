import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { dedupe, escapeCell, fail, formatInlineStatus, formatList, printObject, readJsonIfExists, safeWriteTextFile, splitList, stamp, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { affectedUnits, detectStack, inferTestingSurfaces, unitRegistry } from './units.mjs';

export function workspaceStatus(repo, options = {}) {
  const repos = workspaceRepos(repo, options);
  printObject({ workspaceRoot: repo, repositories: repos.length });
  console.log('\n| Repository | Role | Branch | Status | Upstream | Ahead/behind |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const item of repos) {
    const info = getGitInfo(item.path);
    const role = detectStack(item.path).join(', ') || 'generic';
    console.log(`| ${escapeCell(item.label)} | ${escapeCell(role)} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(info.branch ? formatInlineStatus(info.status) : 'not a git repository')} | ${escapeCell(info.upstream || '')} | ${info.branch ? `${info.behind} behind / ${info.ahead} ahead` : ''} |`);
  }
}

export function workspaceInit(repo, options = {}) {
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'sdlc-workspace.md');
  mkdirSync(dirname(outPath), { recursive: true });
  const repos = workspaceRepos(repo, options);
  const rows = repos.map((item) => `| ${escapeCell(item.label)} | ${escapeCell(relative(repo, item.path) || '.')} | ${escapeCell(workspaceRepoRole(item.path))} | ${escapeCell(loadProfile(item.path).values.sharedContextRoot || options.sharedContextRoot || '')} |`);
  const content = `# SDLC Workspace Profile

Date: ${new Date().toISOString()}
Workspace root: ${repo}
Shared context root: ${options.sharedContextRoot || ''}

## Repositories

| Repository | Path | Role | Context root |
| --- | --- | --- | --- |
${rows.join('\n')}

## Cross-Repo Rules

- One task may touch multiple repositories, but commit/push remains a human finish decision per repository.
- Do not merge, deploy, trigger pipelines, create MR/PRs, or manually move release files from this profile.
- Map each deployable/codebase unit to a context bucket before relying on durable memory.
- QA Markdown should describe tester-visible behavior, API contract checks, data checks, or integration checks without requiring AI.

## Scenario Library

- Location:
- Sanitization rule:
- Tracking-system paste format:
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function workspaceDoctor(repo, options = {}) {
  const repos = workspaceRepos(repo, options);
  const findings = [];
  for (const item of repos) {
    const profile = loadProfile(item.path);
    const units = unitRegistry(item.path, profile);
    if (!profile.path) findings.push(`${item.label}: missing .ai-local/sdlc-profile.md.`);
    if (units.length > 1 && !profile.units?.length) findings.push(`${item.label}: multiple units inferred; add explicit unit registry when deploy/test/context differ.`);
    for (const unit of units) {
      if (!unit.contextBucket) findings.push(`${item.label}/${unit.name}: missing context bucket.`);
      if (!unit.testSurface) findings.push(`${item.label}/${unit.name}: missing test surface.`);
      if (!unit.deployMethod) findings.push(`${item.label}/${unit.name}: missing deploy method or explicit cap.`);
    }
  }
  printObject({ workspaceRoot: repo, repositories: repos.length, result: findings.length ? 'needs attention' : 'ready-looking' });
  console.log('\n## Findings\n');
  console.log(formatList(findings.length ? findings : ['No obvious workspace setup gaps detected.']));
}

export function workspacePacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the workspace packet can be scoped.');
  const repos = workspaceRepos(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-workspace-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const rows = repos.map((item) => {
    const info = getGitInfo(item.path);
    return `| ${escapeCell(item.label)} | ${escapeCell(detectStack(item.path).join(', ') || 'generic')} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(info.branch ? formatInlineStatus(info.status) : 'not a git repository')} | ${info.branch ? `${info.behind} behind / ${info.ahead} ahead` : ''} |`;
  });
  const content = `# SDLC Workspace Packet

Date: ${new Date().toISOString()}
Task: ${task}
Workspace root: ${repo}

## Repositories

| Repository | Role/runtime hints | Branch | Status | Ahead/behind |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Workspace Gates

- Confirm affected repositories before implementation.
- Keep unrelated dirty repos out of the task scope.
- Use per-repo verification and QA evidence when changes span repositories.
- Do not merge, deploy, move code between branches/environments, create MR/PRs, or trigger pipelines automatically.

## Multi-Repo Task Notes

- Primary repo:
- Secondary repos:
- Cross-repo workflow:
- Shared context root:
- Service map:
- Release order:
- QA script should describe the full tester-visible workflow, not repository internals.
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function workspaceMap(repo, options = {}) {
  const task = options.task || '';
  const repos = workspaceRepos(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-workspace-map.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const rows = repos.map((item) => {
    const info = getGitInfo(item.path);
    const role = workspaceRepoRole(item.path);
    return `| ${escapeCell(item.label)} | ${escapeCell(role)} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(info.branch ? formatInlineStatus(info.status) : 'not a git repository')} | ${escapeCell(relative(repo, item.path) || '.')} |`;
  });
  const unitRows = repos.flatMap((item) => {
    const profile = loadProfile(item.path);
    return unitRegistry(item.path, profile).map((unit) => `| ${escapeCell(item.label)} | ${escapeCell(unit.name)} | ${escapeCell(unit.path)} | ${escapeCell(unit.type)} | ${escapeCell(unit.testSurface)} | ${escapeCell(unit.contextBucket)} | ${escapeCell(unit.deployMethod)} |`);
  });
  const content = `# SDLC Workspace Map

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Workspace root: ${repo}

## Repository Roles

| Repository | Role | Branch | Status | Path |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Deployable Units

| Repository | Unit | Path | Type | Test surface | Context bucket | Deploy method |
| --- | --- | --- | --- | --- | --- | --- |
${unitRows.join('\n')}

## Cross-Repo Planning Notes

- Primary repository:
- Secondary repositories:
- User-visible workflow:
- API/service boundaries:
- Data/storage boundaries:
- Integration/provider boundaries:
- Release-order constraint:
- QA environment:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function workspaceLedger(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the workspace ledger can be scoped.');
  const repos = workspaceRepos(repo, options);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-workspace-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const rows = repos.flatMap((item) => {
    const profile = loadProfile(item.path);
    const info = getGitInfo(item.path);
    const units = affectedUnits(item.path, info.changedFiles, profile, options.unit);
    const surfaces = inferTestingSurfaces(item.path, task, info.changedFiles, profile);
    return `| ${escapeCell(item.label)} | ${escapeCell(info.branch || 'unavailable')} | ${escapeCell(units.map((unit) => unit.name).join(', ') || 'default')} | ${escapeCell(info.changedFiles.join(', ') || 'none')} | ${escapeCell(surfaces.join(', ') || 'service-behavior')} | ${info.changedFiles.length ? 'needed' : 'not changed'} | ${info.changedFiles.length ? 'review' : 'none'} | ${info.ahead ? 'unpushed commits' : 'human decision'} |`;
  });
  const content = `# SDLC Workspace Ledger

Date: ${new Date().toISOString()}
Task: ${task}
Workspace root: ${repo}

| Repository | Branch | Units | Changed files | Test surfaces | Validation | QA impact | Commit/push |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Rules

- Track each affected repo/unit separately.
- QA should follow tester-visible workflow, API/developer surface, data check, or integration check as appropriate.
- Commit/push remain explicit human decisions per repository.
- Merge/deploy/release/pipeline/manual movement are outside default automation.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function workspaceGraph(repo, options = {}) {
  const profile = loadProfile(repo);
  const repos = workspaceRepos(repo, options);
  const units = unitRegistry(repo, profile);
  const lines = ['# SDLC Workspace Graph', '', `Root: ${repo}`, '', '## Repositories', ''];
  for (const item of repos) lines.push(`- ${item.label}: ${item.path} (${existsSync(item.path) ? 'found' : 'missing'})`);
  lines.push('', '## Units', '');
  for (const unit of units) lines.push(`- ${unit.name}: ${unit.path} | ${unit.type || 'generic'} | ${unit.testSurface || 'surface?'}`);
  lines.push('', '## Edges', '');
  const related = splitList(profile.values.relatedRepositories);
  if (related.length) for (const item of related) lines.push(`- ${basename(repo)} -> ${item}`);
  else lines.push('- No related repositories configured.');
  writeOrPrint(repo, options.out, `${lines.join('\n')}\n`);
}

export function workspaceImpact(repo, options = {}) {
  const task = options.task || '';
  const git = getGitInfo(repo);
  const profile = loadProfile(repo);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const lines = ['# SDLC Workspace Impact', '', `Task: ${task || 'not provided'}`, '', '## Changed Files', '', ...formatList(files).split('\n'), '', '## Affected Units', '', ...formatList(units.map((unit) => `${unit.name} (${unit.path}) -> ${unit.testSurface || 'surface?'}`)).split('\n'), '', '## Testing Surfaces', '', ...formatList(surfaces).split('\n')];
  writeOrPrint(repo, options.out, `${lines.join('\n')}\n`);
}

export function workspaceRepos(repo, options = {}) {
  const profile = loadProfile(repo);
  const repos = [{ label: basename(repo), path: repo }];
  const explicit = splitList(options.repos || options.paths);
  for (const item of explicit) repos.push({ label: item, path: resolve(repo, item) });
  for (const item of splitList(profile.values.relatedRepositories)) repos.push({ label: item, path: resolve(repo, item) });
  const workspacePath = options.workspace ? resolve(repo, options.workspace) : findWorkspaceFile(repo);
  if (workspacePath) {
    const workspace = readJsonIfExists(workspacePath);
    for (const folder of workspace?.folders || []) {
      if (folder.path) repos.push({ label: folder.name || folder.path, path: resolve(dirname(workspacePath), folder.path) });
    }
  }
  return dedupeRepos(repos);
}

export function workspaceRepoRole(repo) {
  const stack = detectStack(repo);
  const roles = [];
  if (stack.includes('ASP Classic')) roles.push('legacy UI');
  if (stack.includes('Next.js') || stack.includes('Node/TypeScript') || stack.includes('Deno/JSR')) roles.push('modern web/app package');
  if (stack.includes('.NET')) roles.push('API/service candidate');
  if (stack.includes('SQL/database')) roles.push('database/storage');
  if (stack.includes('CI/deployment')) roles.push('CI/deployment');
  return roles.length ? dedupe(roles).join(', ') : 'generic/source';
}

function findWorkspaceFile(repo) {
  let files = [];
  try {
    files = readdirSync(repo).filter((file) => file.endsWith('.code-workspace'));
  } catch {
    return '';
  }
  return files.length ? join(repo, files[0]) : '';
}

function dedupeRepos(repos) {
  const seen = new Set();
  const out = [];
  for (const item of repos) {
    const path = resolve(item.path);
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ ...item, path });
  }
  return out;
}

function optionFiles(options, fallback = []) {
  if (!options.files) return fallback;
  return splitList(options.files).map((file) => file.trim()).filter(Boolean);
}
