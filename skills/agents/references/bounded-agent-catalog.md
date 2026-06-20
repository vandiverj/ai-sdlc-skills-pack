# Bounded Agent Catalog

Portable agent definitions live in `.agents/agents/*.md`. Runtime-specific adapters should be generated or written from these source definitions.

## Current Portable Roles
| Role | Source | Default access | Primary output |
| --- | --- | --- | --- |
| Read-only code scout | `.agents/agents/read-only-code-scout.md` | read-only | source-linked scout findings |
| Independent reviewer | `.agents/agents/independent-reviewer.md` | read-only | review findings and evidence gaps |
| Implementation worker | `.agents/agents/implementation-worker.md` | bounded write | implementation handoff |
| Verification worker | `.agents/agents/verification-worker.md` | read-only commands | fresh verification evidence |
| Release handoff worker | `.agents/agents/release-handoff-worker.md` | Git/handoff only when authorized | finish packet |
| Process learning reviewer | `.agents/agents/process-learning-reviewer.md` | read-only by default | process-learning recommendations |

## Adapter Templates
- Augment/Auggie: `.agents/templates/adapters/augment/agent.md`
- Pi: `.agents/templates/adapters/pi/agent.md`
- Codex: `.agents/templates/adapters/codex/agent.toml`

## Rules
- Portable source owns purpose, boundaries, output, verification duties, and escalation.
- Runtime adapters may map tool names, model ids, and activation mechanics.
- Runtime adapters must not broaden write/tool access without explicit review.
- Do not duplicate unique policy into adapters; keep policy in portable definitions and router references.
