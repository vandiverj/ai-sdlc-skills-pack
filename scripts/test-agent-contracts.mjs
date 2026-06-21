#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const failures = [];

const expectedFrontierAdapters = [
  'sdlc-context-scout.toml',
  'sdlc-read-only-code-scout.toml',
  'sdlc-implementation-planner.toml',
  'sdlc-implementation-worker.toml',
  'sdlc-verification-worker.toml',
  'sdlc-independent-reviewer.toml',
  'sdlc-security-privacy-reviewer.toml',
  'sdlc-qa-handoff-worker.toml',
  'sdlc-release-handoff-worker.toml',
  'sdlc-process-learning-reviewer.toml',
  'sdlc-feedback-reporter.toml',
];
const expectedAuggieAdapters = expectedFrontierAdapters.map((file) => file.replace(/\.toml$/, '.md'));
const auggieReadOnlyAdapters = new Set([
  'sdlc-context-scout.md',
  'sdlc-read-only-code-scout.md',
  'sdlc-implementation-planner.md',
  'sdlc-independent-reviewer.md',
  'sdlc-security-privacy-reviewer.md',
  'sdlc-process-learning-reviewer.md',
  'sdlc-feedback-reporter.md',
]);

function readText(path) {
  return readFileSync(path, 'utf8');
}

function rel(path) {
  return relative(repoRoot, path) || path;
}

function fail(path, message) {
  failures.push(`${rel(path)}: ${message}`);
}

function adapterNameFromFile(file) {
  return basename(file, '.toml').replaceAll('-', '_');
}

function auggieNameFromFile(file) {
  return basename(file, '.md');
}

function sourcePathFromPortableLine(line) {
  const source = line.replace(/^.*Portable source:\s*/, '').trim().replace(/^`|`$/g, '');
  if (source.startsWith('.agents/')) return source.replace(/^\.agents\//, '');
  return source;
}

const agentsDir = join(repoRoot, 'agents');
const codexDir = join(repoRoot, 'templates', 'adapters', 'codex');
const auggieDir = join(repoRoot, 'templates', 'adapters', 'auggie');
const promptDir = join(repoRoot, 'templates', 'prompts', 'sdlc');
const catalogPath = join(repoRoot, 'templates', 'docs', 'agents', 'agent-catalog.md');

for (const file of expectedFrontierAdapters) {
  const path = join(codexDir, file);
  if (!existsSync(path)) {
    failures.push(`templates/adapters/codex/${file}: expected frontier adapter is missing.`);
  }
}

for (const file of expectedAuggieAdapters) {
  const path = join(auggieDir, file);
  if (!existsSync(path)) {
    failures.push(`templates/adapters/auggie/${file}: expected Auggie adapter is missing.`);
  }
}

for (const file of readdirSync(codexDir).filter((entry) => entry.startsWith('sdlc-') && entry.endsWith('.toml')).sort()) {
  const path = join(codexDir, file);
  const text = readText(path);
  const expectedName = adapterNameFromFile(file);
  if (!text.includes(`name = "${expectedName}"`)) {
    fail(path, `adapter name must be "${expectedName}".`);
  }

  const sourceLine = text.split('\n').find((line) => line.includes('Portable source:'));
  if (!sourceLine) {
    fail(path, 'missing Portable source line.');
  } else {
    const sourcePath = join(repoRoot, sourcePathFromPortableLine(sourceLine));
    if (!existsSync(sourcePath)) fail(path, `Portable source does not exist: ${rel(sourcePath)}.`);
  }

  if (!/parent orchestrator owns AirteraCode MCP submission or local fallback/.test(text)) {
    fail(path, 'missing parent-mediated feedback submission rule.');
  }

  if (!/feedback/i.test(text) || !/raw|sanitized|draft|submit/i.test(text)) {
    fail(path, 'missing usable feedback guidance.');
  }
}

for (const file of readdirSync(auggieDir).filter((entry) => entry.startsWith('sdlc-') && entry.endsWith('.md')).sort()) {
  const path = join(auggieDir, file);
  const text = readText(path);
  const expectedName = auggieNameFromFile(file);
  if (!text.includes(`name: ${expectedName}`)) {
    fail(path, `adapter name must be "${expectedName}".`);
  }

  const sourceLine = text.split('\n').find((line) => line.includes('Portable source:'));
  if (!sourceLine) {
    fail(path, 'missing Portable source line.');
  } else {
    const sourcePath = join(repoRoot, sourcePathFromPortableLine(sourceLine));
    if (!existsSync(sourcePath)) fail(path, `Portable source does not exist: ${rel(sourcePath)}.`);
  }

  if (!/parent orchestrator owns AirteraCode MCP submission or local fallback/.test(text)) {
    fail(path, 'missing parent-mediated feedback submission rule.');
  }

  if (!/SDLC feedback draft/i.test(text) || !/Do not submit feedback directly|parent validates and submits/i.test(text)) {
    fail(path, 'missing usable feedback draft guidance.');
  }

  if (auggieReadOnlyAdapters.has(file)) {
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
    if (/str-replace-editor|save-file|remove-files|launch-process/.test(frontmatter)) {
      fail(path, 'read-only Auggie adapter exposes edit, remove, or shell tools.');
    }
  }
}

for (const file of readdirSync(promptDir).filter((entry) => entry.endsWith('.md')).sort()) {
  const path = join(promptDir, file);
  const text = readText(path);
  if (!text.includes('Use with portable role definition:')) continue;
  if (!text.includes('SDLC feedback draft:')) {
    fail(path, 'portable-role prompt template must include SDLC feedback draft in Return block.');
  }
  if (!/meaningful process friction, caps, skipped evidence, or tool\/runtime evidence/.test(text)) {
    fail(path, 'portable-role prompt template must state when to include a feedback draft.');
  }
}

const catalogText = readText(catalogPath);
for (const role of ['test-engineer', 'spec-compliance-reviewer', 'code-quality-reviewer', 'contract-reviewer', 'production-readiness-reviewer', 'doc-sync-reviewer']) {
  const sectionPattern = new RegExp(`### ${role}[\\s\\S]*?(?=\\n### |\\n## |$)`);
  const section = catalogText.match(sectionPattern)?.[0] || '';
  if (!section.includes('Status: router reference') && !section.includes('Status: conceptual')) {
    fail(catalogPath, `${role} must be marked as router reference/conceptual unless it has a portable agent.`);
  }
}

for (const file of readdirSync(agentsDir).filter((entry) => entry.endsWith('.md')).sort()) {
  const path = join(agentsDir, file);
  const text = readText(path);
  if (!text.includes('## Output')) fail(path, 'missing Output section.');
  if (!text.includes('## Hard Rules')) fail(path, 'missing Hard Rules section.');
  if (!text.includes('Do not submit feedback directly')) {
    fail(path, 'missing parent-mediated feedback hard rule.');
  }
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log('Agent contract check passed.');
