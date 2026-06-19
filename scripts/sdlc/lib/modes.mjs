import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { formatList, printObject } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { workspaceRepos } from './workspace.mjs';

export const modeDefinitions = {
  quick: 'Tiny safe change with minimal artifacts and one verification path.',
  normal: 'Default feature, bugfix, or maintenance workflow.',
  legacy: 'Weak/no automated tests, mixed old/new system, or manual smoke likely.',
  'multi-repo': 'More than one repo or deployable unit may be affected.',
  ticket: 'Ticket-centered work where acceptance criteria and QA handoff matter.',
  fixture: 'Validation fixture, approved pilot repository, or repo-local dry-run work.',
  sensitive: 'Production/client/data-sensitive work needing tighter context and approval boundaries.',
  exploratory: 'Research/spike work where implementation may not follow.',
};

export function inferMode(repo, task = '', options = {}) {
  const text = `${task} ${options.modeHint || ''}`.toLowerCase();
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const repoName = repo.toLowerCase();
  const related = String(profile.values.relatedRepositories || '');
  const reasons = [];
  let mode = 'normal';
  if (/fixture|validation app|pilot repo|pilot repository|dry-run fixture/.test(text)) {
    mode = 'fixture';
    reasons.push('fixture or pilot validation language detected');
  } else if (/prod|production|client|customer|database|sql|secret|token|credential|pii|sensitive/.test(text)) {
    mode = 'sensitive';
    reasons.push('sensitive data/system language detected');
  } else if (/yt-\d+|youtrack|ticket|case|qa/.test(text)) {
    mode = 'ticket';
    reasons.push('ticket or QA-centered language detected');
  } else if (/legacy|classic asp|no test|no automated|manual smoke|manual qa/.test(text)) {
    mode = 'legacy';
    reasons.push('legacy or weak-test language detected');
  } else if (/multi[- ]repo|cross[- ]repo|workspace|integration/.test(text) || related || workspaceRepos(repo, {}).length > 1) {
    mode = 'multi-repo';
    reasons.push('multi-repo/workspace signal detected');
  } else if (/research|spike|explore|investigate|prototype/.test(text)) {
    mode = 'exploratory';
    reasons.push('exploratory language detected');
  } else if (git.changedFiles.length <= 1 && /copy|typo|small|tiny|quick|style/.test(text)) {
    mode = 'quick';
    reasons.push('small-change language and tiny diff detected');
  } else reasons.push('default normal mode');
  return {
    mode,
    reasons,
    artifactBudget: mode === 'quick' ? 'minimal' : mode === 'sensitive' ? 'bounded-redacted' : 'standard',
    telemetryDefault: ['sensitive', 'quick'].includes(mode) ? 'off' : 'off unless explicitly enabled',
    contextCap: mode === 'quick' ? 'small' : mode === 'sensitive' ? 'sanitized-small' : 'phase-budgeted',
  };
}

export function modeDetect(repo, options = {}) {
  const result = inferMode(repo, options.task || '', options);
  printObject({
    repository: repo,
    task: options.task || 'not provided',
    mode: result.mode,
    artifactBudget: result.artifactBudget,
    telemetryDefault: result.telemetryDefault,
    contextCap: result.contextCap,
  });
  console.log('\n## Reasons\n');
  console.log(formatList(result.reasons));
}

export function modeExplain(repo, mode) {
  const key = mode || 'normal';
  printObject({
    mode: key,
    purpose: modeDefinitions[key] || 'Unknown mode. Use one of the listed modes.',
    knownModes: Object.keys(modeDefinitions).join(', '),
  });
}
