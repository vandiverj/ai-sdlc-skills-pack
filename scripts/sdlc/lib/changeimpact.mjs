import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { defaultRunsDir } from './paths.mjs';
import { dedupe, escapeCell, fail, formatInlineList, formatList, optionFiles, printObject, safeWriteTextFile, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { affectedUnits, inferTestingSurfaces } from './units.mjs';
import { experienceImpactRequired } from './routes.mjs';

export function touchedPacket(repo, options = {}, deps = {}) {
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
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
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, files, profile);
  const experienceRequired = experienceImpactRequired({ task, route: options.route || 'standard', files, surfaces: testingSurfaces });
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

## Experience-Impact Contract

- Required: ${experienceRequired ? 'yes' : 'no'}
- Experience-impact status: ${experienceRequired ? options.experienceStatus || 'open' : 'not-required'}
- Primary actor: ${optionText(options.actor)}
- Actor job: ${optionText(options.actorJob || options.userJob)}
- Before workflow: ${optionText(options.beforeWorkflow || options.before)}
- After workflow: ${optionText(options.afterWorkflow || options.after)}
- Changed state/data/feedback: ${optionText(options.changedState || options.changedStates)}
- Upstream triggers: ${optionText(options.upstream || options.upstreamTriggers)}
- Downstream consumers: ${optionText(options.downstream || options.downstreamConsumers)}
- Adjacent/regression workflows: ${optionText(options.adjacent || options.adjacentWorkflows)}
- Failure/recovery behavior: ${optionText(options.failureRecovery || options.recovery)}
- Implementation responsibilities: ${optionText(options.implementationResponsibility || options.implementationResponsibilities)}
- Scenario walkthroughs: ${optionText(options.scenario || options.scenarios)}
- Scenario-specific evidence: ${optionText(options.experienceEvidence || options.evidenceNeeded)}

## Experience-Impact Closure

- Implemented and verified: ${optionText(options.implementedVerified)}
- Verified unaffected: ${optionText(options.verifiedUnaffected)}
- Deferred with rationale and human acceptance: ${optionText(options.deferredApproved)}
- Blocking impacts: ${optionText(options.blockingImpact || options.blockingImpacts)}

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

export function impactCheck(repo, options = {}) {
  const packet = options.packet || options.file || '';
  if (!packet) fail('Pass --packet <path>.');
  const fullPath = resolve(repo, packet);
  const text = readFileSync(fullPath, 'utf8');
  const task = text.match(/^Task:\s*(.+)$/m)?.[1]?.trim() || options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const required = /^- Required:\s*yes\s*$/im.test(text) || experienceImpactRequired({ task, route: options.route || 'standard', files, surfaces });
  const findings = impactPacketFindings(text, { required });
  const blocked = findings.filter((finding) => finding.required && finding.status === 'open');
  printObject({ packet: relative(repo, fullPath), result: blocked.length ? 'open' : 'ready', blocked: blocked.length });
  console.log('\n| Area | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const finding of findings) console.log(`| ${finding.area} | ${finding.status} | ${escapeCell(finding.detail)} |`);
  if (blocked.length) process.exitCode = 1;
}

export function impactPacketFindings(text = '', options = {}) {
  const required = options.required ?? /^- Required:\s*yes\s*$/im.test(text);
  if (!required) return [{ area: 'experience impact', status: 'ready', required: false, detail: 'not required for this non-behavioral route' }];

  const field = (label) => packetField(text, label);
  const requiredFields = [
    ['primary actor', 'Primary actor'],
    ['actor job', 'Actor job'],
    ['before workflow', 'Before workflow'],
    ['after workflow', 'After workflow'],
    ['changed state/data/feedback', 'Changed state/data/feedback'],
    ['upstream triggers', 'Upstream triggers'],
    ['downstream consumers', 'Downstream consumers'],
    ['adjacent/regression workflows', 'Adjacent/regression workflows'],
    ['failure/recovery behavior', 'Failure/recovery behavior'],
    ['implementation responsibilities', 'Implementation responsibilities'],
    ['scenario-specific evidence', 'Scenario-specific evidence'],
  ];
  const findings = requiredFields.map(([area, labels]) => {
    const values = (Array.isArray(labels) ? labels : [labels]).map(field).filter(isMeaningful);
    return { area, status: values.length ? 'ready' : 'open', required: true, detail: values.length ? values.join(' | ') : `missing ${area}` };
  });
  const status = field('Experience-impact status');
  findings.unshift({ area: 'experience-impact status', status: /^complete$/i.test(status) ? 'ready' : 'open', required: true, detail: status || 'missing status; set to complete only after closure' });
  const scenarios = field('Scenario walkthroughs').split('|').map((item) => item.trim()).filter(isMeaningful);
  findings.push({ area: 'scenario walkthroughs', status: scenarios.length >= 3 ? 'ready' : 'open', required: true, detail: scenarios.length >= 3 ? scenarios.join(' | ') : 'fewer than three scenarios; include happy, ambiguous/missing input, and failure/recovery or regression' });
  const deferred = field('Deferred with rationale and human acceptance');
  const deferredReady = !isMeaningful(deferred) || (/accept|approv/i.test(deferred) && /because|rationale|reason/i.test(deferred));
  if (!deferredReady) findings.push({ area: 'deferred impacts', status: 'open', required: true, detail: 'deferred impact must include rationale and explicit human acceptance' });
  const completed = [field('Implemented and verified'), field('Verified unaffected'), deferredReady ? deferred : ''].filter(isMeaningful);
  findings.push({ area: 'impact closure', status: completed.length ? 'ready' : 'open', required: true, detail: completed.length ? completed.join(' | ') : 'no impact item is closed' });
  const blocking = field('Blocking impacts');
  findings.push({ area: 'blocking impacts', status: isMeaningful(blocking) ? 'open' : 'ready', required: true, detail: isMeaningful(blocking) ? blocking : 'none recorded' });
  return findings;
}

function packetField(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.match(new RegExp(`^- ${escaped}:[ \\t]*([^\\r\\n]*)$`, 'im'))?.[1]?.trim() || '';
}

function optionText(value) {
  return splitList(value).join(' | ');
}

function isMeaningful(value) {
  return Boolean(value && !/^(none|n\/a|not applicable|unknown|open|tbd)$/i.test(value.trim()));
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
