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
Repository setup profile:
Quality capability profile:
Verification commands discovered:
Improvement proposals:
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
docs/agents/runtime-practical-guide.md
docs/agents/sdlc-agent-prompts.md
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

- Codex: root `AGENTS.md` plus project-local `docs/agents/*` and portable skills guidance.
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
5. Establish repository setup/profile locations before creating noisy artifacts. Prefer `sdlc readiness` first when the helper CLI is available, then `sdlc setup bootstrap --shared-context-root <path>` when a local profile or ignored evidence folders are missing.
6. Decide the local AI notes policy: tracked shared docs belong under `docs/`; personal or pilot scratch notes belong under `.ai-local/` and should be ignored via `.git/info/exclude` or project `.gitignore` by explicit choice. Inspect `git status --short --untracked-files=all`, `git check-ignore -v .ai-local .ai-local/*`, and `.git/info/exclude` when `.ai-local/` exists.
7. Check Git identity and privacy expectations before public or shared publication: `git config user.name`, `git config user.email`, whether a noreply email is desired, and how to verify author/committer with `git log --format=fuller -1`.
8. Review infrastructure and quality capabilities: install/build/run commands, formatter, linter, typecheck/compiler, unit/integration/contract/E2E tests, rendered UI tooling, accessibility checks, security/dependency scans, CI/local preflight, deployment/smoke checks, logs/debugging, QA/manual validation.
9. Classify each capability as available/documented, available/undocumented, partial, missing but valuable, not applicable, or blocked by environment/security.
10. Establish validation-target policy. Default to current repository deterministic checks and dry-run packets; optionally record a repo-local configured validation target in `.ai-local/sdlc-profile.md` or `.ai-local/sdlc-profile.json`; ask the developer before using an external disposable fixture or workspace repo.
11. Draft changes without overwriting project-specific guidance.
12. Merge existing instructions by linking to deeper docs and preserving local commands/conventions.
13. Add `docs/patterns/README.md` and pattern templates when repeated project-specific implementation guidance should be captured.
14. Add runtime adapters only for tools the project actually uses or explicitly wants.
15. Add evidence packet and independent-reviewer templates when the project will use local handoffs, local review packets, or agent review roles.
16. Run documentation verification checks and `git diff --check`.
17. Run `sdlc readiness` again when available and report remaining setup gaps.
18. For mixed legacy/modern UI systems, add or link `docs/context-root/mixed-ui-guidance.md` or an equivalent shared-context note so future agents do not flatten ASP Classic, React, shared CSS, API, and SQL risks into one generic UI bucket.
19. Recommend a scoped commit message, such as `Set up AI SDLC workflow`.

## Helper CLI setup flow
When the SDLC helper is available, use it to make setup concrete:

```bash
sdlc readiness
sdlc profile init --shared-context-root <external-context-root>
sdlc context restore
```

If the project is part of a larger product/system, create or update shared context-root docs outside the application repository using `templates/docs/context-root/`:

```text
product-context-index.md
service-map.md
workflow-map.md
release-order.md
known-failure-modes.md
repo-context-index.md
```

Then record pointers to those docs in `.ai-local/sdlc-profile.md` or `.ai-local/repository-setup.md`. Do not commit personal paths or raw AI working memory unless the repository explicitly approves a sanitized variant.

## Repository setup profile
Prefer a Markdown-first setup profile while the fields are still evolving:

```text
.ai-local/repository-setup.md
.ai-local/sdlc-profile.md
.ai-local/tool-capabilities.md
.ai-local/quality-capabilities.md
.ai-local/terminology.md
docs/evidence/evidence-packet.md
docs/evidence/micro-tiny-evidence.md
docs/evidence/standard-evidence-packet.md
docs/evidence/high-risk-release-evidence-packet.md
docs/evidence/exploratory-findings.md
docs/evidence/review-only-packet.md
docs/security/ai-agent-security-checklist.md
docs/evaluation/calibration-log.md
docs/evaluation/router-consolidation-validation.md
docs/agents/independent-reviewer.md
```

Use a checked-in template, such as `docs/ai-setup.example.md`, when shared repos need a discoverable setup shape without committing personal paths or noisy working history.

Do not require `repo-setup.yaml` in the first pass. Keep YAML as a future machine-readable companion once fields stabilize or automation requires it.

Minimum setup facts to capture:

- repository name/path/source host,
- personal/work/team classification,
- active runtime and OS,
- global `.agents` asset root and branch/version,
- skills/agent-contract/tool/template paths,
- context root,
- shared local context root for multi-repo context when used,
- product/system context path when work spans repositories,
- repo-specific external context path when local docs live outside the repo,
- implementation history location,
- durable docs location,
- ignored AI-local paths,
- Git author/committer privacy policy,
- validation commands,
- validation target policy and any optional local fixture path,
- rendered-review tools,
- approved/blocked tools and MCPs,
- work/personal data boundary,
- command style pitfalls.

## Local AI notes policy
Use this default decision matrix:

```text
Raw personal/pilot notes with local paths, transcripts, prompts, outputs, or handoff history -> `.git/info/exclude`.
Repo-wide local scratch convention that should protect every clone -> project `.gitignore`.
Sanitized reusable examples, evidence packets, or process docs -> tracked `docs/`.
Shared multi-repo software memory that should stay outside application repos -> ignored local pointer to the external context root.
```

Never track raw transcripts, private paths, local handoffs, prompt/output logs, secrets, customer data, or provider/tool credentials by default.

If `.ai-local/` is present and not ignored, record the risk before committing or handing off. Prefer `.git/info/exclude` for a personal/public fixture repo unless the team explicitly wants a shared ignore convention.

## Quality capability proposals
When tooling or testing gaps exist, propose improvements; do not silently add dependencies or workflow changes.

Use this justification shape:

```text
Capability gap:
Observed evidence:
Risk created by the gap:
Suggested improvement:
Smallest useful first step:
Expected quality benefit:
Cost / maintenance burden:
Impact on other developers:
Security or dependency concern:
Approval needed:
Recommended timing:
```

## Merge rules
- Existing project instructions outrank templates.
- Preserve local setup, commands, architecture, security notes, and workflow constraints.
- Do not duplicate full PRDs, application models, contracts, agent catalog entries, or skills inside runtime adapters.
- Do not turn implementation patterns into duplicate lint, format, typecheck, schema, accessibility, or CI rules.
- If a file exists and the merge is ambiguous, produce a proposed patch or mark it `Needs Review`.
- Keep IDE/tool files concise enough that future changes happen in portable docs or `.agents/agents/*.md`, not in several divergent adapters.

## Agent strategy installation
Install or update:

- `docs/agents/agent-strategy.md` for the overall operating model.
- `docs/agents/model-tier-policy.md` for abstract model tiers and escalation triggers.
- `docs/agents/agent-catalog.md` for orchestrator, explorer, worker, reviewer, verifier, and specialist roles.
- `docs/agents/delegation-patterns.md` for single-agent, read-only exploration, bounded worker, specialist review, independent verification, and consensus review.
- `docs/agents/runtime-adapters.md` for Codex, VS Code/Copilot, Augment, Claude Code, and other runtime mappings.
- `docs/agents/learning-loop.md` for how process-learning events can improve agent definitions through human-reviewed commits.

When this skills pack has portable role definitions in `.agents/agents/*.md`, use them as source material for project-local `docs/agents/*` and runtime adapters. Do not copy every portable role into a downstream repository unless the project will actually use it.

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
- Do not make runtime-specific files the source of truth over portable SDLC docs or `.agents/agents/*.md`.
- Do not overwrite existing project instructions without review.
- Do not install every adapter by default.
- Do not hard-code model names in portable docs unless the project explicitly wants local mappings.
- Do not mark project patterns as Standard during setup unless the repo already has clear evidence and human approval.
- Do not add external services, MCP servers, hosted retrieval, CI workflows, or new dependencies without the relevant approval gates.
- Do not create a commit that bundles setup with unrelated feature work.

## Next skills
Usually `agents`, `implementation`, `quality`, `tools`, `context`, or `review`.

## Machine-Readable Local Setup

Repository setup should now prepare both human-readable and machine-readable SDLC configuration when the helper CLI is available.

Preferred setup checks:

```bash
sdlc profile init
sdlc config normalize
sdlc config validate
sdlc profile doctor
sdlc capability snapshot
sdlc index build
sdlc adapter generate --runtime generic
```

For multi-project repositories, ensure the profile has one unit per deployable codebase or testing surface. API-only units should declare an API/OpenAPI testing surface so rendered UI review is not selected by mistake.

For validation targets, the setup default is `current-repo`: use the repository's deterministic checks and SDLC dry-run packets first. Configure `validationTarget` in `.ai-local/sdlc-profile.json` or the Validation Target section of `.ai-local/sdlc-profile.md` only when the developer has an approved disposable fixture, pilot repository, or workspace repo. If no external target exists, leave it unconfigured and record fixture validation as unavailable rather than inventing a machine-specific default.

For multi-repo workspaces, configure a local workspace profile or related repositories and use:

```bash
sdlc workspace graph
sdlc workspace impact --task "..."
```

Tracked config should be sanitized and team-approved. Machine-specific paths, MCP availability, and sensitive context roots belong in `.ai-local` or the developer's external local context root.
