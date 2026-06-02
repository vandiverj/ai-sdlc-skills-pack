import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { dedupe } from './common.mjs';
import { existsAny, hasFileExt } from './units.mjs';

export function detectTestFrameworks(repo, packageJson) {
  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const names = Object.keys(deps);
  const frameworks = [];
  if (names.includes('vitest')) frameworks.push('Vitest');
  if (names.includes('jest') || names.includes('@types/jest')) frameworks.push('Jest');
  if (names.includes('@playwright/test') || existsAny(repo, ['playwright.config.ts', 'playwright.config.js'])) frameworks.push('Playwright');
  if (names.includes('cypress') || existsAny(repo, ['cypress.config.ts', 'cypress.config.js'])) frameworks.push('Cypress');
  if (hasFileExt(repo, ['.csproj']) && projectFilesContain(repo, ['xunit', 'nunit', 'mstest'])) frameworks.push('.NET test project');
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) frameworks.push('Deno test');
  return dedupe(frameworks);
}

export function detectCiSystems(repo) {
  const systems = [];
  if (existsSync(join(repo, '.github', 'workflows'))) systems.push('GitHub Actions');
  if (existsAny(repo, ['.gitlab-ci.yml'])) systems.push('GitLab CI');
  if (existsAny(repo, ['azure-pipelines.yml'])) systems.push('Azure Pipelines');
  if (existsAny(repo, ['buildspec.yml'])) systems.push('AWS CodeBuild/CodePipeline');
  if (existsAny(repo, ['Jenkinsfile'])) systems.push('Jenkins');
  return systems;
}

export function detectDeploySystems(repo) {
  const systems = [];
  if (existsAny(repo, ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'])) systems.push('containerized deploy');
  if (existsAny(repo, ['buildspec.yml'])) systems.push('AWS build/deploy pipeline');
  if (existsAny(repo, ['serverless.yml', 'serverless.ts'])) systems.push('Serverless');
  if (existsAny(repo, ['vercel.json'])) systems.push('Vercel');
  if (existsAny(repo, ['netlify.toml'])) systems.push('Netlify');
  if (existsSync(join(repo, '.ebextensions'))) systems.push('Elastic Beanstalk');
  return systems;
}

export function sharedContextReachability(repo, profile) {
  const paths = sharedContextPaths(repo, profile);
  if (!paths.length) return 'not configured';
  const reachable = paths.filter((item) => existsSync(item.path)).length;
  return `${reachable}/${paths.length}`;
}

export function sharedContextDetails(repo, profile) {
  const paths = sharedContextPaths(repo, profile);
  if (!paths.length) return ['- Shared/product/repo context paths are not configured.'];
  return paths.map((item) => `- ${item.label}: ${existsSync(item.path) ? 'reachable' : 'missing'} (${item.display})`);
}

export function sharedContextPaths(repo, profile) {
  return [
    ['sharedContextRoot', 'Shared context root'],
    ['productContext', 'Product context'],
    ['repoContext', 'Repo context'],
    ['productContextIndex', 'Product context index'],
    ['repoContextIndex', 'Repo context index'],
    ['serviceMap', 'Service map'],
    ['workflowMap', 'Workflow map'],
    ['releaseOrder', 'Release order'],
    ['knownFailureModes', 'Known failure modes'],
  ]
    .filter(([key]) => profile[key])
    .map(([key, label]) => {
      const path = resolveContextPath(repo, profile[key]);
      return { key, label, path, display: profile[key] };
    });
}

function projectFilesContain(repo, needles) {
  let scanned = 0;
  const lowerNeedles = needles.map((needle) => needle.toLowerCase());
  const visit = (dir, depth = 0) => {
    if (depth > 4 || scanned > 200) return false;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory() && visit(path, depth + 1)) return true;
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.csproj')) continue;
      scanned++;
      const text = readFileSync(path, 'utf8').toLowerCase();
      if (lowerNeedles.some((needle) => text.includes(needle))) return true;
    }
    return false;
  };
  return visit(repo);
}

function resolveContextPath(repo, value) {
  const text = String(value || '').trim();
  if (!text) return repo;
  if (text === '~') return process.env.HOME || repo;
  if (text.startsWith('~/')) return join(process.env.HOME || repo, text.slice(2));
  return resolve(repo, text);
}
