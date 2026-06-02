import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { dedupe, escapeCell, fail, formatInlineList, formatList, safeWriteTextFile, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { affectedUnits, inferTestingSurfaces } from './units.mjs';

export function touchedPacket(repo, options = {}, deps = {}) {
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-touched-surface-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const rows = files.map((file) => ({
    file,
    surface: deps.classifyTouchedSurface(file),
    runtime: deps.classifyRuntimeSurface(file),
    qa: deps.needsManualQa(file) ? 'yes' : 'maybe',
  }));

  const content = `# SDLC Touched Surface Ledger

Date: ${new Date().toISOString()}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Head: ${git.head || 'unknown'}

## Summary

- Changed files: ${files.length}
- Surfaces: ${formatInlineList(dedupe(rows.map((row) => row.surface)))}
- Runtime hints: ${formatInlineList(dedupe(rows.map((row) => row.runtime)))}

## Changed Files By Surface

| File | Surface | Runtime hint | Manual QA likely |
| --- | --- | --- | --- |
${rows.length ? rows.map((row) => `| ${escapeCell(row.file)} | ${row.surface} | ${row.runtime} | ${row.qa} |`).join('\n') : '| none |  |  |  |'}

## QA And Handoff Notes

- Use this ledger as an input to impact, developer verification, QA test scripts, and final handoff.
- Generated/build artifacts should be reviewed before commit.
- Manual QA is expected when changed behavior is user-visible, data-affecting, integration-affecting, or lacks automated coverage.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function touchedUpdate(repo, options = {}) {
  const surface = options.surface || '';
  if (!surface) fail('Pass --surface <kind> so the touched-surface ledger can be updated.');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'touched-surface-live-ledger.jsonl');
  mkdirSync(dirname(outPath), { recursive: true });
  const row = {
    timestamp: new Date().toISOString(),
    repo: options.repoName || basename(repo),
    surface,
    evidence: options.evidence || '',
    task: options.task || '',
    privacy: options.privacy || 'internal',
  };
  appendFileSync(outPath, `${JSON.stringify(row)}\n`, 'utf8');
  console.log(relative(repo, outPath));
}

export function impactPacket(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the impact packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const units = affectedUnits(repo, files, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, files, profile);
  const surfaces = dedupe(files.map(deps.classifyTouchedSurface));
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-impact-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Impact Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Verification maturity: ${profile.values.verificationMaturity || 'not configured'}

## Impact Summary

- Runtime/product type: ${formatInlineList(dedupe(files.map(deps.classifyRuntimeSurface)))}
- Touched surfaces: ${formatInlineList(surfaces)}
- Testing surfaces: ${formatInlineList(testingSurfaces)}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}
- Changed files: ${files.length}

## Affected Areas To Consider

${formatList(deps.impactAreas(task, files, profile.values))}

## User Or System Workflows

- Primary workflow:
- Secondary/regression workflows:
- Roles/permissions:
- Environments affected:

## Technical Impact

- APIs/contracts: ${surfaces.includes('backend/API') || surfaces.includes('contracts/interfaces') ? 'likely' : 'unknown/not detected'}
- Data/storage: ${surfaces.includes('database/storage') ? 'likely' : 'unknown/not detected'}
- External integrations: ${surfaces.includes('external integration') ? 'likely' : 'unknown/not detected'}
- Config/environment: ${surfaces.includes('config/environment') ? 'likely' : 'unknown/not detected'}
- Dependencies/packages: ${surfaces.includes('dependencies') ? 'likely' : 'unknown/not detected'}

## QA Coverage Areas

${formatList(deps.qaAreas(task, files))}

## Risks, Unknowns, And Caps

- Unknown affected pages/screens:
- Unknown affected APIs/jobs:
- Test coverage cap:
- Release/handoff risk:
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function interactionPacket(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the interaction packet can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const breadth = deps.taskBreadthAssessment(task, files, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-interaction-stateful-feature.md`);
  const content = `# SDLC Interactive / Stateful Feature Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Task breadth: ${breadth.level}

## Trigger Signals

${formatList(breadth.signals.length ? breadth.signals : ['interactive/stateful recipe selected manually'])}

## Interaction Contract

- Primary actor:
- Starting state:
- User action sequence:
- Mode/settings/state changes:
- Feedback/animation/response expected:
- Error/repeat/edge path:
- Reset/recovery path:

## Required Proof

- State/domain logic test or explicit cap:
- Build/typecheck:
- Rendered/execution-path smoke:
- Happy path:
- Regression path:
- QA Markdown when human testers are involved:

## Validation Surface Ladder

${deps.formatValidationLadder(deps.validationLadderRows(task, surfaces))}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}
