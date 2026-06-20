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

export function agentsPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = loadTaskJournal(repo, task, options);
  const analysis = journal.promptAnalysis || analyzePrompt(task, repo, options);
  const localFirst = journal.localFirst || buildLocalFirstPlan(repo, task, options);
  const routingReceipt = tierRoutingReceipt(repo, task, '', { ...options, analysis, localFirst });
  const recommendations = recommendAgentPackets(repo, task, options);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-agent-plan-v1', task, repository: repo, routingReceipt, recommendations }, null, 2));
    return;
  }
  const content = `# SDLC Agent Handoff Plan

Task: ${task}
Repository: ${repo}

## Tier-Routing Receipt

${renderTierRoutingReceipt(routingReceipt)}

| Role | Recommendation | Score | Why |
| --- | --- | --- | --- |
${recommendations.map((row) => `| ${row.role} | ${row.recommendation} | ${row.score} | ${escapeCell(row.why)} |`).join('\n')}

## Guidance

- Create packets only when they reduce ambiguity, improve evidence, clarify boundaries, or support restart/handoff.
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
    nextRecommendedAction: `Review ${relative(repo, outPath)} or capture route fit with sdlc calibrate add --route "${routingReceipt.workClass}" --route-fit "<right-sized|too heavy|too light>" --friction "<category>"`,
  }, options);
  console.log(content.trimEnd());
  console.log(`\nSaved: ${relative(repo, outPath)}`);
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
    scoreRole({
    role: 'implementation-worker',
      score: (changed ? 2 : 0) + (signals.implementation ? 2 : 0) + (signals.multiRepo ? 1 : 0),
      why: changed ? 'Git has existing changed files; use this packet only if those files are in scope.' : signals.implementation ? 'Implementation intent is present; packet is optional unless scope grows.' : 'No implementation surface detected yet.',
    }),
    scoreRole({
    role: 'verification-worker',
      score: (signals.verify ? 3 : 0) + (changed ? 1 : 0) + (signals.noTests ? 2 : 0) + (signals.risky ? 1 : 0),
      why: signals.verify || changed ? 'Task needs local evidence or a cap.' : 'Verification work is not yet prominent.',
    }),
    scoreRole({
    role: 'independent-reviewer',
      score: (signals.risky ? 3 : 0) + (signals.multiRepo ? 2 : 0) + (signals.sensitive ? 2 : 0) + (signals.release ? 1 : 0),
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
  return {
    implementation: /\b(implement|fix|add|develop|build|refactor)\b/.test(lower),
    verify: /\b(test|verify|validate|proof|evidence|qa)\b/.test(lower) || changed > 0,
    noTests: /no automated tests|manual qa|legacy/.test(lower),
    risky: hasTerm(lower, ['production', 'database', 'sql', 'security', 'auth', 'third-party', 'third party', 'package', 'dependency', 'legacy']),
    sensitive: hasTerm(lower, ['production', 'database', 'sql', 'customer', 'client', 'private', 'secret', 'token', 'soc']),
    multiRepo: /multi-repo|multi repo|multiple repositories|cross repo|workspace|several repositories/.test(lower),
    qa: /\b(qa|tester|manual|youtrack|test script|quality assurance)\b/.test(lower),
    release: hasTerm(lower, ['commit', 'push', 'merge', 'deploy', 'release', 'handoff', 'finish']),
    process: /\b(learning|process|sdlc|workflow|agent|friction|redundancy)\b/.test(lower),
    repeatedFriction: /\b(stuck|repeated|redundant|loop|friction|retry)\b/.test(lower),
  };
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

function renderAgentPacket(repo, task, role, options) {
  const journal = options.journal || loadTaskJournal(repo, task, options);
  const analysis = options.analysis || journal.promptAnalysis || analyzePrompt(task, repo, options);
  const localFirst = options.localFirst || journal.localFirst || buildLocalFirstPlan(repo, task, options);
  const routingReceipt = options.routingReceipt || journal.routingReceipt || tierRoutingReceipt(repo, task, role, { ...options, analysis, localFirst });
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
  const candidateTier = candidateTierForRole(role, lower, riskSignals, localFirst);
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
  if ((localFirst?.canProveLocally || []).length && role === 'verification-worker') return 'deterministic-tools';
  if (role === 'verification-worker') return 'deterministic-tools';
  if (riskSignals.length || hasTerm(lower, ['architecture', 'public contract', 'security', 'privacy', 'production'])) return 'top-frontier-orchestrator';
  if (role === 'process-learning-reviewer') return 'local-or-standard-read-only';
  if (role === 'independent-reviewer') return 'standard-review';
  if (role === 'release-handoff-worker') return 'standard-or-manual';
  if (role === 'implementation-worker') return 'cheaper-frontier-after-safe-boundary';
  return 'manual-or-cheaper-frontier';
}

function evidenceContractForTier(candidateTier, role, localFirst) {
  const localProof = localFirst?.canProveLocally || [];
  const common = [
    'source-linked scope and boundary check',
    'explicit caps for unavailable evidence',
    'human approval boundary for commit/push/merge/deploy/release',
  ];
  if (candidateTier === 'deterministic-tools') return [...localProof.slice(0, 3), 'fresh command output or explicit cap', ...common].filter(Boolean);
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
  if (candidateTier.includes('local')) return ['weak structured output', 'latency or retry burden', ...common];
  if (candidateTier.includes('cheaper')) return ['repeated repair loop', ...common];
  return common;
}

function fallbackTierFor(candidateTier) {
  if (candidateTier === 'deterministic-tools') return 'manual packet or standard model only for interpretation';
  if (candidateTier.includes('local')) return 'manual-packet or standard frontier review';
  if (candidateTier.includes('cheaper')) return 'top-frontier-orchestrator';
  return 'manual-packet with top-frontier reconciliation';
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

function runAgentDir(repo, task, options) {
  return join(defaultRunsDir(repo), options.taskId || slug(task), 'agents');
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
    'implementation-worker': ['Suggested tier: cheaper frontier or standard model only after safe edit boundary is approved.', ...common],
    'verification-worker': ['Suggested tier: deterministic commands first; model only interprets failures or caps.', ...common],
    'independent-reviewer': ['Suggested tier: standard/deep model when risk warrants; deterministic evidence remains primary.', ...common],
    'release-handoff-worker': ['Suggested tier: standard model or manual synthesis; release authority stays human.', ...common],
    'process-learning-reviewer': ['Suggested tier: local/standard model for read-only synthesis; promotion requires review.', ...common],
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
