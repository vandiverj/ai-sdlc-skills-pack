#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contractFindings, taskContract } from './sdlc/lib/contract.mjs';
import { impactPacketFindings } from './sdlc/lib/changeimpact.mjs';
import { evidenceMatchesCriterion } from './sdlc/lib/evidence.mjs';
import { finalGateOpenItems } from './sdlc/lib/finish.mjs';
import { detectStack, inferRepoUnits } from './sdlc/lib/units.mjs';

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

function runText(args) {
  return execFileSync('node', [sdlc, ...args], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const defaultHelp = runText(['--help']);
assert(defaultHelp.includes('sdlc start --task') && defaultHelp.includes('sdlc finish-ready --task'), 'default help should expose the normal lifecycle.');
assert(!defaultHelp.includes('sdlc context contradictions'), 'default help should hide specialist implementation commands.');

const fastPass = runJson(['route', 'fast-pass', '--task', 'fix README typo', '--files', 'README.md', '--json']);
assert(fastPass.schema === 'sdlc.fast_pass.v1', 'fast-pass schema mismatch.');
assert(fastPass.eligible === true, 'README typo should be fast-pass eligible.');
assert(fastPass.delegation === 'none', 'fast-pass should suppress delegation.');
assert((fastPass.requiredChecks || []).includes('git diff --check'), 'fast-pass should require git diff --check.');

const mechanicalFastPass = runJson(['route', 'fast-pass', '--task', 'tiny mechanical rename', '--files', 'scripts/sdlc/lib/routes.mjs', '--json']);
assert(mechanicalFastPass.eligible === true, 'explicitly tiny mechanical source work should remain fast-pass eligible.');

const localBehaviorFastPass = runJson(['route', 'fast-pass', '--task', 'small local reversible label fix with a focused test', '--files', 'src/LabelView.tsx', '--json']);
assert(localBehaviorFastPass.eligible === true, 'bounded reversible behavior with named direct proof should be fast-pass eligible.');
assert((localBehaviorFastPass.requiredChecks || []).some((item) => /focused behavior\/regression/.test(item)), 'local behavior fast-pass should retain its direct proof requirement.');

const experienceTask = 'Change the editor so a user can replace a saved observation and keep its identity';
const experienceFile = 'app/Sources/ObservationEditorView.swift';
const experienceFastPass = runJson(['route', 'fast-pass', '--task', experienceTask, '--files', experienceFile, '--json'], true);
assert(experienceFastPass.eligible === false, 'observable owner workflow changes must not become fast-pass merely because one file is named.');
assert((experienceFastPass.blockedBy || []).some((item) => /observable behavior|experience-impact/i.test(item)), 'blocked behavior work should explain the missing experience-impact route.');

const experienceEvidence = runJson(['evidence', 'recommend', '--task', experienceTask, '--files', experienceFile, '--json']);
assert((experienceEvidence.surfaces || []).includes('rendered-product-ui'), 'SwiftUI/editor work should be detected as rendered product UI.');
assert((experienceEvidence.requirements || []).some((item) => item.id === 'experience-impact'), 'behavior work should require an experience-impact trace.');
assert(experienceEvidence.llmUse !== 'not needed before deterministic checks', 'behavior work should require reasoning before deterministic checks alone.');

const experienceReview = runJson(['evidence', 'recommend', '--task', 'Review the owner observation replacement workflow read-only without edits', '--files', experienceFile, '--json']);
assert(experienceReview.route === 'review-only', 'explicit read-only behavior inspection should use the review route.');
assert((experienceReview.requirements || []).some((item) => item.id === 'experience-impact'), 'review-only inspection of observable behavior should retain the experience-impact trace.');

const internalReview = runJson(['evidence', 'recommend', '--task', 'Review this implementation read-only without edits', '--files', 'src/domain/CoordinateMapper.swift', '--json']);
assert(!(internalReview.requirements || []).some((item) => item.id === 'experience-impact'), 'internal review should not require a behavior-impact artifact without a behavior signal.');

const incompleteContract = taskContract(repoRoot, experienceTask, { files: [experienceFile], acceptance: 'The owner can replace the saved observation.' });
assert(contractFindings(incompleteContract).some((item) => item.required && item.status === 'open' && /outcome|impact|proof/i.test(item.area)), 'behavior task contract should remain open without outcome/connected-impact/proof.');

const completeContract = taskContract(repoRoot, experienceTask, {
  files: [experienceFile],
  acceptance: 'The owner can replace the selected observation without changing its identity.',
  outcome: 'The user replaces the selected observation without changing its stable identity.',
  connectedImpact: 'Draft persistence and the cancel path.',
  proof: 'Identity regression test and rendered replace/cancel check.',
});
assert(!contractFindings(completeContract).some((item) => item.required && item.status === 'open'), 'complete behavior task contract should be ready.');

const expandedContract = taskContract(repoRoot, 'Change a production API contract and database migration', {
  files: ['src/api/contract.ts', 'migrations/002.sql'],
  acceptance: 'Existing consumers continue to read records during rollout.',
  outcome: 'Existing consumers keep receiving compatible records.',
  connectedImpact: 'Database migration and older API clients.',
  proof: 'Contract compatibility test and migration rollback rehearsal.',
});
assert(expandedContract.experienceImpact.expanded === true, 'high-risk contract/data work should require expanded impact mapping.');
assert(contractFindings(expandedContract).some((item) => item.required && item.status === 'open' && /expanded/i.test(item.area)), 'expanded work should stay open without workflow, recovery, ownership, and scenarios.');

assert(!evidenceMatchesCriterion({ kind: 'test', summary: 'npm test and build passed' }, { id: 'ac-1', text: 'Owner replacement keeps the saved observation identity' }, 'targeted automated check'), 'generic test/build evidence must not satisfy an unrelated acceptance criterion.');
assert(!evidenceMatchesCriterion({ criterionId: 'ac-1', kind: 'build', summary: 'application build passed' }, { id: 'ac-1', text: 'Owner replacement keeps the saved observation identity' }, 'targeted automated check'), 'criterion labeling must not turn a generic build into behavior proof.');
assert(evidenceMatchesCriterion({ criterionId: 'ac-1', kind: 'test', summary: 'identity preservation test passed' }, { id: 'ac-1', text: 'Owner replacement keeps the saved observation identity' }, 'targeted automated check'), 'criterion-linked evidence should satisfy its acceptance criterion.');

const completeImpact = `# SDLC Impact Packet
Task: ${experienceTask}
- Required: yes
- Expanded mapping required: no
- Experience-impact status: complete
- Outcome: The user replaces the selected observation without changing its stable identity
- Connected impacts: draft persistence | cancel path
- Proof and recovery: identity regression test | rendered replace/cancel check
- Implemented and verified: replacement and identity preservation
- Verified unaffected: ordering and add workflow
- Deferred with rationale and human acceptance:
- Blocking impacts:
`;
assert(!impactPacketFindings(completeImpact).some((item) => item.required && item.status === 'open'), 'complete experience-impact packet should pass closure findings.');

const incompleteExpandedImpact = completeImpact.replace('Expanded mapping required: no', 'Expanded mapping required: yes');
assert(impactPacketFindings(incompleteExpandedImpact).some((item) => item.required && item.status === 'open' && /expanded/i.test(item.area)), 'expanded impact packet should require the risk-relevant detail omitted by the compact form.');

const incompleteImpact = completeImpact.replace('Experience-impact status: complete', 'Experience-impact status: open').replace('Outcome: The user replaces the selected observation without changing its stable identity', 'Outcome:');
const incompleteFinalGates = finalGateOpenItems(repoRoot, experienceTask, { status: 'M scoped', changedFiles: [experienceFile] }, [{ kind: 'impact', text: incompleteImpact }]);
assert(incompleteFinalGates.includes('experience-impact packet incomplete for observable behavior'), 'finish gate must inspect impact content instead of accepting packet presence.');
const completeFinalGates = finalGateOpenItems(repoRoot, experienceTask, { status: 'M scoped', changedFiles: [experienceFile] }, [{ kind: 'impact', text: completeImpact }]);
assert(!completeFinalGates.includes('experience-impact packet incomplete for observable behavior'), 'finish gate should accept a content-complete experience-impact closure.');

const nativeFixture = mkdtempSync(join(tmpdir(), 'sdlc-native-fixture-'));
try {
  mkdirSync(join(nativeFixture, 'app', 'Demo.xcodeproj'), { recursive: true });
  mkdirSync(join(nativeFixture, 'app', 'Sources', 'Demo'), { recursive: true });
  writeFileSync(join(nativeFixture, 'app', 'Demo.xcodeproj', 'project.pbxproj'), '// fixture\n');
  writeFileSync(join(nativeFixture, 'app', 'Package.swift'), '// swift-tools-version: 6.0\n');
  writeFileSync(join(nativeFixture, 'app', 'Sources', 'Demo', 'EditorWorkspace.swift'), 'struct EditorWorkspace {}\n');
  const stacks = detectStack(nativeFixture);
  const nativeUnits = inferRepoUnits(nativeFixture);
  assert(stacks.includes('Swift') && stacks.includes('Apple/Xcode'), 'native project detection should report Swift and Apple/Xcode.');
  assert(nativeUnits.some((unit) => unit.type === 'xcode-project' && unit.testSurface === 'rendered-product-ui'), 'Xcode app should be inferred as a rendered-product unit.');
  assert(nativeUnits.some((unit) => unit.type === 'swift-package'), 'Swift Package should be inferred as a code unit.');
} finally {
  rmSync(nativeFixture, { recursive: true, force: true });
}

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

const legacyParityTask = 'Review a Classic ASP workflow, React dashboard, and .NET API across multiple repositories for differences in the employee photo upload process';
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
