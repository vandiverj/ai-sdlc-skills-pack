import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fail, formatList, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteTextFile } from './common.mjs';

const FRONTIER_CODEX_AGENT_FILES = [
  'sdlc-context-scout.toml',
  'sdlc-read-only-code-scout.toml',
  'sdlc-implementation-planner.toml',
  'sdlc-implementation-worker.toml',
  'sdlc-verification-worker.toml',
  'sdlc-independent-reviewer.toml',
  'sdlc-security-privacy-reviewer.toml',
  'sdlc-qa-handoff-worker.toml',
  'sdlc-release-handoff-worker.toml',
  'sdlc-process-learning-reviewer.toml',
  'sdlc-feedback-reporter.toml',
];
const LOCAL_CODEX_AGENT_FILES = [
  'sdlc-local-read-only-code-scout.toml',
  'sdlc-lmstudio-read-only-code-scout.toml',
];

export function adapterGenerate(repo, options = {}) {
  const runtime = options.runtime || 'generic';
  const lines = ['# SDLC Runtime Adapter', '', `Runtime: ${runtime}`, '', '## How To Use', '', '- Ask the agent: `Use SDLC for this task: <task>`.', '- For review: `Use SDLC and review the current completion state of this task: <task>`.', '- Start from local context packets instead of loading every SDLC document.', '', '## Required First Commands', '', '```bash', 'sdlc config validate', 'sdlc capability snapshot', 'sdlc context assemble --phase planning --task "..."', '```', '', '## Context Rules', '', '- Do not load archived plans unless the user asks for historical provenance.', '- Prefer `sdlc context assemble --phase <phase>` over broad document dumps.', '- Use `sdlc context budget` when prompt size feels high.', '- Ask for more context with a specific reason when the packet is insufficient.', '', '## Boundaries', '', '- Commit and push require explicit human approval.', '- Merge, deploy, release, MR/PR creation, pipeline triggers, and file movement are outside default automation.'];
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', `sdlc-adapter-${runtime}.md`);
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}

export function adapterProfile(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const profile = runtimeProfile(runtime);
  if (options.json) {
    console.log(JSON.stringify({ schema: 'sdlc-adapter-profile-v1', runtime, repository: repo, ...profile }, null, 2));
    return;
  }
  printObject({ runtime, shell: profile.shell, hooks: profile.hooks, mcp: profile.mcp, browser: profile.browser });
  console.log('\n## Guidance\n');
  console.log(formatList(profile.guidance));
}

export function adapterPrompt(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const task = options.task || '<task>';
  const phase = options.phase || 'start';
  console.log(`Use SDLC for this task: ${task}. Runtime: ${runtime}. Phase: ${phase}. Start local-first, preserve my original prompt, gather deterministic facts, use repo-local configuration, verify with local evidence or explicit caps, prepare QA Markdown if needed, and stop before commit or push.`);
}

export function adapterLimits(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const profile = runtimeProfile(runtime);
  console.log(`# SDLC Adapter Limits: ${runtime}\n`);
  console.log(formatList([
    `Shell: ${profile.shell}`,
    `Hooks: ${profile.hooks}`,
    `MCP: ${profile.mcp}`,
    `Browser: ${profile.browser}`,
    'Do not assume runtime-specific support is present.',
    'Use CLI/chat fallback when hooks, MCPs, or browser tools are unavailable.',
  ]));
}

export function adapterCodexInstall(repo, options = {}) {
  const adaptersDir = resolve(repo, options.templates || 'templates/adapters/codex');
  const targetDir = resolve(options.target || join(homedir(), '.codex', 'agents'));
  const includeLocal = Boolean(options.includeLocal || options.local);
  const frontier = options.frontier !== false;
  const available = readdirSync(adaptersDir).filter((file) => file.endsWith('.toml'));
  const selected = frontier
    ? [...FRONTIER_CODEX_AGENT_FILES, ...(includeLocal ? LOCAL_CODEX_AGENT_FILES : [])]
    : available.filter((file) => file.startsWith('sdlc-'));
  const files = selected
    .filter((file) => includeLocal || !/local|lmstudio/i.test(file))
    .filter((file) => available.includes(file));

  if (!files.length) fail(`No Codex agent templates found in ${adaptersDir}.`);

  mkdirSync(targetDir, { recursive: true });
  const installed = [];
  for (const file of files) {
    const source = join(adaptersDir, file);
    const target = join(targetDir, file);
    if (options.dryRun) installed.push({ source, target, status: 'dry-run' });
    else {
      copyFileSync(source, target);
      installed.push({ source, target, status: 'installed' });
    }
  }

  if (options.json) {
    console.log(JSON.stringify({
      schema: 'sdlc.codex_agent_install.v1',
      mode: frontier ? 'frontier' : 'all-sdlc',
      targetDir,
      includeLocal,
      installed,
    }, null, 2));
    return;
  }

  printObject({
    mode: frontier ? 'frontier' : 'all-sdlc',
    targetDir,
    includeLocal,
    count: installed.length,
    status: options.dryRun ? 'dry-run' : 'installed',
  });
  console.log('\nInstalled agents:');
  console.log(formatList(installed.map((row) => `${row.status}: ${row.target}`)));
  console.log('\nRestart Codex or reload the current Codex surface if newly installed agents are not discoverable.');
}

export function adapterDoctor(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const profile = runtimeProfile(runtime);
  const capability = runtimeCapability(runtime);
  const result = {
    schema: 'sdlc-adapter-doctor-v1',
    runtime,
    repository: repo,
    cycle1: capability,
    capabilities: {
      shell: profile.shell,
      hooks: profile.hooks,
      mcp: profile.mcp,
      browser: profile.browser,
    },
    prompt: `Use SDLC for this task: <task>. Runtime: ${runtime}. Start local-first, keep context bounded, verify with local evidence or explicit caps, and stop before commit or push.`,
    preferredCli: [
      'sdlc operator dashboard --task "<task>"',
      'sdlc operator next --task "<task>"',
      'sdlc context project --task "<task>" --phase implement --check',
      'sdlc command recommend --task "<task>" --phase verify --learned',
    ],
    fallbackGuidance: [
      'If hooks are unavailable, use chat prompts plus explicit CLI commands.',
      'If MCPs are unavailable, rely on local repo evidence and pasted human context.',
      'If browser tools are unavailable, use local tests, render plans, and explicit caps.',
    ],
  };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    printObject({ runtime, shell: profile.shell, hooks: profile.hooks, mcp: profile.mcp, browser: profile.browser });
    console.log('\n## Cycle 1 Runtime Capability\n');
    printObject({
      invocationMethod: capability.invocationMethod,
      supportsStructuredOutput: capability.supportsStructuredOutput,
      supportsNoninteractiveExecution: capability.supportsNoninteractiveExecution,
      supportsLocalProvider: capability.supportsLocalProvider,
      supportsMcp: capability.supportsMcp,
      supportsHooksEvents: capability.supportsHooksEvents,
      supportsSandboxToolBoundaries: capability.supportsSandboxToolBoundaries,
      supportsResponseSchemaEnforcement: capability.supportsResponseSchemaEnforcement,
      supportsUsageTokenCapture: capability.supportsUsageTokenCapture,
      fallback: capability.fallback,
      recommendedNextArtifact: capability.recommendedNextArtifact,
    });
    console.log('\n## Known Caps\n');
    console.log(formatList(capability.knownCaps));
    console.log('\n## Preferred CLI\n');
    console.log(formatList(result.preferredCli));
    console.log('\n## Fallback Guidance\n');
    console.log(formatList(result.fallbackGuidance));
  }
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

# Optional activity capture when local mode allows it
sdlc activity status
sdlc activity command --task "<task>" --phase verification --command "<command>" --status pass
\`\`\`

## Guardrails

- Keep hook-generated files local/ignored unless explicitly approved.
- Check \`sdlc activity status\` before hook-generated activity capture; \`off\` disables passive/hook telemetry.
- Use \`light\` for phase/cap summaries, \`full\` for meaningful commands and artifacts, and \`debug\` only for local troubleshooting.
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

export function hooksContract(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const contract = {
    schema: 'sdlc-hook-contract-v1',
    runtime,
    events: ['prompt-submit', 'pre-edit', 'post-edit', 'command-start', 'command-finish', 'approval-request', 'pre-stop', 'finish-summary'],
    requiredFields: ['event', 'timestamp', 'runtime'],
    optionalFields: ['task', 'phase', 'command', 'status', 'summary', 'artifact'],
    guardrails: ['hooks optional', 'activity off disables passive capture', 'no release/ticket/database writes', 'human approvals remain required'],
  };
  if (options.json) console.log(JSON.stringify(contract, null, 2));
  else {
    console.log(`# SDLC Hook Contract\n\nRuntime: ${runtime}\n`);
    console.log(formatList([...contract.events.map((event) => `event: ${event}`), ...contract.guardrails]));
  }
}

export function eventValidate(repo, options = {}) {
  const file = options.file || '';
  if (!file) fail('Pass --file <event.json>.');
  const data = readJsonIfExists(resolve(repo, file));
  const findings = [];
  if (!data) findings.push('Invalid or unreadable JSON.');
  if (data && !data.event) findings.push('Missing event.');
  if (data && !data.timestamp) findings.push('Missing timestamp.');
  if (data && /merge|deploy|release|ticket.*update|db.*write/i.test(JSON.stringify(data))) findings.push('Protected action signal present; requires review.');
  printObject({ file, result: findings.length ? 'review-needed' : 'pass' });
  console.log(formatList(findings.length ? findings : ['Event matches the portable contract shape.']));
  if (findings.length) process.exitCode = 1;
}

export function eventReplay(repo, options = {}) {
  const file = options.file || '';
  if (!file) fail('Pass --file <events.jsonl>.');
  const rows = readJsonLines(resolve(repo, file));
  printObject({ file, events: rows.length, mode: options.dryRun ? 'dry-run' : 'review-only' });
  printTable(['Event', 'Phase', 'Summary'], rows.map((row) => [row.event || row.type || 'unknown', row.phase || '', row.summary || row.command || '']));
}

export function hookPlanEvents(runtime) {
  const common = ['pre-stop: call `sdlc event pre-stop` and `sdlc gates` before claiming completion', 'approval-request: summarize risk and human gate', 'post-edit: suggest cheap route-appropriate checks', 'activity command: optionally call `sdlc activity command` when mode is light/full/debug', 'activity cap: optionally call `sdlc activity cap` for repeated runtime limits'];
  if (runtime === 'claude') return ['UserPromptSubmit -> `sdlc event prompt-submit`', 'PostToolUse/Edit -> `sdlc event post-edit` and optional `sdlc activity event`', 'Stop -> `sdlc event pre-stop`', ...common];
  if (runtime === 'codex') return ['Use available hook/plugin surfaces only where supported; otherwise use agent prompt and CLI commands.', ...common];
  if (['auggie', 'augment'].includes(runtime)) return ['Use IDE/CLI task adapters if available; otherwise invoke `sdlc event ...` from run-sdlc guidance.', ...common];
  return common;
}

export function hooksAudit(repo, options = {}) {
  const runtime = String(options.runtime || 'generic').toLowerCase();
  const candidates = hookConfigCandidates(repo, runtime);
  const rows = candidates.map((path) => auditHookFile(repo, path));
  console.log(`# SDLC Hook Audit\n\nRuntime: ${runtime}\nRepository: ${repo}\n`);
  if (!rows.length) {
    console.log('No known hook configuration files found. Hooks remain optional.');
    return;
  }
  printTable(['File', 'Status', 'Finding', 'Recommendation'], rows.map((row) => [relative(repo, row.path), row.status, row.finding, row.recommendation]));
  if (rows.some((row) => row.status === 'block')) process.exitCode = 1;
}

function hookConfigCandidates(repo, runtime) {
  const all = [
    join(repo, '.claude', 'settings.json'),
    join(repo, '.claude', 'settings.local.json'),
    join(repo, '.augment', 'settings.json'),
    join(repo, '.auggie', 'settings.json'),
    join(repo, '.codex', 'settings.json'),
  ];
  return all.filter((path) => existsSync(path));
}

function runtimeProfile(runtime) {
  const base = {
    shell: 'available when coding tool exposes terminal',
    hooks: 'optional / runtime-specific',
    mcp: 'optional / developer-configured',
    browser: 'optional / tool-specific',
    guidance: ['Use chat-first SDLC prompt.', 'Run local-first CLI helpers when terminal access exists.', 'Fallback to human-provided evidence when MCPs are unavailable.'],
  };
  if (runtime === 'augment') return { ...base, hooks: 'limited/extension-dependent', guidance: [...base.guidance, 'Use VS Code extension prompt; Auggie CLI can run the same SDLC commands.'] };
  if (runtime === 'auggie') return { ...base, hooks: 'CLI-dependent', guidance: [...base.guidance, 'Use terminal commands directly for operator and command recommendation phases.'] };
  if (runtime === 'codex' || runtime === 'codex-exec') return { ...base, hooks: 'plugin/tool dependent', guidance: [...base.guidance, 'Prefer local CLI commands and explicit evidence summaries.'] };
  if (runtime === 'claude-code') return { ...base, hooks: 'runtime-specific', guidance: [...base.guidance, 'Use Claude Code prompts or settings only as adapters over portable SDLC packets.'] };
  if (runtime === 'manual-packet') return { ...base, shell: 'human/operator provided', hooks: 'none', mcp: 'none unless pasted or separately configured', browser: 'none unless human supplies evidence', guidance: [...base.guidance, 'Use generated packets directly; record caps for unavailable runtime features.'] };
  return base;
}

function runtimeCapability(runtime) {
  const base = {
    runtime,
    invocationMethod: 'chat or CLI prompt with generated SDLC packet',
    supportsStructuredOutput: 'partial / prompt-enforced',
    supportsNoninteractiveExecution: 'unknown',
    supportsLocalProvider: 'unknown',
    supportsMcp: 'optional / developer-configured',
    supportsHooksEvents: 'optional / runtime-specific',
    supportsSandboxToolBoundaries: 'runtime-specific',
    supportsResponseSchemaEnforcement: 'prompt/lint fallback',
    supportsUsageTokenCapture: 'unknown',
    knownCaps: ['Do not assume execution, tool access, schema enforcement, or usage capture without local proof.'],
    fallback: 'manual-packet',
    recommendedNextArtifact: 'sdlc agents packet --role <role> --task "<task>" --dry-run',
  };
  if (runtime === 'codex-exec' || runtime === 'codex') return {
    ...base,
    runtime: 'codex-exec',
    invocationMethod: 'codex exec with a portable role packet, when explicitly approved by the orchestrator',
    supportsStructuredOutput: 'prompt-enforced; validate response with sdlc response lint where applicable',
    supportsNoninteractiveExecution: 'yes when Codex CLI is installed and approved',
    supportsLocalProvider: 'no direct assumption; adapter may route prompts only',
    supportsMcp: 'yes when configured in the Codex environment',
    supportsHooksEvents: 'tool/plugin dependent',
    supportsSandboxToolBoundaries: 'yes, runtime/sandbox dependent',
    supportsResponseSchemaEnforcement: 'prompt/lint fallback',
    supportsUsageTokenCapture: 'runtime dependent; do not claim unless reported',
    knownCaps: ['Codex CLI availability is local-environment dependent.', 'Cycle 1 does not invoke codex exec automatically.', 'Packet lint does not prove model behavior.'],
  };
  if (runtime === 'claude-code') return {
    ...base,
    invocationMethod: 'Claude Code prompt/subagent using the portable packet as the source of truth',
    supportsStructuredOutput: 'prompt-enforced; validate response with lint/manual review',
    supportsNoninteractiveExecution: 'runtime dependent',
    supportsLocalProvider: 'no default assumption',
    supportsMcp: 'yes when configured in Claude Code',
    supportsHooksEvents: 'runtime-specific hooks may exist; keep optional',
    supportsSandboxToolBoundaries: 'runtime/config dependent',
    supportsResponseSchemaEnforcement: 'prompt/lint fallback',
    supportsUsageTokenCapture: 'runtime dependent; do not claim unless reported',
    knownCaps: ['Claude Code configuration is outside portable SDLC policy.', 'Cycle 1 does not generate Claude-specific subagent files here.', 'Human approval gates remain outside hooks.'],
  };
  if (runtime === 'manual-packet') return {
    ...base,
    invocationMethod: 'human copies or reads the generated packet and manually runs approved commands',
    supportsStructuredOutput: 'yes by template discipline; not machine-enforced',
    supportsNoninteractiveExecution: 'no',
    supportsLocalProvider: 'no',
    supportsMcp: 'no',
    supportsHooksEvents: 'no',
    supportsSandboxToolBoundaries: 'human enforced',
    supportsResponseSchemaEnforcement: 'manual review and sdlc agents lint / response lint',
    supportsUsageTokenCapture: 'no',
    knownCaps: ['No automation is implied.', 'Evidence must be pasted, linked, or recorded manually.', 'Best fallback when runtime tooling is unavailable.'],
    fallback: 'manual review by orchestrator',
  };
  return base;
}

function auditHookFile(repo, path) {
  const text = readFileSync(path, 'utf8');
  if (/merge|deploy|release|pipeline|codepipeline|ticket.*update|db.*write|drop table|delete from/i.test(text)) return { path, status: 'block', finding: 'hook appears to reference protected release/ticket/database actions', recommendation: 'remove automation or require explicit human approval outside hook' };
  if (/PostToolUse|PreToolUse|UserPromptSubmit|hooks|command/i.test(text)) return { path, status: 'warn', finding: 'hook-like configuration found', recommendation: 'prefer user-level reviewed hooks and avoid recursive execution' };
  return { path, status: 'pass', finding: 'no risky hook signal detected', recommendation: 'keep hooks optional and local' };
}
