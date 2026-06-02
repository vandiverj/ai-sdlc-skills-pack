import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dedupeBy, escapeCell, fail, printObject, readJsonLines, safeWriteJsonFile, slug, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferRouteFromTask } from './routes.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const agentsRoot = resolve(dirname(scriptPath), '..', '..', '..');

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

export function recipeShow(route) {
  console.log(getRecipe(route));
}

export function recipeMatch(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const recipes = matchRecipes(task, getGitInfo(repo), loadProfile(repo).values);
  printObject({
    repository: repo,
    task,
    matches: recipes.length,
    primary: recipes[0]?.id || 'none',
  });
  console.log('\n| Recipe | Confidence | Status | Required proof | Suggested command |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const recipe of recipes) {
    console.log(`| ${recipe.id} | ${recipe.confidence} | ${recipe.status} | ${escapeCell(recipe.requiredProof.join('; '))} | \`${recipe.command}\` |`);
  }
}

export function recipeList(repo, options = {}) {
  const recipes = recipeRegistry();
  console.log('| Recipe | Status | Owner | Triggers |');
  console.log('| --- | --- | --- | --- |');
  for (const recipe of recipes) {
    if (options.status && recipe.status !== options.status) continue;
    console.log(`| ${recipe.id} | ${recipe.status} | ${recipe.owner} | ${escapeCell(recipe.triggers.join(', '))} |`);
  }
}

export function recipeReview(repo, options = {}) {
  const traces = findTraceFiles(repo).flatMap((file) => readJsonLines(file));
  const recipes = recipeRegistry();
  console.log(`# SDLC Recipe Review

Date: ${new Date().toISOString()}
Repository: ${repo}
Since: ${options.since || 'all'}

| Recipe | Status | Trace mentions | Suggested action |
| --- | --- | --- | --- |`);
  for (const recipe of recipes) {
    const mentions = traces.filter((row) => String(row.recipeIds || row.recipe || row.summary || '').includes(recipe.id)).length;
    const action = recipe.status === 'experimental' && mentions > 2 ? 'review for promotion to active' : recipe.status === 'deprecated' ? 'confirm replacement or retire' : 'keep monitoring';
    console.log(`| ${recipe.id} | ${recipe.status} | ${mentions} | ${action} |`);
  }
}

export function recipeRetire(repo, options = {}) {
  const recipe = options.recipe || options.id || '';
  if (!recipe) fail('Pass --recipe <id>.');
  const reason = options.reason || 'not provided';
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(recipe)}-recipe-retirement.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Recipe Retirement

Date: ${new Date().toISOString()}
Recipe: ${recipe}
Reason: ${reason}

## Rule

- Do not delete historical learning just because a recipe is retired.
- Mark future matching as advisory/deprecated until a replacement is approved.
- Add a scenario regression when retirement fixes a false positive.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function recipeCompile(repo, options = {}, dependencies = {}) {
  const { evidenceRequirementsForTask } = dependencies;
  if (typeof evidenceRequirementsForTask !== 'function') fail('recipe compile requires an evidence requirement provider.');
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const recipes = matchRecipes(task, git, profile.values);
  const plan = { schema: 'sdlc-compiled-recipe-v1', task, route, recipes: recipes.map(recipeForCompile), evidence: evidenceRequirementsForTask(repo, task, route, git, profile, options), generatedAt: new Date().toISOString() };
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${slug(task || route)}-recipe-plan.json`);
  safeWriteJsonFile(repo, outPath, plan);
  console.log(relative(repo, outPath));
}

export function recipeExplain(repo, options = {}) {
  const id = options.recipe || options.id || options.route || '';
  const item = recipeRegistry().find((recipe) => recipe.id === id) || null;
  if (!item) fail(`Recipe not found: ${id}`);
  printObject({ id: item.id, status: item.status, owner: item.owner, triggers: item.triggers.join(', '), requiredProof: item.requiredProof.join('; '), command: item.command, qaAdditions: item.qaAdditions.join('; ') });
}

function getRecipe(route) {
  if (!route) fail('Pass a route name, such as standard, release-push, review-only, or multi-repo-integration.');
  const recipesPath = join(agentsRoot, 'skills', 'run-sdlc', 'references', 'route-recipes.md');
  if (!existsSync(recipesPath)) fail(`Missing route recipes: ${recipesPath}`);
  const lines = readFileSync(recipesPath, 'utf8').split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `### ${String(route).toLowerCase()}`);
  if (start < 0) fail(`Route recipe not found: ${route}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (lines[index].startsWith('### ')) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trimEnd();
}

function findTraceFiles(repo) {
  const dir = defaultRunsDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith('-trace.jsonl')).map((file) => join(dir, file));
}
