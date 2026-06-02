import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { dedupe, escapeCell, fail, formatList, safeWriteTextFile, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { inferDirtySurfaces } from './routes.mjs';
import { findRepoFiles, matchesAny, normalizeUnitPath } from './units.mjs';
import { classifyTouchedSurface } from './surface.mjs';

export function searchPattern(scope, pattern) {
  const results = [];
  const regex = new RegExp(escapeRegExp(pattern), 'i');
  for (const file of findRepoFiles(scope, () => true, 8, 20000)) {
    if (isLikelyBinary(file)) continue;
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (regex.test(line)) results.push({ path: file, line: index + 1, text: line.trim().slice(0, 220) });
    });
  }
  return results;
}

export function classifySearchPath(path) {
  const value = normalizeUnitPath(path).toLowerCase();
  if (/(^|\/)(archive|archived|archivedpages|old|legacy-archive)(\/|$)/.test(value)) return 'archived historical reference';
  if (/(^|\/)(dist|build|bin|obj|out|coverage|generated|wwwroot\/dist)(\/|$)/.test(value) || /\.(min|bundle)\.(js|css)$/.test(value)) return 'generated/deployed artifact';
  if (/(^|\/)(node_modules|packages|vendor)(\/|$)/.test(value)) return 'dependency/build output';
  if (/(^|\/)(test|tests|__tests__|fixtures|spec)(\/|$)/.test(value) || /\.(test|spec)\./.test(value)) return 'test/reference fixture';
  if (value.endsWith('.md') || /(^|\/)(docs|learnings)(\/|$)/.test(value)) return 'context/doc note';
  return 'active source/page reference';
}

export function formatSearchGroups(repo, groups) {
  const entries = Object.entries(groups);
  if (!entries.length) return '- none';
  return entries.map(([category, items]) => `### ${category}

${formatList(items.slice(0, 80).map((item) => `${relative(repo, item.path)}:${item.line} ${item.text}`))}${items.length > 80 ? `\n- ... ${items.length - 80} more` : ''}`).join('\n\n');
}

export function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function changeGraphEdges(task, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const edges = [];
  const add = (from, relationship, to, evidence) => edges.push({ from, relationship, to, evidence });
  if (surfaces.includes('frontend/UI')) add('frontend/UI', 'drives or displays', 'user workflow', 'changed UI files or UI task language');
  if (surfaces.includes('backend/API')) add('user workflow', 'calls', 'API/service behavior', 'backend/API files changed');
  if (surfaces.includes('database/storage')) add('API/service behavior', 'reads or writes', 'data/storage', 'database/storage files or task language');
  if (surfaces.includes('external integration')) add('API/service behavior', 'exchanges data with', 'external provider/system', 'integration files or task language');
  if (surfaces.includes('contracts/interfaces')) add('producer', 'must remain compatible with', 'consumer contract', 'contract/interface files changed');
  if (surfaces.includes('dependencies')) add('runtime/tooling', 'can affect', 'startup/build/test/regression paths', 'dependency files changed');

  const text = String(task || '').toLowerCase();
  if (!edges.length && matchesAny(text, ['api', 'service'])) add('task', 'likely affects', 'API/service behavior', 'task language');
  if (!edges.length && matchesAny(text, ['database', 'sql', 'data'])) add('task', 'likely affects', 'data/storage', 'task language');
  if (!edges.length && matchesAny(text, ['third-party', 'webhook', 'integration'])) add('task', 'likely affects', 'external provider/system', 'task language');
  if (!edges.length && matchesAny(text, ['ui', 'site', 'page', 'react'])) add('task', 'likely affects', 'frontend/UI', 'task language');
  return edges;
}

export function changeGraphImplications(graph, task, files) {
  const nodes = new Set(graph.flatMap((edge) => [edge.from, edge.to]));
  const implications = [];
  if (nodes.has('user workflow')) implications.push('QA script should name the primary user workflow and one nearby regression workflow.');
  if (nodes.has('API/service behavior')) implications.push('Developer verification should include the smallest API/service-level check or an explicit cap.');
  if (nodes.has('data/storage')) implications.push('Generate a data packet and define QA-safe test data/persistence checks.');
  if (nodes.has('external provider/system')) implications.push('Generate an integration packet and record sandbox/provider availability.');
  if (nodes.has('consumer contract')) implications.push('Generate a contract packet before implementation if compatibility is unclear.');
  if (nodes.has('startup/build/test/regression paths')) implications.push('Generate a test introduction plan for dependency or tooling work.');
  if (!implications.length && files.length === 0) implications.push('No changed files yet; use this graph after initial implementation or with explicit task surfaces.');
  if (!implications.length) implications.push('No extra graph implication detected; keep evidence scoped to the task.');
  return implications;
}

function isLikelyBinary(path) {
  return /\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|gz|dll|exe|pdb|woff|woff2|ttf|eot|mp4|mov)$/i.test(path);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function changeGraph(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the change graph can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const graph = deps.changeGraphEdges(task, files);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-change-graph-lite.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Change Graph Lite

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Repository role: ${profile.values.repositoryRole || 'not configured'}

## Changed Nodes

${formatList(files.length ? files.map((file) => `${file} (${deps.classifyTouchedSurface(file)})`) : inferDirtySurfaces(task, git))}

## Likely Edges

| From | Relationship | To | Evidence |
| --- | --- | --- | --- |
${graph.length ? graph.map((edge) => `| ${escapeCell(edge.from)} | ${escapeCell(edge.relationship)} | ${escapeCell(edge.to)} | ${escapeCell(edge.evidence)} |`).join('\n') : '| task | affects | behavior to identify | no changed files yet |'}

## QA And Context Implications

${formatList(deps.changeGraphImplications(graph, task, files))}

## Maintenance Rule

- This is a lightweight local graph, not a permanent architecture model.
- Promote repeated, stable edges into shared context docs such as service maps, workflow maps, API contracts, or known failure modes.
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function searchClassify(repo, options = {}, deps = {}) {
  const pattern = options.pattern || options.query || '';
  if (!pattern) fail('Pass --pattern "..." so search results can be classified.');
  const scope = options.scope ? resolve(repo, options.scope) : repo;
  const results = deps.searchPattern(scope, pattern).map((item) => ({
    ...item,
    category: deps.classifySearchPath(relative(repo, item.path)),
  }));
  const groups = deps.groupBy(results, (item) => item.category);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Search Classification

Date: ${new Date().toISOString()}
Repository: ${repo}
Scope: ${relative(repo, scope) || '.'}
Pattern: ${pattern}

## Summary

${formatList(Object.entries(groups).map(([category, items]) => `${category}: ${items.length}`))}

## Results

${deps.formatSearchGroups(repo, groups)}

## Completion Rule

- Active source/page references can drive implementation scope.
- Archived, generated, dependency, and build-output references are context only unless the task explicitly targets them.
- Remaining retired-route matches must be classified before completion.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function searchRetireCheck(repo, options = {}, deps = {}) {
  const oldPattern = options.old || options.oldPattern || '';
  const newPattern = options.new || options.newPattern || '';
  if (!oldPattern || !newPattern) fail('Pass --old <pattern> and --new <pattern>.');
  const scope = options.scope ? resolve(repo, options.scope) : repo;
  const oldResults = deps.searchPattern(scope, oldPattern).map((item) => ({ ...item, category: deps.classifySearchPath(relative(repo, item.path)) }));
  const newResults = deps.searchPattern(scope, newPattern).map((item) => ({ ...item, category: deps.classifySearchPath(relative(repo, item.path)) }));
  const activeOld = oldResults.filter((item) => item.category === 'active source/page reference');
  const activeNew = newResults.filter((item) => item.category === 'active source/page reference');
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Route Retirement Search Check

Date: ${new Date().toISOString()}
Repository: ${repo}
Scope: ${relative(repo, scope) || '.'}
Old pattern: ${oldPattern}
New pattern: ${newPattern}
Result: ${activeOld.length ? 'open - old active references remain' : activeNew.length ? 'pass - new active references found and old active references absent' : 'open - no new active references found'}

## Positive Search: New Route

${deps.formatSearchGroups(repo, deps.groupBy(newResults, (item) => item.category))}

## Negative Search: Old Route

${deps.formatSearchGroups(repo, deps.groupBy(oldResults, (item) => item.category))}

## Gate

${formatList([
    activeNew.length ? 'new route appears in active source/page references' : 'new route was not found in active source/page references',
    activeOld.length ? `${activeOld.length} old active reference(s) remain` : 'no old active source/page references remain',
  ])}
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
  if (activeOld.length || !activeNew.length) process.exitCode = 1;
}
