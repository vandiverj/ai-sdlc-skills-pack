import { escapeCommandArg, fail, printObject } from './common.mjs';
import { inferMode } from './modes.mjs';
import { journalNextAction, printJournalNextAction, printTaskJournalStatus, upsertTaskJournal } from './journal.mjs';
import { analyzePrompt } from './prompt.mjs';
import { buildLocalFirstPlan } from './tools.mjs';

export function consoleHelp() {
  console.log(`# SDLC Developer Console

Use chat first when possible:

\`\`\`text
Use SDLC for this task: <task>. Determine scope, gather context, implement, verify, generate QA Markdown if needed, and stop before commit or push.
\`\`\`

Small CLI surface:

\`\`\`bash
sdlc console start --task "..."
sdlc console status --task "..."
sdlc console next --task "..."
sdlc console verify --task "..."
sdlc console qa --task "..."
sdlc console finish --task "..."
\`\`\`

The console writes and reads the canonical task run journal under .ai-local/sdlc-runs/<task-id>/.
Expert commands remain available for detailed packets, evidence, policy, learning, and diagnostics.
`);
}

export function consoleStart(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const mode = options.mode || inferMode(repo, task, options).mode;
  const promptAnalysis = analyzePrompt(task, repo, options);
  const localFirst = buildLocalFirstPlan(repo, task, options);
  const journal = upsertTaskJournal(repo, task, {
    route: options.route,
    mode,
    status: 'started',
    promptAnalysis,
    localFirst,
    decisions: [`Mode selected: ${mode}`],
    nextRecommendedAction: `sdlc next --task "${escapeCommandArg(task)}"`,
  }, options);
  printObject({
    repository: repo,
    task,
    mode,
    route: journal.route,
    journal: journal.paths.markdown,
    next: `sdlc next --task "${escapeCommandArg(task)}"`,
  });
}

export function consoleStatus(repo, options = {}) {
  printTaskJournalStatus(repo, options.task || '', options);
}

export function consoleNext(repo, options = {}, deps = {}) {
  const row = journalNextAction(repo, options.task || '', options, deps);
  printJournalNextAction(row);
}

export function consoleVerify(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = upsertTaskJournal(repo, task, {
    status: 'verification-needed',
    nextRecommendedAction: `sdlc verify ladder --task "${escapeCommandArg(task)}"`,
  }, options);
  printObject({
    repository: repo,
    task,
    journal: journal.paths.markdown,
    recommended: `sdlc verify ladder --task "${escapeCommandArg(task)}"`,
    fallback: `sdlc verify packet --task "${escapeCommandArg(task)}"`,
  });
}

export function consoleQa(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = upsertTaskJournal(repo, task, {
    status: 'qa-needed',
    qaImpact: 'human QA Markdown should be generated if changed behavior needs tester validation',
    nextRecommendedAction: `sdlc qa coverage --task "${escapeCommandArg(task)}"`,
  }, options);
  printObject({
    repository: repo,
    task,
    journal: journal.paths.markdown,
    recommended: `sdlc qa coverage --task "${escapeCommandArg(task)}"`,
    qaScript: `sdlc qa script --task "${escapeCommandArg(task)}"`,
  });
}

export function consoleFinish(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = upsertTaskJournal(repo, task, {
    status: 'finish-review',
    nextRecommendedAction: `sdlc finish-ready --task "${escapeCommandArg(task)}"`,
  }, options);
  printObject({
    repository: repo,
    task,
    journal: journal.paths.markdown,
    recommended: `sdlc finish-ready --task "${escapeCommandArg(task)}"`,
    note: 'Commit and push remain explicit human decisions.',
  });
}
