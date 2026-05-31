# AGENTS.md

## Project Overview
- Purpose:
- Primary users:
- Current phase:

## Repository Layout
- Source:
- Tests:
- Docs:
- Generated artifacts:

## Setup
```text
<setup command>
```

## Commands
- Format:
- Lint:
- Typecheck:
- Test:
- Build:
- Health:

## Verification Guidance
- Narrow check for small edits:
- Broader check before completion:
- Commands that are slow, flaky, or environment-dependent:
- Rendered UI/app review path:
- Evidence packet location:
- Protected evidence surfaces:
  - Tests:
  - Snapshots/baselines:
  - Validation scripts:
  - CI/local preflight config:

## AI SDLC Workflow
- Start with work classification.
- Record the evidence packet level and any contextual caps before claiming completion.
- Load the smallest safe context packet.
- Use documented verification before claiming completion.
- Treat tests, snapshots, generated baselines, validation commands, and CI config as protected evidence surfaces. If they change, record why and how the new evidence still protects behavior.
- For UI or user-facing workflow changes, inspect the rendered browser/app/device surface when a runnable surface and approved tool are available; otherwise mark product-experience claims unverified.
- Update context, docs, contracts, and agent instructions only when their surfaces changed.

## Agent Strategy
- Agent policy source of truth: `docs/agents/`.
- Runtime adapter files:
  - Codex: `AGENTS.md`
  - VS Code/Copilot:
  - Augment:
  - Claude Code:
- Default strategy: single-agent for Micro/Tiny work unless risk appears.
- Use `choose-agent-strategy` for Standard, High-risk, Exploratory, review, release, or cross-cutting work when delegation, specialists, independent verification, or model-tier selection may help.
- Model tiers are abstract in portable docs. Map concrete model names only in `docs/agents/runtime-adapters.md` or local runtime config.
- Subagents must stay within assigned context, tools, and write boundaries. Prefer read-only specialists unless an approved plan assigns files.

## Code and Documentation Conventions
- Code style:
- Code-local documentation:
- Public/shared surfaces that must be documented:

## Implementation Patterns
- Pattern guidance source of truth: `docs/patterns/`.
- Use `choose-implementation-pattern` when work touches repeated project-specific surfaces such as forms, tables, modals, API handlers, data fetching, errors, tests, layouts, or feature modules.
- Pattern docs capture project-specific conventions only. Do not duplicate formatter, linter, typecheck, schema, accessibility, test, or CI rules.
- Standard patterns are the default for new work; deviations need a reason.
- Deprecated or Superseded patterns should not be copied into new work.

## Security and Privacy
- Secrets handling:
- Network access:
- Sensitive data:
- Dependency policy:

## Retrieval and Tool Boundaries
- Approved retrieval/index tools:
- Allowed sources:
- Disallowed sources:
- Freshness expectations:

## Runtime Adapter Boundaries
- Runtime-specific files are adapters, not source of truth.
- Adapter files must link back to `AGENTS.md`, `docs/ai-sdlc-workflow.md`, and `docs/agents/`.
- Do not add or change hosted services, MCP servers, CI jobs, dependencies, or model-routing policy without the relevant approval gate.

## Branch, Commit, and PR Guidance
- Branch naming:
- Commit expectations:
- Keep commits scoped to one coherent task, gate, or mechanical change.
- Do not bundle unrelated feature, docs, dependency, generated, and adapter changes unless explicitly approved.
- PR expectations:

## Do Not Change Without Approval
- 
