import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, fail, formatList, formatOptionList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { classifyTouchedSurface } from './surface.mjs';

export function smokePacket(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the manual smoke packet can be scoped.');
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

function smokeStepSuggestions(task, files) {
  const text = String(task || '').toLowerCase();
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const steps = ['Open or invoke the primary changed workflow and confirm the intended behavior.'];
  if (surfaces.includes('frontend/UI') || matchesAny(text, ['ui', 'screen', 'page', 'animation', 'game'])) {
    steps.push('Render the affected UI locally and inspect the changed state on desktop and a narrow/mobile viewport when practical.');
  }
  if (surfaces.includes('backend/API')) steps.push('Exercise the affected API/service path with the smallest available local or QA-safe request.');
  if (surfaces.includes('database/storage')) steps.push('Confirm changed data reads/writes with safe test data and record any migration/backfill cap.');
  if (surfaces.includes('external integration')) steps.push('Use a sandbox/mock path or record the exact external integration cap.');
  if (surfaces.includes('dependencies')) steps.push('Run the closest startup/build/test path to catch dependency upgrade regressions.');
  steps.push('Check the nearest unchanged workflow so QA receives one regression path, not only the happy path.');
  return dedupe(steps);
}

function matchesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
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
