import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { escapeCell, formatInlineList, formatList, printObject, readJsonIfExists } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile, profileInit } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { detectPackageManager, detectStack } from './units.mjs';

export function health(repo, _options = {}, dependencies = {}) {
  const {
    completionTrackedPacketKinds,
    contextDocCandidates,
    findPackets,
    readCalibrationRows,
  } = dependencies;
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const related = splitList(profile.values.relatedRepositories);
  const checks = readinessChecks(repo, profile, commands, existingDocs, related);
  const packets = findPackets(repo, {});
  const calibrationRows = readCalibrationRows(repo, { allowMissing: true }).filter((row) => !row.parseError);
  const readinessScore = Math.round((checks.filter((item) => item.status === 'ready').length / checks.length) * 100);
  const openPackets = packets.filter((packet) => !packet.completed && completionTrackedPacketKinds().includes(packet.kind));

  printObject({
    repository: repo,
    readiness: `${readinessScore}%`,
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    packets: packets.length,
    openPackets: openPackets.length,
    calibrationRows: calibrationRows.length,
    relatedRepositories: related.length,
    recommendedNextCommand: openPackets.length ? `sdlc done check --route ${openPackets[0].route || openPackets[0].kind} --packet ${relative(repo, openPackets[0].path)}` : 'sdlc context pack --task "..."',
  });

  console.log('\n## Readiness Gaps\n');
  console.log(formatList(checks.filter((item) => item.status !== 'ready').map((item) => `${item.area}: ${item.fix}`)));
  console.log('\n## Open Packets\n');
  console.log(formatList(openPackets.map((packet) => `${relative(repo, packet.path)} (${packet.kind})`)));
}

export function processHealth(repo, options = {}, dependencies = {}) {
  const {
    completionTrackedPacketKinds,
    findPackets,
    formatCounts,
    groupCounts,
    learnedFlowCandidates,
    normalizeArray,
    processProposals,
    readCalibrationRows,
  } = dependencies;
  const rows = readCalibrationRows(repo, { ...options, allowMissing: true }).filter((row) => !row.parseError);
  const packets = findPackets(repo, {});
  const caps = groupCounts(rows.flatMap((row) => normalizeArray(row.caps)));
  const routeFit = groupCounts(rows.map((row) => row.routeFit).filter(Boolean));
  const openPackets = packets.filter((packet) => !packet.completed && completionTrackedPacketKinds().includes(packet.kind));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Process Health

Date: ${new Date().toISOString()}
Repository: ${repo}
Calibration rows: ${rows.length}
Packets: ${packets.length}
Open packets: ${openPackets.length}

## Repeated Caps

${formatCounts(caps)}

## Route Fit Signals

${formatCounts(routeFit)}

## Open Packets

${formatList(openPackets.map((packet) => `${packet.kind}: ${relative(repo, packet.path)}`))}

## Suggested Improvements

${formatList(processProposals(caps, routeFit, [], [], []))}

## Learned Flow Candidates

${formatList(learnedFlowCandidates(rows))}
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function setupDoctor(repo, options = {}, dependencies = {}) {
  const {
    contextDocCandidates,
    detectCiSystems,
    detectDeploySystems,
    detectTestFrameworks,
    setupFixPlan,
    sharedContextDetails,
    sharedContextReachability,
  } = dependencies;
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const related = splitList(profile.values.relatedRepositories);
  const checks = readinessChecks(repo, profile, commands, existingDocs, related);
  const gaps = checks.filter((item) => item.status !== 'ready');
  const profilePath = profile.path ? relative(repo, profile.path) : '.ai-local/sdlc-profile.md';
  const stack = detectStack(repo);
  const packageManager = detectPackageManager(repo);
  const testFrameworks = detectTestFrameworks(repo, packageJson);
  const ciSystems = detectCiSystems(repo);
  const deploySystems = detectDeploySystems(repo);

  const lines = [
    '# SDLC Setup Doctor',
    '',
    `Repository: ${repo}`,
    `Profile: ${profilePath}`,
    `Detected stack: ${stack.join(', ') || 'generic'}`,
    `Package manager: ${packageManager || 'not detected'}`,
    `Test framework hints: ${testFrameworks.join(', ') || 'not detected'}`,
    `CI hints: ${ciSystems.join(', ') || 'not detected'}`,
    `Deployment hints: ${deploySystems.join(', ') || 'not detected'}`,
    `Shared context reachable: ${sharedContextReachability(repo, profile.values)}`,
    '',
    '## Readiness Gaps',
    '',
    ...gaps.map((item) => `- ${item.area}: ${item.fix}`),
    ...(gaps.length ? [] : ['- none']),
    '',
    '## Suggested Profile Fields',
    '',
    'Copy or adapt these fields into the local SDLC profile. Keep personal paths and local evidence ignored unless the repo explicitly approves sharing a sanitized variant.',
    '',
    '```text',
    '- Rendered UI review command: npm run dev',
    '- Accessibility review policy: optional',
    '- Verification maturity: no automated tests / manual QA only / smoke tests / partial automated tests / mature CI',
    '- Release policy: local commit/push only after tests/build pass and human approval',
    '- Human approval gates: commit, push, dependency install, external service calls, destructive commands; merge/deploy/release actions are project-specific human processes',
    '- Approved tools: git, npm scripts, local browser/rendered inspection, SDLC helper',
    '- Blocked tools: credentialed production writes, destructive Git commands, dependency installs without approval',
    '- Sensitive data restrictions: no secrets, credentials, customer data, or private transcripts in tracked docs/evidence',
    '```',
    '',
    '## Stack Detection',
    '',
    ...stack.map((item) => `- ${item}`),
    ...(stack.length ? [] : ['- generic / no known stack markers detected']),
    '',
    '## Tooling Detection',
    '',
    `- Package manager: ${packageManager || 'not detected'}`,
    ...testFrameworks.map((item) => `- Test framework: ${item}`),
    ...(testFrameworks.length ? [] : ['- Test framework: not detected']),
    ...ciSystems.map((item) => `- CI: ${item}`),
    ...(ciSystems.length ? [] : ['- CI: not detected']),
    ...deploySystems.map((item) => `- Deploy/release indicator: ${item}`),
    ...(deploySystems.length ? [] : ['- Deploy/release indicator: not detected']),
    '',
    '## Shared Context Detection',
    '',
    ...sharedContextDetails(repo, profile.values),
    '',
    '## Useful Commands',
    '',
    '```bash',
    'sdlc readiness',
    'sdlc context restore',
    'sdlc context pack --task "..."',
    '```',
  ];

  if (options.fixPlan) {
    lines.push('', '## Fix Plan', '', ...setupFixPlan(gaps, profile.values, commands).map((item, index) => `${index + 1}. ${item}`));
  }

  console.log(lines.join('\n'));
}

export function setupBootstrap(repo, options = {}, dependencies = {}) {
  const { detectCiSystems, detectDeploySystems, detectTestFrameworks } = dependencies;
  mkdirSync(defaultRunsDir(repo), { recursive: true });
  const profilePath = join(repo, '.ai-local', 'sdlc-profile.md');
  const created = [];
  if (!existsSync(profilePath)) {
    profileInit(repo, { sharedContextRoot: options.sharedContextRoot || '' });
    created.push(relative(repo, profilePath));
  }

  for (const dir of ['.ai-local/sdlc-runs', '.ai-local/rendered']) {
    const path = join(repo, dir);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
      created.push(dir);
    }
  }

  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const stack = detectStack(repo);
  const setupPath = join(repo, '.ai-local', 'repository-setup.md');
  if (!existsSync(setupPath)) {
    const content = `# Repository Setup

Date: ${new Date().toISOString()}
Repository: ${repo}

## Detected Shape

- Stack: ${formatInlineList(stack)}
- Package manager: ${detectPackageManager(repo) || 'not detected'}
- Test frameworks: ${formatInlineList(detectTestFrameworks(repo, packageJson))}
- CI: ${formatInlineList(detectCiSystems(repo))}
- Deployment hints: ${formatInlineList(detectDeploySystems(repo))}

## Commands

- Test command: ${commands.test || 'not configured'}
- Build command: ${commands.build || 'not configured'}
- Lint/typecheck/format commands: ${commands.lint || 'not configured'}
- Rendered UI review command: ${commands.rendered || 'not configured'}

## Human-Controlled Boundaries

- Commit requires explicit human approval.
- Push requires explicit human approval.
- Merge/deploy/release/pipeline/file movement remains project-specific and human-controlled.
`;
    writeFileSync(setupPath, content, 'utf8');
    created.push(relative(repo, setupPath));
  }

  printObject({
    repository: repo,
    created: created.join(', ') || 'none; setup files already existed',
    recommendedNextCommand: 'sdlc setup doctor --fix-plan',
  });
}

export function doctorFull(repo, options = {}, dependencies = {}) {
  const { contextInventory, readiness } = dependencies;
  console.log('# SDLC Doctor Full\n');
  console.log('## Readiness\n');
  readiness(repo, options);
  console.log('\n## Setup Doctor\n');
  setupDoctor(repo, { ...options, fixPlan: true }, dependencies);
  console.log('\n## Context Inventory\n');
  contextInventory(repo, options);
  console.log('\n## Install Check\n');
  installCheck(repo, options, dependencies);
}

export function installCheck(repo, _options = {}, dependencies = {}) {
  const { agentsRoot } = dependencies;
  const profile = loadProfile(repo);
  const helperPath = join(agentsRoot, 'bin', 'sdlc');
  const checks = [
    ['Helper CLI', existsSync(helperPath), helperPath],
    ['Profile', Boolean(profile.path), profile.path || '.ai-local/sdlc-profile.md'],
    ['Local evidence directory', existsSync(defaultRunsDir(repo)), defaultRunsDir(repo)],
    ['Agent prompt docs', existsSync(join(agentsRoot, 'templates', 'docs', 'agents', 'sdlc-agent-prompts.md')), join(agentsRoot, 'templates', 'docs', 'agents', 'sdlc-agent-prompts.md')],
    ['Shared context configured', Boolean(profile.values.sharedContextRoot || profile.values.productContext || profile.values.repoContext), profile.values.sharedContextRoot || profile.values.productContext || profile.values.repoContext || 'not configured'],
  ];
  printObject({ repository: repo });
  console.log('\n| Check | Status | Detail |');
  console.log('| --- | --- | --- |');
  for (const [name, pass, detail] of checks) console.log(`| ${escapeCell(name)} | ${pass ? 'pass' : 'open'} | ${escapeCell(detail)} |`);
}


export function setupFixPlan(gaps, profile, commands) {
  const plan = [];
  const add = (item) => {
    const normalized = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!plan.some((existing) => existing.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === normalized)) plan.push(item);
  };
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) add('Configure shared/product/repo context paths in `.ai-local/sdlc-profile.md`, using external storage when multiple repos need the same context.');
  if (!commands.test) add('Add or record the narrowest reliable test command.');
  if (!commands.build) add('Add or record build/typecheck command when the repo can support it.');
  if (!profile.verificationMaturity) add('Record verification maturity so final gates can choose automated checks versus manual QA scripts.');
  if (!profile.releasePolicy) add('Record release policy and approval gates before using release packets for push/deploy work.');
  if (!profile.approvedTools && !profile.blockedTools) add('Record approved/blocked tools and sensitive-data restrictions.');
  for (const gap of gaps) {
    if (['context', 'commands', 'release', 'security'].includes(gap.area)) continue;
    add(gap.fix);
  }
  return plan;
}

export function readinessChecks(repo, profile, commands, existingDocs, related) {
  const values = profile.values;
  return [
    { area: 'context', status: profile.path ? 'ready' : 'missing', fix: 'create .ai-local/sdlc-profile.md with sdlc profile init' },
    { area: 'context', status: existingDocs.some((item) => item.label === 'AGENTS.md') ? 'ready' : 'partial', fix: 'add or update AGENTS.md with repo commands and conventions' },
    { area: 'context', status: values.sharedContextRoot || values.productContext || values.repoContext || values.productContextIndex ? 'ready' : 'partial', fix: 'configure shared/product/repo context paths when the repo participates in larger systems' },
    { area: 'commands', status: commands.test ? 'ready' : 'missing', fix: 'record a test command in the SDLC profile or package scripts' },
    { area: 'commands', status: commands.build ? 'ready' : 'partial', fix: 'record a build/typecheck command when applicable' },
    { area: 'commands', status: commands.rendered || !requiresRenderedReview(repo) ? 'ready' : 'partial', fix: 'record rendered UI review command/tool if the repo has visible UI' },
    { area: 'commands', status: values.verificationMaturity ? 'ready' : 'partial', fix: 'record verification maturity so final gates can choose automated checks versus manual QA scripts' },
    { area: 'release', status: values.releasePolicy || values.humanApprovalGates ? 'ready' : 'partial', fix: 'record release policy and human approval gates' },
    { area: 'security', status: values.approvedTools || values.blockedTools || values.sensitiveDataRestrictions ? 'ready' : 'partial', fix: 'record approved/blocked tools and sensitive data restrictions' },
    { area: 'security', status: values.ticketMcpAvailability || values.databaseMcpAvailability ? 'ready' : 'partial', fix: 'record optional ticket/database MCP availability or mark unavailable/blocked' },
    { area: 'multi-repo', status: related.length === 0 || values.serviceMap || values.productContextIndex ? 'ready' : 'partial', fix: 'add service map/product context index for related repositories' },
  ];
}

export function readinessStatus(checks, area) {
  const relevant = checks.filter((item) => item.area === area);
  if (!relevant.length) return 'unknown';
  if (relevant.every((item) => item.status === 'ready')) return 'ready';
  if (relevant.some((item) => item.status === 'missing')) return 'missing';
  return 'partial';
}

export function missingSetup(profile, commands) {
  const missing = [];
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) missing.push('no external/shared context paths configured');
  if (!commands.test) missing.push('no test command discovered');
  if (!commands.build) missing.push('no build command discovered');
  return missing;
}

export function formatCommandList(commands, route) {
  const selected = new Set(['test']);
  if (['standard', 'release-push', 'multi-repo-integration', 'ui-rendered-review', 'bugfix-live-system'].includes(route)) selected.add('build');
  if (route === 'ui-rendered-review') selected.add('rendered');
  if (route === 'release-push') selected.add('lint');
  const lines = Object.entries(commands)
    .filter(([key, command]) => command && (selected.has(key) || ['install', 'dev'].includes(key)))
    .map(([key, command]) => `- ${key}: \`${command}\``);
  return lines.length ? lines.join('\n') : '- none discovered';
}

export function groupCounts(values) {
  const counts = new Map();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function formatCounts(counts) {
  if (!counts.length) return '- none';
  return counts.map(([key, count]) => `- ${key}: ${count}`).join('\n');
}

export function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  return splitList(value);
}

function requiresRenderedReview(repo) {
  return existsSync(join(repo, 'src')) || existsSync(join(repo, 'app')) || existsSync(join(repo, 'pages'));
}

function splitList(value) {
  return String(value || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
