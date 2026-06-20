#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
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

Checks skills/**/SKILL.md files for UTF-8 without BOM, byte-0 YAML
frontmatter, required frontmatter fields, LF line endings, and duplicate
leading frontmatter.`);
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

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`Skill file check passed for ${files.length} files.`);
