import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fail, formatList, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { inferContracts } from './routes.mjs';

export function contractPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the contract packet can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-contract-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Contract Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}

## Contract Surfaces

${formatList(contracts.length ? contracts : ['public or cross-boundary interface to be identified'])}

## Required Decisions Before Implementation

- Producer/consumer ownership:
- Backward compatibility:
- Versioning or migration:
- Error behavior:
- Rollout/release order:
- Test or contract verification path:

## Interface Evidence

| Surface | Current behavior | Proposed behavior | Verification |
| --- | --- | --- | --- |
|  |  |  |  |

## Stop Gates

- No implementation plan before public or cross-boundary contract direction is clear.
- Human approval is needed when compatibility, release order, data, or ownership is unclear.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}
