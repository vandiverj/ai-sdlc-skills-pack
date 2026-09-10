# AI SDLC Skills Pack Summary

## Purpose

This repository provides a portable, user-level SDLC for coding agents. It combines focused skills, bounded agent roles, optional templates, and a local helper CLI. Its design target is complete, evidence-backed changes with the least necessary process.

## Canonical Sources

- `README.md` — entry point, safety kernel, normal CLI, and pack layout.
- `WORKFLOW.md` — routing, behavior completeness, evidence, consent, and completion rules.
- `AGENTS.md` — contribution and verification instructions for this repository.
- `skills/*/SKILL.md` — capability-specific instructions loaded only when relevant.
- `agents/*.md` — portable role contracts.
- `scripts/sdlc/` — deterministic helper implementation.

## Current Design

- One normal router: `run-sdlc`.
- One small lifecycle: `start`, `next`, `prove`, optional `qa-ready`, `finish-ready`.
- Seven intent-aware work classes rather than file-count routing.
- Compact behavior trace: observable outcome, material connected impact, claim-specific proof/recovery.
- Detailed workflow/scenario mapping only when risk or uncertainty warrants it.
- Plans, packets, reviews, and delegation are conditional tools rather than default milestones.
- Specialist CLI commands remain callable for compatibility but are not exposed as the normal workflow.
- Repeated improvement loops are explicit or risk-triggered, not a fixed default.

## Safety That Remains Non-Negotiable

- Follow repository instructions and accepted product/architecture constraints.
- Preserve unrelated work and avoid destructive Git operations.
- Use fresh, claim-specific evidence and report unavailable evidence as a cap.
- Apply existing user/repository authority to consequential actions; request only missing authority. Readiness is not permission.
- Do not install optional tools or create external integrations silently.

## Repository Map

```text
skills/             focused capabilities and routers
agents/             portable worker and reviewer roles
templates/          optional downstream docs, prompts, and adapters
scripts/sdlc/       local deterministic control-plane helpers
scripts/test-*.mjs  pack contract and behavior tests
docs/               supporting durable documentation
learnings/          reviewed reusable process guidance
```

## Design Test

The pack is healthy when a straightforward local change can move directly from context to edit to proof, while a risky or cross-boundary change still expands into the gates needed to prevent an expensive failure. More instructions, artifacts, commands, or agent handoffs are not improvements unless evidence shows they improve that result.
