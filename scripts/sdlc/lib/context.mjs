import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, dedupe, escapeCell, escapeCommandArg, fail, formatInlineList, formatList, optionFiles, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteTextFile, splitList, stamp } from './common.mjs';
import { evidenceRequirementsForTask, readEvidenceManifest } from './evidence.mjs';
import { getGitInfo } from './git.mjs';
import { safeReadSmall } from './index.mjs';
import { defaultRunsDir } from './paths.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { inferContracts, inferDirtySurfaces, inferLikelyRoute, inferRouteFromTask, securityTriggers } from './routes.mjs';
import { loadRunState } from './runstate.mjs';
import { ensureControlRunDir, nextActionForStage, readCurrentState, readCurrentStateInfo } from './state.mjs';
import { classifyTouchedSurface } from './surface.mjs';
import { affectedUnits, inferTestingSurfaces, matchesAny, normalizeUnitPath } from './units.mjs';

export function recommendedContextFile(unit) {
  if (unit.contextBucket) return `${unit.contextBucket}/context.md`;
  if (unit.path && unit.path !== '.') return `${unit.path}/.ai-local/sdlc-profile.md`;
  return '.ai-local/sdlc-profile.md';
}

export function contextAliases(profile = {}) {
  const raw = profile.contextAliases || profile.contextAlias || '';
  return splitList(raw).map((item) => {
    const [match, bucket] = item.split(/->|=>|=/).map((value) => value?.trim());
    return match && bucket ? { match, bucket } : null;
  }).filter(Boolean);
}

export function finalContextSignals(task, files, packets) {
  const signals = [];
  if (matchesAny(task, ['route', 'endpoint', 'download', 'workflow', 'context', 'learning', 'api'])) signals.push('task language suggests durable workflow/API/context knowledge may have changed');
  if (files.some((file) => classifyTouchedSurface(file) === 'docs/context')) signals.push('context/docs files changed');
  if (packets.some((packet) => packet.kind === 'route-retirement')) signals.push('route retirement evidence may produce durable product context');
  if (packets.some((packet) => packet.kind === 'learning-summary')) signals.push('process learning summary exists');
  if (!signals.length) signals.push('no obvious durable context signal detected; still confirm before final handoff');
  return signals;
}

export function contextUpdateTargets(route, dirtySurfaces, contracts, profile) {
  const targets = [];
  if (!profile.sharedContextRoot && route === 'multi-repo-integration') targets.push('SDLC profile: configure shared context root or related repository map');
  if (dirtySurfaces.includes('docs/context')) targets.push('docs/memory-bank or docs/context-state: update active state if durable truth changed');
  if (contracts.length || route === 'contract-first' || route === 'multi-repo-integration') targets.push('docs/contracts or shared context root: update interface/contract truth');
  if (dirtySurfaces.includes('rendered UI')) targets.push('feature context or code-local docs: update visible workflow facts only if behavior changed');
  if (dirtySurfaces.includes('API/contracts/events')) targets.push('service map/workflow map: update cross-boundary facts');
  if (!targets.length) targets.push('no durable context update required unless implementation changes source truth');
  return dedupe(targets);
}

export function contextFreshnessRow(repo, item, days) {
  if (!existsSync(item.path)) return { label: item.label, status: 'missing', ageDays: '', path: relative(repo, item.path) || item.path };
  const stats = statSync(item.path);
  const ageDays = Math.max(0, Math.floor((Date.now() - stats.mtimeMs) / 86400000));
  return { label: item.label, status: ageDays > days ? 'stale' : 'fresh', ageDays, path: relative(repo, item.path) || '.' };
}

export function contextFreshnessRecommendations(existingRows, staleRows, profile) {
  const recommendations = [];
  if (!existingRows.length) recommendations.push('No context docs found; run setup bootstrap/doctor and create the smallest useful repo or shared context docs.');
  if (staleRows.length) recommendations.push(`Review stale docs before trusting them: ${staleRows.map((row) => row.label).join(', ')}.`);
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) recommendations.push('Configure external shared context root when this repository participates in larger multi-repo systems.');
  if (!recommendations.length) recommendations.push('Context docs are present and within the freshness window; still cross-check source files touched by the task.');
  return recommendations;
}

export function contextPlacement(repo, path) {
  const relativePath = relative(repo, path);
  if (!relativePath || relativePath.startsWith('..')) return 'external/shared';
  if (relativePath.startsWith('.ai-local')) return 'local ignored evidence/context';
  if (relativePath.startsWith('docs/')) return 'tracked repo software memory';
  if (['AGENTS.md', '.sdlc/profile.md', '.sdlc/profile.json'].includes(relativePath)) return 'tracked process/setup';
  return 'repo-local';
}

export function contextPlacementRecommendation(fact, profile = {}) {
  const text = String(fact || '').toLowerCase();
  if (matchesAny(text, ['test result', 'command output', 'verification', 'screenshot', 'smoke', 'temporary', 'today', 'this task'])) {
    return { placement: 'ignored local task evidence', target: '.ai-local/sdlc-runs/', reason: 'The fact sounds task-specific or ephemeral.', trackingRule: 'Do not track unless sanitized and intentionally promoted.' };
  }
  if (matchesAny(text, ['learning', 'process lesson', 'route gap', 'workflow miss', 'case id', 'testing surface'])) {
    return { placement: 'sanitized SDLC learning or process-learning event', target: 'learnings/ for redacted shared lessons, or project-local docs/process-improvement for product-specific details', reason: 'The fact appears to improve the SDLC process rather than define product behavior.', trackingRule: 'Separate portable process guidance from product/client details before committing to the skills pack.' };
  }
  if (matchesAny(text, ['service map', 'cross repo', 'cross-repo', 'workflow map', 'release order', 'multiple repositories', 'product-wide'])) {
    return { placement: 'external shared context', target: profile.sharedContextRoot || profile.serviceMap || profile.workflowMap || 'shared context root', reason: 'The fact affects more than one repository.', trackingRule: 'Keep secrets/customer data out; use sanitized shared docs.' };
  }
  if (matchesAny(text, ['api contract', 'public api', 'api', 'calls', 'schema', 'event', 'message', 'integration', 'database', 'sql', 'stores', 'data', 'business rule', 'user workflow', 'workflow'])) {
    return { placement: 'repo or shared software memory', target: profile.repoContext || profile.productContext || 'docs/context-state.md or shared context root', reason: 'The fact is durable software behavior future agents should not rediscover.', trackingRule: 'Track in repo docs only when team-approved; otherwise use shared context.' };
  }
  if (matchesAny(text, ['sdlc', 'agent should', 'process', 'gate', 'skill', 'router'])) {
    return { placement: 'SDLC process pack', target: '.agents skills/references/templates', reason: 'The fact changes how agents should work rather than how the software behaves.', trackingRule: 'Keep reusable process guidance in the SDLC pack.' };
  }
  return { placement: 'repo-local context or task evidence', target: profile.repoContext || '.ai-local/ until durability is clear', reason: 'Durability and scope are unclear.', trackingRule: 'Start local; promote only after it proves reusable.' };
}

export function contextDocCandidates(repo, profile) {
  const candidates = [
    { label: 'AGENTS.md', path: join(repo, 'AGENTS.md') },
    { label: 'SDLC profile JSON', path: join(repo, '.sdlc', 'profile.json') },
    { label: 'SDLC profile Markdown', path: join(repo, '.sdlc', 'profile.md') },
    { label: 'Agent-local SDLC profile', path: join(repo, '.ai-local', 'sdlc-profile.md') },
    { label: 'Agent-local repository setup', path: join(repo, '.ai-local', 'repository-setup.md') },
    { label: 'Memory context index', path: join(repo, 'docs', 'memory-bank', 'contextIndex.md') },
    { label: 'Memory active context', path: join(repo, 'docs', 'memory-bank', 'activeContext.md') },
    { label: 'Context state', path: join(repo, 'docs', 'context-state.md') },
    { label: 'Application model', path: join(repo, 'docs', 'application-model.md') },
  ];

  for (const [key, label] of [
    ['sharedContextRoot', 'Shared context root'],
    ['productContext', 'Product context'],
    ['repoContext', 'Repo context'],
    ['productContextIndex', 'Product context index'],
    ['repoContextIndex', 'Repo context index'],
    ['serviceMap', 'Service map'],
    ['workflowMap', 'Workflow map'],
    ['releaseOrder', 'Release order'],
    ['knownFailureModes', 'Known failure modes'],
  ]) {
    if (profile[key]) candidates.push({ label, path: resolveContextPath(repo, profile[key]) });
  }

  return dedupeByPath(candidates);
}

export function formatContextDocs(repo, items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item.label}: ${relative(repo, item.path) || '.'}`).join('\n');
}

export function resolveContextPath(repo, value) {
  const raw = String(value || '').trim();
  if (!raw) return repo;
  if (raw.startsWith('~')) return raw;
  if (raw.startsWith('/')) return raw;
  return resolve(repo, raw);
}

function dedupeByPath(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item.path || seen.has(item.path)) continue;
    seen.add(item.path);
    out.push(item);
  }
  return out;
}

export function contextBudget(repo, options = {}, deps = {}) {
  const rows = contextBudgetRows(repo, options, deps);
  printTable(['Source', 'Approx Tokens', 'Status', 'Note'], rows.map((row) => [row.source, row.tokens, row.status, row.note]));
  const total = rows.reduce((sum, row) => sum + row.tokens, 0);
  console.log(`Total approximate tokens: ${total}`);
  if (rows.some((row) => row.status === 'warn')) process.exitCode = 1;
}

export function contextAssemble(repo, options = {}, deps = {}) {
  const phase = options.phase || 'planning';
  const packet = buildContextPacket(repo, phase, options);
  const outPath = options.out ? resolve(repo, options.out) : join(ensureControlRunDir(repo, options, options.task || phase), 'context', `${phase}.context.md`);
  safeWriteTextFile(repo, outPath, renderContextPacket(packet));
  appendContextLedger(repo, outPath, packet);
  console.log(relative(repo, outPath));
}

export function contextCompact(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const state = readCurrentState(repo, options) || synthesizeFallbackState(repo, options.task || '', options);
  const manifest = info.runDir ? readEvidenceManifest(info.runDir) : { required: [], captured: [] };
  const lines = [
    '# SDLC Compact Context',
    '',
    `Task: ${state.task || options.task || 'not provided'}`,
    `Route: ${state.route || 'unknown'}`,
    `Stage: ${state.stage || 'unknown'}`,
    '',
    '## Evidence Snapshot',
    '',
    ...formatList((manifest.captured || []).map((item) => `${item.kind}: ${item.summary}`).slice(-12)).split('\n'),
    '',
    '## Next Action',
    '',
    nextActionForStage(state.stage || 'intake', state.task || options.task || ''),
  ];
  const outPath = options.out ? resolve(repo, options.out) : join(ensureControlRunDir(repo, options, options.task || 'compact'), 'context', 'compact.context.md');
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}

export function contextLedger(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const ledgers = [];
  if (info.runDir) ledgers.push(join(info.runDir, 'context', 'context-ledger.jsonl'));
  const root = defaultRunsDir(repo);
  if (existsSync(root)) {
    for (const file of readdirSync(root)) {
      const candidate = join(root, file, 'context', 'context-ledger.jsonl');
      if (existsSync(candidate)) ledgers.push(candidate);
    }
  }
  const rows = dedupe(ledgers).flatMap((ledger) => readJsonLines(ledger));
  if (!rows.length) return console.log('No context ledger rows found. Run sdlc context assemble first.');
  printTable(['Time', 'Phase', 'Tokens', 'Path'], rows.map((row) => [row.timestamp, row.phase, row.approxTokens, row.path]));
}

export function contextRestore(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const profileValues = profile.values;
  const related = splitList(profileValues.relatedRepositories);
  const contextDocs = deps.contextDocCandidates(repo, profileValues).filter((item) => existsSync(item.path));
  const commands = discoverCommands(profileValues, packageJson);
  const output = {
    repository: repo,
    repositoryRole: profileValues.repositoryRole || '',
    branch: git.branch,
    status: git.status || 'clean',
    upstream: git.upstream,
    aheadBehind: `${git.behind} behind / ${git.ahead} ahead`,
    profilePath: profile.path ? relative(repo, profile.path) : 'not found',
    contextDocsFound: contextDocs.map((item) => `${item.label}: ${relative(repo, item.path) || '.'}`).join(', ') || 'none',
    sharedContextRoot: profileValues.sharedContextRoot || '',
    productContext: profileValues.productContext || '',
    repoContext: profileValues.repoContext || '',
    relatedRepositories: related.join(', '),
    commandsAvailable: Object.entries(commands)
      .filter(([, command]) => command)
      .map(([key, command]) => `${key}: ${command}`)
      .join('; ') || 'none discovered',
    likelyRoute: inferLikelyRoute(git),
    missingSetup: deps.missingSetup(profileValues, commands).join('; ') || 'none detected',
    recommendedNextCommand: 'sdlc evidence init --route standard',
  };
  if (options.includeRelatedRepos && related.length > 0) {
    output.relatedRepoStatus = related.map((item) => summarizeRelatedRepo(repo, item)).join('\n');
  }
  printObject(output);
}

export function contextPack(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context pack can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const related = splitList(profile.values.relatedRepositories);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const route = inferRouteFromTask(task, git, profile.values);
  const triggers = securityTriggers(task, profile.values);
  const dirtySurfaces = inferDirtySurfaces(task, git);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-context-pack.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Context Pack

Date: ${new Date().toISOString()}
Task: ${task}
Likely route: ${route}
Repository: ${repo}
Repository role: ${profile.values.repositoryRole || 'not configured'}
Branch: ${git.branch || 'unknown'}
Git status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Relevant Context Docs

${deps.formatContextDocs(repo, existingDocs)}

## Missing Context

${deps.formatContextDocs(repo, missingDocs)}

## Related Repositories

${formatList(related)}

## Contracts And Events Involved

${formatList(contracts)}

## Commands Likely Needed

${deps.formatCommandList(commands, route)}

## Potential Dirty Surfaces

${formatList(dirtySurfaces)}

## Security And Tool Triggers

${formatList(triggers)}

## Recommended Next Command

\`\`\`bash
sdlc route start ${route}
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function contextAudit(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const processLabels = ['AGENTS.md', 'SDLC profile JSON', 'SDLC profile Markdown', 'Agent-local SDLC profile', 'Agent-local repository setup'];
  const content = `# SDLC Context Audit

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Status: ${git.status || 'clean'}

## Process Docs

${deps.formatContextDocs(repo, existingDocs.filter((item) => processLabels.includes(item.label)))}

## Software Memory Docs

${deps.formatContextDocs(repo, existingDocs.filter((item) => !processLabels.includes(item.label)))}

## Missing Or Unconfigured Context

${deps.formatContextDocs(repo, missingDocs)}

## Guidance

- Process docs explain how agents should work.
- Software memory docs explain this software and cross-repo system state.
- External shared context roots are valid and should be configured in the SDLC profile instead of duplicated into every repository.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextFreshness(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const days = Number(options.days || 60);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => deps.contextFreshnessRow(repo, item, days));
  const existingRows = rows.filter((row) => row.status !== 'missing');
  const staleRows = rows.filter((row) => row.status === 'stale');
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Freshness

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Freshness window: ${days} days

## Context Documents Checked

| Document | Status | Age days | Path |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.ageDays} | ${escapeCell(row.path)} |`).join('\n')}

## Source Truth Cross-Check

- Changed files: ${git.changedFiles.length}
- Touched surfaces: ${formatInlineList(dedupe(git.changedFiles.map(deps.classifyTouchedSurface)))}
- Context docs used by agent should be named in the task ledger.
- If stale docs contradict source files, source files win and context update should be recorded.

## Recommended Action

${formatList(deps.contextFreshnessRecommendations(existingRows, staleRows, profile.values))}
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextConflictCheck(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so context conflict check can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => deps.contextFreshnessRow(repo, item, Number(options.days || 60)));
  const stale = rows.filter((row) => row.status === 'stale');
  const missing = rows.filter((row) => row.status === 'missing');
  const contradictions = deps.detectContextContradictions(repo, profile, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json'))), docs, splitList(profile.values.relatedRepositories));
  const severity = contextConflictSeverity({ stale, missing, contradictions, profile: profile.values });
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Conflict Check

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Severity: ${severity}

## Freshness And Ownership

| Document | Status | Age days | Path |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.ageDays} | ${escapeCell(row.path)} |`).join('\n')}

## Contradiction Signals

${formatList(contradictions)}

## Required Agent Behavior

- Treat source code, tests, logs, and current command output as stronger than stale context docs.
- Use context docs as routing memory, not proof.
- If stale context affected implementation or QA, record a context update plan or cap before finish.
- Product-sensitive facts stay in repo/unit/shared context, not global process learning.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
  if (severity === 'stale-and-risky' || severity === 'conflicting-sources') process.exitCode = 1;
}

export function contextContradictions(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const related = splitList(profile.values.relatedRepositories);
  const contradictions = deps.detectContextContradictions(repo, profile, commands, docs, related);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Contradiction Check

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Possible Contradictions

${formatList(contradictions)}

## How To Use This

- Treat these as review prompts, not proof.
- Source files and runnable commands win over stale context docs.
- If a contradiction is real and durable, update the repo or shared context docs after the task.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextInventory(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const docs = deps.contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => {
    const path = item.path;
    const exists = existsSync(path);
    return {
      label: item.label,
      status: exists ? 'present' : 'missing',
      placement: deps.contextPlacement(repo, path),
      age: exists ? deps.contextFreshnessRow(repo, item, Number(options.days || 60)).ageDays : '',
      path: relative(repo, path) || path,
    };
  });
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Inventory

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Inventory

| Context | Status | Placement | Age days | Path |
| --- | --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.placement} | ${row.age} | ${escapeCell(row.path)} |`).join('\n')}

## Placement Model

- Temporary task evidence belongs in ignored .ai-local/.
- Stable repository-specific software facts belong in repo docs when the team accepts tracked docs.
- Cross-repo product/service/workflow/release facts belong in the shared context root.
- Process mechanics belong in the SDLC pack, not downstream software memory.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextBucketCheck(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so context bucket placement can be checked.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const facts = splitList(options.facts || options.fact || '');
  const rows = units.map((unit) => `| ${escapeCell(unit.name)} | ${escapeCell(unit.path)} | ${escapeCell(unit.contextBucket || 'not configured')} | ${escapeCell(unit.durableContextFile || deps.recommendedContextFile(unit))} | ${escapeCell(unit.testSurface || 'not configured')} |`);
  const recommendations = [
    ...units.filter((unit) => !unit.contextBucket).map((unit) => `Configure context bucket for unit "${unit.name}".`),
    ...units.filter((unit) => !unit.durableContextFile && !profile.values.sharedContextRoot).map((unit) => `Decide durable context file or shared context root for "${unit.name}".`),
    ...facts.map((fact) => `${fact}: ${deps.contextPlacementRecommendation(fact, profile.values).target}`),
  ];
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Bucket Check

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Source-Of-Truth Hierarchy

${formatList(['source/logs/tests', 'repo profile', 'unit profile', 'shared context', 'promoted learnings', 'conversation memory'])}

## Affected Unit Context Buckets

| Unit | Path | Context bucket | Durable context file | Testing surface |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Placement Recommendations

${formatList(recommendations.length ? recommendations : ['No obvious context bucket gaps detected.'])}

## Freshness Windows

- Source/logs/tests: current task evidence.
- Repo/unit profiles: refresh when deployable unit, context bucket, commands, or test surface changes.
- Shared context: refresh when cross-repo/product workflow truth changes.
- Promoted learnings: promote only after review; revisit when repeated failures stop matching reality.
- Conversation memory: never treat as durable source truth by itself.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextBucketConfidence(repo, options = {}, deps = {}) {
  const target = options.path || '.';
  const task = options.task || '';
  const profile = loadProfile(repo);
  const targetPath = resolve(repo, target);
  const normalized = normalizeUnitPath(relative(repo, targetPath) || target);
  const aliases = deps.contextAliases(profile.values).filter((item) => normalized.toLowerCase().includes(item.match.toLowerCase()) || task.toLowerCase().includes(item.match.toLowerCase()));
  const units = affectedUnits(repo, [normalized], profile, options.unit);
  const candidates = dedupe([
    ...aliases.map((item) => item.bucket),
    ...units.map((unit) => unit.contextBucket),
    profile.values.repoContext,
    profile.values.productContext,
    profile.values.sharedContextRoot,
  ]).filter(Boolean);
  const confidence = aliases.length === 1 || units.length === 1 && units[0].contextBucket ? 'high' : candidates.length === 1 ? 'medium' : candidates.length > 1 ? 'conflict' : 'low';
  printObject({
    repository: repo,
    path: normalized || '.',
    task: task || 'not provided',
    confidence,
    candidates: candidates.join('; ') || 'none configured',
    recommended: candidates[0] || 'configure repo/unit/shared context bucket',
    gate: ['low', 'conflict'].includes(confidence) ? 'ask human before durable context write' : 'safe to use with normal review',
  });
  if (['low', 'conflict'].includes(confidence)) process.exitCode = 1;
}

export function contextResolve(repo, options = {}, deps = {}) {
  const targetPath = options.path ? resolve(repo, options.path) : repo;
  const task = options.task || '';
  const profile = loadProfile(repo);
  const aliases = deps.contextAliases(profile.values);
  const normalized = normalizeUnitPath(relative(repo, targetPath) || options.path || '.').toLowerCase();
  const alias = aliases.find((item) => normalized.includes(item.match.toLowerCase()) || String(task).toLowerCase().includes(item.match.toLowerCase()));
  const unit = affectedUnits(repo, [relative(repo, targetPath)], profile, options.unit)[0];
  const recommendedBucket = alias?.bucket || unit?.contextBucket || profile.values.productContext || profile.values.repoContext || profile.values.sharedContextRoot || 'not configured';
  printObject({
    repository: repo,
    path: relative(repo, targetPath) || '.',
    task: task || 'not provided',
    matchedAlias: alias ? `${alias.match} -> ${alias.bucket}` : 'none',
    affectedUnit: unit?.name || 'default',
    recommendedContextBucket: recommendedBucket,
    durableContextFile: unit?.durableContextFile || deps.recommendedContextFile(unit || { contextBucket: recommendedBucket, path: '.' }),
    note: alias ? 'alias overrides folder/repo-name intuition' : 'no alias override found',
  });
}

export function contextFinalCheck(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so final context check can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const contextSignals = deps.finalContextSignals(task, git.changedFiles, packets);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Final Context Check

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Durable Knowledge Signals

${formatList(contextSignals)}

## Context Placement Decision

- Product-context bucket: ${profile.values.productContext || profile.values.sharedContextRoot || 'not configured'}
- Repo-context bucket: ${profile.values.repoContext || 'not configured'}
- Process-learning candidate: ${contextSignals.some((item) => item.includes('process')) ? 'yes' : 'only if verification exposed reusable SDLC behavior'}
- Sensitive/product-specific detail present: review before sharing in \`.agents/learnings\`

## Required Question Before Final Handoff

- Did final grep/test/log review discover durable product knowledge?
- Which bucket owns it?
- Is it product-specific, process-general, or both?
- Was the context update done, deferred, or capped?
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function contextPlace(repo, options = {}, deps = {}) {
  const fact = options.fact || options.text || '';
  if (!fact) fail('Pass --fact "..." so the SDLC can recommend context placement.');
  const profile = loadProfile(repo);
  const recommendation = deps.contextPlacementRecommendation(fact, profile.values);
  printObject({
    repository: repo,
    fact,
    recommendedPlacement: recommendation.placement,
    suggestedTarget: recommendation.target,
    reason: recommendation.reason,
    trackingRule: recommendation.trackingRule,
  });
}

export function contextUpdatePlan(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context update plan can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = inferRouteFromTask(task, git, profile.values);
  const dirtySurfaces = inferDirtySurfaces(task, git);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-context-update-plan.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Context Update Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Route: ${route}
Status: ${git.status || 'clean'}

## Update Only If Truth Changed

${formatList(deps.contextUpdateTargets(route, dirtySurfaces, contracts, profile.values))}

## Dirty Surfaces

${formatList(dirtySurfaces)}

## Contracts Or Interfaces

${formatList(contracts)}

## Documentation Boundary

- Do not store process flow rediscovery in repo memory docs.
- Do store software-specific workflow, contract, service, release-order, and architecture facts when they help future agents avoid rediscovery.
- Prefer code-local docs for public exports, shared types, APIs, invariants, and examples.
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function contextGate(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const rows = deps.contextGateRows(repo, task, profile, git, options);
  const blocked = rows.filter((row) => row.status === 'block');
  printObject({ task: task || 'not provided', result: blocked.length ? 'blocked' : rows.some((row) => row.status === 'warn') ? 'warn' : 'pass' });
  deps.printGateRows(rows);
  if (blocked.length) process.exitCode = 1;
}

function contextBudgetRows(repo, options = {}, deps = {}) {
  const profile = loadProfile(repo);
  const state = readCurrentState(repo, options) || loadRunState(repo, options.task || '') || {};
  const docs = (deps.contextDocCandidates?.(repo, profile.values) || []).filter((item) => existsSync(item.path));
  return [
    budgetRow('runtime adapter/global skill prompt', 2500, 'estimate', 'keep static instructions minimal'),
    budgetRow('repo profile', approxTokens(profile.path ? readFileSync(profile.path, 'utf8') : ''), profile.path ? 'ok' : 'warn', profile.path ? relative(repo, profile.path) : 'missing'),
    budgetRow('task state', approxTokens(JSON.stringify(state)), state.task || options.task ? 'ok' : 'warn', state.task ? 'current state found' : options.task ? 'task provided without current state file' : 'task not provided'),
    budgetRow('context docs', docs.reduce((sum, item) => sum + approxTokens(safeReadSmall(item.path, 12000)), 0), docs.length > 4 ? 'warn' : 'ok', `${docs.length} candidate docs`),
    budgetRow('tool output summaries', 600, 'estimate', 'prefer summaries over raw logs'),
  ];
}

function summarizeRelatedRepo(repo, item) {
  const path = resolve(repo, item);
  const info = getGitInfo(path);
  if (!info.branch) return `${item}: not a git repository or unavailable`;
  return `${item}: ${info.branch} ${info.status ? 'dirty' : 'clean'} ${info.behind}/${info.ahead}`;
}

function contextConflictSeverity({ stale, missing, contradictions, profile }) {
  const realContradictions = contradictions.filter((item) => !String(item).toLowerCase().includes('no obvious context contradictions detected'));
  const contradictionText = realContradictions.join(' ').toLowerCase();
  if (contradictionText.includes('contradict') || contradictionText.includes('configured but missing')) return 'conflicting-sources';
  if (stale.length && (profile.sharedContextRoot || profile.productContext || profile.repoContext)) return 'stale-but-usable';
  if (stale.length > 2) return 'stale-and-risky';
  if (missing.length > 5) return 'missing-owner';
  return 'current-or-low-risk';
}

function budgetRow(source, tokens, status, note) {
  return { source, tokens: Math.round(tokens || 0), status, note };
}

function approxTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function buildContextPacket(repo, phase, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const requirements = evidenceRequirementsForTask(repo, task, route, git, profile, options);
  return { phase, task, route, repo, branch: git.branch, files, units, surfaces, requirements, profilePath: profile.path ? relative(repo, profile.path) : '', nextAction: nextActionForPhase(phase, task) };
}

function renderContextPacket(packet) {
  return ['# SDLC Context Packet', '', `Phase: ${packet.phase}`, `Task: ${packet.task || 'not provided'}`, `Route: ${packet.route}`, `Repository: ${packet.repo}`, `Branch: ${packet.branch || 'unknown'}`, '', '## Affected Units', '', ...formatList(packet.units.map((unit) => `${unit.name}: ${unit.path} (${unit.testSurface || 'surface?'})`)).split('\n'), '', '## Changed Files', '', ...formatList(packet.files).split('\n'), '', '## Testing Surfaces', '', ...formatList(packet.surfaces).split('\n'), '', '## Required Evidence', '', ...formatList(packet.requirements.map((item) => `${item.level}: ${item.id} - ${item.summary}`)).split('\n'), '', '## Context Source', '', `- Profile: ${packet.profilePath || 'not found'}`, '- Archived plans excluded by default.', '- Load exact code or docs only when needed for this phase.', '', '## Next Action', '', packet.nextAction, ''].join('\n');
}

function appendContextLedger(repo, outPath, packet) {
  const ledger = join(dirname(outPath), 'context-ledger.jsonl');
  appendControlJsonLine(repo, ledger, { timestamp: new Date().toISOString(), phase: packet.phase, task: packet.task, path: outPath, approxTokens: approxTokens(renderContextPacket(packet)) });
}

function nextActionForPhase(phase, task) {
  if (phase === 'intake') return 'sdlc config validate && sdlc capability snapshot';
  if (phase === 'planning') return `sdlc recipe compile --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'implementation') return 'edit within affected units and keep scope ledger current';
  if (phase === 'verification') return `sdlc checks plan && sdlc evidence plan --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'qa') return `sdlc qa build --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'finish') return `sdlc complete check --task "${escapeCommandArg(task || '...')}"`;
  return 'continue with SDLC state/current evidence';
}

function synthesizeFallbackState(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  return {
    taskId: options.taskId || slugLike(task || 'ad-hoc'),
    task,
    repo,
    route: options.route || inferRouteFromTask(task, git, profile.values),
    stage: options.stage || 'finish-ready',
    status: 'ad-hoc',
  };
}

function slugLike(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}
