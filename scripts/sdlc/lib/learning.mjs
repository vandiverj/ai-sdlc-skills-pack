import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { appendControlJsonLine, dedupe, escapeCell, fail, formatInlineList, formatList, printObject, readJsonIfExists, readJsonLines, safeWriteJsonFile, safeWriteTextFile, slug, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { defaultRunsDir } from './paths.mjs';
import { loadProfile } from './profile.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';
import { inferTestingSurfaces } from './units.mjs';

export function learnCapture(repo, options = {}, deps = {}) {
  const summary = options.summary || '';
  if (!summary) fail('Pass --summary "..." so the learning can be captured.');
  const caseId = options.case || options.caseId || '';
  const agentsRoot = deps.agentsRoot || repo;
  const outPath = options.out ? resolve(repo, options.out) : join(agentsRoot, 'learnings', `${new Date().toISOString().slice(0, 10)}-${slug(caseId || summary)}-learning.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning: ${caseId || summary}

Date: ${new Date().toISOString().slice(0, 10)}
Case: ${caseId || 'not provided'}
Source repository: ${repo}
Privacy: ${options.privacy || 'sensitive-redacted'}

## Summary

${summary}

## Portable Process Lesson

-

## Product-Specific Durable Fact

-

## Sensitive / Redacted Detail

- Do not include secrets, credentials, customer data, private URLs, raw production logs, or unnecessary proprietary source details.

## Candidate Owner

- ${options.owner || 'skills-pack | project | template | tooling | external-context'}

## Validation Needed

-

## Promotion Guidance

- One high-cost miss may create a candidate.
- Three repeated similar events may promote a default rule after human review.
- Product-specific facts must not become global rules without redaction/generalization.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(process.cwd(), outPath));
}

export function learnQuick(repo, options = {}, deps = {}) {
  const summary = options.summary || '';
  if (!summary) fail('Pass --summary "..." so the learning can be captured quickly.');
  return learnCapture(repo, {
    ...options,
    summary,
    privacy: options.privacy || 'sensitive-redacted',
    owner: options.owner || 'unknown',
    source: options.source || 'unspecified',
  }, deps);
}

export function learnSanitize(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const buckets = sanitizeLearningBuckets(text);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learning-sanitization.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Sanitization

Date: ${new Date().toISOString()}
Source learning: ${relative(repo, packetPath)}
Result: ${findings.length ? 'blocked/pending review' : 'ready-looking'}

## Portable Process Lesson

${formatList(buckets.portable)}

## Product-Context Relocation

${formatList(buckets.product)}

## Blocked Sensitive Detail

${formatList(findings.length ? findings : buckets.sensitive)}

## Promotion Rule

- Portable process lessons may become \`.agents/learnings\` candidates.
- Product facts belong in repo/unit/shared external context.
- Sensitive details must be redacted before shared process promotion.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (findings.length) process.exitCode = 1;
}

export function learnSyncCheck(repo, options = {}, deps = {}) {
  const agentsRoot = deps.agentsRoot || repo;
  const learningDir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(learningDir) ? readdirSync(learningDir).filter((file) => file.endsWith('.md')).map((file) => join(learningDir, file)) : [];
  const status = git(agentsRoot, ['status', '--short', '--branch']);
  const unpushed = git(agentsRoot, ['log', '--oneline', '@{u}..HEAD']);
  const behind = git(agentsRoot, ['log', '--oneline', 'HEAD..@{u}']);
  const blocked = files.filter((file) => learningReviewFindings(readFileSync(file, 'utf8')).length);
  printObject({
    repository: agentsRoot,
    branchStatus: status.split(/\r?\n/)[0] || 'not a git repository',
    learningFiles: files.length,
    unpushedCommits: unpushed ? unpushed.split(/\r?\n/).length : 0,
    remoteCommitsNotPulled: behind ? behind.split(/\r?\n/).length : 0,
    sanitizationBlockedFiles: blocked.length,
  });
  console.log('\n## Blocked Learning Files\n');
  console.log(formatList(blocked.map((file) => relative(agentsRoot, file))));
}

export function learnReviewCycle(repo, options = {}, deps = {}) {
  const agentsRoot = deps.agentsRoot || repo;
  const since = options.since || '';
  const learningDir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(learningDir) ? readdirSync(learningDir).filter((file) => file.endsWith('.md')).map((file) => join(learningDir, file)) : [];
  const selected = since ? files.filter((file) => readFileSync(file, 'utf8').includes(since) || basename(file) >= since) : files;
  const rows = selected.map((file) => {
    const text = readFileSync(file, 'utf8');
    const findings = learningReviewFindings(text);
    return `| ${escapeCell(relative(agentsRoot, file))} | ${escapeCell(firstMatch(text, /^Privacy:\s*(.+)$/m) || 'unknown')} | ${findings.length ? 'blocked' : 'candidate'} | ${escapeCell(firstMatch(text, /^Case:\s*(.+)$/m) || '')} |`;
  });
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learning-review-cycle.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Review Cycle

Date: ${new Date().toISOString()}
Since: ${since || 'all'}
Learning directory: ${learningDir}

| Learning | Privacy | Review state | Case |
| --- | --- | --- | --- |
${rows.join('\n') || '| none |  |  |  |'}

## Promotion Levels

${formatList(['Level 0 raw local event', 'Level 1 sanitized shared learning', 'Level 2 reviewed candidate', 'Level 3 implementation plan', 'Level 4 process update', 'Level 5 stable pattern'])}

## Outcomes To Assign

- product context relocated
- process change implemented
- deferred with reason
- archived as not reusable
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function learnArchive(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const reason = options.reason || '';
  if (!reason) fail('Pass --reason "..." so the archive is explainable.');
  const archiveDir = options.archiveDir ? resolve(repo, options.archiveDir) : join(dirname(packetPath), 'archive');
  mkdirSync(archiveDir, { recursive: true });
  const archivedPath = join(archiveDir, basename(packetPath));
  const text = readFileSync(packetPath, 'utf8');
  writeFileSync(archivedPath, `${text.trimEnd()}\n\n## Archive Reason\n\n- ${reason}\n`, 'utf8');
  writeFileSync(packetPath, `# Archived SDLC Learning Pointer\n\nOriginal moved to: ${relative(repo, archivedPath)}\nReason: ${reason}\n`, 'utf8');
  console.log(relative(repo, archivedPath));
}

export function learnRoute(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const productSignals = deps.packetHas(text, ['Product-Specific Durable Fact', 'customer', 'client', 'production', 'private URL']);
  const route = findings.length
    ? 'sanitize-before-review'
    : productSignals
      ? 'split-product-context-and-process-learning'
      : 'process-learning-review';
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    route,
    reviewFindings: findings.length,
    recommendedNextCommand: findings.length ? `sdlc learn review --packet ${relative(repo, packetPath)}` : `sdlc learn promote --packet ${relative(repo, packetPath)} --target process`,
  });
  console.log('\n## Findings\n');
  console.log(formatList(findings.length ? findings : ['No blocking sanitization findings detected.']));
}

export function learnSummary(repo, options = {}, deps = {}) {
  const agentsRoot = deps.agentsRoot || repo;
  const dir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => join(dir, file)) : [];
  const rows = files.map((file) => {
    const text = readFileSync(file, 'utf8');
    return `| ${escapeCell(relative(dir, file))} | ${escapeCell(firstMatch(text, /^Privacy:\s*(.+)$/m) || 'unknown')} | ${escapeCell(learningReviewFindings(text).length ? 'needs review' : 'ready-looking')} |`;
  });
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Learning Summary

Date: ${new Date().toISOString()}
Learning directory: ${dir}

| Learning | Privacy | Review state |
| --- | --- | --- |
${rows.join('\n') || '| none |  |  |'}

## Promotion Thresholds

- One high-cost miss can create a candidate after human review.
- Three repeated similar events can promote a default route/template/tooling change.
- Product facts belong in repo/unit/shared external context, not global process rules.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function learnReview(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    result: findings.length ? 'needs review before promotion/share' : 'ready-looking',
  });
  console.log('\n## Findings\n');
  console.log(formatList(findings));
}

export function learnPromoteCheck(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const all = [...learningReviewFindings(text), ...learningPromotionFindings(text)];
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    result: all.length ? 'blocked-or-needs-review' : 'ready-for-human-promotion-review',
  });
  console.log('\n## Checks\n');
  console.log(formatList(all.length ? all : ['Sanitized summary, target bucket, evidence source, and review fields look present.']));
  if (all.length) process.exitCode = 1;
}

export function learnCandidates(repo, options = {}, deps = {}) {
  const agentsRoot = deps.agentsRoot || repo;
  const dir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => join(dir, file)) : [];
  const rows = files
    .map((file) => ({ file, text: readFileSync(file, 'utf8') }))
    .filter((item) => !options.since || item.text.includes(options.since) || basename(item.file) >= options.since)
    .map((item) => {
      const findings = [...learningReviewFindings(item.text), ...learningPromotionFindings(item.text)];
      return `| ${escapeCell(relative(agentsRoot, item.file))} | ${findings.length ? 'needs review' : 'candidate'} | ${escapeCell(firstMatch(item.text, /^Candidate Owner\s*-?\s*(.+)$/m) || firstMatch(item.text, /^Case:\s*(.+)$/m) || '')} |`;
    });
  console.log('| Learning | State | Owner/Case |');
  console.log('| --- | --- | --- |');
  console.log(rows.join('\n') || '| none |  |  |');
}

export function learnPromote(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const target = options.target || '';
  if (!target) fail('Pass --target "process|template|route|context" so promotion intent is explicit.');
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learning-promotion.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Promotion Packet

Date: ${new Date().toISOString()}
Source learning: ${relative(repo, packetPath)}
Target: ${target}
Review result: ${findings.length ? 'blocked/pending sanitization' : 'candidate ready for human review'}

## Findings Before Promotion

${formatList(findings)}

## Promotion Target

- process: update route recipes, router guidance, or helper CLI behavior.
- template: update generated docs, QA scripts, profile templates, or prompts.
- route: add or tune a route/overlay/scenario.
- context: move product-specific durable facts to repo/unit/shared external context.

## Human Review Required

- [ ] Sensitive details redacted.
- [ ] Product facts separated from portable process guidance.
- [ ] Validation evidence is enough for this target.
- [ ] Rollback/deprecation path is clear.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (findings.length) process.exitCode = 1;
}

export function learnSplit(repo, options = {}, deps = {}) {
  const packetPath = deps.resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(basename(packetPath, '.md'))}-learning-split.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Split

Source: ${relative(repo, packetPath)}

## Portable Process Lesson

${extractLearningSection(text, 'Portable Process Lesson') || extractLearningSection(text, 'Key Process Learnings') || 'Review and summarize reusable process-only lesson here.'}

## Product-Specific Durable Fact

${extractLearningSection(text, 'Product-Specific Durable Fact') || extractLearningSection(text, 'Durable Facts') || 'Move product/repo/workflow facts to repo/unit/shared context, not global process guidance.'}

## Sensitive / Redacted Detail

- Confirm no raw prompts, source snippets, ticket bodies, issue comments, private URLs, customer/client names, credentials, secrets, raw logs, row-level database data, or proprietary schema details are promoted.
- Keep issue IDs, table names, record IDs, tenant/customer identifiers, and query results out of shared .agents/learnings unless sanitized into a generalized process pattern.

## Candidate Owner

- process / template / route / context / ticket-intake-pattern / ticket-qa-pattern / database-diagnosis-pattern / database-redaction-pattern / external-evidence-capability-gap / parked
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function learnFromRun(repo, options = {}, deps = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the run learning review can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = deps.findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const recipes = deps.matchRecipes(task, git, profile.values);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const breadth = deps.taskBreadthAssessment(task, git.changedFiles, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-run-learning-review.md`);
  const content = `# SDLC Run Learning Review

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route: ${route}
Task breadth: ${breadth.level}
Testing surfaces: ${formatInlineList(surfaces)}
Recipes: ${formatInlineList(recipes.map((recipe) => recipe.id))}

## Evidence Signals

- Changed files: ${git.changedFiles.length}
- Packets found: ${packets.length}
- Breadth signals: ${formatInlineList(breadth.signals)}
- Current evidence: ${formatInlineList(deps.taskEvidenceSummary(repo, packets))}

## Review Prompts

1. Route fit: Did the selected route prevent the most likely expensive failure?
2. Context quality: Which repo/unit/shared context was missing, stale, or useful?
3. Validation surface: Was the strongest practical surface used, or was a cap recorded?
4. Tool availability: Did unavailable MCPs, browser, database, ticket, or runtime tools change the evidence path?
5. Developer friction: What slowed the developer down without improving product quality?
6. QA handoff: Could a human tester follow the Markdown without AI, source access, or developer command knowledge?
7. Kept-change fixture value: If this was a fixture app, did the final product improve in a way worth committing?
8. Portable process lesson: What generalized SDLC rule, helper, or template should be considered?

## Candidate Learning Split

### Portable Process Lesson

-

### Product-Specific Durable Fact

-

### Sensitive / Redacted Detail

- Confirm no raw ticket text, private URLs, customer data, secrets, raw logs, row-level database data, or proprietary schema details are promoted.

## Recommended Follow-Up

\`\`\`bash
sdlc learn split --packet ${relative(repo, outPath)}
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

export function learnBacklog(repo, options = {}, deps = {}) {
  const agentsRoot = deps.agentsRoot || repo;
  const root = join(agentsRoot, 'learnings');
  const files = existsSync(root) ? readdirSync(root).filter((file) => file.endsWith('.md')) : [];
  console.log('| Learning | Promotion state | Candidate implementation |');
  console.log('| --- | --- | --- |');
  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    const state = learningPromotionFindings(text).length ? 'needs review' : 'ready for review';
    const candidate = firstMatch(text, /^- Implementation candidate:\s*(.+)$/m) || firstMatch(text, /^Candidate implementation:\s*(.+)$/m) || 'not specified';
    console.log(`| ${file} | ${state} | ${escapeCell(candidate)} |`);
  }
}

export function learnSuggest(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task || '';
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task || 'current-task');
  const suggestions = learningSuggestionsFromRun(repo, runDir, task);
  printObject({ task: task || 'not provided', suggestions: suggestions.length });
  console.log(formatList(suggestions.length ? suggestions : ['No strong process-learning candidate detected from local run records.']));
}

export function learnExport(repo, options = {}) {
  const rows = readJsonLines(defaultLearningBacklogPath(repo)).map(sanitizePortableObject);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'sdlc-learnings.sanitized.json');
  safeWriteJsonFile(repo, outPath, { schema: 'sdlc-sanitized-learning-export-v1', exportedAt: new Date().toISOString(), rows });
  console.log(relative(repo, outPath));
}

export function learnImport(repo, options = {}) {
  if (!options.file) fail('Pass --file <path>.');
  const input = readJsonIfExists(resolve(repo, options.file));
  const rows = Array.isArray(input?.rows) ? input.rows : Array.isArray(input) ? input : [];
  const target = defaultLearningBacklogPath(repo);
  for (const row of rows) appendControlJsonLine(repo, target, { ...row, importedAt: new Date().toISOString(), importReviewRequired: true });
  console.log(`${rows.length} learning rows imported to ${relative(repo, target)}`);
}

function sanitizeLearningBuckets(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const portable = lines.filter((line) => /process improvement|run-sdlc|sdlc|route|qa|verification|context bucket|learning|checklist/i.test(line)).slice(0, 20);
  const product = lines.filter((line) => /durable fact|root cause|fix:|failure:|workflow:|route:|endpoint|table|column|repository|scenario/i.test(line)).slice(0, 20);
  const sensitive = lines.filter((line) => /secret|token|credential|customer|client|private url|raw log|production log|stack trace/i.test(line)).slice(0, 20);
  return {
    portable: portable.length ? portable : ['No portable process lesson extracted automatically; review manually.'],
    product: product.length ? product : ['No product-context relocation extracted automatically.'],
    sensitive: sensitive.length ? sensitive : ['No obvious sensitive detail found by simple scanner.'],
  };
}

function learningReviewFindings(text) {
  const findings = [];
  const required = ['## Summary', '## Portable Process Lesson', '## Product-Specific Durable Fact', '## Sensitive / Redacted Detail', '## Candidate Owner', '## Validation Needed'];
  for (const heading of required) if (!text.includes(heading)) findings.push(`Missing section: ${heading}.`);
  const sensitiveLines = text
    .split(/\r?\n/)
    .filter((line) => /password|secret|token|api key|credential|https?:\/\/[^\s)]+|production log|raw log|stack trace|customer|client/i.test(line))
    .filter((line) => !/do not include|redact|redacted|privacy|sensitive detail/i.test(line));
  if (sensitiveLines.some((line) => /password|secret|token|api key|credential/i.test(line))) findings.push('Potential secret/credential language found; redact before sharing.');
  if (sensitiveLines.some((line) => /https?:\/\/[^\s)]+/i.test(line))) findings.push('Private URL may be present; replace with a sanitized system label unless it is intentionally public.');
  if (sensitiveLines.some((line) => /production log|raw log|stack trace|customer|client/i.test(line))) findings.push('Potential sensitive product/client/log detail; confirm it is redacted or belongs in external product context.');
  if (!/Privacy:\s*(public|internal|sensitive-redacted)/i.test(text)) findings.push('Privacy classification should be public, internal, or sensitive-redacted.');
  return dedupe(findings);
}

function learningPromotionFindings(text) {
  const findings = [];
  if (!/##\s+Summary/i.test(text)) findings.push('Missing summary section.');
  if (!/##\s+Portable Process Lesson/i.test(text)) findings.push('Missing portable process lesson section.');
  if (!/##\s+Validation Needed/i.test(text)) findings.push('Missing validation-needed section.');
  const productSection = extractLearningSection(text, 'Product-Specific Durable Fact');
  if (/\b(client|customer|private url|production log|raw log|table|column|tenant)\b/i.test(productSection)) findings.push('Product-specific detail appears present; confirm relocation/redaction before global promotion.');
  if (!/Privacy:\s*(public|internal|sensitive-redacted)/i.test(text)) findings.push('Privacy classification should be public, internal, or sensitive-redacted.');
  return dedupe(findings);
}

function extractLearningSection(text, heading) {
  const pattern = new RegExp(`^##+\\s+${escapeRegExp(heading)}\\s*$([\\s\\S]*?)(?=^##+\\s+|\\z)`, 'im');
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function learningSuggestionsFromRun(repo, runDir, task) {
  const checks = readJsonLines(join(runDir, 'checks.jsonl'));
  const gates = readJsonLines(join(runDir, 'gates.jsonl'));
  const waivers = readJsonLines(join(runDir, 'waivers.jsonl'));
  const suggestions = [];
  if (checks.some((check) => ['sandbox-failure', 'tool-unavailable', 'tool-failure'].includes(check.status))) suggestions.push('Tooling/sandbox failures occurred; consider documenting runtime fallback or command classification guidance.');
  if (gates.filter((gate) => gate.status === 'block').length > 2) suggestions.push('Multiple blocking gates occurred; review whether preflight should expose these earlier.');
  if (waivers.length) suggestions.push('Waivers were used; review whether this is a repeated cap or a one-off environment limitation.');
  if (checks.some((check) => check.status === 'cap')) suggestions.push('Evidence caps were recorded; consider setup/profile changes if this repeats.');
  if (matchesAny(String(task || '').toLowerCase(), ['fixture', 'battle soccer'])) suggestions.push('Fixture validation used; split portable process lessons from product-specific game facts.');
  return dedupe(suggestions);
}

function git(repo, args) {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function matchesAny(text, needles) {
  return needles.some((needle) => String(text || '').includes(needle));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function firstMatch(text, pattern) {
  const match = String(text || '').match(pattern);
  return match ? match[1].trim() : '';
}

function sanitizePortableObject(value) {
  if (Array.isArray(value)) return value.map(sanitizePortableObject);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = sanitizePortableObject(item);
    return out;
  }
  if (typeof value !== 'string') return value;
  return sanitizeOneLine(value)
    .replace(/\/Users\/[^\s/]+/g, '/Users/[redacted]')
    .replace(/https?:\/\/[^\s)]+/gi, '[redacted-url]')
    .replace(/\b[A-Z]{1,10}-\d{1,8}\b/g, '[ticket-id]')
    .replace(/\b(?:client|customer|company|tenant)[-_ ]?[A-Za-z0-9]+\b/gi, '[redacted-entity]');
}

function defaultLearningBacklogPath(repo) {
  return join(repo, '.ai-local', 'sdlc-learning-backlog.jsonl');
}

function sanitizeOneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}
