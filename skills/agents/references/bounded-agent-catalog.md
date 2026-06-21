# Bounded Agent Catalog

Portable agent definitions live in `.agents/agents/*.md`. Runtime-specific adapters should be generated or written from these source definitions.

## Current Portable Roles
| Role | Source | Default access | Primary output |
| --- | --- | --- | --- |
| Context scout | `.agents/agents/context-scout.md` | read-only | source-of-truth context packet |
| Read-only code scout | `.agents/agents/read-only-code-scout.md` | read-only | source-linked scout findings |
| Implementation planner | `.agents/agents/implementation-planner.md` | read-only | bounded implementation plan |
| Independent reviewer | `.agents/agents/independent-reviewer.md` | read-only | review findings and evidence gaps |
| Implementation worker | `.agents/agents/implementation-worker.md` | bounded write | implementation handoff |
| Verification worker | `.agents/agents/verification-worker.md` | read-only commands | fresh verification evidence |
| Security privacy reviewer | `.agents/agents/security-privacy-reviewer.md` | read-only | security/privacy findings and mitigations |
| QA handoff worker | `.agents/agents/qa-handoff-worker.md` | docs/handoff only | tester-readable QA handoff |
| Release handoff worker | `.agents/agents/release-handoff-worker.md` | Git/handoff only when authorized | finish packet |
| Process learning reviewer | `.agents/agents/process-learning-reviewer.md` | read-only by default | process-learning recommendations |
| Feedback reporter | `.agents/agents/feedback-reporter.md` | feedback draft only | sanitized feedback event draft |

## Adapter Templates
- Augment/Auggie: `.agents/templates/adapters/augment/agent.md`
- Pi: `.agents/templates/adapters/pi/agent.md`
- Codex: `.agents/templates/adapters/codex/agent.toml` for generic role adapters, or `.agents/templates/adapters/codex/sdlc-*.toml` for Codex-native SDLC subagents

## Rules
- Portable source owns purpose, boundaries, output, verification duties, and escalation.
- Runtime adapters may map tool names, model ids, and activation mechanics.
- Runtime adapters must not broaden write/tool access without explicit review.
- Do not duplicate unique policy into adapters; keep policy in portable definitions and router references.
- Agents return sanitized SDLC feedback drafts; the parent orchestrator submits through AirteraCode MCP or local fallback.
