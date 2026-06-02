import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { dedupe, dedupeBy, escapeCell, escapeCommandArg, fail, formatInlineStatus, formatList, optionFiles, printObject, printTable, readJsonIfExists } from './common.mjs';
import { discoverCommands, loadProfile, parseMarkdownProfile } from './profile.mjs';
import { getGitInfo } from './git.mjs';


export function matchesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

export function unitRegistry(repo, profile = loadProfile(repo)) {
  const configured = profile.units && profile.units.length ? profile.units : [];
  const inferred = configured.length ? [] : inferRepoUnits(repo);
  const units = (configured.length ? configured : inferred.length ? inferred : [{ name: 'default', path: '.', type: detectStack(repo).join(', ') || 'generic' }])
    .map((unit) => enrichUnit(repo, unit));
  return units.sort((a, b) => normalizeUnitPath(b.path).length - normalizeUnitPath(a.path).length || a.name.localeCompare(b.name));
}

export function enrichUnit(repo, unit) {
  const fullPath = resolve(repo, unit.path || '.');
  const localProfile = join(fullPath, '.ai-local', 'sdlc-profile.md');
  const unitProfile = existsSync(localProfile) ? parseMarkdownProfile(readFileSync(localProfile, 'utf8')) : {};
  delete unitProfile.path;
  const merged = { ...unit, ...unitProfile };
  return {
    name: merged.name || basename(fullPath) || 'default',
    path: merged.path || relative(repo, fullPath) || '.',
    type: merged.type || inferUnitType(fullPath),
    testSurface: merged.testSurface || inferUnitSurface(fullPath, merged),
    contextBucket: merged.contextBucket || merged.repositoryRole || '',
    durableContextFile: merged.durableContextFile || merged.contextFile || '',
    buildCommand: merged.buildCommand || '',
    testCommand: merged.testCommand || '',
    deployMethod: merged.deployMethod || '',
    swaggerOpenapi: merged.swaggerOpenapi || merged.swagger || merged.openapi || '',
    localProfile: existsSync(localProfile) ? localProfile : '',
  };
}

export function inferRepoUnits(repo) {
  const units = [];
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  if (packageJson) units.push({ name: packageJson.name || basename(repo), path: '.', type: 'node/package' });
  for (const file of findFilesByExt(repo, ['.csproj'], 4, 80)) units.push({ name: basename(file, '.csproj'), path: dirname(relative(repo, file)), type: 'dotnet-project' });
  for (const file of findFilesByName(repo, ['openapi.json', 'openapi.yaml', 'swagger.json', 'swagger.yaml'], 4, 40)) units.push({ name: basename(dirname(file)) || 'openapi', path: dirname(relative(repo, file)), type: 'api-contract', testSurface: 'api-contract', swaggerOpenapi: relative(repo, file) });
  return dedupeBy(units, (unit) => `${unit.name}:${unit.path}`);
}

export function inferUnitType(path) {
  if (existsAny(path, ['package.json'])) return 'node/package';
  if (findFilesByExt(path, ['.csproj'], 1, 1).length) return 'dotnet-project';
  if (findFilesByName(path, ['openapi.json', 'openapi.yaml', 'swagger.json', 'swagger.yaml'], 2, 1).length) return 'api-contract';
  return '';
}

export function inferUnitSurface(fullPath, unit = {}) {
  const text = `${unit.name || ''} ${unit.path || ''} ${unit.type || ''} ${unit.swaggerOpenapi || ''}`.toLowerCase();
  if (matchesAny(text, ['swagger', 'openapi', 'api-contract'])) return 'api-contract';
  if (matchesAny(text, ['worker', 'job', 'queue', 'import', 'export'])) return 'background-job';
  if (matchesAny(text, ['sql', 'database', 'migration'])) return 'data-persistence';
  if (matchesAny(text, ['react', 'web', 'ui', 'site', 'asp'])) return 'rendered-product-ui';
  if (findFilesByName(fullPath, ['openapi.json', 'openapi.yaml', 'swagger.json', 'swagger.yaml'], 2, 1).length) return 'api-contract';
  if (findFilesByExt(fullPath, ['.tsx', '.jsx', '.asp', '.aspx', '.html'], 2, 1).length) return 'rendered-product-ui';
  if (findFilesByExt(fullPath, ['.sql'], 2, 1).length) return 'data-persistence';
  return 'service-behavior';
}

export function affectedUnits(repo, files, profile = loadProfile(repo), explicitUnit = '') {
  const units = unitRegistry(repo, profile);
  if (explicitUnit) return units.filter((unit) => unit.name.toLowerCase() === String(explicitUnit).toLowerCase());
  if (!files.length) return units.filter((unit) => unit.path === '.') || units.slice(0, 1);
  const matched = [];
  for (const file of files) {
    const normalizedFile = normalizeUnitPath(file);
    const unit = units.find((candidate) => {
      const unitPath = normalizeUnitPath(candidate.path);
      return unitPath === '.' || normalizedFile === unitPath || normalizedFile.startsWith(`${unitPath}/`);
    });
    if (unit) matched.push(unit);
  }
  return dedupeBy(matched.length ? matched : units.slice(0, 1), (unit) => unit.name);
}

export function normalizeUnitPath(value) {
  const text = String(value || '.').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  return text || '.';
}

export function inferTestingSurfaces(repo, task, files, profile = loadProfile(repo)) {
  const text = `${task} ${profile.values?.repositoryRole || ''}`.toLowerCase();
  const surfaces = [];
  for (const unit of affectedUnits(repo, files, profile)) if (unit.testSurface) surfaces.push(unit.testSurface);
  for (const file of files) surfaces.push(classifyTestingSurface(file));
  if (matchesAny(text, ['swagger', 'openapi', 'endpoint', 'api-only', 'api only', 'developer testing'])) surfaces.push('api-contract');
  if (matchesAny(text, ['user interface', 'visible ui', 'rendered product ui', 'layout', 'screen', 'page', 'button', 'board', 'placement', 'animation'])) surfaces.push('rendered-product-ui');
  if (matchesAny(text, ['database', 'sql', 'ef core', 'migration', 'foreign key', 'stored procedure'])) surfaces.push('data-persistence');
  if (matchesAny(text, ['third-party', 'third party', 'provider', 'webhook', 'integration'])) surfaces.push('integration-provider');
  if (matchesAny(text, ['worker', 'queue', 'scheduled', 'import', 'export', 'background job'])) surfaces.push('background-job');
  if (matchesAny(text, ['package', 'dependency', 'tooling', 'build'])) surfaces.push('package-tooling');
  let result = dedupe(surfaces.filter(Boolean));
  const hasUiFile = files.some((file) => classifyTestingSurface(file) === 'rendered-product-ui');
  if (result.includes('api-contract') && !hasUiFile && matchesAny(text, ['api-only', 'api only', 'swagger', 'openapi', 'developer testing'])) {
    result = result.filter((surface) => surface !== 'rendered-product-ui');
  }
  return result;
}

export function classifyTestingSurface(file) {
  const value = String(file || '').toLowerCase();
  if (value.includes('openapi') || value.includes('swagger') || value.endsWith('.http') || value.includes('postman')) return 'api-contract';
  if (/\.(tsx|jsx|css|scss|html|vue|svelte|asp|aspx|ascx)$/.test(value)) return 'rendered-product-ui';
  if (/\.(sql)$/.test(value) || value.includes('migration') || value.includes('schema')) return 'data-persistence';
  if (value.includes('integration') || value.includes('webhook') || value.includes('/provider') || value.includes('provider/') || value.includes('vendor') || value.includes('third-party') || value.includes('third_party')) return 'integration-provider';
  if (value.includes('worker') || value.includes('job') || value.includes('queue') || value.includes('import') || value.includes('export')) return 'background-job';
  if (value.includes('package.json') || value.includes('package-lock') || value.includes('pipeline') || value.includes('docker')) return 'package-tooling';
  if (value.endsWith('.md') || value.includes('/docs/') || value.includes('/learnings/')) return 'docs-process';
  if (/\.(cs|vb|fs|go|rs|java|kt|php|rb|py|ts|js)$/.test(value)) return 'service-behavior';
  return '';
}

export function qaModeForSurfaces(surfaces, task = '') {
  const text = String(task || '').toLowerCase();
  if (matchesAny(text, ['scenario', 'retest'])) return 'scenario-retest';
  if (matchesAny(text, ['interactive', 'stateful', 'game', 'gameplay', 'difficulty', 'settings', 'animation', 'mode', 'wizard', 'dashboard'])) return 'interactive-stateful';
  if (matchesAny(text, ['cli', 'command line', 'terminal command'])) return 'cli-workflow';
  if (matchesAny(text, ['worker', 'background job', 'queue', 'scheduled job', 'import job', 'export job'])) return 'background-job';
  if (surfaces.includes('api-contract')) return 'api-contract';
  if (surfaces.includes('rendered-product-ui')) return 'ui-workflow';
  if (surfaces.includes('data-persistence')) return 'data-persistence';
  if (surfaces.includes('integration-provider')) return 'integration-provider';
  if (surfaces.includes('background-job')) return 'background-job';
  if (surfaces.includes('docs-process')) return 'docs-process';
  return 'workflow';
}

export function detectStack(repo) {
  const markers = [
    [existsAny(repo, ['package.json']), 'Node/TypeScript'],
    [existsAny(repo, ['deno.json', 'deno.jsonc', 'jsr.json']), 'Deno/JSR'],
    [existsAny(repo, ['next.config.js', 'next.config.mjs', 'next.config.ts']), 'Next.js'],
    [hasFileExt(repo, ['.sln', '.csproj', '.vbproj']), '.NET'],
    [hasFileExt(repo, ['.asp', '.asa']), 'ASP Classic'],
    [hasFileExt(repo, ['.sql']), 'SQL/database'],
    [existsAny(repo, ['Dockerfile', 'docker-compose.yml']) || existsSync(join(repo, '.github')), 'CI/deployment'],
  ];
  return markers.filter(([present]) => present).map(([, label]) => label);
}

export function detectPackageManager(repo) {
  if (existsAny(repo, ['pnpm-lock.yaml'])) return 'pnpm';
  if (existsAny(repo, ['yarn.lock'])) return 'yarn';
  if (existsAny(repo, ['package-lock.json'])) return 'npm';
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) return 'deno';
  if (existsAny(repo, ['bun.lockb', 'bun.lock'])) return 'bun';
  if (existsAny(repo, ['packages.lock.json'])) return 'nuget';
  return '';
}

export function existsAny(repo, paths) {
  return paths.some((item) => existsSync(join(repo, item)));
}

export function hasFileExt(repo, extensions) {
  let scanned = 0;
  const visit = (dir, depth = 0) => {
    if (depth > 4 || scanned > 5000) return false;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      scanned++;
      if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory() && visit(path, depth + 1)) return true;
      if (entry.isFile() && extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) return true;
    }
    return false;
  };
  return visit(repo);
}

export function findFilesByExt(repo, extensions, maxDepth = 4, maxResults = 100) {
  return findRepoFiles(repo, (file) => extensions.some((ext) => file.toLowerCase().endsWith(ext)), maxDepth, maxResults);
}

export function findFilesByName(repo, names, maxDepth = 4, maxResults = 100) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  return findRepoFiles(repo, (file) => wanted.has(basename(file).toLowerCase()), maxDepth, maxResults);
}

export function findRepoFiles(repo, predicate, maxDepth = 4, maxResults = 100) {
  const results = [];
  const visit = (dir, depth = 0) => {
    if (depth > maxDepth || results.length >= maxResults) return;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (['.git', 'node_modules', 'dist', 'build', '.next', '.ai-local'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path, depth + 1);
      else if (entry.isFile() && predicate(path)) results.push(path);
    }
  };
  visit(repo);
  return results;
}


export function surfaceList() {
  console.log(`# SDLC Testing Surface Taxonomy

| Surface | Use For | Not For |
| --- | --- | --- |
| rendered-product-ui | browser-visible product UI, layout, interaction, copy, animation | Swagger/OpenAPI-only APIs |
| api-contract | Swagger/OpenAPI, HTTP endpoints, request/response contracts, developer API testing | human browser layout review |
| service-behavior | backend logic, domain services, business rules, controllers without UI rendering | end-user visual acceptance |
| data-persistence | SQL, EF, migrations, stored procedures, persistence invariants | generic UI smoke |
| integration-provider | third-party/provider calls, webhooks, exports/imports, sandbox behavior | local-only unit behavior |
| background-job | scheduled jobs, queues, workers, import/export processes | interactive UI workflows |
| package-tooling | dependency upgrades, build/test/toolchain changes | product behavior without startup/build risk |
| docs-process | docs, agent process, prompts, templates, context routing | product runtime behavior |
`);
}

export function surfaceDetect(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  printObject({
    repository: repo,
    task: task || 'not provided',
    files: files.length,
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    renderedUiRequired: surfaces.includes('rendered-product-ui') ? 'yes' : 'no',
    apiContractTesting: surfaces.includes('api-contract') ? 'yes' : 'no',
    recommendedNextCommand: surfaces.includes('api-contract') ? `sdlc qa script --mode api --task "${escapeCommandArg(task || 'current task')}"` : `sdlc smoke packet --task "${escapeCommandArg(task || 'current task')}"`,
  });
}

export function unitMap(repo, options = {}) {
  const profile = loadProfile(repo);
  const units = unitRegistry(repo, profile);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const rows = units.map((unit) => `| ${escapeCell(unit.name)} | ${escapeCell(unit.path)} | ${escapeCell(unit.type)} | ${escapeCell(unit.testSurface)} | ${escapeCell(unit.contextBucket)} | ${escapeCell(unit.deployMethod)} | ${escapeCell(unit.localProfile ? relative(repo, unit.localProfile) : '')} |`);
  const content = `# SDLC Deployable Unit Map

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Units

| Unit | Path | Type | Test surface | Context bucket | Deploy method | Unit-local profile |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Resolution Order

1. Explicit \`--unit\`.
2. Changed file path matched to the longest unit path.
3. Repo-level unit registry.
4. Optional unit-local \`.ai-local/sdlc-profile.md\`.
5. Repo-level defaults.
6. Shared context root fallback.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function unitDetect(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  printObject({
    repository: repo,
    task: task || 'not provided',
    changedFiles: files.length,
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    contextBuckets: dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)).join(', ') || 'not configured',
    testingSurfaces: dedupe(units.map((unit) => unit.testSurface).filter(Boolean)).join(', ') || inferTestingSurfaces(repo, task, files, profile).join(', '),
    deployMethods: dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)).join(', ') || 'not configured',
  });
}

export function unitDoctor(repo, options = {}) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  const units = unitRegistry(repo, profile);
  const inferred = inferRepoUnits(repo);
  const findings = [];
  if (inferred.length > 1 && !profile.units?.length) findings.push('Multiple deployable/codebase units were inferred but no explicit repo-level unit registry is configured.');
  for (const unit of units) {
    if (!unit.path) findings.push(`${unit.name}: missing path.`);
    if (!unit.type) findings.push(`${unit.name}: missing type.`);
    if (!unit.testSurface) findings.push(`${unit.name}: missing test surface.`);
    if (!unit.contextBucket) findings.push(`${unit.name}: missing context bucket.`);
    if (!unit.buildCommand && !unit.testCommand && !commands.test && !commands.build) findings.push(`${unit.name}: missing build/test command or explicit verification cap.`);
    if (!unit.deployMethod && !profile.values.releasePolicy) findings.push(`${unit.name}: missing deploy method or explicit cap.`);
    if (unit.testSurface === 'rendered-product-ui' && unit.swaggerOpenapi) findings.push(`${unit.name}: has Swagger/OpenAPI hint but is marked rendered UI; verify surface.`);
  }
  const outPath = options.out ? resolve(repo, options.out) : '';
  const rows = units.map((unit) => `| ${escapeCell(unit.name)} | ${escapeCell(unit.path)} | ${escapeCell(unit.type)} | ${escapeCell(unit.testSurface)} | ${escapeCell(unit.contextBucket)} | ${escapeCell(unit.buildCommand || unit.testCommand || commands.test || commands.build || '')} | ${escapeCell(unit.deployMethod || profile.values.releasePolicy || '')} |`);
  const content = `# SDLC Unit Doctor

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Result: ${findings.length ? 'needs attention' : 'ready-looking'}

## Units

| Unit | Path | Type | Test surface | Context bucket | Command | Deploy method |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Findings

${formatList(findings.length ? findings : ['No obvious unit registry gaps detected.'])}

## Recommended Registry Fields

- name
- path
- type
- testSurface
- contextBucket
- durableContextFile
- buildCommand
- testCommand
- deployMethod
- swaggerOpenapi when applicable
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function unitProfile(repo, options = {}) {
  const unitName = options.unit || options.name || '';
  if (!unitName) fail('Pass --unit <name> so the unit profile can be selected.');
  const profile = loadProfile(repo);
  const unit = unitRegistry(repo, profile).find((item) => item.name.toLowerCase() === unitName.toLowerCase());
  if (!unit) fail(`Unit not found in profile or inferred units: ${unitName}`);
  printObject({
    repository: repo,
    unit: unit.name,
    path: unit.path,
    type: unit.type || 'not configured',
    testSurface: unit.testSurface || 'not configured',
    contextBucket: unit.contextBucket || 'not configured',
    durableContextFile: unit.durableContextFile || 'not configured',
    buildCommand: unit.buildCommand || 'not configured',
    testCommand: unit.testCommand || 'not configured',
    deployMethod: unit.deployMethod || 'not configured',
    swaggerOpenapi: unit.swaggerOpenapi || 'not configured',
    unitLocalProfile: unit.localProfile ? relative(repo, unit.localProfile) : 'none',
  });
}

export function unitList(repo, options = {}) {
  const units = unitRegistry(repo, loadProfile(repo));
  printTable(['Unit', 'Path', 'Type', 'Surface', 'Context'], units.map((unit) => [unit.name, unit.path, unit.type, unit.testSurface, unit.contextBucket || '']));
}

export function unitResolve(repo, options = {}) {
  const path = options.path || options.file || '';
  if (!path) fail('Pass --path <path>.');
  const unit = affectedUnits(repo, [path], loadProfile(repo), options.unit)[0];
  printObject({ path, unit: unit?.name || 'none', unitPath: unit?.path || '', testSurface: unit?.testSurface || '', contextBucket: unit?.contextBucket || '' });
}

export function unitContext(repo, options = {}) {
  const name = options.unit || options.name || '';
  if (!name) fail('Pass --unit <name>.');
  const unit = unitRegistry(repo, loadProfile(repo)).find((item) => item.name.toLowerCase() === String(name).toLowerCase());
  if (!unit) fail(`Unit not found: ${name}`);
  printObject({ unit: unit.name, path: unit.path, contextBucket: unit.contextBucket || 'not configured', durableContextFile: unit.durableContextFile || 'not configured', localProfile: unit.localProfile ? relative(repo, unit.localProfile) : 'not found' });
}
