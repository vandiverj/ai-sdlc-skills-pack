#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const sdlc = resolve(repoRoot, 'scripts', 'sdlc', 'sdlc.mjs');
const failures = [];
const rejectedTool = 'action' + 'lint';

function runJson(args) {
  try {
    return JSON.parse(execFileSync('node', [sdlc, ...args], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch (error) {
    failures.push(`${args.join(' ')} failed: ${error.stderr || error.message}`);
    return {};
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function names(rows) {
  return new Set((rows || []).map((row) => row.tool || row.name || row.id));
}

function assertTool(result, tool, message) {
  assert(names(result.toolRecommendations).has(tool), message);
}

function assertNoActionlint(value, label) {
  assert(!JSON.stringify(value).includes(rejectedTool), `${label} should not reference ${rejectedTool}.`);
}

const inventory = runJson(['tools', 'inventory', '--json']);
const inventoryTools = names(inventory.tools);
for (const tool of ['gitleaks', 'semgrep', 'shellcheck', 'hadolint', 'osv-scanner', 'lychee', 'markdownlint-cli2', 'vale', 'spectral', 'ast-grep', 'jq', 'yq', 'rg']) {
  assert(inventoryTools.has(tool), `inventory should include approved deterministic tool: ${tool}`);
}
assert(!inventoryTools.has(rejectedTool), `inventory should not include ${rejectedTool}.`);
assertNoActionlint(inventory, 'inventory');

const docs = runJson(['evidence', 'recommend', '--task', 'update public docs', '--files', 'README.md', '--json']);
assertTool(docs, 'markdownlint-cli2', 'docs should recommend markdownlint-cli2.');
assertTool(docs, 'lychee', 'docs should recommend lychee.');
assertTool(docs, 'vale', 'docs should recommend vale.');
assertNoActionlint(docs, 'docs evidence');

const shell = runJson(['evidence', 'recommend', '--task', 'update scratch script', '--files', '.ai-local/sdlc-scratch/scripts/check.sh', '--json']);
assertTool(shell, 'shellcheck', 'shell scripts should recommend shellcheck.');

const docker = runJson(['evidence', 'recommend', '--task', 'update container build', '--files', 'Dockerfile', '--json']);
assertTool(docker, 'hadolint', 'Dockerfiles should recommend hadolint.');

const deps = runJson(['evidence', 'recommend', '--task', 'upgrade dependencies', '--files', 'package-lock.json', '--json']);
assertTool(deps, 'osv-scanner', 'dependency changes should recommend osv-scanner.');

const api = runJson(['evidence', 'recommend', '--task', 'update OpenAPI contract', '--files', 'openapi.yaml', '--json']);
assertTool(api, 'spectral', 'API specs should recommend spectral.');
assertTool(api, 'yq', 'YAML specs should recommend yq syntax validation.');

const sensitive = runJson(['evidence', 'recommend', '--task', 'harden MCP adapter token handling', '--files', 'templates/adapters/codex/sdlc-implementation-worker.toml', '--json']);
assertTool(sensitive, 'gitleaks', 'sensitive adapter work should recommend gitleaks.');

const source = runJson(['evidence', 'recommend', '--task', 'harden auth handling in service code', '--files', 'scripts/sdlc/lib/tools.mjs', '--json']);
assertTool(source, 'semgrep', 'security-sensitive source changes should recommend semgrep.');
const refactor = runJson(['evidence', 'recommend', '--task', 'refactor service code', '--files', 'scripts/sdlc/lib/tools.mjs', '--json']);
assert(!names(refactor.toolRecommendations).has('semgrep'), 'ordinary refactors should not recommend semgrep without security-sensitive signals.');
assertTool(refactor, 'ast-grep', 'refactor work should recommend ast-grep.');

const recommended = runJson(['tools', 'recommend', '--task', 'update Dockerfile', '--files', 'Dockerfile', '--json']);
assert((recommended.recommendations || []).some((item) => item.includes('hadolint')), 'tools recommend should mention hadolint for Dockerfile work.');
assertNoActionlint(recommended, 'tools recommend');

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('Deterministic tool recommendation check passed.');
