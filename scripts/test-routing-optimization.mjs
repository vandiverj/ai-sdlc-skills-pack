#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const sdlc = resolve(repoRoot, 'scripts', 'sdlc', 'sdlc.mjs');
const failures = [];

function runJson(args, expectFailure = false) {
  try {
    const output = execFileSync('node', [sdlc, ...args], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (expectFailure) failures.push(`${args.join(' ')}: expected failure but command passed.`);
    return JSON.parse(output);
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : '';
    if (!expectFailure) {
      failures.push(`${args.join(' ')}: command failed: ${error.stderr || error.message}`);
      return {};
    }
    try {
      return JSON.parse(stdout);
    } catch {
      failures.push(`${args.join(' ')}: failed command did not return JSON.`);
      return {};
    }
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const fastPass = runJson(['route', 'fast-pass', '--task', 'fix README typo', '--files', 'README.md', '--json']);
assert(fastPass.schema === 'sdlc.fast_pass.v1', 'fast-pass schema mismatch.');
assert(fastPass.eligible === true, 'README typo should be fast-pass eligible.');
assert(fastPass.delegation === 'none', 'fast-pass should suppress delegation.');
assert((fastPass.requiredChecks || []).includes('git diff --check'), 'fast-pass should require git diff --check.');

const blocked = runJson(['route', 'fast-pass', '--task', 'deploy database migration', '--files', 'migrations/001.sql', '--json'], true);
assert(blocked.eligible === false, 'database deployment should not be fast-pass eligible.');
assert((blocked.blockedBy || []).length > 0, 'blocked fast-pass should explain blockers.');

const context = runJson(['context', 'compile', '--task', 'fix README typo', '--budget', '1200', '--json']);
assert(context.schema === 'sdlc.context_compile.v1', 'context compile schema mismatch.');
assert(context.estimatedTokens <= context.budget, 'context compile should stay within budget.');
assert(Array.isArray(context.selected), 'context compile should include selected context array.');

const evidence = runJson(['evidence', 'recommend', '--task', 'update Auggie adapter docs', '--files', 'templates/adapters/auggie/sdlc-context-scout.md', '--json']);
assert(evidence.schema === 'sdlc.evidence_recommend.v1', 'evidence recommend schema mismatch.');
assert((evidence.checks || []).some((check) => check.command === 'git diff --check'), 'evidence recommend should include diff check.');
assert((evidence.checks || []).some((check) => check.command === 'node scripts/test-agent-contracts.mjs'), 'adapter docs should recommend agent contract test.');

const agents = runJson(['agents', 'plan', '--task', 'fix README typo', '--files', 'README.md', '--json']);
assert(agents.delegation?.delegationRecommended === false, 'agents plan should suppress delegation for deterministic fast-pass.');
assert((agents.recommendations || []).every((row) => row.recommendation === 'skip'), 'suppressed agents plan should skip all handoff roles.');

const legacyParityTask = 'Pull latest comment for LC-50; review Classic ASP process, new ReactUI employee-dashboard, and Mainsite API backend for differences in employee photo upload process from dashboard';
const parityAgents = runJson(['agents', 'plan', '--task', legacyParityTask, '--json']);
assert(parityAgents.delegation?.delegationRecommended === true, 'legacy cross-surface parity task should not suppress delegation.');
assert(parityAgents.delegation?.signals?.crossSurfaceLike === true, 'legacy cross-surface parity signal should be reported.');
assert((parityAgents.recommendations || []).some((row) => row.role === 'read-only-code-scout' && row.languageProfile === 'classic-asp' && row.recommendation === 'strongly-recommended'), 'Classic ASP scout should be strongly recommended.');
assert((parityAgents.recommendations || []).some((row) => row.role === 'read-only-code-scout' && row.languageProfile === 'typescript-react' && row.recommendation === 'strongly-recommended'), 'React scout should be strongly recommended.');
assert((parityAgents.recommendations || []).some((row) => row.role === 'read-only-code-scout' && row.languageProfile === 'dotnet-csharp' && row.recommendation === 'strongly-recommended'), '.NET API scout should be strongly recommended.');
assert((parityAgents.recommendations || []).some((row) => row.role === 'verification-worker' && row.recommendation !== 'skip'), 'legacy parity task should recommend verification.');
assert((parityAgents.recommendations || []).some((row) => row.role === 'independent-reviewer' && row.recommendation === 'recommended'), 'legacy parity task should recommend independent review.');
assert((parityAgents.recommendations || []).some((row) => row.role === 'process-learning-reviewer' && row.recommendation === 'skip'), 'product process wording should not trigger process-learning review.');
assert((parityAgents.workspaceWarnings || []).some((warning) => /active repository is the reusable skills pack/.test(warning)), 'legacy parity task should warn when planned from the skills-pack repo.');

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('Routing optimization check passed.');
