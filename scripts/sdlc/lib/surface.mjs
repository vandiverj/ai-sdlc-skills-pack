export function classifyTouchedSurface(file) {
  const value = String(file || '').toLowerCase();
  if (/\.(asp|asa|aspx|ascx)$/.test(value)) return 'frontend/UI';
  if (/\.(tsx|jsx|css|scss|html|vue|svelte)$/.test(value)) return 'frontend/UI';
  if (/\.(cs|vb|fs|go|rs|java|kt|php|rb|py)$/.test(value)) return 'backend/API';
  if (/\.(sql)$/.test(value) || value.includes('migration') || value.includes('schema')) return 'database/storage';
  if (value.includes('contract') || value.includes('openapi') || value.includes('swagger') || value.includes('proto')) return 'contracts/interfaces';
  if (value.includes('integration') || value.includes('webhook') || value.includes('vendor') || value.includes('third')) return 'external integration';
  if (value.includes('package.json') || value.includes('package-lock') || value.includes('pnpm-lock') || value.includes('yarn.lock') || value.includes('deno.json')) return 'dependencies';
  if (value.includes('.env') || value.includes('config') || value.includes('appsettings') || value.includes('pipeline') || value.includes('docker')) return 'config/environment';
  if (/\.(test|spec)\./.test(value) || value.includes('__tests__') || value.includes('/tests/')) return 'tests';
  if (value.endsWith('.md') || value.includes('/docs/')) return 'docs/context';
  if (value.includes('/scripts/') || value.includes('/tools/') || value.includes('/bin/')) return 'scripts/tooling';
  if (value.includes('/dist/') || value.includes('/build/') || value.includes('/generated/')) return 'generated/build artifacts';
  return 'source/other';
}

export function classifyRuntimeSurface(file) {
  const value = String(file || '').toLowerCase();
  if (/\.(asp|asa)$/.test(value)) return 'ASP Classic';
  if (/\.(cs|csproj|sln)$/.test(value)) return '.NET';
  if (/\.(sql)$/.test(value)) return 'SQL/database';
  if (value.includes('deno.json') || value.includes('jsr.json')) return 'Deno/JSR';
  if (value.includes('package.json') || /\.(ts|tsx|js|jsx)$/.test(value)) return 'Node/TypeScript';
  if (value.includes('next.config')) return 'Next.js';
  if (value.includes('docker') || value.includes('pipeline') || value.includes('workflow')) return 'deployment/tooling';
  return 'generic';
}

export function needsManualQa(file) {
  return ['frontend/UI', 'backend/API', 'database/storage', 'external integration', 'contracts/interfaces', 'config/environment', 'dependencies'].includes(classifyTouchedSurface(file));
}
