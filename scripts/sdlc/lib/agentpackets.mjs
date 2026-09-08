import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { escapeCell, escapeCommandArg, fail, formatList, printObject, printTable, safeWriteTextFile, slug } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadTaskJournal, upsertTaskJournal } from './journal.mjs';
import { loadProfile } from './profile.mjs';
import { analyzePrompt, renderPromptAnalysis } from './prompt.mjs';
import { buildLocalFirstPlan, renderLocalFirstPlan } from './tools.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask, securityTriggers } from './routes.mjs';

export const HANDOFF_ROLES = [
  'implementation-worker',
  'verification-worker',
  'independent-reviewer',
  'release-handoff-worker',
  'process-learning-reviewer',
];

export const SCOUT_LANGUAGE_PROFILES = [
  'generic',
  'classic-asp',
  'dotnet-csharp',
  'typescript-react',
  'sql',
  'node',
  'python',
];

export const SCOUT_TASK_TYPES = [
  'duplication-scan',
  'abandoned-code-scan',
  'extraction-candidate-scan',
  'test-gap-scan',
  'risk-surface-scan',
  'context-summary',
];

export function agentsPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = loadTaskJournal(repo, task, options);
  const analysis = journal.promptAnalysis || analyzePrompt(task, repo, options);
  const localFirst = journal.localFirst || buildLocalFirstPlan(repo, task, options);
  const routingReceipt = tierRoutingReceipt(repo, task, '', { ...options, analysis, localFirst });
  const delegation = delegationStrategyDecision(repo, task, options);
  const recommendations = delegation.delegationRecommended ? recommendAgentPackets(repo, task, options) : suppressAgentRecommendations(delegation);
  const workspaceWarnings = agentWorkspaceWarnings(repo, task, recommendations);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-agent-plan-v1', task, repository: repo, routingReceipt, delegation, recommendations, workspaceWarnings }, null, 2));
    return;
  }
  const content = `# SDLC Agent Handoff Plan

Task: ${task}
Repository: ${repo}

## Tier-Routing Receipt

${renderTierRoutingReceipt(routingReceipt)}

## Delegation Decision

${formatList([
  `Delegation recommended: ${delegation.delegationRecommended}`,
  `Reason: ${delegation.reason}`,
  `Fast-pass route: ${delegation.fastPassRoute}`,
  `Required deterministic checks: ${delegation.requiredChecks.join('; ') || 'none'}`,
  `Parallelism recommended: ${delegation.parallelism.parallelRecommended}`,
  `Parallelism reason: ${delegation.parallelism.reason}`,
  `Parallel workstreams: ${delegation.parallelism.workstreams.join('; ') || 'none'}`,
  `Sequential dependencies: ${delegation.parallelism.sequentialDependencies.join('; ') || 'none'}`,
  `Maximum useful concurrency: ${delegation.parallelism.maximumUsefulConcurrency}`,
  `Ownership: ${delegation.parallelism.ownership}`,
  `Synthesis point: ${delegation.parallelism.synthesisPoint}`,
  `Runtime fallback: ${delegation.parallelism.runtimeFallback}`,
])}

| Role | Recommendation | Score | Why |
| --- | --- | --- | --- |
${recommendations.map((row) => `| ${row.role} | ${row.recommendation} | ${row.score} | ${escapeCell(row.why)} |`).join('\n')}

## Workspace Warnings

${formatList(workspaceWarnings.length ? workspaceWarnings : ['No workspace mismatch warning detected.'])}

## Guidance

- Create packets only when they reduce ambiguity, improve evidence, clarify boundaries, or support restart/handoff.
- For cross-surface legacy parity work, generate read-only scout packets before coding so the orchestrator can synthesize a parity contract and safe edit boundary.
- Run recommended workstreams concurrently only when ownership is non-overlapping and the synthesis point is explicit.
- Tiny/low-risk work can proceed without packets.
- Packets are bounded work orders, not autonomous subagents.
- After using a packet or response, capture route fit with: sdlc calibrate add --route "${routingReceipt.workClass}" --route-fit "<right-sized|too heavy|too light>" --friction "<category>".
`;
  const outPath = options.out ? resolve(repo, options.out) : join(runAgentDir(repo, task, options), 'agent-plan.md');
  safeWriteTextFile(repo, outPath, content);
  upsertTaskJournal(repo, task, {
    agents: recommendations.map((row) => ({ role: row.role, status: row.recommendation, why: row.why })),
    packets: [{ kind: 'agent-plan', path: relative(repo, outPath) }],
    promptAnalysis: analysis,
    localFirst,
    routingReceipt,
    delegation,
    nextRecommendedAction: `Review ${relative(repo, outPath)} or capture route fit with sdlc calibrate add --route "${routingReceipt.workClass}" --route-fit "<right-sized|too heavy|too light>" --friction "<category>"`,
  }, options);
  console.log(content.trimEnd());
  console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function delegationStrategyDecision(repo, task, options = {}) {
  const git = getGitInfo(repo);
  const files = String(options.files || '').trim() ? String(options.files).split(/[,;\n]/).map((file) => file.trim()).filter(Boolean) : git.changedFiles;
  const lower = task.toLowerCase();
  const triggers = securityTriggers(task, loadProfile(repo).values);
  const highRiskTriggers = triggers.filter((trigger) => !/generated runtime adapter or skill surface/.test(trigger));
  const docsOnly = files.length ? files.every((file) => /\.(md|mdx|txt|adoc|rst)$/i.test(file) || /^docs\//.test(file)) : hasTerm(lower, ['docs', 'readme', 'markdown', 'typo', 'wording']);
  const mechanical = hasTerm(lower, ['typo', 'wording', 'format', 'rename', 'comment only', 'comments only']);
  const releaseLike = hasTerm(lower, ['commit', 'push', 'merge', 'deploy', 'release']);
  const dataLike = hasTerm(lower, ['database', 'migration', 'sql', 'auth', 'secret', 'token', 'security']);
  const crossSurfaceLike = isCrossSurfaceLegacyTask(lower);
  const inferredRoute = inferRouteFromTask(task, git, loadProfile(repo).values);
  const riskyRoute = ['multi-repo-integration', 'contract-first', 'release-push', 'bugfix-live-system'].includes(inferredRoute);
  const explicitlyTiny = hasTerm(lower, ['micro', 'tiny', 'small local', 'small one-file', 'small one file', 'one-file low-risk', 'one file low risk', 'narrow local', 'obvious local', 'low-risk local', 'low risk local']);
  const small = files.length <= 1 || (docsOnly && files.length <= 5);
  const suppress = small && (docsOnly || mechanical || explicitlyTiny) && !highRiskTriggers.length && !releaseLike && !dataLike && !crossSurfaceLike && !riskyRoute;
  const parallelism = buildParallelismDecision(task, files, agentSignals(lower, files.length), !suppress);
  return {
    schema: 'sdlc.delegation_decision.v1',
    delegationRecommended: !suppress,
    reason: suppress
      ? 'Deterministic fast-pass scope; use checks before subagents.'
      : crossSurfaceLike
        ? 'Cross-surface legacy parity work needs read-only scout packets before coding.'
        : 'Normal route or risk signals may benefit from delegated packets.',
    fastPassRoute: suppress ? (docsOnly ? 'tiny-docs' : 'micro-tiny-fast-pass') : inferredRoute,
    requiredChecks: suppress ? ['git diff --check', ...(files.some((file) => /SKILL\.md$/.test(file)) ? ['node scripts/test-skill-files.mjs'] : [])] : [],
    suppressedRoles: suppress ? HANDOFF_ROLES : [],
    parallelism,
    signals: { files, docsOnly, mechanical, explicitlyTiny, inferredRoute, highRiskTriggers, releaseLike, dataLike, crossSurfaceLike },
  };
}

function buildParallelismDecision(task, files, signals, delegationRecommended) {
  const lower = String(task || '').toLowerCase();
  const orderedOrOverlapping = hasTerm(lower, ['same file', 'shared mutable state', 'shared state', 'ordered discovery', 'ordered discoveries', 'sequential', 'tightly coupled', 'depends on']);
  const runtimeFallback = 'Preserve the same role boundaries as sequential phases and record the runtime capability cap.';

  if (!delegationRecommended) {
    return {
      parallelRecommended: false,
      reason: 'Deterministic or single-agent fast-pass work does not justify coordination overhead.',
      workstreams: [],
      sequentialDependencies: ['complete the scoped task and deterministic verification in one flow'],
      maximumUsefulConcurrency: 1,
      ownership: 'primary agent owns the scoped task',
      synthesisPoint: 'primary agent final verification',
      runtimeFallback,
    };
  }

  if (orderedOrOverlapping) {
    return {
      parallelRecommended: false,
      reason: 'The task signals overlapping ownership, shared state, or ordered dependencies.',
      workstreams: [],
      sequentialDependencies: ['complete the dependency-producing work before starting its consumer'],
      maximumUsefulConcurrency: 1,
      ownership: 'one active writer for the coupled surface',
      synthesisPoint: 'primary agent after the ordered work completes',
      runtimeFallback,
    };
  }

  if (signals.crossSurfaceLegacy) {
    const workstreams = [
      signals.classicAsp ? 'read-only legacy implementation scout' : '',
      signals.reactUi ? 'read-only modern UI scout' : '',
      signals.dotnetApi ? 'read-only API/backend scout' : '',
      signals.databaseEvidence ? 'read-only data or fixture evidence scout' : '',
    ].filter(Boolean);
    return {
      parallelRecommended: true,
      reason: 'Independent read-only surfaces can be inspected concurrently before the parity contract is synthesized.',
      workstreams: workstreams.length ? workstreams : ['read-only scout per independent surface'],
      sequentialDependencies: ['synthesize one parity contract before assigning write-capable implementation'],
      maximumUsefulConcurrency: Math.max(2, Math.min(4, workstreams.length || 2)),
      ownership: 'one read-only scout per repository or surface; no write ownership during exploration',
      synthesisPoint: 'orchestrator parity contract and safe edit boundary',
      runtimeFallback,
    };
  }

  const explicitlyIndependent = /\b(parallel|independent|non-overlapping|nonoverlapping|disjoint)\b/.test(lower);
  if (signals.multiRepo && explicitlyIndependent) {
    return {
      parallelRecommended: true,
      reason: 'The task explicitly identifies independent repository-scoped discovery before cross-repository synthesis.',
      workstreams: ['one read-only scout per independently owned repository or deployable unit'],
      sequentialDependencies: ['synthesize repository findings before implementation or contract decisions'],
      maximumUsefulConcurrency: 3,
      ownership: 'each scout is restricted to one named repository or deployable unit',
      synthesisPoint: 'orchestrator cross-repository impact and ownership decision',
      runtimeFallback,
    };
  }

  if (signals.multiRepo) {
    return {
      parallelRecommended: false,
      reason: 'Multiple repositories are involved, but independence and non-overlapping ownership have not been established.',
      workstreams: [],
      sequentialDependencies: ['map cross-repository contracts and ordering before enabling concurrent work'],
      maximumUsefulConcurrency: 1,
      ownership: 'primary agent retains cross-repository orchestration until boundaries are explicit',
      synthesisPoint: 'orchestrator dependency and ownership decision',
      runtimeFallback,
    };
  }
  if (explicitlyIndependent && files.length > 1) {
    const workstreams = [...new Set(files)].slice(0, 4).map((file) => `bounded workstream for ${file}`);
    return {
      parallelRecommended: workstreams.length > 1,
      reason: workstreams.length > 1 ? 'The task identifies independent work and the available file scopes can be assigned without overlap.' : 'Independent work was requested, but distinct ownership was not established.',
      workstreams,
      sequentialDependencies: ['integrate all workstreams before final verification'],
      maximumUsefulConcurrency: Math.max(1, Math.min(4, workstreams.length)),
      ownership: 'one owner per distinct file or explicitly bounded surface',
      synthesisPoint: 'primary agent integration and full-scope verification',
      runtimeFallback,
    };
  }

  return {
    parallelRecommended: false,
    reason: 'No independent, non-overlapping workstreams have been established yet.',
    workstreams: [],
    sequentialDependencies: ['decompose and confirm ownership before enabling parallel execution'],
    maximumUsefulConcurrency: 1,
    ownership: 'primary agent retains ownership until a bounded decomposition exists',
    synthesisPoint: 'primary agent final verification',
    runtimeFallback,
  };
}

function suppressAgentRecommendations(delegation) {
  return HANDOFF_ROLES.map((role) => ({
    role,
    score: 0,
    recommendation: 'skip',
    why: `${delegation.reason} Required checks: ${delegation.requiredChecks.join('; ') || 'none'}.`,
  }));
}

export function agentsPacket(repo, options = {}) {
  const role = options.role || '';
  const task = options.task || '';
  if (!role || !task) fail('Pass --role <role> and --task "...".');
  if (!HANDOFF_ROLES.includes(role)) fail(`Unknown role "${role}". Use one of: ${HANDOFF_ROLES.join(', ')}`);
  const journal = loadTaskJournal(repo, task, options);
  const analysis = journal.promptAnalysis || analyzePrompt(task, repo, options);
  const localFirst = journal.localFirst || buildLocalFirstPlan(repo, task, options);
  const routingReceipt = journal.routingReceipt || tierRoutingReceipt(repo, task, role, { ...options, analysis, localFirst });
  const packet = renderAgentPacket(repo, task, role, { ...options, journal, analysis, localFirst, routingReceipt });
  const outPath = options.out ? resolve(repo, options.out) : join(runAgentDir(repo, task, options), `${role}.md`);
  safeWriteTextFile(repo, outPath, packet);
  upsertTaskJournal(repo, task, {
    agents: [{ role, status: options.dryRun ? 'dry-run-packet-created' : 'packet-created', path: relative(repo, outPath) }],
    packets: [{ kind: `agent-${role}`, path: relative(repo, outPath) }],
    promptAnalysis: analysis,
    localFirst,
    routingReceipt,
    nextRecommendedAction: `Review ${relative(repo, outPath)}, run sdlc agents lint --packet "${escapeCommandArg(relative(repo, outPath))}", then capture route fit with sdlc calibrate add --route "${routingReceipt.workClass}" --route-fit "<right-sized|too heavy|too light>" --friction "<category>"`,
  }, options);
  console.log(relative(repo, outPath));
}

export function agentsScoutPacket(repo, options = {}) {
  const task = options.task || '';
  const languageProfile = options.languageProfile || 'generic';
  const taskType = options.taskType || 'context-summary';
  const scope = options.scope || options.files || '';
  if (!task) fail('Pass --task "...".');
  if (!scope) fail('Pass --scope <path-or-list>.');
  if (!SCOUT_LANGUAGE_PROFILES.includes(languageProfile)) fail(`Unknown language profile "${languageProfile}". Use one of: ${SCOUT_LANGUAGE_PROFILES.join(', ')}`);
  if (!SCOUT_TASK_TYPES.includes(taskType)) fail(`Unknown task type "${taskType}". Use one of: ${SCOUT_TASK_TYPES.join(', ')}`);

  const packet = buildScoutRequest(repo, { ...options, task, languageProfile, taskType, scope });
  if (options.json) {
    console.log(JSON.stringify(packet, null, 2));
    return;
  }

  const content = renderScoutPacketMarkdown(packet);
  const outPath = options.out ? resolve(repo, options.out) : join(runAgentDir(repo, task, options), `read-only-code-scout-${taskType}.md`);
  safeWriteTextFile(repo, outPath, content);
  upsertTaskJournal(repo, task, {
    agents: [{ role: 'read-only-code-scout', status: 'scout-packet-created', path: relative(repo, outPath), taskType, languageProfile }],
    packets: [{ kind: `agent-read-only-code-scout-${taskType}`, path: relative(repo, outPath) }],
    nextRecommendedAction: `Review ${relative(repo, outPath)}. If a scout returns JSON findings, validate with sdlc agents scout-validate --packet <findings.json>.`,
  }, options);
  console.log(relative(repo, outPath));
}

export function agentsScoutValidate(repo, options = {}) {
  const packet = options.packet || options.file || '';
  if (!packet) fail('Pass --packet <findings.json>.');
  const packetPath = resolve(repo, packet);
  const findings = readJsonFile(packetPath);
  const errors = validateScoutFindings(findings);
  printObject({
    packet: relative(repo, packetPath),
    result: errors.length ? 'needs review' : 'valid-looking',
  });
  console.log(formatList(errors.length ? errors : ['No obvious scout findings contract gaps detected.']));
  if (errors.length) process.exitCode = 1;
}

export function agentsStatus(repo, options = {}) {
  const task = options.task || '';
  const journal = loadTaskJournal(repo, task, options);
  const agents = journal.agents || [];
  printObject({
    task: journal.task || task || 'not provided',
    journal: journal.paths?.markdown ? relative(repo, journal.paths.markdown) : 'missing',
    packets: agents.filter((row) => row.path).length,
  });
  printTable(
    ['Role', 'Status', 'Path/Why'],
    agents.length ? agents.map((row) => [row.role || 'unknown', row.status || 'unknown', row.path || row.why || '']) : [['none', 'not planned', 'Run sdlc agents plan --task "..."']],
  );
}

export function agentsLint(repo, options = {}) {
  const packet = options.packet || '';
  if (!packet) fail('Pass --packet <path>.');
  const packetPath = resolve(repo, packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = lintAgentPacket(text);
  printObject({ packet: relative(repo, packetPath), result: findings.length ? 'needs review' : 'ready-looking' });
  console.log(formatList(findings.length ? findings : ['No obvious packet quality gaps detected.']));
  if (findings.length) process.exitCode = 1;
}

export function recommendAgentPackets(repo, task, options = {}) {
  const lower = task.toLowerCase();
  const git = getGitInfo(repo);
  const changed = git.changedFiles.length;
  const signals = agentSignals(lower, changed);
  const rows = [
    ...recommendScoutPackets(signals),
    scoreRole({
    role: 'implementation-worker',
      score: (changed ? 2 : 0) + (signals.implementation ? 2 : 0) + (signals.multiRepo ? 1 : 0) + (signals.crossSurfaceLegacy ? 1 : 0),
      why: changed ? 'Git has existing changed files; use this packet only if those files are in scope.' : signals.crossSurfaceLegacy ? 'Wait until read-only scouts define the parity contract and safe edit boundary.' : signals.implementation ? 'Implementation intent is present; packet is optional unless scope grows.' : 'No implementation surface detected yet.',
    }),
    scoreRole({
    role: 'verification-worker',
      score: (signals.verify ? 3 : 0) + (changed ? 1 : 0) + (signals.noTests ? 2 : 0) + (signals.risky ? 1 : 0) + (signals.crossSurfaceLegacy ? 2 : 0),
      why: signals.crossSurfaceLegacy ? 'Parity work needs explicit same-surface proof or capped unavailable evidence.' : signals.verify || changed ? 'Task needs local evidence or a cap.' : 'Verification work is not yet prominent.',
    }),
    scoreRole({
    role: 'independent-reviewer',
      score: (signals.risky ? 3 : 0) + (signals.multiRepo ? 2 : 0) + (signals.sensitive ? 2 : 0) + (signals.release ? 1 : 0) + (signals.crossSurfaceLegacy ? 3 : 0),
      why: signals.risky || signals.multiRepo || signals.sensitive ? 'Risk, sensitivity, or cross-system work benefits from independent review.' : 'Use when scope/risk grows.',
    }),
    scoreRole({
    role: 'release-handoff-worker',
      score: (signals.qa ? 3 : 0) + (signals.release ? 3 : 0) + (hasTerm(lower, ['commit', 'push', 'finish']) ? 1 : 0),
      why: signals.qa || signals.release ? 'Human QA, finish, or git decision needs developer/tester-facing clarity.' : 'No finish/handoff need detected.',
    }),
    scoreRole({
    role: 'process-learning-reviewer',
      score: (signals.process ? 3 : 0) + (signals.repeatedFriction ? 2 : 0),
      why: signals.process ? 'Task is about SDLC/process learning and should capture reusable lessons.' : 'Use when the task reveals reusable process learning or repeated friction.',
    }),
  ];
  return rows;
}

function agentSignals(lower, changed) {
  const crossSurfaceLegacy = isCrossSurfaceLegacyTask(lower);
  return {
    implementation: /\b(implement|fix|add|develop|build|refactor)\b/.test(lower),
    verify: /\b(test|verify|validate|proof|evidence|qa)\b/.test(lower) || changed > 0,
    noTests: /no automated tests|manual qa|legacy/.test(lower),
    risky: hasTerm(lower, ['production', 'database', 'sql', 'security', 'auth', 'third-party', 'third party', 'package', 'dependency', 'legacy']),
    sensitive: hasTerm(lower, ['production', 'database', 'sql', 'customer', 'client', 'private', 'secret', 'token', 'soc']),
    multiRepo: /multi-repo|multi repo|multiple repositories|cross repo|workspace|several repositories/.test(lower),
    qa: /\b(qa|tester|manual|youtrack|test script|quality assurance)\b/.test(lower),
    release: hasTerm(lower, ['commit', 'push', 'merge', 'deploy', 'release', 'handoff', 'finish']),
    process: /\b(process learning|process improvement|sdlc process|sdlc|workflow improvement|improve (?:the )?workflow|agent strategy|subagent|subagents|friction|redundancy)\b/.test(lower),
    repeatedFriction: /\b(stuck|repeated|redundant|loop|friction|retry)\b/.test(lower),
    crossSurfaceLegacy,
    classicAsp: hasTerm(lower, ['classic asp', 'asp classic', 'www_dev']),
    reactUi: hasTerm(lower, ['reactui', 'react ui', 'react', 'employee-dashboard']),
    dotnetApi: hasTerm(lower, ['mainsite api', 'api backend', 'backend', 'dotnet', '.net', 'csharp', 'c#']),
    databaseEvidence: hasTerm(lower, ['database', 'db', 'sql', 'stored procedure']),
  };
}

function recommendScoutPackets(signals) {
  if (!signals.crossSurfaceLegacy) return [];
  const scouts = [];
  if (signals.classicAsp) {
    scouts.push(scoutRecommendation('classic-asp', 'Classic legacy behavior must be source-linked before defining parity.'));
  }
  if (signals.reactUi) {
    scouts.push(scoutRecommendation('typescript-react', 'Modern UI consumer behavior and payload shape must be source-linked.'));
  }
  if (signals.dotnetApi) {
    scouts.push(scoutRecommendation('dotnet-csharp', 'API/backend ownership must be source-linked before implementation.'));
  }
  if (signals.databaseEvidence) {
    scouts.push(scoutRecommendation('sql', 'Database fixture or persistence behavior should be checked read-only or capped.'));
  }
  return scouts.length ? scouts : [scoutRecommendation('generic', 'Cross-surface parity work needs read-only exploration before coding.')];
}

function scoutRecommendation(languageProfile, why) {
  return {
    role: 'read-only-code-scout',
    languageProfile,
    taskType: 'context-summary',
    score: 7,
    recommendation: 'strongly-recommended',
    why: `${why} Create with: sdlc agents scout-packet --language-profile ${languageProfile} --task-type context-summary --scope <path> --task "...".`,
  };
}

function isCrossSurfaceLegacyTask(lower) {
  const legacy = hasTerm(lower, ['classic asp', 'asp classic', 'legacy', 'www_dev']);
  const modern = hasTerm(lower, ['reactui', 'react ui', 'react', 'employee-dashboard', 'new ui', 'modern ui']);
  const backend = hasTerm(lower, ['mainsite api', 'api backend', 'backend', 'dotnet', '.net', 'csharp', 'c#']);
  const parity = hasTerm(lower, ['parity', 'differences', 'compare', 'fallback', 'dashboard', 'upload process', 'photo process']);
  return legacy && modern && backend && parity;
}

function agentWorkspaceWarnings(repo, task, recommendations) {
  const lower = task.toLowerCase();
  const repoBase = repo.split(/[\\/]/).filter(Boolean).pop() || repo;
  const crossSurface = isCrossSurfaceLegacyTask(lower);
  const likelyExternalProduct = crossSurface || hasTerm(lower, ['mainsite', 'reactui', 'www_dev', 'youtrack', 'employee-dashboard']);
  const warnings = [];
  if (repoBase === '.agents' && likelyExternalProduct) {
    warnings.push('Task appears to target a product workspace, but the active repository is the reusable skills pack. Re-run with --repo <target-workspace> before using dirty files or scope as task evidence.');
  }
  if (crossSurface && !recommendations.some((row) => row.role === 'read-only-code-scout')) {
    warnings.push('Cross-surface legacy parity work should produce read-only scout packets before implementation.');
  }
  return warnings;
}

function hasTerm(text, terms) {
  return new RegExp(`(^|[^a-z0-9-])(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})([^a-z0-9-]|$)`, 'i').test(text);
}

function scoreRole(row) {
  return { ...row, recommendation: recommendationForScore(row.score) };
}

function recommendationForScore(score) {
  if (score >= 6) return 'strongly-recommended';
  if (score >= 3) return 'recommended';
  if (score >= 1) return 'optional';
  return 'skip';
}

export function renderAgentPacket(repo, task, role, options) {
  const journal = options.journal || loadTaskJournal(repo, task, options);
  const analysis = options.analysis || journal.promptAnalysis || analyzePrompt(task, repo, options);
  const localFirst = options.localFirst || journal.localFirst || buildLocalFirstPlan(repo, task, options);
  const routingReceipt = options.routingReceipt || journal.routingReceipt || tierRoutingReceipt(repo, task, role, { ...options, analysis, localFirst });
  const delegation = journal.delegation?.parallelism ? journal.delegation : delegationStrategyDecision(repo, task, options);
  const git = getGitInfo(repo);
  return `# SDLC Agent Handoff Packet

Role: ${role}
Task: ${task}
Created: ${new Date().toISOString()}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Journal: ${journal.paths?.markdown ? relative(repo, journal.paths.markdown) : 'not started'}
Packet mode: ${options.dryRun ? 'dry-run packet only' : 'packet only'}

## Execution Status

This packet has not executed delegated work, invoked a model, changed files, or granted write authority. It is a bounded handoff artifact for human/orchestrator review.

## Why This Packet Exists

${rolePurpose(role)}

## Intent Trace

- Original task: ${task}
- Interpreted objective: ${analysis.intent || task}
- Acceptance evidence expected: ${evidenceForRole(role).join('; ')}
- Current packet claim: packet prepared only; no implementation, verification, review, release, or learning work has been completed by this packet.
- Human-visible next action: review the packet, lint it, then decide whether to run the role manually or through an approved runtime adapter.

## Allowed Scope

${formatList(allowedScope(role))}

## Forbidden Scope

${formatList([
  'Do not merge, deploy, release, or push.',
  'Do not inspect sensitive/private data outside configured read-only and approved boundaries.',
  'Do not invent evidence; record caps when evidence is unavailable.',
  'Do not broaden scope beyond this packet without updating the run journal.',
])}

## Prompt Analysis

${renderPromptAnalysis(analysis).trim()}

## Local-First Plan

${renderLocalFirstPlan(localFirst).trim()}

## Tier-Routing Receipt

${renderTierRoutingReceipt(routingReceipt)}

## Delegation and Parallelism Contract

${renderDelegationContract(delegation)}

## Linked Artifacts

${formatList([
  journal.paths?.markdown ? relative(repo, journal.paths.markdown) : '',
  ...(journal.packets || []).map((packet) => typeof packet === 'string' ? packet : packet.path).filter(Boolean),
])}

## Commands / Tools Allowed

${formatList(roleCommands(role, task))}

## Advisory Runtime / Model Recommendation

${formatList(runtimeRecommendation(role))}

## Evidence Required

${formatList(evidenceForRole(role))}

## Role Done Contract

${formatList(roleDoneContract(role))}

## Required Response Packet Fields

Return a concise Markdown result with:

1. Scope handled.
2. Evidence used.
3. Findings or changes.
4. Caps/risks.
5. Recommended next action.

Do not claim completion, safety, release readiness, or model quality beyond the evidence listed in the response.

Lint role responses with: sdlc response lint --file <path> --role-response before the orchestrator relies on them.

## Stop Conditions

${formatList([
  'Ambiguous approval or destructive action required.',
  'Sensitive data boundary is unclear.',
  'Local evidence conflicts with task intent.',
  'Scope grows beyond the packet.',
])}

## Run Journal Update

After work, record evidence or caps with the relevant SDLC command, keep the packet linked in the task run journal, and capture route fit with: sdlc calibrate add --route "${routingReceipt.workClass}" --route-fit "<right-sized|too heavy|too light>" --friction "<category>".
`;
}

export function tierRoutingReceipt(repo, task, role = '', options = {}) {
  const git = getGitInfo(repo);
  const profile = loadProfile(repo);
  const profileValues = profile.values || {};
  const route = inferRouteFromTask(task, git, profileValues);
  const lower = String(task || '').toLowerCase();
  const analysis = options.analysis || {};
  const localFirst = options.localFirst || {};
  const triggers = securityTriggers(task, profileValues);
  const riskSignals = [
    ...triggers,
    ...(analysis.riskTerms || []).map((term) => `prompt risk: ${term}`),
    ...(git.status ? ['dirty worktree'] : []),
    ...(hasTerm(lower, ['production', 'database', 'sql', 'security', 'auth', 'secret', 'token']) ? ['sensitive or high-risk task terms'] : []),
  ];
  const tierRiskSignals = riskSignals.filter((signal) => signal !== 'dirty worktree');
  const candidateTier = candidateTierForRole(role, lower, tierRiskSignals, localFirst);
  return {
    task,
    workClass: route,
    riskSignals: [...new Set(riskSignals)],
    candidateTier,
    evidenceContract: evidenceContractForTier(candidateTier, role, localFirst),
    escalationTriggers: escalationTriggersForTier(candidateTier),
    fallbackTier: fallbackTierFor(candidateTier),
    doNotClaim: [
      'lower tier quality from price alone',
      'model self-confidence as evidence',
      'delegated work executed from packet generation',
      'release, deploy, merge, push, or model quality without explicit evidence',
    ],
  };
}

function candidateTierForRole(role, lower, riskSignals, localFirst) {
  if ((localFirst?.canProveLocally || []).length && role === 'verification-worker') return 'deterministic';
  if (role === 'verification-worker') return 'deterministic';
  if (riskSignals.length || hasTerm(lower, ['architecture', 'public contract', 'security', 'privacy', 'production'])) return 'deep';
  if (role === 'process-learning-reviewer') return 'fast';
  if (role === 'independent-reviewer') return 'standard';
  if (role === 'release-handoff-worker') return 'standard';
  if (role === 'implementation-worker') return 'standard';
  return 'fast';
}

function evidenceContractForTier(candidateTier, role, localFirst) {
  const localProof = localFirst?.canProveLocally || [];
  const common = [
    'source-linked scope and boundary check',
    'explicit caps for unavailable evidence',
    'human approval boundary for commit/push/merge/deploy/release',
  ];
  if (candidateTier === 'deterministic') return [...localProof.slice(0, 3), 'fresh command output or explicit cap', ...common].filter(Boolean);
  if (role === 'verification-worker') return ['verification command output, manual smoke evidence, or cap', ...common];
  if (role === 'independent-reviewer') return ['findings or no-findings statement tied to files/evidence', ...common];
  if (role === 'implementation-worker') return ['changed files and rationale', 'verification run or cap', ...common];
  return common;
}

function escalationTriggersForTier(candidateTier) {
  const common = [
    'failed deterministic check',
    'missing source links',
    'scope or safe-edit boundary drift',
    'human correction',
    'sensitive data or approval uncertainty',
  ];
  if (candidateTier === 'fast') return ['weak structured output', 'repeated repair loop', ...common];
  if (candidateTier === 'standard') return ['repeated repair loop', 'conflicting evidence', ...common];
  if (candidateTier === 'deep') return ['unresolved disagreement requiring independent review', ...common];
  return common;
}

function fallbackTierFor(candidateTier) {
  if (candidateTier === 'deterministic') return 'fast or standard only when model interpretation is needed';
  if (candidateTier === 'fast') return 'standard';
  if (candidateTier === 'standard') return 'deep';
  if (candidateTier === 'deep') return 'consensus or human decision';
  return 'human decision backed by deterministic evidence';
}

function renderTierRoutingReceipt(receipt) {
  return formatList([
    `Task: ${receipt.task}`,
    `Work class: ${receipt.workClass}`,
    `Risk signals: ${receipt.riskSignals.length ? receipt.riskSignals.join('; ') : 'none detected'}`,
    `Candidate tier: ${receipt.candidateTier}`,
    `Evidence contract: ${receipt.evidenceContract.join('; ')}`,
    `Escalation triggers: ${receipt.escalationTriggers.join('; ')}`,
    `Fallback tier: ${receipt.fallbackTier}`,
    `Do not claim: ${receipt.doNotClaim.join('; ')}`,
  ]);
}

function renderDelegationContract(delegation) {
  const parallel = delegation.parallelism || {};
  return formatList([
    `Delegation recommended: ${delegation.delegationRecommended}`,
    `Delegation reason: ${delegation.reason}`,
    `Parallelism recommended: ${parallel.parallelRecommended || false}`,
    `Parallelism reason: ${parallel.reason || 'not evaluated'}`,
    `Parallel workstreams: ${(parallel.workstreams || []).join('; ') || 'none'}`,
    `Sequential dependencies: ${(parallel.sequentialDependencies || []).join('; ') || 'none'}`,
    `Maximum useful concurrency: ${parallel.maximumUsefulConcurrency || 1}`,
    `Ownership: ${parallel.ownership || 'primary agent owns the task'}`,
    `Synthesis point: ${parallel.synthesisPoint || 'primary agent final verification'}`,
    `Runtime fallback: ${parallel.runtimeFallback || 'run the same bounded roles sequentially'}`,
  ]);
}

function runAgentDir(repo, task, options) {
  return join(defaultRunsDir(repo), options.taskId || slug(task), 'agents');
}

function buildScoutRequest(repo, options = {}) {
  const git = getGitInfo(repo);
  const scope = String(options.scope || '').split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  return {
    schemaVersion: 'sdlc.read_only_code_scout.request.v1',
    agentRole: 'read-only-code-scout',
    languageProfile: options.languageProfile,
    taskType: options.taskType,
    taskSummary: options.task,
    repository: repo,
    git: {
      branch: git.branch,
      commit: git.head,
      dirty: Boolean(git.status),
    },
    scope,
    allowedActions: ['read'],
    forbiddenActions: [
      'edit files',
      'stage files',
      'commit',
      'push',
      'merge',
      'deploy',
      'release',
      'write tickets',
      'query databases',
      'store raw secrets or sensitive data',
    ],
    evidenceRequired: [
      'source-linked findings',
      'explicit uncertainty',
      'caps for unavailable or unreviewed scope',
      'recommended next action for the orchestrator',
    ],
    outputSchema: {
      schemaVersion: 'sdlc.read_only_code_scout.findings.v1',
      required: [
        'schemaVersion',
        'agentRole',
        'languageProfile',
        'taskType',
        'scopeReviewed',
        'findings',
        'sourcePointers',
        'confidence',
        'uncertainty',
        'verificationQuestions',
        'caps',
        'recommendedNextAction',
      ],
    },
    escalationTriggers: [
      'scope is unclear',
      'task requires edits',
      'finding lacks source pointer',
      'sensitive data boundary is unclear',
      'model/runtime output invents facts',
      'findings are more expensive to verify than manual review',
    ],
    modelTierPreference: options.modelTierPreference || options.modelTier || 'local-or-low-tier',
    fallbackInstruction: 'If runtime invocation is unavailable or not approved, return this packet for manual scout execution. Findings remain advisory until orchestrator verification.',
  };
}

function renderScoutPacketMarkdown(packet) {
  return `# Read-Only Code Scout Packet

Role: ${packet.agentRole}
Task type: ${packet.taskType}
Language profile: ${packet.languageProfile}
Task: ${packet.taskSummary}
Created: ${new Date().toISOString()}
Repository: ${packet.repository}
Branch: ${packet.git.branch || 'unknown'}
Packet mode: read-only packet only

## Execution Status

This packet has not invoked a model, executed delegated work, changed files, or granted write authority.

## Scope

${formatList(packet.scope)}

## Allowed Actions

${formatList(packet.allowedActions)}

## Forbidden Actions

${formatList(packet.forbiddenActions)}

## Evidence Required

${formatList(packet.evidenceRequired)}

## Escalation Triggers

${formatList(packet.escalationTriggers)}

## Runtime Guidance

- Model tier preference: ${packet.modelTierPreference}
- ${packet.fallbackInstruction}
- The orchestrator must verify source pointers before acting on findings.
- Top-level sourcePointers may name reviewed files or ranges; every finding must include exact line or range pointers in path:line or path:start-end form.
- For duplication or comparison findings, cite each compared block or function, not just one side.
- Record useful or noisy runs through \`sdlc_feedback\` or local \`sdlc feedback add\`.

## Request JSON

\`\`\`json
${JSON.stringify(packet, null, 2)}
\`\`\`

## Required Findings JSON

\`\`\`json
{
  "schemaVersion": "sdlc.read_only_code_scout.findings.v1",
  "agentRole": "read-only-code-scout",
  "languageProfile": "${packet.languageProfile}",
  "taskType": "${packet.taskType}",
  "scopeReviewed": ${JSON.stringify(packet.scope, null, 2)},
  "findings": [],
  "sourcePointers": ${JSON.stringify(packet.scope, null, 2)},
  "confidence": "low|medium|high",
  "uncertainty": [],
  "verificationQuestions": [],
  "caps": [],
  "recommendedNextAction": "orchestrator verify source pointers before acting"
}
\`\`\`
`;
}

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`Could not read JSON packet: ${error.message || String(error)}`);
  }
}

function validateScoutFindings(packet) {
  const errors = [];
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return ['Findings packet must be a JSON object.'];
  const required = [
    'schemaVersion',
    'agentRole',
    'languageProfile',
    'taskType',
    'scopeReviewed',
    'findings',
    'sourcePointers',
    'confidence',
    'uncertainty',
    'verificationQuestions',
    'caps',
    'recommendedNextAction',
  ];
  for (const field of required) {
    if (!(field in packet)) errors.push(`Missing required field: ${field}`);
  }
  if (packet.schemaVersion !== 'sdlc.read_only_code_scout.findings.v1') errors.push('schemaVersion must be sdlc.read_only_code_scout.findings.v1.');
  if (packet.agentRole !== 'read-only-code-scout') errors.push('agentRole must be read-only-code-scout.');
  if (!SCOUT_LANGUAGE_PROFILES.includes(packet.languageProfile)) errors.push(`languageProfile must be one of: ${SCOUT_LANGUAGE_PROFILES.join(', ')}`);
  if (!SCOUT_TASK_TYPES.includes(packet.taskType)) errors.push(`taskType must be one of: ${SCOUT_TASK_TYPES.join(', ')}`);
  if (!Array.isArray(packet.scopeReviewed) || !packet.scopeReviewed.length) errors.push('scopeReviewed must be a non-empty array.');
  if (!Array.isArray(packet.findings)) errors.push('findings must be an array.');
  if (!Array.isArray(packet.sourcePointers) || !packet.sourcePointers.length) errors.push('sourcePointers must include at least one pointer.');
  if (Array.isArray(packet.findings)) {
    for (const [index, finding] of packet.findings.entries()) {
      if (!finding || typeof finding !== 'object') {
        errors.push(`finding ${index + 1} must be an object.`);
        continue;
      }
      if (!finding.summary) errors.push(`finding ${index + 1} is missing summary.`);
      if (!finding.sourcePointer && !finding.sourcePointers) errors.push(`finding ${index + 1} is missing sourcePointer/sourcePointers.`);
      const findingPointers = [
        ...(finding.sourcePointer ? [finding.sourcePointer] : []),
        ...(Array.isArray(finding.sourcePointers) ? finding.sourcePointers : []),
      ].map((pointer) => String(pointer || ''));
      for (const pointer of findingPointers) {
        if (!/:[0-9]+(?:-[0-9]+)?$/.test(pointer)) {
          errors.push(`finding ${index + 1} source pointer must use path:line or path:start-end form: ${pointer}`);
        }
      }
      if (/edit|edited|changed|fixed|committed|pushed|deployed/i.test(String(finding.actionTaken || ''))) {
        errors.push(`finding ${index + 1} appears to claim forbidden action or edit work.`);
      }
    }
  }
  const serialized = JSON.stringify(packet);
  if (/rawDiff|rawCode|rawTicketText|databaseOutput|secret|password|access[_-]?token/i.test(serialized)) {
    errors.push('Findings packet appears to contain raw or sensitive content fields.');
  }
  if (/edited files|changed files|committed|pushed|deployed|released/i.test(serialized)) {
    errors.push('Findings packet appears to claim forbidden execution authority.');
  }
  return errors;
}

function rolePurpose(role) {
  return {
    'implementation-worker': 'Bound implementation work to the task and current local facts.',
    'verification-worker': 'Collect local proof, identify evidence gaps, and avoid model-only verification.',
    'independent-reviewer': 'Review risk, scope, quality, and evidence with independence from implementation.',
    'release-handoff-worker': 'Prepare human-facing finish, QA, and commit/push decision material without automating release.',
    'process-learning-reviewer': 'Capture reusable SDLC learning while redacting product-sensitive details.',
  }[role] || 'Bounded SDLC work packet.';
}

function allowedScope(role) {
  return {
    'implementation-worker': ['Make scoped code/doc/config edits implied by the task.', 'Use local deterministic checks before final claims.'],
    'verification-worker': ['Run or recommend verification commands.', 'Record caps and fallback evidence where tools are unavailable.'],
    'independent-reviewer': ['Inspect changed files, risks, contracts, and evidence gaps.', 'Return findings with severity and file references when available.'],
    'release-handoff-worker': ['Draft QA Markdown, finish packet, and commit/push approval material.', 'Keep merge/deploy/release human-controlled.'],
    'process-learning-reviewer': ['Summarize process friction and reusable improvement ideas.', 'Redact sensitive product/client details.'],
  }[role] || ['Follow packet scope only.'];
}

function roleCommands(role, task) {
  const common = [`sdlc tools inventory`, `sdlc local-first plan --task "${escapeCommandArg(task)}"`];
  return {
    'implementation-worker': [...common, `sdlc task ledger --task "${escapeCommandArg(task)}"`],
    'verification-worker': [...common, `sdlc verify ladder --task "${escapeCommandArg(task)}"`, `sdlc verify packet --task "${escapeCommandArg(task)}"`],
    'independent-reviewer': [...common, `sdlc review local --task "${escapeCommandArg(task)}"`],
    'release-handoff-worker': [...common, `sdlc qa script --task "${escapeCommandArg(task)}"`, `sdlc finish-ready --task "${escapeCommandArg(task)}"`],
    'process-learning-reviewer': [...common, `sdlc learn quick --task "${escapeCommandArg(task)}"`, 'sdlc learn candidate-add --claim "..." --source <path> --owner <artifact>'],
  }[role] || common;
}

function evidenceForRole(role) {
  return {
    'implementation-worker': ['Changed files stay within scope.', 'Implementation rationale is recorded when non-obvious.'],
    'verification-worker': ['Command output, manual smoke, QA script, or explicit cap.'],
    'independent-reviewer': ['Findings, no-findings statement, evidence gaps, and residual risk.'],
    'release-handoff-worker': ['Tester-readable QA script and explicit commit/push decision options.'],
    'process-learning-reviewer': ['Sanitized learning candidate and whether it should be promoted.', 'Knowledge candidate envelope when reusable process learning should be reviewed later.'],
  }[role] || ['Evidence appropriate to packet role.'];
}

function roleDoneContract(role) {
  return {
    'implementation-worker': ['Changed files and rationale are listed.', 'Evidence commands are run or explicitly capped.', 'No release, Git publication, dependency install, migration, or external-service action occurred.'],
    'verification-worker': ['Commands/tools run, results, skipped checks, and caps are listed.', 'Failures stop at evidence reporting unless a new approved packet allows repair.', 'No files were edited to make checks pass.'],
    'independent-reviewer': ['Findings are severity-ranked and source-linked where possible.', 'No-findings result includes evidence and residual risk.', 'Missing evidence is reported instead of accepted silently.'],
    'release-handoff-worker': ['QA/finish material is tester-readable.', 'Commit/push/deploy choices remain explicit human decisions.', 'Residual risks and evidence gaps are surfaced.'],
    'process-learning-reviewer': ['Reusable learning is sanitized and source-linked.', 'Promotion state is proposed, not silently made durable.', 'Product/client-sensitive details are excluded.', 'Knowledge candidates cite source artifacts and owner artifact before MCP or JSONL handoff.'],
  }[role] || ['Role output names scope, evidence, caps, and next action.'];
}

function runtimeRecommendation(role) {
  const common = [
    'Recommendation is advisory only; runtime adapters must not change role authority or evidence requirements.',
    'Default fallback: manual packet handoff using this file.',
  ];
  return {
    'implementation-worker': ['Suggested tier: standard after the safe edit boundary is approved.', ...common],
    'verification-worker': ['Suggested tier: deterministic; use fast or standard only to interpret failures or caps.', ...common],
    'independent-reviewer': ['Suggested tier: standard; escalate to deep when risk warrants. Deterministic evidence remains primary.', ...common],
    'release-handoff-worker': ['Suggested tier: standard or manual synthesis; release authority stays human.', ...common],
    'process-learning-reviewer': ['Suggested tier: fast for read-only synthesis; escalate to standard when ambiguity persists. Promotion requires review.', ...common],
  }[role] || common;
}

function lintAgentPacket(text) {
  const checks = [
    { ok: /^Role:/m.test(text), finding: 'Missing Role line.' },
    { ok: /^Task:/m.test(text), finding: 'Missing Task line.' },
    { ok: /^Packet mode:/m.test(text), finding: 'Missing packet mode line.' },
    { ok: /Execution Status/i.test(text), finding: 'Missing execution status / not-executed statement.' },
    { ok: /has not executed delegated work|not executed/i.test(text), finding: 'Missing explicit no-execution claim.' },
    { ok: /Intent Trace/i.test(text), finding: 'Missing intent trace.' },
    { ok: /Allowed Scope/i.test(text), finding: 'Missing allowed scope.' },
    { ok: /Forbidden Scope/i.test(text), finding: 'Missing forbidden scope.' },
    { ok: /Tier-Routing Receipt/i.test(text), finding: 'Missing tier-routing receipt.' },
    { ok: /Delegation and Parallelism Contract/i.test(text), finding: 'Missing delegation and parallelism contract.' },
    { ok: /Maximum useful concurrency:/i.test(text), finding: 'Missing maximum useful concurrency.' },
    { ok: /Ownership:/i.test(text), finding: 'Missing ownership boundary.' },
    { ok: /Runtime fallback:/i.test(text), finding: 'Missing runtime fallback.' },
    { ok: /Candidate tier:/i.test(text), finding: 'Missing candidate tier in routing receipt.' },
    { ok: /Escalation triggers:/i.test(text), finding: 'Missing escalation triggers in routing receipt.' },
    { ok: /Commands \/ Tools Allowed/i.test(text), finding: 'Missing allowed commands/tools.' },
    { ok: /Advisory Runtime \/ Model Recommendation/i.test(text), finding: 'Missing advisory runtime/model recommendation.' },
    { ok: /Evidence Required/i.test(text), finding: 'Missing evidence requirements.' },
    { ok: /Role Done Contract/i.test(text), finding: 'Missing role done contract.' },
    { ok: /Required Response Packet Fields/i.test(text), finding: 'Missing required response packet fields.' },
    { ok: /Stop Conditions/i.test(text), finding: 'Missing stop conditions.' },
    { ok: /Do not merge, deploy, release, or push/i.test(text), finding: 'Missing release safety boundary.' },
  ];
  return checks.filter((row) => !row.ok).map((row) => row.finding);
}
