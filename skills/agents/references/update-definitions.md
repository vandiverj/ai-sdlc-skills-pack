
# update-agent-definitions

## Description
Update portable agent definitions, model-tier policy, delegation patterns, or runtime adapter guidance based on reviewed evidence.

## Use when
- process-learning review, `review/references/agent-strategy.md`, or repeated project work shows an agent role, model tier, escalation rule, or runtime adapter is missing, stale, noisy, or unsafe.
- A project adds or removes a supported IDE/agent runtime such as Codex, VS Code/Copilot, Augment, or Claude Code.
- Specialist roles need to be added, narrowed, merged, renamed, or retired.
- Agent definitions no longer match how work is actually delegated and reviewed.

## Purpose
Improve agent behavior deliberately without turning one-off anecdotes into permanent process. Agent definitions are part of the SDLC and should change through normal reviewable commits.

## Read first
1. Portable role definitions in `.agents/agents/*.md` when working in the skills pack.
2. `agents` router references for portable definition schema and runtime adapter rules.
3. Project-local `docs/agents/agent-catalog.md`, `model-tier-policy.md`, `delegation-patterns.md`, `runtime-adapters.md`, and `learning-loop.md`, when working in a downstream repository.
4. Related process-learning event entries/reviews, `review/references/agent-strategy.md` findings, and `review/references/agent-work.md` findings.
5. Runtime-specific files such as `.augment/agents/*`, `.github/copilot-instructions.md`, `.github/instructions/*`, `.claude/agents/*`, and `AGENTS.md` when present.
6. Current workflow docs and skills that reference the changed roles.

## Required output

```text
Agent definition change:
Evidence considered:
Affected roles:
Affected model tiers:
Affected runtime adapters:
Proposed update:
Why:
Risks:
Rollback:
Artifacts to update:
Verification:
Next skill:
```

## Update rules
- Prefer tightening an existing role before adding a new specialist.
- Prefer abstract model tiers over vendor-specific model names in portable docs.
- Keep runtime-specific files thin and derived from the portable strategy.
- In the skills pack, update `.agents/agents/*.md` before compatibility copies or runtime adapters.
- Record why a change improves quality, reviewability, cost, or safety.
- Preserve human Git review: make small scoped commits with intentional messages.
- If the change affects downstream setup, update `setup-sdlc-in-repo` guidance.

## Boundary With Skill Updates
This skill owns agent roles, model-tier policy, delegation patterns, and runtime adapter guidance. General SDLC workflow behavior belongs in the relevant workflow skill, not in an agent definition. If a learning changes how all agents should plan a slice, test the rule and update the portable skill instead of burying it in one runtime adapter.

## Hard rules
- Do not auto-update agent definitions from raw logs or one failed session.
- Do not encode secrets, private prompts, private customer data, or local-only preferences.
- Do not let runtime adapters diverge from portable `.agents/agents/*.md` or project `docs/agents/*` without recording the reason.
- Do not add specialists that have no clear use case, output contract, or escalation trigger.

## Next skills
Usually `setup-sdlc-in-repo`, agents setup guidance, `review/references/agent-strategy.md`, context save, or process-learning review.
