#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const args = process.argv.slice(2);

function optionValue(name) {
  const index = args.indexOf(name);
  if (index < 0) return '';
  return args[index + 1] || '';
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/test-skill-files.mjs [--skills-root <path>]

Checks skill entrypoints and optional agents/openai.yaml metadata for UTF-8,
LF, supported metadata structure, invocation references, and stale defaults.
This is structural validation, not proof of agent behavior.`);
  process.exit(0);
}

const skillsRoot = resolve(repoRoot, optionValue('--skills-root') || optionValue('-SkillsRoot') || 'skills');
const decoder = new TextDecoder('utf-8', { fatal: true });
const failures = [];

function findSkillFiles(root) {
  const found = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name === 'SKILL.md') found.push(full);
    }
  }
  walk(root);
  return found.sort();
}

function displayPath(file) {
  return relative(repoRoot, file) || file;
}

const files = findSkillFiles(skillsRoot);

for (const file of files) {
  const bytes = readFileSync(file);
  const label = displayPath(file);

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    failures.push(`${label}: UTF-8 BOM found before YAML frontmatter.`);
    continue;
  }

  if (bytes.length < 3 || bytes[0] !== 0x2d || bytes[1] !== 0x2d || bytes[2] !== 0x2d) {
    failures.push(`${label}: first bytes must be 2D 2D 2D for YAML frontmatter.`);
    continue;
  }

  let text = '';
  try {
    text = decoder.decode(bytes);
  } catch {
    failures.push(`${label}: file is not valid UTF-8.`);
    continue;
  }

  if (text.includes('\r')) {
    failures.push(`${label}: file must use LF line endings, not CRLF or CR.`);
    continue;
  }

  const lines = text.split('\n');
  if (lines[0] !== '---') {
    failures.push(`${label}: first line must be exactly ---.`);
    continue;
  }

  const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---');
  if (frontmatterEnd < 0) {
    failures.push(`${label}: YAML frontmatter is not closed with ---.`);
    continue;
  }

  const frontmatter = lines.slice(1, frontmatterEnd);
  const nameLine = frontmatter.find((line) => /^name:\s*\S/.test(line));
  if (!nameLine) {
    failures.push(`${label}: YAML frontmatter is missing name.`);
  } else {
    const name = nameLine.replace(/^name:\s*/, '').trim().replace(/^['"]|['"]$/g, '');
    const directory = basename(dirname(file));
    if (name !== directory) {
      failures.push(`${label}: frontmatter name '${name}' must match directory '${directory}'.`);
    }
  }

  if (!frontmatter.some((line) => /^description:\s*.+/.test(line))) {
    failures.push(`${label}: YAML frontmatter is missing description.`);
  }

  if (!frontmatter.some((line) => /^user-invocable:\s*true\s*$/.test(line))) {
    failures.push(`${label}: YAML frontmatter must include user-invocable: true.`);
  }

  let bodyStart = frontmatterEnd + 1;
  while (bodyStart < lines.length && lines[bodyStart] === '') bodyStart++;
  if (bodyStart < lines.length && lines[bodyStart] === '---') {
    failures.push(`${label}: duplicate leading YAML frontmatter found.`);
  }
}

for (const file of files) {
  const metadata = join(dirname(file), 'agents', 'openai.yaml');
  if (!existsSync(metadata)) continue;
  const bytes = readFileSync(metadata);
  const label = displayPath(metadata);
  if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) failures.push(`${label}: UTF-8 BOM is not allowed.`);
  let text;
  try { text = decoder.decode(bytes); } catch { failures.push(`${label}: invalid UTF-8.`); continue; }
  if (text.includes('\r') || text.includes('\t') || !text.endsWith('\n')) failures.push(`${label}: use LF, spaces, and a final newline.`);
  const roots = text.split('\n').filter((line) => /^[a-z_]+:/.test(line));
  if (roots.some((line) => !/^(interface|policy|dependencies):\s*$/.test(line))) failures.push(`${label}: interface fields must be nested under interface.`);
  const prompt = text.match(/^  default_prompt: "(.*)"$/m)?.[1];
  if (/default_prompt:/.test(text) && !prompt?.includes(`$${basename(dirname(file))}`)) failures.push(`${label}: default_prompt must name its skill explicitly.`);
  const short = text.match(/^  short_description: "(.*)"$/m)?.[1];
  if (short && (short.length < 25 || short.length > 64)) failures.push(`${label}: short_description must be 25–64 characters.`);
  if (/allow_implicit_invocation:/.test(text) && !/^  allow_implicit_invocation: (true|false)$/m.test(text)) failures.push(`${label}: invalid invocation policy.`);
  if (/\b10 review\/revision loops\b/.test(text)) failures.push(`${label}: retired mandatory ten-loop default.`);
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`Skill file check passed for ${files.length} files.`);
