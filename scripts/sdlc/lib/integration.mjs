import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, formatList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { defaultRunsDir } from './paths.mjs';

export function integrationPacket(repo, options = {}, dependencies = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the integration packet can be scoped.');
  const classifyTouchedSurface = dependencies.classifyTouchedSurface || (() => 'unknown');
  const git = getGitInfo(repo);
  const integrationFiles = git.changedFiles.filter((file) => classifyTouchedSurface(file) === 'external integration');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-integration-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Integration Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Integration Surfaces

${formatList(integrationFiles.length ? integrationFiles : ['No changed integration files detected yet; identify providers/endpoints/events/files during implementation.'])}

## Integration Checklist

- Provider/system:
- Endpoint/webhook/file/event:
- Auth/config touched:
- Sandbox/test path:
- Retry/error behavior:
- Logging/observability:
- QA validation path:
- Fallback/rollback:
- External dependency cap:

## Verification

- Sandbox/API check:
- Manual QA observable result:
- Unavailable integration cap:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}
