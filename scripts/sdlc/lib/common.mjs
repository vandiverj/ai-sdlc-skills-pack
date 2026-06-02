import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

export function parseOptions(tokens) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = tokens[index + 1];
    if (!next || next.startsWith('--')) {
      options[toCamel(key)] = true;
      continue;
    }

    options[toCamel(key)] = next;
    index++;
  }

  options._ = positionals;
  return options;
}

export function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function readJsonLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { parseError: line };
      }
    });
}

export function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

export function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'route';
}

export function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

export function humanize(value) {
  return String(value).replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

export function splitList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || '').split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

export function formatList(items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function formatInlineList(items) {
  return items.length ? items.join(', ') : 'none';
}

export function formatInlineStatus(value) {
  return value ? String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join('; ') : 'clean';
}

export function formatOptionList(value) {
  return formatList(splitList(value));
}

export function indentList(items) {
  return formatList(items).split('\n').map((line) => `  ${line}`).join('\n');
}

export function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

export function dedupeBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function dedupeByPath(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item.path || seen.has(item.path)) continue;
    seen.add(item.path);
    out.push(item);
  }
  return out;
}

export function safeWriteTextFile(repo, outPath, content) {
  try {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    if (code === 'EPERM' || code === 'EACCES') {
      fail([
        `Could not write SDLC evidence to ${outPath}.`,
        `Reason: ${message}`,
        'Recovery:',
        '- rerun the command with approval/escalation when the repo is outside the writable sandbox,',
        '- or pass --out /private/tmp/<file>.md,',
        '- or record an explicit evidence-path cap in the final summary.',
      ].join('\n'));
    }
    throw error;
  }
}

export function safeWriteJsonFile(repo, outPath, value) {
  safeWriteTextFile(repo, outPath, `${JSON.stringify(value, null, 2)}\n`);
}

export function appendControlJsonLine(repo, outPath, value) {
  try {
    mkdirSync(dirname(outPath), { recursive: true });
    appendFileSync(outPath, `${JSON.stringify(value)}\n`, 'utf8');
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    if (code === 'EPERM' || code === 'EACCES') fail(`Could not write SDLC control record to ${outPath}.\nReason: ${message}\nRecovery: pass --out-root /private/tmp/<dir> or rerun with approval.`);
    throw error;
  }
}

export function printObject(object) {
  for (const [key, value] of Object.entries(object)) {
    console.log(`${humanize(key)}: ${value}`);
  }
}

export function writeOrPrint(repo, out, content) {
  if (out) {
    const outPath = resolve(repo, out);
    safeWriteTextFile(repo, outPath, content);
    console.log(relative(repo, outPath));
  } else console.log(content.trimEnd());
}

export function printTable(headers, rows) {
  console.log(`| ${headers.map(escapeCell).join(' | ')} |`);
  console.log(`| ${headers.map(() => '---').join(' | ')} |`);
  for (const row of rows) console.log(`| ${row.map((cell) => escapeCell(cell ?? '')).join(' | ')} |`);
}

export function fail(message) {
  console.error(message);
  process.exit(1);
}
