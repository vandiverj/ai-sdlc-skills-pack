import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, escapeCell, fail, formatInlineList, formatList, printObject, readJsonIfExists, safeWriteTextFile, slug, splitList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { completionTrackedPacketKinds, firstMatch } from './packets.mjs';
import { matchRecipes } from './recipes.mjs';
import { inferDirtySurfaces, inferRouteFromTask, securityTriggers } from './routes.mjs';
import { classifyTouchedSurface, needsManualQa } from './surface.mjs';
import { affectedUnits, inferTestingSurfaces, matchesAny, qaModeForSurfaces } from './units.mjs';
import { artifactBudgetForRoute, formatArtifactBudget } from './artifacts.mjs';
import { qaScript } from './qa.mjs';

export function taskType(task) {
  const text = String(task || '').toLowerCase();
  if (matchesAny(text, ['bug', 'fix', 'regression', 'broken', 'failure'])) return 'bugfix';
  if (matchesAny(text, ['upgrade', 'package', 'dependency', 'maintenance'])) return 'maintenance';
  if (matchesAny(text, ['optimize', 'performance', 'speed'])) return 'optimization';
  if (matchesAny(text, ['release', 'handoff', 'push'])) return 'release/handoff';
  if (matchesAny(text, ['review', 'audit', 'inspect'])) return 'review';
  return 'feature/change';
}

export function taskRunId(task, options = {}) {
  return options.taskId || `${stamp()}-${slug(task || 'task')}`;
}

export function expectedQaNeed(task, files, profile = {}) {
  const text = `${task} ${profile.verificationMaturity || ''}`.toLowerCase();
  if (matchesAny(text, ['no automated tests', 'manual qa', 'youtrack', 'qa script'])) return 'human QA Markdown script expected';
  if (files.some(needsManualQa)) return 'likely human QA or manual smoke';
  if (matchesAny(text, ['docs', 'readme'])) return 'usually no QA script unless behavior is affected';
  return 'decide after impact packet';
}

export function taskLedgerRows(repo, packets) {
  const kinds = ['touched', 'impact', 'developer-verification', 'manual-smoke', 'qa-script', 'test-plan', 'data', 'integration', 'git-action'];
  return kinds.map((kind) => {
    const packet = packets.find((item) => item.kind === kind);
    return `| ${kind} | ${packet ? escapeCell(relative(repo, packet.path)) : 'missing'} | ${packet ? (completionTrackedPacketKinds().includes(kind) ? (packet.completed ? 'yes' : 'no') : 'n/a') : 'missing'} |`;
  });
}

export function proposedCommitMessage(files, impactPacket, options = {}) {
  const caseId = options.caseId || '';
  const prefix = caseId ? `${caseId}: ` : '';
  if (!caseId && requiresCaseId(options.profile || {})) return 'CASE ID REQUIRED: ask for the case identifier before suggesting a commit message';
  if (impactPacket?.text) {
    const task = firstMatch(impactPacket.text, /^Task:\s*(.+)$/m);
    if (task) {
      const message = task.length > 72 ? task.slice(0, 69).trimEnd() + '...' : task;
      return `${prefix}${message}`;
    }
  }
  const surfaces = dedupe(files.map(classifyTouchedSurface)).filter((item) => item !== 'source/other');
  if (surfaces.length === 1) return `${prefix}Update ${surfaces[0]}`;
  if (files.length) return `${prefix}Update task implementation`;
  return 'No tracked changes to commit';
}

export function taskCaseId(task, options = {}, profile = {}) {
  if (options.case || options.caseId) return options.case || options.caseId;
  const text = String(task || '');
  const match = text.match(/\b[A-Z][A-Z0-9]+[_-]\d+\b|\b[A-Z]{2,10}-\d+\b/);
  return match ? match[0] : profile.currentCaseId || '';
}

export function requiresCaseId(profile = {}) {
  return /^(true|yes|required)$/i.test(String(profile.requireCaseIdInCommitMessages || profile.requireCaseId || ''));
}

export function caseIdPolicy(profile = {}) {
  return requiresCaseId(profile) ? `required (${profile.commitMessageFormat || 'CASE_ID: concise summary'})` : 'optional unless task/profile requires it';
}

export function taskPreflight(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so preflight can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = deps.optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const triggers = securityTriggers(task, profile.values);
  const caseId = deps.taskCaseId(task, options, profile.values);
  const breadth = deps.taskBreadthAssessment(task, files, surfaces);
  const fast = deps.fastPassAssessment(repo, task, route, git, profile, units, surfaces, triggers);
  const quality = deps.qualityFloorRows({ task, git, route, units, surfaces, qaMode, profile, packets: deps.findPackets(repo, {}) });
  const budget = artifactBudgetForRoute(route, fast.eligible ? 'micro' : '');
  const confidence = deps.routeConfidence({ task, route, files, units, surfaces, profile, triggers });
  const next = fast.eligible ? `sdlc task fast-pass --task "${deps.escapeCommandArg(task)}"` : `sdlc route start ${route} --task "${deps.escapeCommandArg(task)}"`;
  const summary = {
    repository: repo,
    task,
    caseId: caseId || 'not provided',
    workClass: deps.taskType(task),
    route,
    confidence,
    fastPassEligible: fast.eligible ? 'yes' : 'no',
    taskBreadth: breadth.level,
    taskBreadthSignals: breadth.signals.join(', ') || 'none',
    affectedRepos: splitList(profile.values.relatedRepositories).join(', ') || 'primary repository only / unknown',
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    contextBuckets: dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)).join(', ') || 'not configured',
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    qaMode,
    artifactBudget: budget.name,
    nextAction: next,
  };

  if (!options.lock && !options.out) {
    printObject(summary);
    console.log('\n## Human Gates\n');
    console.log(formatList(deps.runStartGates(route, task, git, profile.values)));
    console.log('\n## Safe Defaults Assumed\n');
    console.log(formatList(deps.safeDefaultsForPreflight(route, fast, profile.values)));
    console.log('\n## Quality Floor\n');
    console.log(deps.formatQualityFloorTable(quality));
    console.log('\n## Fast-Pass Decision\n');
    console.log(formatList(fast.reasons));
    return;
  }

  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-preflight.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Task Preflight

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Case ID: ${caseId || 'not provided'}
Work class: ${deps.taskType(task)}
Route: ${route}
Classification confidence: ${confidence}
Fast-pass eligible: ${fast.eligible ? 'yes' : 'no'}
Task breadth: ${breadth.level}

## One-Screen Decision Summary

- Affected repos: ${splitList(profile.values.relatedRepositories).join(', ') || 'primary repository only / unknown'}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(surfaces)}
- QA mode: ${qaMode}
- Artifact budget: ${budget.name}
- Task breadth signals: ${formatInlineList(breadth.signals)}
- Security/tool triggers: ${triggers.length ? triggers.join('; ') : 'none detected'}
- Next action: ${next}

## Safe Defaults Assumed

${formatList(deps.safeDefaultsForPreflight(route, fast, profile.values))}

## Human Approval Gates

${formatList(deps.runStartGates(route, task, git, profile.values))}

## Quality Floor Checklist

${deps.formatQualityFloorTable(quality)}

## Artifact Budget

${formatArtifactBudget(budget)}

## Fast-Pass Assessment

${formatList(fast.reasons)}

## Confidence Summary

${deps.confidenceBlock({ proved: deps.preflightProved(route, units, surfaces, git), inferred: deps.preflightInferred(route, qaMode), human: deps.preflightHumanJudgment(fast, triggers), nextAction: next })}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function taskFastPass(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so fast-pass can be evaluated.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = deps.optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const triggers = securityTriggers(task, profile.values);
  const breadth = deps.taskBreadthAssessment(task, files, surfaces);
  const fast = deps.fastPassAssessment(repo, task, route, git, profile, units, surfaces, triggers);
  const budget = artifactBudgetForRoute(route, fast.eligible ? 'micro' : '');
  printObject({
    repository: repo,
    task,
    route,
    eligible: fast.eligible ? 'yes' : 'no',
    artifactBudget: budget.name,
    changedFiles: files.length,
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    taskBreadth: breadth.level,
    taskBreadthSignals: breadth.signals.join(', ') || 'none',
    nextAction: fast.eligible ? 'Proceed inline with one verification path and final confidence block.' : `Escalate to: sdlc task preflight --task "${deps.escapeCommandArg(task)}" --lock`,
  });
  console.log('\n## Decision Reasons\n');
  console.log(formatList(fast.reasons));
  console.log('\n## Minimum Evidence\n');
  console.log(formatArtifactBudget(budget));
}

export function taskStart(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task contract can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const modes = deps.detectWorkModes(repo, task, profile.values, git.changedFiles);
  const triggers = securityTriggers(task, profile.values);
  const related = splitList(profile.values.relatedRepositories);
  const caseId = deps.taskCaseId(task, options, profile.values);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-start.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Start Contract

Date: ${new Date().toISOString()}
Case ID: ${caseId || 'not provided'}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Suggested route: ${route}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Normalized Task Shape

- Task type: ${deps.taskType(task)}
- Work modes: ${formatInlineList(modes)}
- Affected repositories: ${related.length ? related.join(', ') : 'primary repository only / unknown'}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(testingSurfaces)}
- Deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}
- Expected QA need: ${deps.expectedQaNeed(task, git.changedFiles, profile.values)}
- Likely surfaces: ${formatInlineList(inferDirtySurfaces(task, git))}
- Verification maturity: ${deps.verificationMaturity(profile.values, commands)}
- Commit/push preference: human decision at finish; never automatic

## Constraints And Gates

${formatList(deps.runStartGates(route, task, git, profile.values))}

## Context To Check

\`\`\`bash
sdlc context freshness --task "${deps.escapeCommandArg(task)}"
sdlc context pack --task "${deps.escapeCommandArg(task)}"
sdlc change graph --task "${deps.escapeCommandArg(task)}"
\`\`\`

## Suggested Task Flow

\`\`\`bash
sdlc task ledger --task "${deps.escapeCommandArg(task)}"
sdlc unit detect --task "${deps.escapeCommandArg(task)}"
sdlc surface detect --task "${deps.escapeCommandArg(task)}"
sdlc touched packet
sdlc impact packet --task "${deps.escapeCommandArg(task)}"
sdlc verify packet --task "${deps.escapeCommandArg(task)}"
sdlc smoke packet --task "${deps.escapeCommandArg(task)}"
sdlc qa script --task "${deps.escapeCommandArg(task)}"
sdlc task finish --task "${deps.escapeCommandArg(task)}"
\`\`\`

## Security And Tool Triggers

${formatList(triggers)}
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function taskId(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." to generate a task id.');
  printObject({ repository: repo, task, taskId: deps.taskRunId(task, options) });
}

export function taskCurrent(repo, options = {}, deps = {}) {
  const packets = deps.findPackets(repo, {});
  const taskPackets = packets.filter((packet) => ['task-start', 'task-ledger', 'task-finish'].includes(packet.kind));
  const current = taskPackets[0] || packets[0];
  if (!current) {
    printObject({ repository: repo, currentTask: 'none', suggestedNextCommand: 'sdlc task open --task "..."' });
    return;
  }
  const task = deps.firstMatch(current.text, /^Task:\s*(.+)$/m);
  const git = getGitInfo(repo);
  const open = deps.finalGateOpenItems(repo, task, git, packets);
  printObject({
    repository: repo,
    currentPacket: relative(repo, current.path),
    currentKind: current.kind,
    task: task || 'not found',
    route: task ? inferRouteFromTask(task, git, loadProfile(repo).values) : current.route,
    changedFiles: git.changedFiles.length,
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: task ? (open[0] ? deps.suggestedFinalGateCommand(open[0], task) : `sdlc task review --task "${task}"`) : 'sdlc task open --task "..."',
  });
}

export function taskOpen(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task can be opened.');
  const outDir = options.outDir ? resolve(repo, options.outDir) : defaultRunsDir(repo);
  mkdirSync(outDir, { recursive: true });
  const taskSlug = deps.taskRunId(task, options);
  printObject({ repository: repo, task, taskId: taskSlug, action: 'opening task with start contract, context checks, change graph, and ledger' });
  taskStart(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-task-start.md`) }, deps);
  deps.contextFreshness(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-context-freshness.md`) });
  deps.contextContradictions(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-context-contradictions.md`) });
  deps.changeGraph(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-change-graph.md`) }, deps.graphSearchDependencies());
  taskLedger(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-task-ledger.md`) }, deps);
}

export function taskBundle(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task bundle can be scoped.');
  const outDir = options.outDir ? resolve(repo, options.outDir) : defaultRunsDir(repo);
  const taskSlug = deps.taskRunId(task, options);
  mkdirSync(outDir, { recursive: true });
  printObject({ repository: repo, task, taskId: taskSlug, action: 'bundling task evidence' });
  deps.touchedPacket(repo, { ...options, out: join(outDir, `${taskSlug}-touched-surface-ledger.md`) }, deps.changeImpactDependencies());
  deps.impactPacket(repo, { ...options, out: join(outDir, `${taskSlug}-impact-packet.md`) }, deps.changeImpactDependencies());
  deps.verifyPacket(repo, { ...options, out: join(outDir, `${taskSlug}-developer-verification-packet.md`) }, deps.verifyDependencies());
  deps.smokePacket(repo, { ...options, out: join(outDir, `${taskSlug}-manual-smoke-packet.md`) }, deps.smokeDependencies());
  qaScript(repo, { ...options, out: join(outDir, `${taskSlug}-qa-test-script.md`) }, deps.qaDependencies());
  taskLedger(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-task-ledger.md`), refresh: true }, deps);
}

export function taskStatus(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const open = deps.finalGateOpenItems(repo, task, git, packets);
  const metrics = deps.taskMetrics(repo, task, git, packets);
  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    route: task ? inferRouteFromTask(task, git, loadProfile(repo).values) : 'not provided',
    packets: packets.length,
    finalGate: open.length ? 'open' : 'ready with explicit human approval',
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: open[0] ? deps.suggestedFinalGateCommand(open[0], task) : 'sdlc task finish --task "..."',
  });
  console.log('\n## Metrics\n');
  console.log(formatList(Object.entries(metrics).map(([key, value]) => `${deps.humanize(key)}: ${value}`)));
}

export function taskReview(repo, options = {}, deps = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const open = deps.finalGateOpenItems(repo, task, git, packets);
  const latest = (kind) => deps.latestPacketPath(repo, packets, kind);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    route: task ? inferRouteFromTask(task, git, profile.values) : 'not provided',
    changedFiles: git.changedFiles.length,
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    testingSurfaces: testingSurfaces.join(', ') || 'service-behavior',
    finalGate: open.length ? 'open' : 'ready with explicit human approval',
    readyForQaHandoff: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no',
    readyToCommit: open.length ? 'no' : 'yes, with explicit human approval only',
    readyToPush: open.length ? 'no' : 'only with explicit human approval',
    mergeDeployRelease: 'forbidden by SDLC default; project-specific human process only',
  });
  console.log('\n## Evidence\n');
  console.log(formatList([
    `Task ledger: ${latest('task-ledger')}`,
    `Touched packet: ${latest('touched')}`,
    `Impact packet: ${latest('impact')}`,
    `Developer verification: ${latest('developer-verification')}`,
    `Manual smoke: ${latest('manual-smoke')}`,
    `QA script: ${latest('qa-script')}`,
    `Git packet: ${latest('git-action')}`,
  ]));
  console.log('\n## Open Gates\n');
  console.log(formatList(open));
  console.log('\n## Recommended Next Action\n');
  console.log(`- ${open[0] ? deps.suggestedFinalGateCommand(open[0], task) : 'sdlc task finish --task "..."'}`);
}

export function taskLedger(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task ledger can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Task Ledger

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route: ${route}
Status: ${git.status || 'clean'}

## Evidence Index

| Kind | Latest packet | Completed |
| --- | --- | --- |
${deps.taskLedgerRows(repo, packets).join('\n')}

## Context And Change Understanding

- Context freshness:
- Context pack:
- Change graph:
- Context update plan:

## Verification And QA

- Developer verification:
- Manual smoke:
- Human QA Markdown script:
- Test introduction plan:
- Render/browser evidence:
- Caps:

## Files Touched

${formatList(git.changedFiles)}

## Finish Decision

\`\`\`bash
sdlc task finish --task "${deps.escapeCommandArg(task)}"
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function taskVerify(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so task verification can be scoped.');
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  printObject({
    repository: repo,
    task,
    suggestedVerifyPacket: `sdlc verify packet --task "${task}"`,
    suggestedManualSmoke: `sdlc smoke packet --task "${task}"`,
    suggestedTestPlan: deps.shouldSuggestTestPlan(repo, task, git.changedFiles) ? `sdlc test plan --task "${task}"` : 'not required by detected surfaces',
    latestDeveloperVerification: deps.latestPacketPath(repo, packets, 'developer-verification'),
    latestManualSmoke: deps.latestPacketPath(repo, packets, 'manual-smoke'),
  });
}

export function taskQa(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so task QA can be scoped.');
  const packets = deps.findPackets(repo, {});
  printObject({
    repository: repo,
    task,
    suggestedQaScript: `sdlc qa script --task "${task}"`,
    latestImpactPacket: deps.latestPacketPath(repo, packets, 'impact'),
    latestQaScript: deps.latestPacketPath(repo, packets, 'qa-script'),
    note: 'QA scripts are Markdown for human testers and YouTrack paste-in; they do not assume AI use.',
  });
}

export function taskFinish(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the finish decision can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const open = deps.finalGateOpenItems(repo, task, git, packets);
  const metrics = deps.taskMetrics(repo, task, git, packets);
  const caseId = deps.taskCaseId(task, options, profile.values);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const proposedMessage = deps.proposedCommitMessage(git.changedFiles, packets.find((packet) => packet.kind === 'impact'), { caseId, profile: profile.values });
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-finish-decision.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Task Finish Decision

Date: ${new Date().toISOString()}
Case ID: ${caseId || 'not provided'}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Head: ${git.head || 'unknown'}
Route: ${route}
Status: ${git.status || 'clean'}

## Decision Summary

- Ready to commit: ${open.length ? 'no' : 'yes, with explicit human approval only'}
- Ready to push: ${open.length ? 'no' : 'only with explicit human approval'}
- Ready for QA handoff: ${packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no'}
- Merge/deploy/release: forbidden by SDLC default; project-specific human process only
- Suggested commit message: ${proposedMessage}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(inferTestingSurfaces(repo, task, git.changedFiles, profile))}
- Deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}

## Open Gates

${formatList(open)}

## Evidence Summary

${formatList(deps.taskEvidenceSummary(repo, packets))}

## Task Metrics

${formatList(Object.entries(metrics).map(([key, value]) => `${deps.humanize(key)}: ${value}`))}

## Human Approval Choices

- [ ] No action.
- [ ] Commit only.
- [ ] Commit and push.
- [ ] Generate/update QA handoff only.

## Next Commands

\`\`\`bash
${open.length ? deps.suggestedFinalGateCommand(open[0], task) : 'sdlc git packet'}
sdlc calibrate add --route ${route} --outcome "" --route-fit "" --caps "" --friction "" --process-change-proposed ""
\`\`\`

## Final Response Shape For Agent

- Ready to commit: ${open.length ? 'no' : 'yes, with explicit human approval only'}
- Ready to push: ${open.length ? 'no' : 'only with explicit human approval'}
- QA script ready: ${packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no'}
- Tests/checks run:
- Caps:
- Files changed: ${git.changedFiles.length}
- Recommended next action: ${open[0] ? deps.suggestedFinalGateCommand(open[0], task) : 'Ask human to choose no action / commit only / commit and push.'}

## Confidence Summary

${deps.confidenceBlock({
    proved: [`${git.changedFiles.length} changed file(s) observed`, `${packets.length} SDLC packet(s) available`, `route inferred as ${route}`],
    inferred: [`QA readiness is ${packets.some((packet) => packet.kind === 'qa-script') ? 'available' : 'not available'}`, `commit message proposal: ${proposedMessage}`],
    human: open.length ? open : ['choose no action / commit only / commit and push'],
    nextAction: open[0] ? deps.suggestedFinalGateCommand(open[0], task) : 'Ask human to choose finish action.',
  })}
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (open.length) process.exitCode = 1;
}

export function taskDoctor(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const open = deps.finalGateOpenItems(repo, task, git, packets);
  printObject({
    repository: repo,
    task,
    route: inferRouteFromTask(task, git, profile.values),
    changedFiles: git.changedFiles.length,
    recipes: matchRecipes(task, git, profile.values).map((recipe) => recipe.id).join(', ') || 'none',
    evidence: deps.taskEvidenceSummary(repo, packets).join('; ') || 'none',
    missing: open.join('; ') || 'none detected',
    qaReady: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no or not needed',
    nextDecision: open[0] || 'approve commit/push/handoff choice if satisfied',
    nextCommand: open[0] ? deps.suggestedFinalGateCommand(open[0], task) : 'sdlc finish packet --task "..."',
  });
}
