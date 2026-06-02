import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, fail, formatList, formatOptionList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';

export function smokePacket(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the manual smoke packet can be scoped.');
  const classifyTouchedSurface = dependencies.classifyTouchedSurface || (() => 'unknown');
  const smokeStepSuggestions = dependencies.smokeStepSuggestions || (() => ['Run the changed workflow and one nearby regression path.']);
  const renderedEvidencePlan = dependencies.renderedEvidencePlan || (() => ['Rendered evidence not inferred. Record cap if unavailable.']);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-manual-smoke-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Manual Smoke Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Head: ${git.head || 'unknown'}
Status: ${git.status || 'clean'}
Verification maturity: ${profile.values.verificationMaturity || 'not configured'}

## Purpose

Record developer/agent smoke evidence for the changed behavior before completion, commit, push, or QA handoff. This is separate from the human QA Markdown script.

## Changed Surfaces

${formatList(dedupe(files.map(classifyTouchedSurface)))}

## Suggested Smoke Steps

${formatList(smokeStepSuggestions(task, files))}

## Rendered Evidence Plan

${formatList(renderedEvidencePlan(task, files, profile.values))}

## Environment

- Local/QA URL:
- Browser/device:
- User role/test account:
- Data/config needed:

## Expected Result

- Changed behavior is visible or callable.
- Nearby existing behavior still works.
- No obvious console, page, API, or integration errors appear in the smoke path.

## Actual Result

- Status:
- Notes:
- Screenshots/logs:

## Caps

- Automated tests unavailable:
- Render/browser unavailable:
- External service/data unavailable:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function smokeComplete(repo, options = {}, dependencies = {}) {
  const resolvePacketPath = dependencies.resolvePacketPath;
  const appendPacketCompletion = dependencies.appendPacketCompletion;
  if (typeof resolvePacketPath !== 'function' || typeof appendPacketCompletion !== 'function') fail('smoke complete requires packet resolution dependencies.');
  const packetPath = resolvePacketPath(repo, options.packet);
  const status = options.status || '';
  if (!status) fail('Pass --status "pass|fail|blocked" so manual smoke outcome is explicit.');
  if (!['pass', 'fail', 'blocked'].includes(status)) fail('Use --status "pass", "fail", or "blocked".');
  const entry = `## Manual Smoke Completion

Completed: ${new Date().toISOString()}
Status: ${status}

### Steps Run

${formatOptionList(options.steps)}

### Result / Evidence

${formatOptionList(options.evidence || options.result)}

### Remaining Gaps / Caps

${formatOptionList(options.caps)}

### Notes

${options.notes || ''}
`;
  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}
