---
name: setup-sdlc-in-repo
description: 'Bootstrap or update a downstream repository so AI coding agents can follow the SDLC, agent strategy, context model, and runtime-specific IDE/tool adapters.'
user-invocable: true
---

# setup-sdlc-in-repo

## Description
Bootstrap or update a downstream repository so AI coding agents can follow the SDLC, agent strategy, context model, and runtime-specific IDE/tool adapters.

## Use when
- Starting AI-assisted work in a new or existing repository.
- A project needs the SDLC installed, refreshed, or aligned with this reusable skills pack.
- A repo will be used from Codex, VS Code/Copilot, Augment, Claude Code, or another agent runtime.
- Agent instructions, Memory Bank files, context-state, agent strategy docs, implementation pattern docs, or runtime adapter files are missing or stale.

## Purpose
Install portable SDLC source-of-truth files first, then create thin runtime adapters for the specific IDE/tool environments the project uses. The repo should remain reviewable in plain Git even when different tools automate different parts.

## Read first
1. Existing project `README.md`, `AGENTS.md`, contribution docs, CI/build/test config, and package/workspace files.
2. Existing AI/IDE instruction files such as `.github/copilot-instructions.md`, `.github/instructions/*`, `.augment/agents/*`, `.claude/agents/*`, `.cursor/*`, or local equivalents.
3. Existing docs under `docs/`, especially application model, PRDs, contracts, decisions, patterns, Memory Bank, context-state, and process-improvement files.
4. The approved technical approach, quality automation, retrieval approach, and agent strategy if they exist.
5. Templates from this skills pack only as starting points; do not overwrite project-specific truth.

## Required output

```text
Setup status: Proposed / Applied / Needs Review
Target repo:
Detected runtimes:
Portable SDLC files present:
Portable SDLC files to create/update:
Runtime adapters to create/update:
Existing files preserved:
Merge conflicts or manual review needed:
Agent strategy installed:
Skill pack expectations installed:
Implementation patterns installed:
Quality/retrieval/tool boundaries installed:
Verification commands discovered:
Follow-up decisions:
Next skill:
```

## Portable files to install or update
Prefer these as source-of-truth artifacts:

```text
AGENTS.md
docs/ai-sdlc-workflow.md
docs/application-model.md
docs/context-state.md
docs/memory-bank/activeContext.md
docs/memory-bank/productContext.md
docs/memory-bank/progress.md
docs/memory-bank/decisionIndex.md
docs/memory-bank/contextIndex.md
docs/agents/agent-strategy.md
docs/agents/agent-catalog.md
docs/agents/model-tier-policy.md
docs/agents/delegation-patterns.md
docs/agents/runtime-adapters.md
docs/agents/learning-loop.md
docs/patterns/README.md
docs/patterns/pattern.md
docs/process-improvement/events.jsonl
docs/process-improvement/friction-log.md
docs/process-improvement/skill-changelog.md
```

Create PRD, contract, decision, issue, implementation-plan, release, concrete pattern, or feature-context folders only when the project needs them or the user asks for the full scaffold.

## Runtime adapters
Adapters are optional and should stay thin:

- Codex: root `AGENTS.md` plus portable `docs/agents/*` and skills guidance.
- VS Code/Copilot: `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` when the project uses Copilot customization.
- Augment: `.augment/agents/*.md` when the project uses Augment/Auggie subagents.
- Claude Code: `.claude/agents/*.md` when the project uses Claude Code project agents.
- Other tools: document the mapping in `docs/agents/runtime-adapters.md` before adding tool-specific files.

Adapters should reference `AGENTS.md`, `docs/ai-sdlc-workflow.md`, and `docs/agents/*` instead of copying the full SDLC.

## Skill pack expectations
When installing or refreshing the SDLC, ensure the runtime can discover the portable skills root and that `slice-product-fit` is available for Standard work. Runtime-specific adapters may mention the rule, but the source of truth should stay in portable docs and the skill pack.

## Setup process
1. Classify setup as `Standard` unless it only updates a tiny existing instruction file.
2. Inventory existing instruction, workflow, docs, command, CI, and agent runtime files.
3. Identify which portable SDLC files are missing, stale, or project-specific.
4. Identify IDE/tool runtimes to support. If unclear, create portable files first and record adapter decisions as follow-up.
5. Draft changes without overwriting project-specific guidance.
6. Merge existing instructions by linking to deeper docs and preserving local commands/conventions.
7. Add `docs/patterns/README.md` and pattern templates when repeated project-specific implementation guidance should be captured.
8. Add runtime adapters only for tools the project actually uses or explicitly wants.
9. Run documentation verification checks and `git diff --check`.
10. Recommend a scoped commit message, such as `Set up AI SDLC workflow`.

## Merge rules
- Existing project instructions outrank templates.
- Preserve local setup, commands, architecture, security notes, and workflow constraints.
- Do not duplicate full PRDs, application models, contracts, agent catalog entries, or skills inside runtime adapters.
- Do not turn implementation patterns into duplicate lint, format, typecheck, schema, accessibility, or CI rules.
- If a file exists and the merge is ambiguous, produce a proposed patch or mark it `Needs Review`.
- Keep IDE/tool files concise enough that future changes happen in portable docs, not in several divergent adapters.

## Agent strategy installation
Install or update:

- `docs/agents/agent-strategy.md` for the overall operating model.
- `docs/agents/model-tier-policy.md` for abstract model tiers and escalation triggers.
- `docs/agents/agent-catalog.md` for orchestrator, explorer, worker, reviewer, verifier, and specialist roles.
- `docs/agents/delegation-patterns.md` for single-agent, read-only exploration, bounded worker, specialist review, independent verification, and consensus review.
- `docs/agents/runtime-adapters.md` for Codex, VS Code/Copilot, Augment, Claude Code, and other runtime mappings.
- `docs/agents/learning-loop.md` for how process-learning events can improve agent definitions through human-reviewed commits.

## Implementation pattern installation
Install or update:

- `docs/patterns/README.md` for pattern lifecycle, maturity, and rules.
- `docs/patterns/pattern.md` as the generic template for forms, tables, API handlers, data fetching, errors, tests, layouts, or feature modules.

Create concrete pattern files only when the project has evidence, examples, or the user asks to document a specific pattern.

## Skill root rules
- Prefer a portable `.agents/skills` or documented equivalent over runtime-specific custom skill roots.
- Do not install duplicate custom skills into runtime-specific roots unless the runtime cannot discover the portable root.
- Keep runtime-owned system skills separate from portable project/SDLC skills.

## Hard rules
- Do not make runtime-specific files the source of truth over portable SDLC docs.
- Do not overwrite existing project instructions without review.
- Do not install every adapter by default.
- Do not hard-code model names in portable docs unless the project explicitly wants local mappings.
- Do not mark project patterns as Standard during setup unless the repo already has clear evidence and human approval.
- Do not add external services, MCP servers, hosted retrieval, CI workflows, or new dependencies without the relevant approval gates.
- Do not create a commit that bundles setup with unrelated feature work.

## Next skills
Usually `setup-agent-instructions`, `choose-agent-strategy`, `choose-implementation-pattern`, `choose-quality-automation`, `choose-retrieval-approach`, `health-check`, `context-save`, or `review-agent-work`.