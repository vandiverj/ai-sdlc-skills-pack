import { join, relative } from 'node:path';
import { appendControlJsonLine, escapeCommandArg, fail, printObject } from './common.mjs';
import { journalDir, upsertTaskJournal } from './journal.mjs';

export function overrideAdd(repo, options = {}) {
  const gate = options.gate || '';
  const reason = options.reason || '';
  const task = options.task || '';
  if (!gate || !reason) fail('Pass --gate <id> and --reason "...".');
  if (!task) fail('Pass --task "..." so the override is attached to a run journal.');
  const dir = journalDir(repo, task, options);
  const row = {
    schema: 'sdlc-override-v1',
    gate,
    reason,
    owner: options.owner || 'human',
    classification: classifyOverride(gate, reason),
    createdAt: new Date().toISOString(),
  };
  appendControlJsonLine(repo, join(dir, 'overrides.jsonl'), row);
  const journal = upsertTaskJournal(repo, task, {
    waivers: [`${gate}: ${reason}`],
    decisions: [`Override recorded for ${gate}: ${reason}`],
    nextRecommendedAction: `sdlc next --task "${escapeCommandArg(task)}"`,
  }, options);
  printObject({
    gate,
    classification: row.classification,
    journal: relative(repo, journal.paths.markdown),
    record: relative(repo, join(dir, 'overrides.jsonl')),
  });
}

function classifyOverride(gate, reason) {
  const text = `${gate} ${reason}`.toLowerCase();
  if (/approval|sensitive|secret|credential|destructive|delete|drop|deploy|merge|push|production/.test(text)) return 'requires-human-risk-acceptance';
  if (/evidence|test|verify|qa|cap/.test(text)) return 'evidence-cap';
  return 'process-override';
}
