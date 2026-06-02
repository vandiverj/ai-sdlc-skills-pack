import { join, relative, resolve } from 'node:path';
import { formatList, safeWriteTextFile } from './common.mjs';

export function adapterGenerate(repo, options = {}) {
  const runtime = options.runtime || 'generic';
  const lines = ['# SDLC Runtime Adapter', '', `Runtime: ${runtime}`, '', '## How To Use', '', '- Ask the agent: `Use SDLC for this task: <task>`.', '- For review: `Use SDLC and review the current completion state of this task: <task>`.', '- Start from local context packets instead of loading every SDLC document.', '', '## Required First Commands', '', '```bash', 'sdlc config validate', 'sdlc capability snapshot', 'sdlc context assemble --phase planning --task "..."', '```', '', '## Context Rules', '', '- Do not load archived plans unless the user asks for historical provenance.', '- Prefer `sdlc context assemble --phase <phase>` over broad document dumps.', '- Use `sdlc context budget` when prompt size feels high.', '- Ask for more context with a specific reason when the packet is insufficient.', '', '## Boundaries', '', '- Commit and push require explicit human approval.', '- Merge, deploy, release, MR/PR creation, pipeline triggers, and file movement are outside default automation.'];
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', `sdlc-adapter-${runtime}.md`);
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}


export function hooksPlan(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Hook Adapter Plan

Date: ${new Date().toISOString()}
Repository: ${repo}
Runtime: ${runtime}

## Position

Hooks are optional adapters over portable \`sdlc event ...\` commands. Normal SDLC usage must continue to work when runtime hooks are unavailable.

## Suggested Events

${formatList(hookPlanEvents(runtime))}

## Local Template

\`\`\`bash
# Generic pre-stop style check
sdlc event pre-stop --task "<task>"
sdlc gates --task "<task>"
\`\`\`

## Guardrails

- Keep hook-generated files local/ignored unless explicitly approved.
- Use hooks to suggest or block deterministic risk, not to hide human approval gates.
- Do not require a runtime-specific hook to complete normal SDLC work.
`;
  if (outPath) {
    safeWriteTextFile(repo, outPath, content)
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function hookPlanEvents(runtime) {
  const common = ['pre-stop: call `sdlc event pre-stop` and `sdlc gates` before claiming completion', 'approval-request: summarize risk and human gate', 'post-edit: suggest cheap route-appropriate checks'];
  if (runtime === 'claude') return ['UserPromptSubmit -> `sdlc event prompt-submit`', 'PostToolUse/Edit -> `sdlc event post-edit`', 'Stop -> `sdlc event pre-stop`', ...common];
  if (runtime === 'codex') return ['Use available hook/plugin surfaces only where supported; otherwise use agent prompt and CLI commands.', ...common];
  if (['auggie', 'augment'].includes(runtime)) return ['Use IDE/CLI task adapters if available; otherwise invoke `sdlc event ...` from run-sdlc guidance.', ...common];
  return common;
}
