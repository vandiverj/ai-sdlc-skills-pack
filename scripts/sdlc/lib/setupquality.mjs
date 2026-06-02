import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { formatList, printObject, safeWriteTextFile } from './common.mjs';
import { buildToolInventory } from './tools.mjs';
import { loadProfile } from './profile.mjs';

export function setupInspect(repo, options = {}) {
  const inventory = buildToolInventory(repo);
  const profile = loadProfile(repo);
  const result = {
    schema: 'sdlc-setup-inspect-v1',
    repository: repo,
    profile: profile.path ? relative(repo, profile.path) : 'missing',
    aiLocal: existsSync(join(repo, '.ai-local')) ? 'present' : 'missing',
    scratchScripts: existsSync(join(repo, '.ai-local', 'sdlc-scratch', 'scripts')) ? 'present' : 'missing',
    packageManager: inventory.packageManager,
    units: inventory.units || [],
    scripts: inventory.scripts.filter((script) => /test|build|dev|lint|typecheck/i.test(script.name)).slice(0, 20),
    files: inventory.files,
  };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    printObject({ repository: repo, profile: result.profile, aiLocal: result.aiLocal, scratchScripts: result.scratchScripts, packageManager: result.packageManager, units: result.units.length });
    console.log('\n## Scripts\n');
    console.log(formatList(result.scripts.map((script) => `${script.command}: ${script.detail}`)));
  }
}

export function setupRecommend(repo, options = {}) {
  const inventory = buildToolInventory(repo);
  const recommendations = [];
  if (!existsSync(join(repo, '.ai-local'))) recommendations.push('Create ignored `.ai-local` for SDLC run artifacts and repo-local profile.');
  if (!existsSync(join(repo, '.ai-local', 'sdlc-scratch', 'scripts'))) recommendations.push('Use `.ai-local/sdlc-scratch/scripts/` for agent-created temporary PowerShell/shell scripts so they do not dirty product source folders.');
  if (!inventory.scripts.some((script) => /test/i.test(script.name))) recommendations.push('Add or profile a focused test command, or document no-test/manual QA maturity.');
  if ((inventory.units || []).length) recommendations.push('Record deployable/codebase units in repo setup so context and commands map correctly.');
  if (inventory.files.some((file) => file.kind === 'api-contract')) recommendations.push('Mark API/OpenAPI surfaces as testable API surfaces, not rendered UI.');
  if (!recommendations.length) recommendations.push('No major setup gaps detected.');
  const result = { schema: 'sdlc-setup-recommend-v1', repository: repo, recommendations };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else console.log(formatList(recommendations));
}

export function setupApplyLocal(repo, options = {}) {
  const preview = options.preview || !options.apply;
  const content = `# SDLC Local Profile Draft

Repository: ${repo}

## Verification

- test command:
- build command:
- rendered UI command:

## Units

- name:
  path:
  testing surface:
  deploy method:
  context bucket:

## External Evidence

- ticket MCP: optional
- database MCP: optional/read-only with approval boundaries

## Local Scratch Artifacts

- temporary scripts: .ai-local/sdlc-scratch/scripts/
- scratch script TTL: 7 days by default
- cleanup: sdlc artifact scratch-cleanup --repo <path> [--apply]
`;
  const outPath = resolve(repo, '.ai-local', 'sdlc-profile.md');
  if (preview) {
    console.log(content.trimEnd());
    console.log('\nPreview only. Rerun with --apply to write.');
    return;
  }
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}
