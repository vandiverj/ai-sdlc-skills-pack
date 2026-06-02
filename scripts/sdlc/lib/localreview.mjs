import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { escapeCell, fail, formatList, printObject, printTable, safeWriteTextFile } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { discoverCommands } from './profile.mjs';
import { classifyTouchedSurface } from './surface.mjs';
import { inferContracts } from './routes.mjs';

export function reviewLocal(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const commands = discoverCommands(profile.values, readJson(repo, 'package.json'));
  const findings = localReviewFindings(repo, task, files, commands);
  if (options.json) {
    console.log(JSON.stringify({
      schema: 'sdlc-local-review-v1',
      task,
      repository: repo,
      branch: git.branch || '',
      status: git.status || '',
      changedFiles: files,
      surfaces: [...new Set(files.map(classifyTouchedSurface))],
      contracts: inferContracts(task, profile.values),
      findings,
    }, null, 2));
    if (findings.some((row) => row.severity === 'block')) process.exitCode = 1;
    return;
  }
  const content = `# SDLC Local Static Review

Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Changed Files

${formatList(files)}

## Surfaces

${formatList([...new Set(files.map(classifyTouchedSurface))])}

## Contracts

${formatList(inferContracts(task, profile.values))}

## Findings

| Severity | Finding | Suggested Local Action |
| --- | --- | --- |
${findings.map((row) => `| ${row.severity} | ${escapeCell(row.finding)} | ${escapeCell(row.action)} |`).join('\n')}
`;
  const outPath = options.out ? resolve(repo, options.out) : null;
  if (outPath) safeWriteTextFile(repo, outPath, content);
  console.log(content.trimEnd());
  if (outPath) console.log(`\nSaved: ${relative(repo, outPath)}`);
  if (findings.some((row) => row.severity === 'block')) process.exitCode = 1;
}

export function responseLint(repo, options = {}) {
  const file = options.file || '';
  if (!file) fail('Pass --file <path>.');
  const text = readFileSync(resolve(repo, file), 'utf8');
  const findings = responseLintFindings(text);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-response-lint-v1', file: relative(repo, resolve(repo, file)), result: lintResult(findings), findings }, null, 2));
    if (findings.some((row) => row.severity === 'block')) process.exitCode = 1;
    return;
  }
  printObject({ file: relative(repo, resolve(repo, file)), result: findings.length ? 'needs review' : 'ready-looking' });
  printTable(['Severity', 'Finding'], findings.length ? findings.map((row) => [row.severity, row.finding]) : [['record', 'No obvious final-response overclaim detected.']]);
  if (findings.some((row) => row.severity === 'block')) process.exitCode = 1;
}

export function humanReviewPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const git = getGitInfo(repo);
  const content = `# Human Review Packet

Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}

## What Changed

${formatList(git.changedFiles)}

## What To Review

${formatList([
  'Does the implementation match the requested behavior?',
  'Are local verification results or caps recorded?',
  'Is a tester-readable QA Markdown script needed and present?',
  'Are commit/push choices still waiting for human approval?',
])}

## Decisions Needed

${formatList([
  'Continue implementation',
  'Run more verification',
  'Prepare QA handoff',
  'Commit only',
  'Commit and push',
  'No git action',
])}
`;
  const outPath = options.out ? resolve(repo, options.out) : null;
  if (outPath) safeWriteTextFile(repo, outPath, content);
  console.log(content.trimEnd());
  if (outPath) console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function acceptanceCoverage(repo, options = {}) {
  const contract = options.contract || '';
  if (!contract) fail('Pass --contract <path>.');
  const text = readFileSync(resolve(repo, contract), 'utf8');
  const criteria = text.split(/\r?\n/).filter((line) => /^\s*(-|\d+\.)\s+/.test(line)).map((line) => line.replace(/^\s*(-|\d+\.)\s+/, '').trim()).filter(Boolean);
  const git = getGitInfo(repo);
  const rows = (criteria.length ? criteria : ['No bullet/numbered acceptance criteria detected.']).map((criterion) => ({
    criterion,
    implementation: git.changedFiles.length ? 'needs reviewer mapping to changed files' : 'no changed files detected',
    evidence: /test|verify|qa|expected/i.test(criterion) ? 'explicit evidence likely needed' : 'evidence mapping needed',
    qa: /user|tester|workflow|screen|api|data/i.test(criterion) ? 'QA step likely needed' : 'QA may be optional',
  }));
  const content = `# Acceptance Coverage

Contract: ${relative(repo, resolve(repo, contract))}

| Criterion | Implementation | Evidence | QA |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.criterion)} | ${row.implementation} | ${row.evidence} | ${row.qa} |`).join('\n')}
`;
  const outPath = options.out ? resolve(repo, options.out) : null;
  if (outPath) safeWriteTextFile(repo, outPath, content);
  console.log(content.trimEnd());
  if (outPath) console.log(`\nSaved: ${relative(repo, outPath)}`);
}

export function qaHumanLint(repo, options = {}) {
  const packet = options.packet || '';
  if (!packet) fail('Pass --packet <path>.');
  const text = readFileSync(resolve(repo, packet), 'utf8');
  const findings = qaHumanLintFindings(text);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-human-qa-lint-v1', packet: relative(repo, resolve(repo, packet)), result: lintResult(findings), findings }, null, 2));
    if (findings.some((row) => row.severity === 'block')) process.exitCode = 1;
    return;
  }
  printObject({ packet: relative(repo, resolve(repo, packet)), result: findings.length ? 'needs review' : 'ready-looking' });
  printTable(['Severity', 'Finding'], findings.length ? findings.map((row) => [row.severity, row.finding]) : [['record', 'No obvious human QA script issues detected.']]);
  if (findings.some((row) => row.severity === 'block')) process.exitCode = 1;
}

function responseLintFindings(text) {
  const findings = [];
  if (/tests? (pass|passed|green)/i.test(text) && !/(npm run|dotnet test|deno test|pytest|cargo test|sdlc verify)/i.test(text)) findings.push({ severity: 'warn', finding: 'Test pass claim without obvious command evidence.' });
  if (/committed|pushed/i.test(text) && !/human approval|approved/i.test(text)) findings.push({ severity: 'warn', finding: 'Commit/push claim should mention explicit human approval.' });
  if (/no issues|fully verified|complete/i.test(text) && /not run|unable|cap|could not/i.test(text)) findings.push({ severity: 'warn', finding: 'Completion language may conflict with caps or missing evidence.' });
  if (/merge|deploy|release/i.test(text) && !/do not|not performed|human/i.test(text)) findings.push({ severity: 'block', finding: 'Merge/deploy/release language needs explicit safety boundary.' });
  return findings;
}

function qaHumanLintFindings(text) {
  const findings = [];
  if (!/\b1\./.test(text)) findings.push({ severity: 'warn', finding: 'QA script should include numbered tester steps.' });
  if (!/expected/i.test(text)) findings.push({ severity: 'warn', finding: 'QA script should include expected results.' });
  if (/(ask the ai|use ai to|use an ai to|agent should|llm should|codex should|augment should)/i.test(text)) findings.push({ severity: 'block', finding: 'QA testers should not receive AI-agent instructions.' });
  if (/(npm run|dotnet test|git |sdlc )/i.test(text) && !/developer validation|not for qa testers/i.test(text)) findings.push({ severity: 'warn', finding: 'Developer-only commands should be moved out of QA tester steps or clearly labeled.' });
  return findings;
}

function lintResult(findings) {
  if (findings.some((row) => row.severity === 'block')) return 'block';
  if (findings.some((row) => row.severity === 'warn')) return 'warn';
  return 'pass';
}

function localReviewFindings(repo, task, files, commands) {
  const findings = [];
  if (!files.length) findings.push({ severity: 'record', finding: 'No changed files detected.', action: 'Use task/context review or inspect intended branch.' });
  if (files.some((file) => /package-lock|pnpm-lock|yarn.lock|package.json|\.csproj|\.sln|deno\.json/.test(file))) findings.push({ severity: 'warn', finding: 'Dependency/build metadata touched.', action: 'Run build/test where available and mention package risk.' });
  if (files.some((file) => /migration|schema|\.sql/i.test(file)) || /database|sql|migration/i.test(task)) findings.push({ severity: 'warn', finding: 'Data/schema surface detected.', action: 'Use read-only metadata/aggregate evidence or record approval/cap.' });
  if (files.some((file) => /openapi|swagger|proto|schema/i.test(file)) || /api|swagger|openapi/i.test(task)) findings.push({ severity: 'warn', finding: 'Public/API contract surface detected.', action: 'Validate contract/API client behavior; do not treat as rendered UI.' });
  if (!commands.test) findings.push({ severity: 'warn', finding: 'No discovered test command.', action: 'Use build/typecheck/manual smoke and consider foothold test.' });
  if (!commands.build) findings.push({ severity: 'record', finding: 'No discovered build command.', action: 'Use closest local deterministic check or configure profile.' });
  return findings.length ? findings : [{ severity: 'record', finding: 'No obvious local static risks detected.', action: 'Proceed to verification/review.' }];
}

function readJson(repo, path) {
  if (!existsSync(join(repo, path))) return null;
  try {
    return JSON.parse(readFileSync(join(repo, path), 'utf8'));
  } catch {
    return null;
  }
}
