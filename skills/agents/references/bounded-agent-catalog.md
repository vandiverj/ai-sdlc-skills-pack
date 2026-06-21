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
- Auggie SDLC roster: `.agents/templates/adapters/auggie/sdlc-*.md`
- Pi: `.agents/templates/adapters/pi/agent.md`
- Codex: `.agents/templates/adapters/codex/agent.toml` for generic role adapters, or `.agents/templates/adapters/codex/sdlc-*.toml` for Codex-native SDLC subagents

## Role Source Matrix

| Portable role | Codex adapter | Auggie adapter | Prompt template | Downstream catalog status |
| --- | --- | --- | --- | --- |
| Context scout | `templates/adapters/codex/sdlc-context-scout.toml` | `templates/adapters/auggie/sdlc-context-scout.md` | none yet | portable agent |
| Read-only code scout | `templates/adapters/codex/sdlc-read-only-code-scout.toml` | `templates/adapters/auggie/sdlc-read-only-code-scout.md` | none yet | portable agent |
| Implementation planner | `templates/adapters/codex/sdlc-implementation-planner.toml` | `templates/adapters/auggie/sdlc-implementation-planner.md` | none yet | portable agent |
| Implementation worker | `templates/adapters/codex/sdlc-implementation-worker.toml` | `templates/adapters/auggie/sdlc-implementation-worker.md` | `templates/prompts/sdlc/implementation-worker.md` | portable agent |
| Verification worker | `templates/adapters/codex/sdlc-verification-worker.toml` | `templates/adapters/auggie/sdlc-verification-worker.md` | `templates/prompts/sdlc/verification-worker.md` | portable agent |
| Independent reviewer | `templates/adapters/codex/sdlc-independent-reviewer.toml` | `templates/adapters/auggie/sdlc-independent-reviewer.md` | `templates/prompts/sdlc/independent-reviewer.md` | portable agent |
| Security privacy reviewer | `templates/adapters/codex/sdlc-security-privacy-reviewer.toml` | `templates/adapters/auggie/sdlc-security-privacy-reviewer.md` | none yet | portable agent |
| QA handoff worker | `templates/adapters/codex/sdlc-qa-handoff-worker.toml` | `templates/adapters/auggie/sdlc-qa-handoff-worker.md` | none yet | portable agent |
| Release handoff worker | `templates/adapters/codex/sdlc-release-handoff-worker.toml` | `templates/adapters/auggie/sdlc-release-handoff-worker.md` | `templates/prompts/sdlc/release-handoff-worker.md` | portable agent |
| Process learning reviewer | `templates/adapters/codex/sdlc-process-learning-reviewer.toml` | `templates/adapters/auggie/sdlc-process-learning-reviewer.md` | `templates/prompts/sdlc/process-learning-reviewer.md` | portable agent |
| Feedback reporter | `templates/adapters/codex/sdlc-feedback-reporter.toml` | `templates/adapters/auggie/sdlc-feedback-reporter.md` | none yet | portable agent |

Conceptual downstream reviewer labels such as `test-engineer`, `spec-compliance-reviewer`, `code-quality-reviewer`, `contract-reviewer`, `production-readiness-reviewer`, and `doc-sync-reviewer` are router-reference roles unless repeated evidence justifies a separate portable agent.

## Rules
- Portable source owns purpose, boundaries, output, verification duties, and escalation.
- Runtime adapters may map tool names, model ids, and activation mechanics.
- Runtime adapters must not broaden write/tool access without explicit review.
- Do not duplicate unique policy into adapters; keep policy in portable definitions and router references.
- Agents return sanitized SDLC feedback drafts; the parent orchestrator submits through AirteraCode MCP or local fallback.
