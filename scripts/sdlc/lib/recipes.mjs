import { dedupeBy } from './common.mjs';

export function recipeRegistry() {
  return [
    recipe('route-retirement', 'active', ['retire', 'replace old', 'legacy route', 'old route', 'download route', 'old active callers', 'active callers'], ['positive search for new active callers', 'negative search for old active callers', 'remaining references classified'], 'sdlc route proof --old <old> --new <new> --task "..."', ['include old/new behavior and absence checks in QA']),
    recipe('live-system-bug', 'active', ['staging log', 'production log', 'live bug', 'sql log', 'exact error', 'support report'], ['sanitized exact error/log', 'minimal reproduction or cap', 'smallest fix hypothesis'], 'sdlc bug live-evidence --task "..."', ['include root cause, retest steps, and expected absence of old error']),
    recipe('interactive-stateful-feature', 'active', ['interactive', 'stateful', 'gameplay', 'game', 'settings', 'difficulty', 'animation', 'feedback', 'dashboard', 'wizard', 'mode', 'turn'], ['interaction contract', 'state/domain logic test or cap', 'surface-correct smoke', 'human QA path when applicable'], 'sdlc interaction packet --task "..."', ['include starting state, changed setting/mode, primary interaction, feedback/animation, recovery/reset, and regression path']),
    recipe('fixture-validation-kept-change', 'active', ['fixture', 'validation fixture', 'battle soccer', 'kept change', 'keep changes', 'save changes', 'commit fixture', 'test sdlc'], ['preflight route and breadth', 'changed-file scope', 'tests/build or surface verification', 'commit preview when kept'], 'sdlc fixture plan --task "..."', ['treat useful fixture improvements like product work and keep commit/release decisions explicit']),
    recipe('efcore-sqlserver-trigger-output', 'experimental', ['ef core', 'sql server', 'trigger', 'output clause', 'usesqloutputclause', 'hastrigger'], ['exact SQL Server error/table', 'trigger-backed table list', 'mapped DbContext intersection', 'metadata regression test'], 'sdlc dotnet efcore diagnose --task "..."', ['record SQL Server smoke cap separately from metadata test']),
    recipe('efcore-fk-relationship', 'experimental', ['foreign key', ' fk ', 'relationship', 'savechanges', 'company_id'], ['exact FK table/columns', 'relationship invariant', 'analogous working path', 'focused regression test'], 'sdlc dotnet efcore diagnose --task "..."', ['include scenario retest and invariant expectation']),
    recipe('no-test-legacy', 'active', ['no automated tests', 'manual qa', 'weak test', 'missing test', 'legacy site fix where no automated tests'], ['test bootstrap decision', 'manual smoke cap', 'QA Markdown'], 'sdlc test regression-plan --task "..."', ['include manual QA owner and future test recommendation']),
    recipe('api-only-openapi', 'active', ['api-only', 'api only', 'swagger', 'openapi', 'developer testing'], ['API request/response evidence', 'contract/error behavior', 'no rendered UI cap'], 'sdlc qa api --task "..."', ['write API/client validation steps, not browser UI steps']),
    recipe('multi-repo-qa-handoff', 'active', ['multi-repo', 'multi repo', 'five repositories', 'several repositories', 'shared qa', 'release order'], ['workspace ledger', 'affected units', 'one tester-visible QA script'], 'sdlc workspace ledger --task "..."', ['hide repo mechanics unless QA needs them']),
    recipe('test-bootstrap', 'active', ['add test project', 'bootstrap test', 'new test project', 'missing harness'], ['project reference', 'package/reference validation', 'focused test command'], 'sdlc test bootstrap-plan --unit <unit> --framework dotnet', ['record dependency warnings separately']),
    recipe('command-tooling-failure', 'active', ['parsererror', 'quote', 'syntax', 'command failed', 'operation not permitted', 'sandbox'], ['failure classified', 'corrected rerun result or cap'], 'sdlc command classify --command "..." --status <code>', ['do not treat invocation failure as product evidence']),
    recipe('context-bucket-save', 'active', ['context', 'learning', 'durable fact', 'legacyapi', 'shared context'], ['bucket confidence', 'product vs process split', 'final context checkpoint'], 'sdlc context bucket-confidence --path <path> --task "..."', ['confirm context updated/deferred/capped']),
    recipe('ticket-evidence', 'active', ['youtrack', 'ticket', 'yt-', 'issue id', 'acceptance criteria', 'qa case'], ['ticket source and read mode', 'acceptance criteria or confirmed gap', 'drift check before closeout'], 'sdlc ticket evidence --task "..."', ['translate acceptance criteria into tester steps']),
    recipe('database-evidence', 'active', ['database mcp', 'read-only database', 'read only database', 'database evidence', 'database query', 'db evidence', 'sql evidence', 'query plan', 'native soc', 'data mismatch'], ['read-only boundary', 'safe query plan', 'redacted result summary or cap'], 'sdlc data query-plan --task "..."', ['describe observable behavior and safe test data, not raw SQL']),
  ];
}

export function recipe(id, status, triggers, requiredProof, command, qaAdditions) {
  return {
    id,
    status,
    owner: recipeOwner(id),
    triggers,
    requiredProof,
    command,
    qaAdditions,
    confidence: 'medium',
  };
}

export function recipeOwner(id) {
  if (id.includes('efcore') || id.includes('test')) return 'implementation/quality';
  if (id.includes('qa')) return 'quality/release';
  if (id.includes('context') || id.includes('learning')) return 'context/process-learning';
  if (id.includes('command')) return 'tools/quality';
  return 'run-sdlc';
}

export function matchRecipes(task, gitInfo = { changedFiles: [] }, profile = {}) {
  const text = `${task} ${profile.repositoryRole || ''}`.toLowerCase();
  const matches = recipeRegistry()
    .map((item) => {
      const hits = item.triggers.filter((trigger) => text.includes(trigger.toLowerCase())).length;
      return hits ? { ...item, confidence: hits > 1 ? 'high' : 'medium' } : null;
    })
    .filter(Boolean);
  return dedupeBy(matches, (item) => item.id);
}

export function recipeForCompile(item) {
  return { id: item.id, status: item.status, owner: item.owner, requiredProof: item.requiredProof, command: item.command, qaAdditions: item.qaAdditions };
}
