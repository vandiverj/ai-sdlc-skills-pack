import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, formatList, printObject, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { externalEvidenceProfile, ticketFallbackFields } from './tools.mjs';

export function ticketEvidence(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the ticket evidence packet can be scoped.');
  const profile = loadProfile(repo);
  const ticket = externalEvidenceProfile(profile.values).ticket;
  const ticketId = options.ticket || firstMatch(task, /\b([A-Z][A-Z0-9]+-\d+)\b/) || 'not provided';
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-ticket-evidence.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Ticket Evidence Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Capability

- Provider: ${ticket.provider}
- MCP availability: ${ticket.availability}
- Read issue: ${ticket.readIssue}
- Read comments: ${ticket.readComments}
- Read attachments/articles: ${ticket.readAttachments}
- Write comments: ${ticket.writeComments}
- Update fields/status/assignee: ${ticket.updateFields}

## Ticket Intake

- Issue id/link: ${ticketId}
- Read mode: MCP / pasted / unavailable
- Retrieved at:
- Title/summary:
- Acceptance criteria:
- Reporter/requester notes:
- Relevant comments:
- Linked issues:
- Attachments/articles considered:
- Inferred scope:
- Open questions:
- Privacy caps:
- Drift check needed before closeout: yes

## Fallback If MCP Is Unavailable

Ask the developer for:

${formatList(ticketFallbackFields(ticket))}

## Approval Boundary

- Reading ticket evidence follows the configured profile boundary.
- Posting comments, changing status, assigning, updating fields, or creating issues requires explicit human approval.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function ticketDrift(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const ticket = externalEvidenceProfile(profile.values).ticket;
  const ticketId = options.ticket || firstMatch(task, /\b([A-Z][A-Z0-9]+-\d+)\b/) || 'not provided';
  printObject({
    repository: repo,
    task: task || 'not provided',
    ticket: ticketId,
    provider: ticket.provider,
    mcpAvailability: ticket.availability,
    action: ticket.availability === 'available' ? 'refresh ticket title, description, acceptance criteria, comments, linked issues, and attachments before claiming done' : 'ask developer whether ticket changed since task start',
    stopGate: 'if acceptance criteria, scope, priority, or QA expectations changed, summarize delta and reclassify before closeout',
  });
}

export function ticketUpdatePreview(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the ticket update preview can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const ticket = externalEvidenceProfile(profile.values).ticket;
  const ticketId = options.ticket || firstMatch(task, /\b([A-Z][A-Z0-9]+-\d+)\b/) || 'not provided';
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-ticket-update-preview.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Ticket Update Preview

Ticket: ${ticketId}
Task: ${task}
Branch: ${git.branch || 'unknown'}

## Proposed Comment

### Implementation Summary

- TBD

### Developer Verification

- TBD

### QA Notes

- TBD

### Known Caps / Follow-Up

- TBD

## Approval Boundary

- Provider: ${ticket.provider}
- MCP availability: ${ticket.availability}
- Write comments: ${ticket.writeComments}
- Update fields/status/assignee: ${ticket.updateFields}
- This file is a preview only. Do not post, change status, assign, update fields, create issues, merge, deploy, release, or trigger pipelines without explicit human approval.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function firstMatch(text, pattern) {
  const match = String(text || '').match(pattern);
  return match?.[1]?.trim() || '';
}
