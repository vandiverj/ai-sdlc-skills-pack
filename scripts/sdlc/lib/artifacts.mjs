import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { escapeCell, formatList, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteJsonFile, writeOrPrint } from './common.mjs';
import { defaultRunsDir, defaultScratchScriptsDir } from './paths.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { inferRouteFromTask } from './routes.mjs';
import { ensureControlRunDir, readCurrentStateInfo } from './state.mjs';

export function artifactBudget(repo, options = {}) {
  const route = options.route || inferRouteFromTask(options.task || '', getGitInfo(repo), loadProfile(repo).values);
  const budget = artifactBudgetForRoute(route, options.size || '');
  printObject({
    repository: repo,
    route,
    budget: budget.name,
    requiredArtifacts: budget.required.join(', '),
    optionalArtifacts: budget.optional.join(', ') || 'none',
    chatRule: budget.chatRule,
  });
  console.log('\n## Final Response Shape\n');
  console.log(formatList(['changed files', 'checks', 'QA readiness', 'open caps', 'commit/push status', 'next action', 'confidence block']));
}

export function artifactSpaPlan(repo, options = {}) {
  const task = options.task || 'generated SPA artifact promotion';
  const packagePath = options.package ? resolve(repo, options.package) : join(repo, 'package.json');
  const packageJson = readJsonIfExists(packagePath) || {};
  const scripts = packageJson.scripts || {};
  const packageType = classifySpaPackage(packageJson, scripts);
  const homepage = packageJson.homepage || '';
  const hasPublish = Boolean(scripts.publish);
  const hasBuild = Boolean(scripts.build);
  const hostTarget = homepage ? homepage.replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '') : '';
  const lines = [
    '# SDLC Generated SPA Artifact Promotion Plan',
    '',
    `Task: ${task}`,
    `Repository: ${repo}`,
    `Package file: ${relative(repo, packagePath) || 'package.json'}`,
    '',
    '## Detected Package Signals',
    '',
    `- Package type: ${packageType}`,
    `- Build script: ${scripts.build || 'not configured'}`,
    `- Publish script: ${scripts.publish || 'not configured'}`,
    `- Homepage: ${homepage || 'not configured'}`,
    `- Host target hint: ${hostTarget || 'not inferred'}`,
    '',
    '## Promotion Decision',
    '',
    ...spaPromotionDecisionRows({ packageType, hasPublish, hasBuild, homepage }),
    '',
    '## Required Checklist',
    '',
    '- Identify changed source packages and classify each as library/package or deployable app bundle.',
    '- Build library packages first, but do not copy their `dist/` output into a host repository.',
    '- Deploy or promote only the consuming app bundle that owns the hosted output.',
    '- Prefer an app `publish` script when present; inspect its target path before committing artifacts.',
    '- For build-only apps, use package `homepage` or repo profile context to map the host target.',
    '- Inspect the host target before copying: preserve host pages, server includes, auth logic, local config, uploads, and environment-specific markup.',
    '- Update only generated script/style tags that reference the app build assets.',
    '- Clean stale generated app assets only by comparing old generated filenames to the latest build output; never wipe the target folder.',
    '- Review `git diff --stat`, `git diff --numstat`, and `git diff --check` before committing generated artifacts.',
    '- Restore no-op line-ending/stat noise when Git shows dirty generated files with no meaningful content diff.',
    '',
    '## Stop Gates',
    '',
    '- Package type, host target, or deployable unit is unclear.',
    '- The task would replace or delete a host page such as `index.asp`, auth/server config, or unrelated assets.',
    '- Generated artifact cleanup would remove files outside the app-owned generated bundle pattern.',
    '- Publish/deploy/push/release would occur without explicit human approval.',
    '',
    '## Suggested Verification',
    '',
    '- Build changed libraries and consuming app packages in dependency order.',
    '- Run the app publish/build command and inspect the host repository diff.',
    '- Run focused UI/API smoke against the hosted workflow when available, or record an explicit cap.',
    '- Produce a QA Markdown script when human testers must verify the hosted workflow.',
    '',
  ];
  writeOrPrint(repo, options.out, lines.join('\n'));
}

export function artifactBudgetForRoute(route, size = '') {
  if (size === 'micro' || route === 'tiny-docs') return {
    name: 'micro/tiny',
    required: ['changed-files summary', 'one verification check or explicit cap', 'final confidence block'],
    optional: ['context placement note when durable truth changed'],
    chatRule: 'keep preflight and final response inline; no packet unless a gate appears',
  };
  if (['multi-repo-integration', 'bugfix-live-system', 'contract-first', 'release-push'].includes(route)) return {
    name: 'expanded evidence',
    required: ['preflight packet', 'route-specific packet', 'per-unit/per-repo checks', 'QA Markdown when human QA is involved', 'finish decision'],
    optional: ['security/risk packet', 'context bucket check', 'learning packet'],
    chatRule: 'summarize decisions in chat; keep dense evidence in packets',
  };
  if (route === 'ui-rendered-review') return {
    name: 'rendered workflow',
    required: ['preflight or route packet', 'rendered/behavior evidence or cap', 'verification packet', 'finish confidence block'],
    optional: ['QA Markdown', 'accessibility note when suggested/required'],
    chatRule: 'show only visual result, checks, caps, and next action',
  };
  return {
    name: 'standard',
    required: ['preflight summary', 'touched/impact awareness', 'verification evidence or cap', 'finish confidence block'],
    optional: ['QA Markdown', 'context update plan', 'learning capture'],
    chatRule: 'one-screen summary unless high-risk signals appear',
  };
}

function classifySpaPackage(packageJson = {}, scripts = {}) {
  const deps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };
  const build = String(scripts.build || '').toLowerCase();
  const publish = String(scripts.publish || '').toLowerCase();
  if (deps.webpack || build.includes('webpack') || publish.includes('webpack')) return 'webpack app bundle';
  if (deps.rollup || build.includes('rollup') || publish.includes('rollup')) return 'rollup library/package';
  if (deps.vite || build.includes('vite') || publish.includes('vite')) return 'vite app bundle';
  if (deps.react || deps['react-dom']) return 'react package/app - bundler unknown';
  return 'unknown';
}

function spaPromotionDecisionRows({ packageType, hasPublish, hasBuild, homepage }) {
  const rows = [];
  if (packageType.includes('rollup')) rows.push('- Treat this as a likely shared library/package: build it, then rebuild/promote the consuming app rather than copying this package `dist/` to a host repo.');
  if (hasPublish) rows.push('- Prefer the package `publish` script as the artifact-generation path; verify the target host diff before committing.');
  if (!hasPublish && hasBuild && homepage) rows.push('- Build-only app with a homepage hint: resolve the host target from `homepage`, then manually promote only generated app assets.');
  if (!hasPublish && hasBuild && !homepage) rows.push('- Build-only package without `homepage`: stop and identify the host target from repo profile/context before copying artifacts.');
  if (!rows.length) rows.push('- Insufficient package signals: classify the deployable unit and artifact owner before build/publish work.');
  return rows;
}

export function formatArtifactBudget(budget) {
  return formatList([
    `Budget: ${budget.name}`,
    `Required: ${budget.required.join('; ')}`,
    `Optional: ${budget.optional.join('; ') || 'none'}`,
    `Chat rule: ${budget.chatRule}`,
  ]);
}

export function artifactValidate(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || defaultRunsDir(repo);
  const findings = artifactFindings(runDir);
  printTable(['Status', 'Artifact', 'Detail'], findings.map((item) => [item.status, item.artifact, item.detail]));
  if (findings.some((item) => item.status === 'block')) process.exitCode = 1;
}

export function artifactSummarize(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || defaultRunsDir(repo);
  const findings = artifactFindings(runDir);
  const lines = ['# SDLC Artifact Summary', '', `Run root: ${runDir}`, '', '| Status | Artifact | Detail |', '| --- | --- | --- |', ...findings.map((item) => `| ${item.status} | ${escapeCell(item.artifact)} | ${escapeCell(item.detail)} |`), ''];
  writeOrPrint(repo, options.out, lines.join('\n'));
}

export function artifactCleanupPlan(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = options.runDir ? resolve(repo, options.runDir) : info.runDir || defaultRunsDir(repo);
  const rows = artifactLifecycleRows(runDir);
  const lines = [
    '# SDLC Artifact Cleanup Plan',
    '',
    `Run root: ${runDir}`,
    '',
    'This is recommendation-only. Do not delete, move, archive, or rewrite artifacts without explicit human approval.',
    '',
    '| Recommendation | Artifact | Reason |',
    '| --- | --- | --- |',
    ...rows.map((row) => `| ${row.recommendation} | ${escapeCell(row.artifact)} | ${escapeCell(row.reason)} |`),
    '',
    '## Lifecycle Rules',
    '',
    '- Temporary run evidence stays under `.ai-local/sdlc-runs/`.',
    '- Durable product facts belong in repo/unit/shared context, not transient run packets.',
    '- Portable SDLC learnings belong in sanitized `.agents/learnings/` candidates.',
    '- Large command logs should be summarized before prompt use.',
    '- Cleanup remains a human decision.',
    '',
  ];
  writeOrPrint(repo, options.out, lines.join('\n'));
}

export function artifactScratchPolicy(repo, options = {}) {
  const scratchDir = defaultScratchScriptsDir(repo);
  const maxAgeDays = Number(options.maxAgeDays || options.ttlDays || 7);
  const policy = {
    repository: repo,
    controlledScratchScriptDir: relative(repo, scratchDir),
    defaultTtlDays: maxAgeDays,
    rules: [
      'Do not create temporary .ps1, .sh, .cmd, .bat, or helper scripts in the repository root or product source folders.',
      'Place agent-created temporary scripts under `.ai-local/sdlc-scratch/scripts/` unless the user explicitly asks for a durable script.',
      'Keep `.ai-local/` ignored or locally excluded so scratch scripts do not dirty the product codebase.',
      'Treat scripts older than the TTL as cleanup candidates when they are not linked to an active run.',
      'Cleanup is dry-run by default; deletion requires `--apply` and is limited to the controlled scratch script directory.',
    ],
    commands: [
      'sdlc artifact scratch-audit --repo <path>',
      'sdlc artifact scratch-cleanup --repo <path>',
      'sdlc artifact scratch-cleanup --repo <path> --apply',
    ],
  };

  if (options.json) console.log(JSON.stringify(policy, null, 2));
  else {
    console.log('# SDLC Scratch Script Policy\n');
    console.log(`Controlled folder: ${policy.controlledScratchScriptDir}`);
    console.log(`Default TTL: ${policy.defaultTtlDays} days\n`);
    console.log(formatList(policy.rules));
    console.log('\nUseful commands:\n');
    console.log(formatList(policy.commands));
  }
}

export function artifactScratchAudit(repo, options = {}) {
  const scratchRel = normalizeRel(relative(repo, defaultScratchScriptsDir(repo)));
  const changedFiles = getGitInfo(repo).changedFiles;
  const scriptFiles = changedFiles.filter((file) => /\.(ps1|sh|cmd|bat)$/i.test(file));
  const rows = scriptFiles.map((file) => {
    const rel = normalizeRel(file);
    const controlled = rel.startsWith(`${scratchRel}/`);
    return {
      status: controlled ? 'pass' : 'warn',
      file,
      recommendation: controlled ? 'scratch script is in controlled local folder' : `move temporary script to ${scratchRel}/ or make the durable intent explicit`,
    };
  });

  if (!rows.length) rows.push({ status: 'pass', file: '(none)', recommendation: 'no changed script artifacts detected' });

  if (options.json) console.log(JSON.stringify({ repository: repo, controlledScratchScriptDir: scratchRel, rows }, null, 2));
  else printTable(['Status', 'File', 'Recommendation'], rows.map((row) => [row.status, row.file, row.recommendation]));

  if (rows.some((row) => row.status === 'warn')) process.exitCode = 1;
}

export function artifactScratchCleanup(repo, options = {}) {
  const scratchDir = defaultScratchScriptsDir(repo);
  const maxAgeDays = Number(options.maxAgeDays || options.ttlDays || 7);
  const apply = Boolean(options.apply || options.write);
  const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const rows = scratchCleanupRows(scratchDir, cutoffMs);

  if (apply) {
    for (const row of rows) {
      if (row.action !== 'delete') continue;
      try {
        unlinkSync(row.abs);
        row.status = 'deleted';
      } catch (error) {
        row.status = 'error';
        row.reason = `${row.reason}; ${error.message}`;
      }
    }
  }

  const printableRows = rows.map((row) => [row.status || (apply ? row.action : 'dry-run'), relative(repo, row.abs), row.reason]);
  if (options.json) console.log(JSON.stringify({
    repository: repo,
    controlledScratchScriptDir: relative(repo, scratchDir),
    maxAgeDays,
    apply,
    rows: rows.map(({ abs, ...row }) => ({ ...row, file: relative(repo, abs) })),
  }, null, 2));
  else {
    console.log(`# SDLC Scratch Script Cleanup ${apply ? '' : '(dry run)'}\n`);
    console.log(`Controlled folder: ${relative(repo, scratchDir)}`);
    console.log(`TTL: ${maxAgeDays} days`);
    console.log(apply ? 'Deletion applied only inside the controlled scratch folder.\n' : 'Pass --apply to delete cleanup candidates.\n');
    printTable(['Status', 'File', 'Reason'], printableRows);
  }
}

export function artifactMigrate(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const runDir = info.runDir || ensureControlRunDir(repo, options, options.task || 'migration');
  const marker = join(runDir, 'artifact-migration.json');
  safeWriteJsonFile(repo, marker, { schema: 'sdlc-artifact-migration-v1', migratedAt: new Date().toISOString(), action: 'no-op-current-version' });
  console.log(relative(repo, marker));
}

export function artifactFindings(runDir) {
  const expected = ['state.json', 'evidence.json', 'checks.jsonl', 'gates.jsonl', 'waivers.jsonl', 'trace.jsonl'];
  if (!existsSync(runDir)) return [{ status: 'block', artifact: runDir, detail: 'run directory not found' }];
  return expected.map((file) => {
    const path = join(runDir, file);
    if (!existsSync(path)) return { status: ['waivers.jsonl', 'gates.jsonl'].includes(file) ? 'warn' : 'block', artifact: file, detail: 'missing' };
    if (file.endsWith('.json') && !readJsonIfExists(path)) return { status: 'block', artifact: file, detail: 'invalid json' };
    if (file.endsWith('.jsonl') && readJsonLines(path).some((row) => row.parseError)) return { status: 'block', artifact: file, detail: 'invalid jsonl row' };
    return { status: 'pass', artifact: file, detail: 'present' };
  });
}

function artifactLifecycleRows(runDir) {
  if (!existsSync(runDir)) return [{ recommendation: 'record cap', artifact: runDir, reason: 'run directory not found' }];
  const files = listArtifactFiles(runDir).slice(0, 250);
  if (!files.length) return [{ recommendation: 'record', artifact: runDir, reason: 'no artifacts found' }];
  return files.map((file) => {
    const size = safeSize(file.abs);
    if (/run\.json$|run\.md$|state\.json$|evidence\.json$/.test(file.rel)) return { recommendation: 'keep', artifact: file.rel, reason: 'canonical run/evidence state' };
    if (/agents\/.+\.md$/.test(file.rel)) return { recommendation: 'keep or summarize', artifact: file.rel, reason: 'handoff packet; summarize if prompt context gets large' };
    if (/\.jsonl$/.test(file.rel)) return { recommendation: 'summarize', artifact: file.rel, reason: 'event/check log; use summary for prompt context' };
    if (size > 80_000) return { recommendation: 'summarize', artifact: file.rel, reason: `large artifact (${size} bytes)` };
    if (/tool-gaps|tools\.json|capability|local-first/i.test(file.rel)) return { recommendation: 'keep for run', artifact: file.rel, reason: 'local-first fact cache; refresh instead of copying into durable docs' };
    return { recommendation: 'review', artifact: file.rel, reason: 'decide whether temporary evidence, durable context, or learning candidate' };
  });
}

function scratchCleanupRows(scratchDir, cutoffMs) {
  if (!existsSync(scratchDir)) return [{ action: 'keep', status: 'missing', abs: scratchDir, reason: 'controlled scratch folder does not exist' }];
  const files = listArtifactFiles(scratchDir).filter((file) => /\.(ps1|sh|cmd|bat)$/i.test(file.rel)).slice(0, 500);
  if (!files.length) return [{ action: 'keep', status: 'empty', abs: scratchDir, reason: 'no scratch scripts found' }];
  return files.map((file) => {
    let stat;
    try {
      stat = statSync(file.abs);
    } catch {
      return { action: 'keep', status: 'unknown', abs: file.abs, reason: 'could not stat file' };
    }
    if (stat.mtimeMs < cutoffMs) return { action: 'delete', abs: file.abs, reason: 'older than scratch script TTL' };
    return { action: 'keep', abs: file.abs, reason: 'inside TTL' };
  });
}

function normalizeRel(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function listArtifactFiles(root) {
  const out = [];
  function walk(dir, prefix = '', depth = 0) {
    if (depth > 5) return;
    let entries = [];
    try {
      entries = readdirSync(dir).slice(0, 300);
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = join(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      let stat;
      try {
        stat = statSync(abs);
      } catch {
        continue;
      }
      if (stat.isDirectory()) walk(abs, rel, depth + 1);
      else out.push({ abs, rel });
    }
  }
  walk(root);
  return out;
}

function safeSize(path) {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}
