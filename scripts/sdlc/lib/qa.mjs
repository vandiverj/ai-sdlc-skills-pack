import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { dedupe, fail, printTable, safeWriteTextFile, slug } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';

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
  for (const section of ['Preconditions', 'Primary Test Steps', 'Regression Checks']) if (!new RegExp(`##\\s+${section}`, 'i').test(text)) findings.push({ status: 'block', section, detail: 'missing required QA section' });
  if (!/expected|confirm|verify|should/i.test(text)) findings.push({ status: 'warn', section: 'expected-results', detail: 'few explicit expected-result words detected' });
  if (!findings.length) findings.push({ status: 'pass', section: 'qa-script', detail: 'required structure present' });
  printTable(['Status', 'Section', 'Detail'], findings.map((item) => [item.status, item.section, item.detail]));
  if (findings.some((item) => item.status === 'block')) process.exitCode = 1;
}
