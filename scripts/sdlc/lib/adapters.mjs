import { join, relative, resolve } from 'node:path';
import { safeWriteTextFile } from './common.mjs';

export function adapterGenerate(repo, options = {}) {
  const runtime = options.runtime || 'generic';
  const lines = ['# SDLC Runtime Adapter', '', `Runtime: ${runtime}`, '', '## How To Use', '', '- Ask the agent: `Use SDLC for this task: <task>`.', '- For review: `Use SDLC and review the current completion state of this task: <task>`.', '- Start from local context packets instead of loading every SDLC document.', '', '## Required First Commands', '', '```bash', 'sdlc config validate', 'sdlc capability snapshot', 'sdlc context assemble --phase planning --task "..."', '```', '', '## Context Rules', '', '- Do not load archived plans unless the user asks for historical provenance.', '- Prefer `sdlc context assemble --phase <phase>` over broad document dumps.', '- Use `sdlc context budget` when prompt size feels high.', '- Ask for more context with a specific reason when the packet is insufficient.', '', '## Boundaries', '', '- Commit and push require explicit human approval.', '- Merge, deploy, release, MR/PR creation, pipeline triggers, and file movement are outside default automation.'];
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', `sdlc-adapter-${runtime}.md`);
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}
