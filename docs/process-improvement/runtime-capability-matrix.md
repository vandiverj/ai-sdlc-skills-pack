# Runtime Capability Matrix

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Compare Cycle 1 runtime targets without turning runtime plumbing into durable policy.

## Matrix

| Runtime | Invocation | Structured output | Noninteractive | MCP | Tool boundaries | Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| `codex-exec` | Codex CLI with approved packet | prompt/lint enforced | yes when installed/approved | configured runtime feature | sandbox/runtime dependent | `manual-packet` |
| `claude-code` | Claude Code prompt/subagent with approved packet | prompt/lint enforced | runtime dependent | configured runtime feature | runtime/config dependent | `manual-packet` |
| `manual-packet` | human reads/copies packet | template discipline | no | no | human enforced | orchestrator review |

## Required Capability Fields

Use the fields in [runtime-adapter-contract.md](runtime-adapter-contract.md).

## Optional Fields

Runtime rows may include local config paths, approved model names, MCP server names, hook file paths, and usage capture paths only when those facts are locally verified.

## Source Of Truth

`scripts/sdlc/lib/adapters.mjs` is the CLI projection. The portable contract remains [runtime-adapter-contract.md](runtime-adapter-contract.md).

## Forbidden Claims

Do not claim a runtime supports hooks, MCP, local providers, schema enforcement, or usage capture unless the local adapter check or user configuration proves it.

## Validation Path

`sdlc adapter doctor --runtime <runtime> --json` returns comparable `cycle1` capability data.

## No-Install Fallback

Manual packet handoff remains the baseline.
