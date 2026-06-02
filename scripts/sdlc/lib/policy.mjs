import { escapeCommandArg, fail, printGateRows, printObject, printTable } from './common.mjs';
import { loadProfile } from './profile.mjs';

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function profileToken(value) {
  return String(value || '').toLowerCase();
}

function matchesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}


function securityTriggers(task, profile = {}) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const triggers = [];
  if (matchesAny(text, ['secret', 'credential', 'password', 'token', 'api key', 'private key'])) triggers.push('secrets or credentials');
  if (matchesAny(text, ['dependency', 'package', 'install', 'npm install', 'pip install', 'cargo add', 'plugin'])) triggers.push('new dependency or tool install');
  if (matchesAny(text, ['external api', 'webhook', 'http', 'curl', 'network', 'third party', 'third-party'])) triggers.push('external API or network call');
  if (matchesAny(text, ['mcp', 'tool install', 'plugin install', 'connector'])) triggers.push('MCP/tool install');
  if (matchesAny(text, ['youtrack', 'ticket', 'issue id', 'acceptance criteria', 'yt-'])) triggers.push('ticket-system evidence');
  if (matchesAny(text, ['database mcp', 'read-only database', 'read only database', 'db mcp', 'native soc', 'production data', 'row-level', 'query production'])) triggers.push('database evidence boundary');
  if (matchesAny(text, ['credentialed write', 'write action', 'push', 'deploy', 'publish'])) triggers.push('credentialed write action');
  if (matchesAny(text, ['production', 'prod', 'deploy', 'release'])) triggers.push('production or release surface');
  if (matchesAny(text, ['cross repo', 'multi repo', 'multi-repo', 'release order'])) triggers.push('cross-repo release order');
  if (matchesAny(text, ['runtime adapter', 'adapter', 'agent', 'skill'])) triggers.push('generated runtime adapter or skill surface');
  if (matchesAny(text, ['prompt injection', 'tool injection', 'untrusted input', 'user content'])) triggers.push('prompt/tool injection risk');
  if (matchesAny(text, ['delete', 'remove all', 'rm -rf', 'reset', 'force push', 'bulk rewrite'])) triggers.push('broad file mutation or destructive command');
  return dedupe(triggers);
}

export function policyCheck(repo, options = {}) {
  const task = options.task || '';
  const action = options.action || '';
  const profile = loadProfile(repo);
  const rows = action ? policyRowsForAction(repo, task, action, profile.values) : policyRowsForTask(repo, task, profile.values);
  const blocked = rows.filter((row) => row.status === 'block');
  printObject({ task: task || 'not provided', action: action || 'task', result: blocked.length ? 'blocked' : rows.some((row) => row.status === 'warn') ? 'warn' : 'pass' });
  printGateRows(rows);
  if (blocked.length) process.exitCode = 1;
}

export function policyExplain(repo, options = {}) {
  const gate = options.gate || '';
  if (!gate) fail('Pass --gate <id>.');
  const explanations = policyExplanations();
  printObject({
    gate,
    explanation: explanations[gate] || 'No specific explanation found; use `sdlc policy check --task "..."` for current policy rows.',
  });
}

export function policyRowsForTask(repo, task, profile = {}) {
  const rows = [];
  const triggers = securityTriggers(task || '', profile);
  if (triggers.length) rows.push({ id: 'policy-security-triggers', status: 'warn', detail: triggers.join(', '), next: `sdlc policy check --task "${escapeCommandArg(task || '')}"` });
  if (matchesAny(String(task || '').toLowerCase(), ['merge', 'deploy', 'release', 'pipeline', 'move files'])) rows.push({ id: 'policy-release-boundary', status: 'block', detail: 'merge/deploy/release/pipeline/file movement is never automatic', next: 'human project-specific release process' });
  if (!rows.length) rows.push({ id: 'policy-default', status: 'pass', detail: 'no high-risk policy trigger detected', next: '' });
  return rows;
}

export function policyRowsForAction(repo, task, action, profile = {}) {
  const rows = [];
  if (action === 'push') rows.push({ id: 'policy-push-approval', status: 'block', detail: 'push requires explicit human approval and is never automatic', next: 'ask human for push approval' });
  else if (action === 'commit') rows.push({ id: 'policy-commit-approval', status: 'warn', detail: 'commit requires explicit human approval', next: 'sdlc action preview --action commit' });
  else if (['merge', 'deploy', 'release', 'pipeline'].includes(action)) rows.push({ id: 'policy-release-boundary', status: 'block', detail: `${action} is outside SDLC automation`, next: 'use project-specific human release process' });
  else if (action === 'ticket-update') rows.push({ id: 'policy-ticket-write', status: 'block', detail: 'ticket writes/status updates require explicit approval', next: 'sdlc ticket update-preview --task "..."' });
  else if (action === 'db-query') rows.push({ id: 'policy-database-boundary', status: 'warn', detail: 'database access must stay read-only, bounded, and redacted', next: 'sdlc data query-plan --task "..."' });
  else if (['install', 'network'].includes(action)) rows.push({ id: 'policy-external-action', status: 'warn', detail: `${action} may need approval depending on sandbox/profile`, next: 'sdlc tools status --task "..."' });
  rows.push(...policyRowsForTask(repo, task, profile).filter((row) => row.id !== 'policy-default'));
  return rows.length ? rows : [{ id: 'policy-action', status: 'pass', detail: 'no special action policy detected', next: '' }];
}

export function policyExplanations() {
  return {
    'policy-push-approval': 'Push changes only after explicit human approval. Commit approval is separate from push approval.',
    'policy-release-boundary': 'Merge, deploy, release, MR/PR creation, pipeline triggers, and manual file movement are project-specific human processes.',
    'policy-ticket-write': 'Ticket comments/status/field changes can affect team workflow and require explicit approval.',
    'policy-database-boundary': 'Read-only database evidence can reduce uncertainty, but writes, migrations, backfills, stored procedure execution, and sensitive row reads are blocked without explicit approval.',
    'policy-security-triggers': 'Security/tool triggers add review and evidence expectations; they do not automatically authorize action.',
  };
}

export function policyList(repo, options = {}) {
  const profile = loadProfile(repo).values;
  const rows = ['commit', 'push', 'merge', 'deploy', 'ticket-update', 'db-query', 'install', 'network'].flatMap((action) => policyRowsForAction(repo, options.task || '', action, profile).map((row) => [action, row.id, row.status, row.detail]));
  printTable(['Action', 'Gate', 'Status', 'Detail'], rows);
}

export function policyValidateConfig(repo, options = {}) {
  const profile = loadProfile(repo).values;
  const findings = [];
  if (!profile.releasePolicy && !profile.humanApprovalGates) findings.push(['warn', 'release policy/human approval gates not configured']);
  if (!profile.sensitiveDataRestrictions) findings.push(['warn', 'sensitive data restrictions not configured']);
  if (profile.databaseMcpAvailability === 'available' && !profile.databaseAllowedOperations) findings.push(['warn', 'database MCP available but allowed operations not configured']);
  if (profile.ticketMcpAvailability === 'available' && !profile.ticketSensitiveDataRules) findings.push(['warn', 'ticket MCP available but sensitive data rules not configured']);
  if (!findings.length) findings.push(['pass', 'policy config has core fields']);
  printTable(['Status', 'Finding'], findings);
  if (findings.some((row) => row[0] === 'warn')) process.exitCode = 1;
}

export function policySimulate(repo, options = {}) {
  const action = options.action || '';
  if (!action) fail('Pass --action <action>.');
  const rows = policyRowsForAction(repo, options.task || '', action, loadProfile(repo).values);
  printTable(['Gate', 'Status', 'Decision', 'Next'], rows.map((row) => [row.id, row.status, policyDecision(row.status), row.next || '']));
  if (rows.some((row) => row.status === 'block')) process.exitCode = 1;
}

export function policyDecision(status) {
  if (status === 'block') return 'blocked or human approval required';
  if (status === 'warn') return 'allowed only with review/approval as applicable';
  return 'allowed within normal SDLC boundaries';
}
