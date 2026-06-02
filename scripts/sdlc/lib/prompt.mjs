import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { escapeCell, fail, formatList, printObject, printTable, readJsonIfExists, safeWriteTextFile, splitList } from './common.mjs';
import { loadTaskJournal, upsertTaskJournal } from './journal.mjs';
import { buildLocalFirstPlan, renderLocalFirstPlan } from './tools.mjs';

const BUILT_IN_CORRECTIONS = [
  ['implmentation', 'implementation', 'high'],
  ['implment', 'implement', 'high'],
  ['perofrm', 'perform', 'high'],
  ['sotrage', 'storage', 'high'],
  ['walid', 'validate', 'medium'],
  ['tess', 'tests', 'medium'],
  ['Tess', 'tests', 'medium'],
  ['STC', 'SDLC', 'medium'],
  ['seal line', 'CLI', 'medium'],
  ['get up', 'GitHub', 'medium'],
  ['QI review', 'UI review', 'medium'],
  ['ADPI', 'API', 'low'],
  ['manure repositories', 'newer repositories', 'low'],
];

export function promptClean(repo, options = {}) {
  const analysis = analyzePrompt(readPromptInput(repo, options), repo, options);
  console.log(analysis.cleanedPrompt);
  if (analysis.corrections.length) {
    console.log('\n## Suggested Corrections\n');
    printTable(['Original', 'Suggestion', 'Confidence'], analysis.corrections.map((row) => [row.original, row.suggestion, row.confidence]));
  }
}

export function promptStructure(repo, options = {}) {
  const analysis = analyzePrompt(readPromptInput(repo, options), repo, options);
  console.log(renderPromptAnalysis(analysis));
}

export function promptAudit(repo, options = {}) {
  const task = options.task || options.text || '';
  const analysis = analyzePrompt(readPromptInput(repo, options), repo, options);
  const outPath = options.out ? resolve(repo, options.out) : null;
  if (task) upsertTaskJournal(repo, task, { promptAnalysis: analysis }, options);
  if (options.json) {
    console.log(JSON.stringify(analysis, null, 2));
    if (outPath) safeWriteTextFile(repo, outPath, `${JSON.stringify(analysis, null, 2)}\n`);
    return;
  }
  const content = renderPromptAnalysis(analysis);
  if (outPath) safeWriteTextFile(repo, outPath, content);
  console.log(content.trimEnd());
  if (outPath) console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function promptScore(repo, options = {}) {
  const analysis = analyzePrompt(readPromptInput(repo, options), repo, options);
  const score = {
    score: analysis.score,
    ambiguityCount: analysis.ambiguities.length,
    contradictionCount: analysis.contradictions.length,
    riskTermCount: analysis.riskTerms.length,
    approvalCount: analysis.approvals.length,
    sensitivity: analysis.sensitivity,
  };
  if (options.json) {
    console.log(JSON.stringify(score, null, 2));
    return;
  }
  printObject({
    ...score,
    score: `${score.score}/100`,
  });
}

export function promptSanitize(repo, options = {}) {
  const analysis = analyzePrompt(readPromptInput(repo, options), repo, options);
  console.log(analysis.sanitizedPrompt);
  console.log('\nNote: sanitization is best-effort. Review before sharing outside the approved environment.');
}

export function promptCompile(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const journal = loadTaskJournal(repo, task, options);
  const analysis = journal.promptAnalysis || analyzePrompt(task, repo, options);
  const localFirst = journal.localFirst || buildLocalFirstPlan(repo, task, options);
  const mode = options.mode || (/brainstorm|idea|strategy/i.test(task) ? 'loose' : 'strict');
  const phase = options.phase || '';
  const role = options.role || '';
  const title = role ? `Role Prompt: ${role}` : `Phase Prompt: ${phase || 'current'}`;
  const content = `# SDLC ${title}

Mode: ${mode}
Task ID: ${journal.taskId || 'not started'}
Journal: ${journal.paths?.markdown ? relative(repo, journal.paths.markdown) : 'not started'}

## Original Human Prompt

${analysis.originalPrompt}

## Cleaned Prompt Suggestion

${analysis.cleanedPrompt}

## Intent And Constraints

- Intent: ${analysis.intent}
- Constraints: ${(analysis.constraints || []).join('; ') || 'none detected'}
- Approvals: ${(analysis.approvals || []).join('; ') || 'none detected'}
- Denials: ${(analysis.denials || []).join('; ') || 'none detected'}
- Done criteria: ${(analysis.doneCriteria || []).join('; ') || 'none detected'}

## Local-First Facts

${renderLocalFirstPlan(localFirst).trim()}

## Boundaries

- Do not merge, deploy, release, or push unless explicitly approved.
- Treat model reasoning as judgment until backed by local evidence, human approval, or accepted caps.
- Keep context bounded; link artifacts instead of pasting large files.
`;
  const outPath = options.out ? resolve(repo, options.out) : null;
  if (outPath) safeWriteTextFile(repo, outPath, content);
  console.log(content.trimEnd());
  if (outPath) console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function analyzePrompt(text, repo = process.cwd(), options = {}) {
  const originalPrompt = String(text || '').trim();
  const dictionary = loadDictionary(repo);
  const corrections = findCorrections(originalPrompt, dictionary);
  const cleanedPrompt = applyHighConfidenceCorrections(originalPrompt, corrections);
  const lower = originalPrompt.toLowerCase();
  const approvals = [];
  const denials = [];
  if (/\bcommit\b/i.test(originalPrompt)) approvals.push('commit may be in scope only with explicit final approval');
  if (/\bpush\b/i.test(originalPrompt)) approvals.push('push mentioned; final action still requires explicit approval');
  if (termPattern(['do not push', 'no push', "don't push"]).test(originalPrompt)) denials.push('do not push');
  if (termPattern(['do not merge', 'no merge', "don't merge"]).test(originalPrompt)) denials.push('do not merge');
  if (termPattern(['do not deploy', 'no deploy', "don't deploy"]).test(originalPrompt)) denials.push('do not deploy');
  if (termPattern(['read-only', 'readonly']).test(originalPrompt)) approvals.push('read-only evidence only where applicable');
  const riskTerms = extractMatches(lower, ['production', 'prod', 'database', 'sql', 'migration', 'deploy', 'package', 'dependency', 'third party', 'third-party', 'auth', 'security', 'customer', 'client', 'soc', 'payment']);
  const entities = extractEntities(originalPrompt);
  const constraints = [
    ...denials,
    ...extractMatches(lower, ['markdown', 'qa', 'manual tester', 'read-only', 'global', 'repo-local', 'multi-repo', 'multiple repositories']),
  ];
  const doneCriteria = extractDoneCriteria(originalPrompt);
  const ambiguities = [];
  if (!doneCriteria.length) ambiguities.push('Done criteria are not explicit.');
  if (/qa/i.test(originalPrompt) && !/markdown|script|tester|test case/i.test(originalPrompt)) ambiguities.push('QA output type is not explicit.');
  if (termPattern(['database', 'sql']).test(originalPrompt) && !termPattern(['read-only', 'readonly', 'aggregate', 'metadata', 'approved']).test(originalPrompt)) ambiguities.push('Database evidence boundary may need approval.');
  if (termPattern(['qa']).test(originalPrompt) && !termPattern(['ui', 'api', 'data', 'workflow', 'tester', 'manual', 'script', 'youtrack']).test(originalPrompt)) ambiguities.push('QA testing surface is not explicit.');
  const contradictions = detectContradictions(originalPrompt, approvals, denials);
  const sensitivity = riskTerms.some((term) => ['production', 'prod', 'database', 'sql', 'customer', 'client', 'soc', 'payment'].includes(term)) ? 'sensitive-review-needed' : 'normal';
  const score = promptQualityScore({ originalPrompt, doneCriteria, ambiguities, contradictions, entities, approvals, denials });
  return {
    schema: 'sdlc-prompt-analysis-v1',
    originalPrompt,
    cleanedPrompt,
    sanitizedPrompt: sanitizePrompt(cleanedPrompt),
    corrections,
    intent: inferIntent(cleanedPrompt),
    entities,
    constraints: [...new Set(constraints)],
    approvals,
    denials,
    riskTerms,
    ambiguities,
    contradictions,
    sensitivity,
    doneCriteria,
    score,
  };
}

export function renderPromptAnalysis(analysis) {
  return `# SDLC Prompt Analysis

## Original Prompt

${analysis.originalPrompt || 'not provided'}

## Cleaned Prompt Suggestion

${analysis.cleanedPrompt || 'not provided'}

## Intent

${analysis.intent || 'unknown'}

## Entities

${formatList((analysis.entities || []).map((entity) => `${entity.kind}: ${entity.value}`))}

## Constraints

${formatList(analysis.constraints || [])}

## Approvals

${formatList(analysis.approvals || [])}

## Denials

${formatList(analysis.denials || [])}

## Risk Terms

${formatList(analysis.riskTerms || [])}

## Ambiguities

${formatList(analysis.ambiguities || [])}

## Contradictions

${formatList(analysis.contradictions || [])}

## Sensitivity

${analysis.sensitivity || 'unknown'}

## Done Criteria

${formatList(analysis.doneCriteria || [])}

## Score

${analysis.score}/100
`;
}

function readPromptInput(repo, options) {
  if (options.file) return readFileSync(resolve(repo, options.file), 'utf8');
  if (options.text) return options.text;
  if (options.task) return options.task;
  fail('Pass --text "...", --file <path>, or --task "...".');
}

function loadDictionary(repo) {
  const globalPath = join(process.env.HOME || '', '.agents', 'dictionaries', 'global.json');
  const localPath = join(repo, '.ai-local', 'sdlc-dictionary.json');
  const entries = [];
  for (const path of [globalPath, localPath]) {
    const data = existsSync(path) ? readJsonIfExists(path) : null;
    const values = data?.corrections || data?.entries || [];
    if (Array.isArray(values)) {
      for (const row of values) entries.push(row);
    } else {
      for (const row of splitList(values)) entries.push(row);
    }
  }
  return entries;
}

function findCorrections(text, dictionary = []) {
  const rows = BUILT_IN_CORRECTIONS.map(([original, suggestion, confidence]) => ({ original, suggestion, confidence }));
  for (const item of dictionary) {
    if (typeof item === 'string' && item.includes('=')) {
      const [original, suggestion] = item.split('=');
      rows.push({ original: original.trim(), suggestion: suggestion.trim(), confidence: 'local-dictionary' });
    } else if (item && typeof item === 'object' && item.original && item.suggestion) {
      rows.push({
        original: String(item.original).trim(),
        suggestion: String(item.suggestion).trim(),
        confidence: item.confidence || 'local-dictionary',
        scope: item.scope || 'local',
        notes: item.notes || '',
      });
    }
  }
  return rows.filter((row) => safeCorrectionPattern(row.original).test(text));
}

function applyHighConfidenceCorrections(text, corrections) {
  let out = text;
  for (const row of corrections) {
    if (!['high', 'local-dictionary'].includes(row.confidence)) continue;
    out = out.replace(safeCorrectionPattern(row.original, 'g'), row.suggestion);
  }
  return out;
}

function sanitizePrompt(text) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[redacted-ip]')
    .replace(/\b(?:token|secret|password|apikey|api_key)\s*[:=]\s*\S+/gi, '[redacted-secret]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted-identifier]');
}

function extractMatches(text, terms) {
  return terms.filter((term) => termPattern([term]).test(text));
}

function extractEntities(text) {
  const entities = [];
  for (const value of text.match(/\b[A-Z]{2,10}-\d+\b/g) || []) entities.push({ kind: 'ticket', value });
  for (const value of text.match(/(?:^|\s)([\w./-]+\.(?:js|mjs|ts|tsx|cs|vb|asp|json|md|yml|yaml|sql|sln|csproj))/g) || []) entities.push({ kind: 'file', value: value.trim() });
  for (const value of text.match(/\b(?:npm run [\w:-]+|dotnet test|dotnet build|deno task [\w:-]+|sdlc [\w:-]+)/g) || []) entities.push({ kind: 'command', value });
  for (const value of text.match(/\b(?:GitHub|GitLab|YouTrack|Swagger|OpenAPI|MCP|Augment|Auggie|Codex)\b/gi) || []) entities.push({ kind: 'tool', value });
  return entities;
}

function extractDoneCriteria(text) {
  const criteria = [];
  if (/implement|develop|add|fix|improve/i.test(text)) criteria.push('Requested implementation/change is completed.');
  if (/test|verify|validate/i.test(text)) criteria.push('Verification evidence is captured or capped.');
  if (/qa|tester|youtrack/i.test(text)) criteria.push('Human QA Markdown script/notes are ready when needed.');
  if (/commit/i.test(text)) criteria.push('Commit only after explicit human approval.');
  if (/push/i.test(text)) criteria.push('Push only after explicit human approval.');
  return criteria;
}

function inferIntent(text) {
  if (/brainstorm|think|recommend|suggest/i.test(text)) return 'explore and recommend process improvements';
  if (/implement|develop|add|fix/i.test(text)) return 'implement requested change with SDLC evidence';
  if (/review|audit/i.test(text)) return 'review current state and produce findings';
  if (/validate|test|verify/i.test(text)) return 'validate behavior and collect evidence';
  return 'complete the requested SDLC task';
}

function detectContradictions(text, approvals, denials) {
  const rows = [];
  if (/\bpush\b/i.test(text) && denials.includes('do not push')) rows.push('Push is mentioned while push is denied; treat as no-push unless human later approves.');
  if (/\bmerge\b/i.test(text) && denials.includes('do not merge')) rows.push('Merge is mentioned while merge is denied; do not merge.');
  if (/\bdeploy\b/i.test(text) && denials.includes('do not deploy')) rows.push('Deploy is mentioned while deploy is denied; do not deploy.');
  if (/\b(push|merge|deploy|release)\b/i.test(text) && !approvals.length && !denials.length) rows.push('Git/release action is mentioned but final approval is not explicit.');
  return rows;
}

function promptQualityScore({ originalPrompt, doneCriteria, ambiguities, contradictions, entities, approvals, denials }) {
  let score = 55;
  if (originalPrompt.length > 20) score += 10;
  if (doneCriteria.length) score += 15;
  if (entities.length) score += 8;
  if (approvals.length || denials.length) score += 7;
  score -= Math.min(25, ambiguities.length * 8);
  score -= Math.min(20, contradictions.length * 10);
  return Math.max(0, Math.min(100, score));
}

function termPattern(terms) {
  return new RegExp(`(^|[^a-z0-9])(${terms.map(escapeRegExp).join('|')})([^a-z0-9]|$)`, 'i');
}

function safeCorrectionPattern(value, flags = 'i') {
  return new RegExp(`(?<![\\w./-])${escapeRegExp(value)}(?![\\w./-])`, flags);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
