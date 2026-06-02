import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { dirname } from 'node:path';
import { dedupe, escapeCell, fail, formatInlineList, formatList, formatOptionList, printObject, printTable, safeWriteTextFile, slug, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { classifyTestingSurface, inferTestingSurfaces, matchesAny, qaModeForSurfaces } from './units.mjs';
import { externalEvidenceProfile } from './tools.mjs';

function optionFiles(options, fallback = []) {
  return options.files ? String(options.files).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean) : fallback;
}

export function primaryQaSteps(mode) {
  if (mode === 'interactive-stateful') {
    return `1. Start from the default or documented initial state.
   - Expected: The starting state, available controls, and instructions are visible.
2. Change the relevant setting/mode or complete the first step of the workflow.
   - Expected: The UI or tool clearly reflects the new state.
3. Complete the primary changed interaction path.
   - Expected: The user-visible feedback, animation/status/result, and saved/transient state match the task.
4. Use reset, back, retry, or an adjacent regression path.
   - Expected: The workflow recovers cleanly and nearby behavior still works.`;
  }
  if (mode === 'cli-workflow') {
    return `1. Run the primary changed command with QA-safe input.
   - Expected: Exit code, output, and side effects match the task.
2. Run help/version or a nearby existing command.
   - Expected: Existing command behavior remains stable.
3. Run an expected error or validation case.
   - Expected: The command fails safely with a clear message.`;
  }
  if (mode === 'background-job') {
    return `1. Trigger or dry-run the affected job in an approved non-production environment.
   - Expected: The job starts with expected inputs and no unexpected errors.
2. Inspect approved output, logs, queue state, files, or downstream observable behavior.
   - Expected: The job result matches the task.
3. Run or inspect the closest existing job path.
   - Expected: Existing job behavior remains stable.`;
  }
  if (mode === 'api-contract') {
    return `1. Open the Swagger/OpenAPI page or approved API client for the affected endpoint.
   - Expected: The endpoint is available in the target environment.
2. Send the request using the QA-safe payload listed in this ticket.
   - Expected: Expected status and response body match the task.
3. Confirm any observable side effect, such as saved data, returned state, or safe log evidence.
   - Expected: The API behavior matches the fixed or new behavior without unrelated errors.`;
  }
  if (mode === 'docs-process') {
    return `1. Open the changed documentation/process entry point.
   - Expected: The intended reader can find the changed information.
2. Follow links, commands, examples, or referenced paths.
   - Expected: They are current and match the source truth.
3. Check an adjacent existing instruction.
   - Expected: The change did not contradict nearby guidance.`;
  }
  if (mode === 'scenario-retest') {
    return `1. Open the named QA scenario in the target environment.
   - Expected: Preconditions and test data are available.
2. Execute the scenario steps listed in this ticket.
   - Expected: The previously failing or changed behavior now passes.
3. Run the nearest regression path for the same workflow.
   - Expected: Existing behavior still works.`;
  }
  if (mode === 'data-persistence') {
    return `1. Prepare QA-safe data that exercises the changed data path.
   - Expected: Preconditions match the ticket and do not use production-sensitive data.
2. Run the affected workflow/API/job that writes or reads the data.
   - Expected: Saved/returned data matches the expected result.
3. Confirm rollback/error behavior for invalid or edge-case data.
   - Expected: No corrupt, duplicate, or missing data is observed.`;
  }
  if (mode === 'integration-provider') {
    return `1. Confirm the provider/sandbox/test integration is available.
   - Expected: The external dependency can be tested safely.
2. Execute the changed integration path with QA-safe input.
   - Expected: Request, response, callback, export, or import behavior matches the ticket.
3. Check the nearest failure or retry path.
   - Expected: Errors are handled without duplicate or partial side effects.`;
  }
  if (mode === 'multi-repo-workflow') {
    return `1. Confirm all affected repositories/deployable units are present in the QA environment.
   - Expected: The environment build/version is known for each affected area.
2. Execute the full user/API/business workflow from entry point to final result.
   - Expected: The changed behavior works across system boundaries.
3. Regression-test the nearest old path that crosses the same boundary.
   - Expected: Existing cross-system behavior still works.`;
  }
  return `1. Navigate to the affected area.
   - Expected: The page/workflow loads without errors.
2. Perform the primary changed action.
   - Expected: The new or fixed behavior works as described in the task.
3. Refresh or revisit the affected area when persistence matters.
   - Expected: Data/state remains correct.`;
}

export function qaOutlineForMode(mode, task, files, surfaces, scope = []) {
  const fallbackScope = surfaces.map((surface) => `Validate ${surface} behavior.`);
  return {
    scope: dedupe([...(scope || []), ...fallbackScope, 'Validate the changed behavior described in the task.']).slice(0, 10),
    preconditions: ['QA environment/build identified.', 'Test account/data identified.', 'Feature flags/config noted when relevant.'],
    primary: primaryQaSteps(mode).split(/\r?\n/).filter((line) => /^\d+\./.test(line.trim())).map((line) => line.trim()),
    regression: ['Run the closest existing workflow using the same surface.', 'Check validation/error handling around the changed behavior.', 'Confirm no unrelated visible/API/job/data errors occur.'],
    caps: ['List unavailable environments, tools, provider sandboxes, test data, or developer-only checks.'],
  };
}

export function qaOutline(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const mode = options.mode || qaModeForSurfaces(surfaces, task);
  const outline = qaOutlineForMode(mode, task, files, surfaces, qaAreas(task, files));
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-outline.md`);
  const content = `# SDLC QA Outline

Task: ${task}
Mode: ${mode}
Testing surfaces: ${formatInlineList(surfaces)}

## In Scope

${formatList(outline.scope)}

## Preconditions

${formatList(outline.preconditions)}

## Primary Test

${formatList(outline.primary)}

## Regression Tests

${formatList(outline.regression)}

## Known Caps / Setup Notes

${formatList(outline.caps)}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function qaCompare(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = [];
  if (!deps.packetHas(text, ['## Preconditions'])) findings.push('Missing Preconditions section.');
  if (!deps.packetHas(text, ['## Test Cases', '### QA-001'])) findings.push('Missing primary test case section.');
  if (!deps.packetHas(text, ['Regression'])) findings.push('Missing regression coverage.');
  if (!deps.packetHas(text, ['Known Risks', 'Known Caps', 'Developer caps'])) findings.push('Missing caps/risks section.');
  if (!deps.packetHas(text, ['QA Completion'])) findings.push('Missing QA completion section.');
  printObject({ packet: relative(repo, packetPath), result: findings.length ? 'needs review' : 'ready-looking' });
  console.log(formatList(findings.length ? findings : ['No obvious QA structure gaps detected.']));
  if (findings.length) process.exitCode = 1;
}

export function qaModeCommand(repo, action, options = {}, rest = [], deps = {}) {
  if (action === 'scenario' && (rest[0] === 'list' || options.list)) return qaScenarioList(repo, options);
  if (action === 'scenario' && (rest[0] === 'show' || options.show)) return qaScenarioShow(repo, rest[1] || options.scenario || options.id, options);
  if (action === 'scenario' && (rest[0] === 'draft' || options.draft)) return qaScript(repo, { ...options, mode: 'scenario-retest' }, deps);
  const modeMap = {
    ui: 'ui-workflow',
    api: 'api-contract',
    data: 'data-persistence',
    integration: 'integration-provider',
    scenario: 'scenario-retest',
    multi: 'multi-repo-workflow',
    interactive: 'interactive-stateful',
    cli: 'cli-workflow',
    job: 'background-job',
    docs: 'docs-process',
  };
  return qaScript(repo, { ...options, mode: modeMap[action] || action }, deps);
}

export function qaScenarios(repo, command, options = {}) {
  if (command === 'init') return qaScenariosInit(repo, options);
  if (command === 'match') return qaScenariosMatch(repo, options);
  return qaScenarioList(repo, options);
}

export function qaScenarioList(repo, options = {}) {
  const scenarios = qaScenarioRecords(repo, options);
  if (!scenarios.length) {
    printObject({ repository: repo, scenarios: 0, note: 'No scenario library found. Configure profile qaScenarioLibrary or add .ai-local/qa-scenarios.md.' });
    return;
  }
  console.log('| ID | Title | Unit | Surface |');
  console.log('| --- | --- | --- | --- |');
  for (const scenario of scenarios) console.log(`| ${escapeCell(scenario.id)} | ${escapeCell(scenario.title)} | ${escapeCell(scenario.unit)} | ${escapeCell(scenario.surface)} |`);
}

export function qaScenarioShow(repo, id, options = {}) {
  if (!id) fail('Pass a scenario id.');
  const scenario = qaScenarioRecords(repo, options).find((item) => item.id.toLowerCase() === String(id).toLowerCase());
  if (!scenario) fail(`Scenario not found: ${id}`);
  printObject(scenario);
}

export function qaScenariosInit(repo, options = {}) {
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'qa-scenarios.md');
  if (existsSync(outPath) && !options.force) fail(`${relative(repo, outPath)} already exists. Pass --force to overwrite.`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# QA Scenario Library

Purpose: local scenario library for human QA Markdown generation. Keep product/client-sensitive scenarios local or external unless the repo approves a sanitized checked-in version.

## Primary Changed Workflow

ID: primary-changed-workflow
Unit:
Surface: ui/api/data/integration/scenario
Setup data:

### Steps

1. Prepare the QA environment and test user.
2. Run the changed workflow.
3. Confirm expected result and nearby regression path.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function qaScenariosMatch(repo, options = {}) {
  const task = String(options.task || '').toLowerCase();
  if (!task) fail('Pass --task "...".');
  const scenarios = qaScenarioRecords(repo, options);
  const matches = scenarios.filter((scenario) => {
    const haystack = `${scenario.id} ${scenario.title} ${scenario.unit} ${scenario.surface} ${scenario.body}`.toLowerCase();
    return task.split(/\s+/).filter((word) => word.length > 3).some((word) => haystack.includes(word));
  });
  printObject({ repository: repo, task: options.task, matches: matches.length });
  console.log(formatList((matches.length ? matches : scenarios.slice(0, 5)).map((scenario) => `${scenario.id}: ${scenario.title} (${scenario.surface || 'surface not set'})`)));
}

export function qaScript(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the QA test script can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const testingSurfaces = inferTestingSurfaces(repo, task, files, profile);
  const mode = options.mode || qaModeForSurfaces(testingSurfaces, task);
  const sourceHints = qaSourceHints(repo, options);
  const external = externalEvidenceProfile(profile.values);
  const ticketId = options.ticket || firstMatch(task, /\b([A-Z][A-Z0-9]+-\d+)\b/) || '';
  const scopeItems = dedupe([...qaAreas(task, files), ...sourceHints.scope]);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-test-script.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# QA Test Script: ${task}

QA Mode: ${mode}

## Summary

${qaSummaryForMode(mode)}

${ticketId || matchesAny(task.toLowerCase(), ['ticket', 'youtrack', 'yt-']) ? `Ticket: ${ticketId || 'provide ticket ID/link if available'}\n` : ''}This script is for human QA testers. It does not assume QA will use AI, inspect source code, run developer commands, or access database/ticket MCP tools.

## Scope

### In Scope

${formatList(scopeItems)}
${sourceHints.scope.length ? `\n### Source Packet Hints\n\n${formatList(sourceHints.scope)}` : ''}

### Out Of Scope

- Repository review and release decisions.
- Merge, deploy, release, or branch movement decisions.

## Environment

- Environment: QA
- Browser/device: ${mode === 'api-contract' ? 'not required unless API change is observable through UI' : ''}
- API client / Swagger:
- User role:
- Test account/data:
- Build/version/branch: ${git.branch || 'unknown'} / ${git.head || 'unknown'}

## Preconditions

- Required permissions:
- Required test data:
- Feature flags/config:
- External systems/sandbox availability:
${matchesAny(task.toLowerCase(), ['database', 'sql', 'data', 'db evidence', 'read-only database']) ? '- Database-backed evidence was developer-facing only; QA should validate observable UI/API/export behavior unless explicitly assigned developer testing.\n' : ''}

## Test Cases

### QA-001: Primary Changed Workflow

**Purpose:** Validate the main behavior changed by this task.

**Steps**
${primaryQaSteps(mode)}

**Result**
- Pass/Fail:
- Actual result:
- Notes:

### QA-002: Regression Check

**Purpose:** Ensure nearby existing behavior still works.

**Steps**
1. Run the closest existing workflow that uses the same page/API/data/integration.
   - Expected: Existing behavior still works.
2. Check validation/error handling for the affected area.
   - Expected: Errors are clear and no unexpected failures occur.

**Result**
- Pass/Fail:
- Actual result:
- Notes:

${qaDomainSections(task, files)}

${scenarioRetestSection(options)}

## Regression Checklist

- [ ] Changed workflow works.
- [ ] Existing nearby workflow still works.
- [ ] Permissions/roles behave correctly.
- [ ] Existing saved data displays correctly.
- [ ] Validation and error messages behave correctly.
- [ ] No unexpected page, API, or integration errors are visible to QA.

## Known Risks / Notes

- Touched surfaces: ${formatInlineList(dedupe(files.map(classifyQaTouchedSurface)))}
- Changed files: ${files.length}
- Verification maturity: ${profile.values.verificationMaturity || 'not configured'}
- Developer caps to communicate:
${sourceHints.risks.length ? formatList(sourceHints.risks) : '- none recorded'}

## Developer Verification Summary

- Developer/agent checks run:
- Ticket evidence: ${external.ticket.availability === 'available' ? 'available if route-selected; confirm drift before closeout' : `not assumed (${external.ticket.availability})`}
- Database evidence: ${external.database.availability === 'available' ? 'available if route-selected; summarize redacted evidence only' : `not assumed (${external.database.availability})`}
- Known verification caps:

## QA Completion

- QA status:
- QA tester:
- Date:
- Notes:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function qaComplete(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const status = options.status || '';
  if (!status) fail('Pass --status "draft|ready|blocked" so QA script readiness is explicit.');
  if (!['draft', 'ready', 'blocked'].includes(status)) fail('Use --status "draft", "ready", or "blocked".');

  const entry = `## QA Script Completion

Completed: ${new Date().toISOString()}
Status: ${status}
Ready for YouTrack paste: ${status === 'ready' ? 'yes' : 'no'}

### Remaining Gaps / Caps

${formatOptionList(options.caps)}

### Linked Evidence

- Impact packet: ${options.impact || ''}
- Touched packet: ${options.touched || ''}
- Developer verification packet: ${options.verify || ''}

### Notes

${options.notes || ''}
`;

  deps.appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

export function qaReview(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = qaReviewFindings(text);
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    result: findings.length ? 'needs review' : 'ready-looking',
  });
  console.log('\n## Findings\n');
  console.log(formatList(findings));
}

export function qaHandoff(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const recipes = deps.matchRecipes(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-handoff.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC QA Handoff

Task: ${task}
Case ID: ${deps.taskCaseId(task, options, profile.values) || 'not provided'}
Repository: ${repo}
Branch/build: ${git.branch || 'unknown'} / ${git.head || 'unknown'}

## Tester Instructions

- Environment:
- Test account/data:
- Steps:
- Expected result:
- Regression checks:

## Developer Validation Evidence

${formatList(deps.taskEvidenceSummary(repo, packets))}

## Recipe-Specific QA Notes

${formatList(recipes.flatMap((recipe) => recipe.qaAdditions))}

## Manual QA Ownership

- QA tester follows this Markdown manually.
- QA tester does not need AI, source-code access, or developer command knowledge.
- Developer owns any listed caps, setup notes, and environment limitations.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function qaBuild(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const mode = qaModeForSurfaces(surfaces, task);
  const outline = qaOutlineForMode(mode, task, files, surfaces);
  const lines = ['# QA Test Script', '', `Task: ${task}`, `Mode: ${mode}`, '', '## Preconditions', '', ...outline.preconditions.map((item) => `- ${item}`), '', '## Primary Test Steps', '', ...outline.primary, '', '## Regression Checks', '', ...outline.regression.map((item) => `- ${item}`), '', '## Caps Or Setup Gaps', '', ...outline.caps.map((item) => `- ${item}`), ''];
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${slug(task)}-qa-script.md`);
  safeWriteTextFile(repo, outPath, lines.join('\n'));
  console.log(relative(repo, outPath));
}

export function qaValidate(repo, options = {}) {
  const packet = options.packet || options.file || '';
  if (!packet) fail('Pass --packet <path>.');
  const full = resolve(repo, packet);
  const text = existsSync(full) ? readFileSync(full, 'utf8') : '';
  const findings = [];
  const sectionGroups = [
    { section: 'Preconditions', headings: ['Preconditions'] },
    { section: 'Primary Test Steps', headings: ['Primary Test Steps', 'Test Cases'] },
    { section: 'Regression Checks', headings: ['Regression Checks', 'Regression Checklist'] },
  ];
  for (const group of sectionGroups) {
    if (!group.headings.some((heading) => new RegExp(`##\\s+${heading}`, 'i').test(text))) {
      findings.push({ status: 'block', section: group.section, detail: `missing required QA section (${group.headings.join(' or ')})` });
    }
  }
  if (!/expected|confirm|verify|should/i.test(text)) findings.push({ status: 'warn', section: 'expected-results', detail: 'few explicit expected-result words detected' });
  if (!findings.length) findings.push({ status: 'pass', section: 'qa-script', detail: 'required structure present' });
  printTable(['Status', 'Section', 'Detail'], findings.map((item) => [item.status, item.section, item.detail]));
  if (findings.some((item) => item.status === 'block')) process.exitCode = 1;
}

function qaScenarioRecords(repo, options = {}) {
  const profile = loadProfile(repo);
  const candidates = [
    options.library ? resolve(repo, options.library) : '',
    profile.values.qaScenarioLibrary ? resolve(repo, profile.values.qaScenarioLibrary) : '',
    join(repo, '.ai-local', 'qa-scenarios.md'),
    join(repo, 'docs', 'qa-scenarios.md'),
  ].filter(Boolean);
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) return [];
  const text = readFileSync(path, 'utf8');
  const sections = text.split(/^##\s+/m).slice(1);
  return sections.map((section) => {
    const [titleLine, ...bodyLines] = section.split(/\r?\n/);
    const title = titleLine.trim();
    const body = bodyLines.join('\n');
    return {
      id: firstMatch(body, /^ID:[ \t]*(.+)$/m) || slug(title),
      title,
      unit: firstMatch(body, /^Unit:[ \t]*(.*)$/m) || '',
      surface: firstMatch(body, /^Surface:[ \t]*(.*)$/m) || '',
      path,
      body: body.trim(),
    };
  });
}

function qaSourceHints(repo, options = {}) {
  const hints = { scope: [], risks: [] };
  for (const key of ['fromImpact', 'impact']) {
    if (!options[key]) continue;
    const text = readPacketTextIfExists(repo, options[key]);
    hints.scope.push(...extractBulletsAfter(text, '## QA Coverage Areas'));
    hints.risks.push(...extractBulletsAfter(text, '## Risks, Unknowns, And Caps'));
  }
  for (const key of ['fromTouched', 'touched']) {
    if (!options[key]) continue;
    const text = readPacketTextIfExists(repo, options[key]);
    hints.scope.push(...extractTableColumn(text, 1).filter((item) => item && !['Surface', '---'].includes(item)).map((item) => `Validate touched surface: ${item}.`));
  }
  hints.scope = dedupe(hints.scope).slice(0, 12);
  hints.risks = dedupe(hints.risks).slice(0, 12);
  return hints;
}

function qaSummaryForMode(mode) {
  if (mode === 'api-contract') return 'Validate the changed API behavior through Swagger/OpenAPI, an approved API client, or documented request/response evidence. This Markdown is for human QA or developer-test handoff and does not assume QA will inspect source code or use AI.';
  if (mode === 'cli-workflow') return 'Validate the changed command-line behavior through command execution, help/version smoke, expected output, and error handling. This script is for human or developer-test handoff and should name exact commands when safe.';
  if (mode === 'background-job') return 'Validate the changed background job, queue, import/export, or scheduled process through a dry-run, sandbox execution, logs, output files, or explicit environment caps.';
  if (mode === 'data-persistence') return 'Validate the changed data behavior with QA-safe data setup, visible application/API evidence, and approved SQL/log checks when available. This script is for human testers and tracking-system paste-in.';
  if (mode === 'integration-provider') return 'Validate the provider or cross-system behavior through sandbox-safe requests, callbacks, exports/imports, or logs approved for QA. This script does not require source-code inspection.';
  if (mode === 'interactive-stateful') return 'Validate the changed interactive or stateful workflow, including setup, mode/settings changes, primary user path, feedback/animation, reset/recovery, and nearby regression behavior.';
  if (mode === 'multi-repo-workflow') return 'Validate the full tester-visible workflow that spans repositories or deployable units. The script should hide repository mechanics and focus on environment, steps, expected results, and release-order caps.';
  if (mode === 'docs-process') return 'Validate the documentation/process change by checking the intended reader path, links, examples, and whether current instructions match source truth.';
  if (mode === 'scenario-retest') return 'Validate the named QA/business scenario in the target environment and record pass/fail evidence for the tracking ticket.';
  return 'Validate the changed behavior for this task and regression-test the affected site/application areas. This Markdown is intended to be pasted into YouTrack and followed by human QA testers. It does not assume QA will use AI, inspect source code, run developer commands, or know the SDLC.';
}

function scenarioRetestSection(options = {}) {
  const scenario = options.scenario || options.case || '';
  if (!scenario) return '';
  return `### QA-Scenario: ${scenario}

**Purpose:** Retest the named business/QA scenario connected to this task.

**Steps**
1. Prepare the scenario-specific test data and user role.
   - Expected: Preconditions match the tracking ticket.
2. Execute the scenario from start to finish in QA/staging.
   - Expected: The scenario completes with the expected result.
3. Record environment, build/branch, and observed outcome.
   - Expected: The tracking ticket has enough detail for release review.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`;
}

export function qaAreas(task, files) {
  const areas = impactAreas(task, files);
  const checks = areas.map((area) => `Validate ${area}.`);
  if (files.some((file) => classifyTestingSurface(file) === 'package-tooling')) checks.push('Run a regression smoke path for dependency/package upgrade side effects.');
  if (!checks.length) checks.push('Validate the changed behavior described in the task.');
  return dedupe(checks);
}

export function impactAreas(task, files) {
  const text = String(task || '').toLowerCase();
  const surfaces = files.map(classifyTestingSurface);
  const areas = [];
  if (surfaces.includes('rendered-product-ui') || matchesAny(text, ['site', 'page', 'screen', 'ui', 'client', 'animation', 'game', 'turn', 'workflow', 'feature'])) areas.push('user-visible site/application workflow');
  if (surfaces.includes('api-contract') || surfaces.includes('service-behavior') || matchesAny(text, ['api', 'service', 'endpoint', 'swagger', 'openapi'])) areas.push('API/service behavior');
  if (surfaces.includes('data-persistence') || matchesAny(text, ['database', 'sql', 'data', 'storage'])) areas.push('data/storage behavior');
  if (surfaces.includes('integration-provider') || matchesAny(text, ['third party', 'third-party', 'vendor', 'webhook', 'integration'])) areas.push('external integration behavior');
  if (surfaces.includes('package-tooling') || matchesAny(text, ['package', 'dependency', 'upgrade'])) areas.push('dependency/package behavior');
  if (!areas.length) areas.push('task-specific behavior to identify during implementation');
  return dedupe(areas);
}

function qaDomainSections(task, files) {
  const text = String(task || '').toLowerCase();
  const surfaces = dedupe(files.map(classifyTestingSurface));
  const sections = [];

  if (surfaces.includes('rendered-product-ui') || matchesAny(text, ['ui', 'site', 'page', 'screen', 'workflow', 'react'])) {
    sections.push(`### QA-003: UI / Browser Workflow

**Purpose:** Validate the visible workflow from a tester's point of view.

**Steps**
1. Open the affected page or workflow in the QA environment.
   - Expected: The page loads without visible errors.
2. Complete the changed action in the most common browser/device combination.
   - Expected: The visible state, copy, animation, and success/error behavior match the expected change.
3. Repeat on one secondary viewport or browser when practical.
   - Expected: The layout remains usable and no text overlaps or controls disappear.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('api-contract') || surfaces.includes('service-behavior') || matchesAny(text, ['api', 'service', 'endpoint'])) {
    sections.push(`### QA-004: API-Backed Behavior

**Purpose:** Validate the user-visible result of the changed service/API path.

**Steps**
1. Perform the site/app action that calls the affected service, or use Swagger/OpenAPI/API client when this is an API-only surface.
   - Expected: The action succeeds and the result is correct.
2. Try a common validation or error case for the same action.
   - Expected: The site/app or API shows the expected error or fallback without an unexpected failure.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('data-persistence') || matchesAny(text, ['database', 'sql', 'data', 'stored procedure'])) {
    sections.push(`### QA-005: Data Persistence

**Purpose:** Validate that changed data behavior is correct with safe QA data.

**Steps**
1. Create or update QA-safe data through the affected workflow.
   - Expected: The workflow saves the expected data.
2. Refresh, revisit, or search for the same record.
   - Expected: The saved data displays correctly and existing related data is unchanged.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('integration-provider') || matchesAny(text, ['third-party', 'third party', 'webhook', 'integration', 'vendor'])) {
    sections.push(`### QA-006: External Integration Observable Result

**Purpose:** Validate the integration result that QA can observe.

**Steps**
1. Confirm the sandbox/provider/test configuration is available.
   - Expected: QA has the required non-production integration path or a documented cap.
2. Trigger the affected integration behavior.
   - Expected: The site/app records the expected result, message, status, or fallback.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('package-tooling') || matchesAny(text, ['package', 'dependency', 'upgrade'])) {
    sections.push(`### QA-007: Package / Maintenance Regression

**Purpose:** Smoke the most important workflows after a dependency or maintenance change.

**Steps**
1. Open the primary application page or startup workflow.
   - Expected: The application starts and loads normally.
2. Run one high-value existing workflow near the changed package/tooling area.
   - Expected: Existing behavior is unchanged.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  return sections.join('\n\n');
}

function qaReviewFindings(text) {
  const findings = [];
  const required = ['## Summary', '## Scope', '## Environment', '## Preconditions', '## Test Cases', '## Regression Checklist', '## Known Risks / Notes'];
  const isApiMode = /QA Mode:\s*api-contract/i.test(text);
  for (const heading of required) {
    if (!text.includes(heading)) findings.push(`Missing section: ${heading}.`);
  }
  if (!/Expected:/i.test(text)) findings.push('Expected results are missing or too sparse.');
  const developerOnlyLines = text
    .split(/\r?\n/)
    .filter((line) => /inspect source|developer-only|run npm|run git|run tests/i.test(line))
    .filter((line) => !/does not assume|do not|should not|out of scope/i.test(line));
  if (developerOnlyLines.length) findings.push('QA script may contain developer-only language; QA testers should follow site/app steps.');
  if (!isApiMode && /Browser\/device:\s*$/m.test(text)) findings.push('Browser/device field is blank.');
  if (isApiMode && /API client \/ Swagger:\s*$/m.test(text)) findings.push('API client / Swagger field is blank.');
  if (/Test account\/data:\s*$/m.test(text)) findings.push('Test account/data field is blank.');
  if (/Feature flags\/config:\s*$/m.test(text)) findings.push('Feature flags/config field is blank.');
  if (!isApiMode && /Navigate to the affected area/i.test(text)) findings.push('Step may be too vague: name the affected page/workflow when known.');
  if (isApiMode && !/Expected status|Expected response|Request payload/i.test(text)) findings.push('API QA script should include request payload and expected status/response.');
  return dedupe(findings);
}

function classifyQaTouchedSurface(file) {
  const surface = classifyTestingSurface(file);
  if (surface === 'rendered-product-ui') return 'frontend/UI';
  if (surface === 'api-contract' || surface === 'service-behavior') return 'backend/API';
  if (surface === 'data-persistence') return 'database/storage';
  if (surface === 'integration-provider') return 'external integration';
  if (surface === 'package-tooling') return 'dependencies';
  if (surface === 'docs-process') return 'docs/context';
  return surface || 'source/other';
}

function readPacketTextIfExists(repo, value) {
  const path = resolve(repo, value);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function extractBulletsAfter(text, heading) {
  if (!text) return [];
  const start = text.indexOf(heading);
  if (start < 0) return [];
  const rest = text.slice(start + heading.length);
  const end = rest.search(/\n## /);
  const section = end >= 0 ? rest.slice(0, end) : rest;
  return section.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim()).filter(Boolean);
}

function extractTableColumn(text, columnIndex) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|') && line.includes('|'))
    .map((line) => line.split('|').map((cell) => cell.trim())[columnIndex + 1])
    .filter(Boolean);
}

function firstMatch(text, pattern) {
  const match = String(text || '').match(pattern);
  return match ? match[1].trim() : '';
}
