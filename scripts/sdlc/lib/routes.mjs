import { dedupe } from './common.mjs';

function matchesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function profileToken(value) {
  const text = String(value || '').trim();
  if (!text || text.includes(' / ')) return '';
  return text;
}

export function inferLikelyRoute(gitInfo) {
  if (!gitInfo.status) return 'resume-work or review-work';
  if (gitInfo.changedFiles.every((file) => file.endsWith('.md'))) return 'tiny-docs';
  return 'standard';
}

export function inferRouteFromTask(task, gitInfo, profile = {}) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const explicitNonUiApi = matchesAny(text, ['api-only', 'api only', 'swagger', 'openapi', 'developer testing']) && matchesAny(text, ['no rendered product ui', 'not rendered product ui', 'no browser ui', 'no user interface', 'without ui']);
  if (hasReviewIntent(text) && matchesAny(text, ['without edit', 'without making edit', 'no edit', 'read-only', 'read only'])) return 'review-only';
  if (matchesAny(text, ['multi-repo', 'multi repo', 'cross repo', 'multiple service', 'multiple repo', 'multiple repositories', 'five repositories', 'several repositories', 'workspace', 'release order'])) return 'multi-repo-integration';
  if (matchesAny(text, ['contract', 'interface', 'public api', 'sdk', 'cli flag', 'config format', 'event schema', 'message schema'])) return 'contract-first';
  if (!matchesAny(text, ['separately deployed', 'deployable codebase', 'deployable api', 'deployable project']) && (matchesAny(text, ['release', 'push', 'deploy', 'merge']) || (text.includes('handoff') && !matchesAny(text, ['qa handoff', 'manual qa', 'test script'])))) return 'release-push';
  if (hasReviewIntent(text)) return 'review-only';
  if (explicitNonUiApi || (matchesAny(text, ['swagger', 'openapi', 'api-only', 'api only', 'developer testing']) && !matchesAny(text, ['user interface', 'visible ui', 'rendered product ui']))) return 'standard';
  if (matchesAny(text, ['multi-project repository', 'multiple projects', 'multiple codebases', 'multiple code bases', 'deployable codebase', 'deployable api codebase'])) return 'standard';
  if (matchesAny(text, ['weak test', 'coverage', 'missing test', 'no automated tests']) || (text.includes('legacy') && matchesAny(text, ['test', 'coverage', 'regression']))) return 'weak-test-legacy';
  if (matchesAny(text, ['qa script', 'qa test', 'quality assurance', 'youtrack', 'manual qa', 'test script'])) return 'standard';
  if (matchesAny(text, ['spa artifact', 'generated spa', 'webpack', 'rollup', 'publish script', 'build-only app', 'build only app', 'generated bundle', 'artifact promotion'])) return 'standard';
  if (matchesAny(text, ['user interface', 'rendered product ui', 'visible ui', 'layout', 'mobile', 'accessibility', 'button', 'screen', 'page', 'board', 'placement', 'animation', 'animate', 'delay', 'turn feel', 'feels like a turn'])) return 'ui-rendered-review';
  if (matchesAny(text, ['staging log', 'production log', 'sql log', 'foreign key', 'fk ', 'live-connected', 'live connected'])) return 'bugfix-live-system';
  if (matchesAny(text, ['docs', 'readme', 'markdown']) && !gitInfo.status) return 'tiny-docs';
  if (hasBugfixIntent(text)) return 'bugfix-regression';
  return inferLikelyRoute(gitInfo) === 'tiny-docs' ? 'tiny-docs' : 'standard';
}

export function inferDirtySurfaces(task, gitInfo) {
  const text = task.toLowerCase();
  const surfaces = [];
  if (matchesAny(text, ['ui', 'render', 'layout', 'mobile', 'accessibility', 'page', 'screen', 'animation', 'animate', 'delay', 'turn feel', 'feels like a turn'])) surfaces.push('rendered UI');
  if (matchesAny(text, ['api', 'contract', 'schema', 'event', 'webhook'])) surfaces.push('API/contracts/events');
  if (matchesAny(text, ['database', 'migration', 'data', 'retention'])) surfaces.push('data model/storage');
  if (matchesAny(text, ['auth', 'permission', 'credential', 'secret', 'token'])) surfaces.push('security/auth');
  if (matchesAny(text, ['docs', 'context', 'readme'])) surfaces.push('docs/context');
  if (matchesAny(text, ['test', 'coverage', 'e2e'])) surfaces.push('test automation');
  if (gitInfo.changedFiles.length) surfaces.push(...gitInfo.changedFiles.slice(0, 12));
  return dedupe(surfaces);
}

export function inferContracts(task, profile) {
  const text = `${task} ${profile.repositoryRole || ''}`.toLowerCase();
  const items = [];
  if (matchesAny(text, ['api', 'endpoint', 'http', 'rest', 'graphql'])) items.push('API endpoint or client contract');
  if (matchesAny(text, ['event', 'queue', 'topic', 'message'])) items.push('event/message contract');
  if (matchesAny(text, ['schema', 'database', 'migration', 'model'])) items.push('data schema contract');
  if (matchesAny(text, ['workflow', 'process', 'handoff'])) items.push('workflow contract');
  return dedupe(items);
}

export function securityTriggers(task, profile = {}) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const triggers = [];
  if (matchesAny(text, ['secret', 'credential', 'password', 'token', 'api key', 'private key'])) triggers.push('secrets or credentials');
  if (matchesAny(text, ['dependency', 'package', 'install', 'npm install', 'pip install', 'cargo add', 'plugin'])) triggers.push('new dependency or tool install');
  if (matchesAny(text, ['external api', 'webhook', 'http', 'curl', 'network', 'third party', 'third-party'])) triggers.push('external API or network call');
  if (matchesAny(text, ['mcp', 'tool install', 'plugin install', 'connector'])) triggers.push('MCP/tool install');
  if (matchesAny(text, ['youtrack', 'ticket', 'issue id', 'acceptance criteria', 'yt-'])) triggers.push('ticket-system evidence');
  if (matchesAny(text, ['database mcp', 'read-only database', 'read only database', 'db mcp', 'native soc', 'production data', 'row-level', 'query production'])) triggers.push('database evidence boundary');
  if (matchesAny(text, ['credentialed write', 'write action', 'push', 'deploy', 'publish'])) triggers.push('credentialed write action');
  if (matchesAny(text, ['production', 'prod', 'deploy', 'release'])) triggers.push('production or release surface');
  if (matchesAny(text, ['cross repo', 'multi repo', 'multi-repo', 'release order'])) triggers.push('cross-repo release order');
  if (matchesAny(text, ['runtime adapter', 'adapter', 'agent', 'skill'])) triggers.push('generated runtime adapter or skill surface');
  if (matchesAny(text, ['prompt injection', 'tool injection', 'untrusted input', 'user content'])) triggers.push('prompt/tool injection risk');
  if (matchesAny(text, ['delete', 'remove all', 'rm -rf', 'reset', 'force push', 'bulk rewrite'])) triggers.push('broad file mutation or destructive command');
  return dedupe(triggers);
}

export function hasReviewIntent(text) {
  return /\b(review|inspect|audit)\b/.test(text);
}

export function hasBugfixIntent(text) {
  return /\b(bug|fix|regression|broken|failing|failure)\b/.test(text);
}
