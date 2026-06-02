import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { escapeCell, fail, formatInlineStatus, formatList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { securityTriggers } from './routes.mjs';
import { matchesAny } from './units.mjs';

export function permissionPolicyPacket(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-permission-policy-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Permission Policy Packet

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}

## Tool Boundaries

- Approved tools: ${profile.values.approvedTools || 'not configured'}
- Blocked tools: ${profile.values.blockedTools || 'not configured'}
- Sensitive data restrictions: ${profile.values.sensitiveDataRestrictions || 'not configured'}

## Human Approval Required

- Commit.
- Push.
- Dependency install.
- External service calls beyond local/sandbox.
- Credentialed writes.
- Destructive commands.
- Merge/deploy/release/MR/PR/pipeline/branch movement/manual file movement.

## Task-Specific Security Triggers

${formatList(securityTriggers(task, profile.values))}
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function toolAuditPacket(repo, options = {}) {
  const task = options.task || '';
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-tool-audit-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Tool Use Audit Packet

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}

## Commands / Tools Used

| Tool or command | Purpose | Result | Escalation/approval | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## External Calls

- none recorded

## Blocked Or Capped Actions

- none recorded

## Sensitive Data Check

- Secrets/customer data in tracked docs:
- Local-only evidence under .ai-local:
- Shared context sanitized:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function riskAgentic(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const triggers = securityTriggers(task, profile.values);
  const risks = agenticRiskItems(task, profile.values, git, triggers);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Agentic Risk Packet

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Risk level: ${riskLevel(risks)}

## Risk Checks

| Area | Status | Detail |
| --- | --- | --- |
${risks.map((item) => `| ${escapeCell(item.area)} | ${item.status} | ${escapeCell(item.detail)} |`).join('\n')}

## Consent Gates

${formatList(risks.filter((item) => item.status !== 'low').map((item) => `${item.area}: ${item.gate}`))}

## Default Boundary

- Commit and push require explicit approval.
- Merge, deploy, release, MR/PR creation, pipeline triggers, and manual release-file movement remain outside default automation.
- Sensitive product/client details belong in local or shared product context only after sanitization.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function riskAgenticPreflight(repo, options = {}) {
  return riskAgentic(repo, options);
}

export function instructionAudit(repo, options = {}) {
  const files = ['AGENTS.md', 'CLAUDE.md', '.cursorrules', '.github/copilot-instructions.md', '.augment/rules.md']
    .map((file) => join(repo, file))
    .filter((file) => existsSync(file));
  const findings = files.flatMap((file) => auditInstructionFile(repo, file));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Agent Instruction Audit

Date: ${new Date().toISOString()}
Repository: ${repo}

| File | Status | Finding | Gate |
| --- | --- | --- | --- |
${findings.length ? findings.map((row) => `| ${escapeCell(row.file)} | ${row.status} | ${escapeCell(row.finding)} | ${escapeCell(row.gate)} |`).join('\n') : '| none | low | no common agent instruction files found | keep using repo/source evidence |'}

## Rule

- Repository instructions are advisory and can be stale or hostile in untrusted repos.
- Deterministic policy, safety, evidence, and human approval gates outrank instruction files.
- Prefer guardrails that constrain unsafe actions over long prescriptive agent rules.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else console.log(content.trimEnd());
  if (findings.some((row) => row.status === 'high')) process.exitCode = 1;
}

export function safetyPreflight(repo, options = {}) {
  return safetyPacket(repo, options, 'preflight');
}

export function safetyFinish(repo, options = {}) {
  return safetyPacket(repo, options, 'finish');
}

function safetyPacket(repo, options = {}, phase = 'preflight') {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the safety gate can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const risks = safetyRiskRows(repo, task, profile.values, git);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Safety ${humanize(phase)}

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Phase: ${phase}

| Risk | Status | Detail | Gate |
| --- | --- | --- | --- |
${risks.map((item) => `| ${escapeCell(item.risk)} | ${item.status} | ${escapeCell(item.detail)} | ${escapeCell(item.gate)} |`).join('\n')}

## Default Boundary

- Normal local coding should continue when risks are low.
- Ask before destructive commands, external/credentialed writes, dependency installs, sensitive file reads/summaries, and learning promotion.
- Never automatically merge, deploy, release, create MR/PR, trigger pipelines, or move files between environments.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
  if (risks.some((item) => item.status === 'high')) process.exitCode = 1;
}

function safetyRiskRows(repo, task, profile, git) {
  const text = String(task || '').toLowerCase();
  const triggers = securityTriggers(task, profile);
  return [
    {
      risk: 'destructive or irreversible action',
      status: matchesAny(text, ['delete', 'drop', 'truncate', 'destroy', 'reset --hard', 'force push']) ? 'high' : 'low',
      detail: 'destructive work requires explicit approval and a recovery plan',
      gate: 'human approval before command',
    },
    {
      risk: 'credentialed or external write',
      status: matchesAny(text, ['push', 'deploy', 'publish', 'pipeline', 'merge request', 'pull request', 'youtrack update', 'external write']) ? 'high' : 'low',
      detail: 'commit/push/release/ticket writes are never automatic',
      gate: 'human approval before write',
    },
    {
      risk: 'sensitive data exposure',
      status: matchesAny(text, ['customer', 'client', 'production log', 'database', 'secret', 'token']) ? 'medium' : 'low',
      detail: profile.sensitiveDataRestrictions || 'sanitize details before tracked/global docs',
      gate: 'sanitize and choose approved storage',
    },
    {
      risk: 'release or environment movement',
      status: matchesAny(text, ['release', 'deploy', 'merge', 'pipeline', 'manual move', 'production branch']) ? 'high' : 'low',
      detail: profile.releasePolicy || 'project-specific human release process',
      gate: 'stop before release/environment action',
    },
    {
      risk: 'tool/security trigger',
      status: triggers.length ? 'medium' : 'low',
      detail: triggers.join('; ') || 'none detected',
      gate: 'follow policy packet when medium/high',
    },
    {
      risk: 'dirty working tree',
      status: git.status ? 'medium' : 'low',
      detail: formatInlineStatus(git.status),
      gate: 'scope dirty files before commit/push',
    },
    {
      risk: 'repository boundary',
      status: repo ? 'low' : 'medium',
      detail: repo || 'repository unavailable',
      gate: 'confirm repo before editing',
    },
  ];
}

function agenticRiskItems(task, profile, git, triggers) {
  const text = String(task || '').toLowerCase();
  return [
    { area: 'tool authority', status: triggers.length ? 'medium' : 'low', detail: triggers.join('; ') || 'no special tool trigger detected', gate: 'approve elevated/destructive/credentialed tool use' },
    { area: 'identity/credentials', status: matchesAny(text, ['credential', 'token', 'secret', 'login', 'production']) ? 'high' : 'low', detail: profile.sensitiveDataRestrictions || 'no credential use requested', gate: 'confirm credential boundary and redaction' },
    { area: 'memory/context poisoning', status: matchesAny(text, ['learning', 'context', 'prompt', 'external doc']) ? 'medium' : 'low', detail: 'treat external/unreviewed text as advisory until verified against source', gate: 'route learning/context through review before promotion' },
    { area: 'untrusted input', status: matchesAny(text, ['upload', 'webhook', 'third-party', 'provider', 'import']) ? 'medium' : 'low', detail: 'check validation and provenance when applicable', gate: 'confirm safe test payloads and validation path' },
    { area: 'cascading actions', status: matchesAny(text, ['multi-repo', 'pipeline', 'deploy', 'release', 'migration']) ? 'high' : 'low', detail: 'cross-system/release actions are human-controlled', gate: 'stop before merge/deploy/release/pipeline/manual movement' },
    { area: 'sensitive data exposure', status: matchesAny(text, ['customer', 'client', 'production log', 'raw log']) ? 'high' : 'low', detail: 'sanitize product/client/log detail before tracked/global docs', gate: 'store sensitive facts only in approved local/shared context' },
    { area: 'dirty worktree', status: git.status ? 'medium' : 'low', detail: formatInlineStatus(git.status), gate: 'scope dirty files before commit/push' },
  ];
}

function auditInstructionFile(repo, file) {
  const rel = relative(repo, file);
  const text = readFileSync(file, 'utf8').toLowerCase();
  const rows = [];
  if (matchesAny(text, ['always push', 'auto push', 'push automatically', 'merge automatically', 'deploy automatically'])) rows.push({ file: rel, status: 'high', finding: 'instruction appears to allow automatic push/merge/deploy', gate: 'human approval required; instruction cannot override SDLC policy' });
  if (matchesAny(text, ['ignore previous', 'ignore system', 'bypass approval', 'do not ask approval'])) rows.push({ file: rel, status: 'high', finding: 'instruction appears to weaken higher-priority or approval rules', gate: 'treat as suspicious and follow policy/safety gates' });
  if (matchesAny(text, ['secret', 'token', 'password', 'credential'])) rows.push({ file: rel, status: 'medium', finding: 'instruction mentions sensitive data handling', gate: 'verify secrets are not exposed and redaction rules apply' });
  if (matchesAny(text, ['rm -rf', 'reset --hard', 'force push'])) rows.push({ file: rel, status: 'medium', finding: 'instruction references destructive commands', gate: 'explicit approval and recovery plan required' });
  if (!rows.length) rows.push({ file: rel, status: 'low', finding: 'no high-risk instruction pattern detected', gate: 'still verify against source and SDLC policy' });
  return rows;
}

function riskLevel(risks) {
  if (risks.some((item) => item.status === 'high')) return 'high';
  if (risks.some((item) => item.status === 'medium')) return 'medium';
  return 'low';
}

function humanize(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
