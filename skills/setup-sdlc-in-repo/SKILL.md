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
3. Existing team artifacts in the consumer repo: `docs/application-model.md`, `docs/prds/`, `docs/contracts/`, `docs/decisions/`, `docs/patterns/*`, `docs/agents/*`, and `docs/ai-sdlc-workflow.md`.
4. Existing personal-memory artifacts resolved through `sdlc-config`: `<memory-bank>`, `<context-state>`, `<session-checkpoints>`, `<process-improvement>`. When the resolver returns repo-local fallback, these live at `docs/memory-bank/`, `docs/context-state.md`, `docs/session-checkpoints/`, and `docs/process-improvement/` inside the consumer repo.
5. The approved technical approach, quality automation, retrieval approach, and agent strategy if they exist.
6. Templates from this skills pack only as starting points; do not overwrite project-specific truth.

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
Files split into two trust zones. The split is defined in `~/.agents/skills/run-sdlc/SKILL.md` `## Context storage location` and the resolver in `~/.agents/skills/sdlc-config/SKILL.md`.

**Team artifacts (always installed in the consumer repo).** Source-of-truth artifacts that ship in PRs:

```text
AGENTS.md
docs/ai-sdlc-workflow.md
docs/application-model.md
docs/agents/agent-strategy.md
docs/agents/agent-catalog.md
docs/agents/model-tier-policy.md
docs/agents/delegation-patterns.md
docs/agents/runtime-adapters.md
docs/agents/learning-loop.md
docs/patterns/README.md
docs/patterns/pattern.md
```

**Personal-memory artifacts (resolver-driven; NOT installed in the consumer repo when vault mode is enabled).** Scaffold at the path returned by `sdlc-config`:

```text
<memory-bank>/activeContext.md
<memory-bank>/productContext.md
<memory-bank>/progress.md
<memory-bank>/decisionIndex.md
<memory-bank>/contextIndex.md
<context-state>
<session-checkpoints>/        # directory only, populated by context-save
<process-improvement>/events.jsonl
<process-improvement>/friction-log.md
```

The skills-pack `skill-changelog.md` lives at `~/.agents/docs/process-improvement/skill-changelog.md` (pack repo), not in the consumer repo.

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
3. Resolve personal-memory paths via `sdlc-config` (`<memory-bank>`, `<context-state>`, `<session-checkpoints>`, `<process-improvement>`) before deciding scaffold locations. Confirm `project_slug` and write the `.sdlc-project` marker — see `## Project-marker bootstrap`.
4. Detect legacy `docs/memory-bank/`, `docs/context-state.md`, `docs/session-checkpoints/`, or `docs/process-improvement/` in the consumer repo. If found and vault mode is enabled, run `## Legacy-memory migration` before scaffolding.
5. Identify which portable SDLC files are missing, stale, or project-specific.
6. Identify IDE/tool runtimes to support. If unclear, create portable files first and record adapter decisions as follow-up.
7. Draft changes without overwriting project-specific guidance.
8. Merge existing instructions by linking to deeper docs and preserving local commands/conventions.
9. Add `docs/patterns/README.md` and pattern templates when repeated project-specific implementation guidance should be captured.
10. Add runtime adapters only for tools the project actually uses or explicitly wants.
11. Run documentation verification checks and `git diff --check`.
12. Recommend a scoped commit message, such as `Set up AI SDLC workflow`.

## Project-marker bootstrap
Every consumer repo carries at least one `.sdlc-project` file at its root. Hybrid monorepos MAY additionally carry nested `.sdlc-project` files in sub-trees that represent distinct products; the resolver picks the nearest one walking up from PWD (see `sdlc-config` resolver algorithm step 2).

```ini
project_slug = <Title-Kebab-Case>
```

Derive the slug in this order, and **always confirm with the user before writing**:
1. Explicit user input in the current request.
2. Inferred from the repo directory basename, normalized to Title-Kebab-Case (e.g. `airtera-monorepo` → `Airtera-Monorepo`).
3. Fall back to `SDLC_DEFAULT_PROJECT_SLUG` from `sdlc-config`.

Surface the candidate slug, the source it came from, and the resolved vault path (`$VAULT_ROOT/<slug>/`) before writing. If the user rejects, do not proceed — `.sdlc-project` is a long-lived contract and a wrong slug fragments the vault across runs.

### Hybrid monorepo markers
A monorepo with multiple distinct products (e.g. `apps/<product-a>/...`, `apps/<product-b>/...`) MAY anchor each product's Memory Bank to its own slug by placing a `.sdlc-project` file inside each product's subtree. Rules:

1. The repo-root marker is mandatory and serves as the fallback slug for files not covered by any nested marker.
2. Nested markers MUST follow the same slug-confirmation contract as the root marker. Do not write a nested marker without explicit user opt-in for that specific subtree.
3. If a product spans multiple sub-trees (e.g. api + web + mock-server), write a marker into **every** sub-tree that should resolve to the product slug. A marker in only one sub-tree silently mis-resolves the others to the root slug.
4. Single-file product surfaces (e.g. one `<product>-domain.ts` mixed into a shared `domains/` directory) cannot be anchored without over-claiming. Accept that those files resolve to the root slug, and record the decision in `<context-state>` or the decision index so the next agent does not re-litigate it.

## Legacy-memory migration
When the consumer repo contains `docs/memory-bank/`, `docs/context-state.md`, `docs/session-checkpoints/`, or `docs/process-improvement/` AND vault mode is enabled:

1. For each legacy path, check whether the corresponding vault path is empty.
2. If empty: surface a migration block listing source path, destination, file count, total size, and the exact `rsync -av --remove-source-files <src>/ <dst>/` command (or `mv` for a single file). Remind the user that OneDrive must be fully synced before running. Wait for explicit `Proceed with migration` before doing anything.
3. If the vault side is non-empty: surface a conflict warning naming both sides. Do nothing automatic. The user resolves manually.
4. After migration completes: append one audit row to `<process-improvement>/events.jsonl` recording source path, destination, byte count, and timestamp.
5. Do NOT delete repo-local directories without user approval. `rsync --remove-source-files` is the only sanctioned approach and requires confirmation first.

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
- Do not install personal-memory files (`<memory-bank>`, `<context-state>`, `<session-checkpoints>`, `<process-improvement>`) into the consumer repo when vault mode is enabled in `sdlc-config`.
- Do not move legacy `docs/memory-bank/` etc. without explicit user approval, even when vault paths are empty.
- Do not write a nested `.sdlc-project` marker without exercising the slug-confirmation contract for that specific subtree. The contract applies per-marker, not per-repo — the root marker confirmation does not cover nested markers.

## Next skills
Usually `setup-agent-instructions`, `choose-agent-strategy`, `choose-implementation-pattern`, `choose-quality-automation`, `choose-retrieval-approach`, `health-check`, `context-save`, or `review-agent-work`.