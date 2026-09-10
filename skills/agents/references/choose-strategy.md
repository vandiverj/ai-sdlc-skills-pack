
# choose-agent-strategy

## Description
Choose whether bounded delegation adds useful independent work. Preserve the selected primary model and use task-appropriate reasoning effort.

## Use when
- Work is Standard, High-risk, Exploratory, broad review, release work, or cross-cutting.
- A task would benefit from read-only exploration, specialist review, independent verification, or bounded implementation workers.
- The current agent is likely to overuse a heavy model for simple work or underuse a stronger model for risky work.
- A project has configured Codex, VS Code/Copilot, Augment, Claude Code, or another runtime with different agent/model capabilities.
- `run-sdlc` classification reference, `run-sdlc`, planning implementation-plan guidance, `review/references/agent-work.md`, or `review/references/production-readiness.md` needs delegation or escalation boundaries.

## Purpose
Make delegation intentional, portable, and reviewable. The SDLC decides roles, model tiers, boundaries, and escalation triggers. Runtime adapters translate that strategy into the files or features a specific IDE/tool supports.

Portable specialized agent definitions live in `.agents/agents/*.md`. When creating or reviewing those definitions, use the local reference `references/portable-agent-definition-schema.md`.

When mapping portable roles into Codex, Pi, Copilot, Augment, Claude Code, or another runtime, use `references/runtime-adapter-rules.md` so runtime-specific files stay thin and do not become hidden policy.

When a delegated role or Codex-direct role-separated phase needs a consistent prompt, have the orchestrator fill the matching template under `templates/prompts/sdlc/`. These templates are general-purpose and AI-authored; they are not user-facing intake forms.

## Read first
1. Work classification, risk level, dirty surfaces, and required evidence.
2. Current request, issue, PRD, contract, application model, and context-state entries.
3. `docs/agents/agent-catalog.md`, `docs/agents/model-tier-policy.md`, and `docs/agents/delegation-patterns.md`, if present.
4. `docs/agents/runtime-adapters.md`, `AGENTS.md`, and runtime-specific instruction files, if present.
5. Tool/MCP boundaries and safe-edit boundary when already known.

## Required output

```text
Agent strategy: single-agent / delegated-exploration / delegated-implementation / delegated-review / delegated-verification / consensus-review
Why delegation is or is not useful:
Initial model tier:
Escalation model tier:
Agents/subagents to use:
Role of each agent:
Allowed tools and context:
Write access:
Expected handoff:
Escalation triggers:
Runtime support:
Fallback if unsupported:
Parallelism decision:
Parallel workstreams:
Sequential dependencies:
Maximum useful concurrency:
File/repository ownership:
Synthesis point:
Human approval needed:
Next skill:
```

## Model tiers
For the GPT-6 profile, use `medium` for ordinary work, `high` for consequential ambiguity or difficult diagnosis, and `xhigh` only for unusually hard or disputed work. This is a configurable workload policy, not proof that lower effort is always equivalent. Children inherit the primary model and effort unless a bounded task justifies an override. Runtime support determines whether effort can change during a session.

The following capability labels remain compatible with existing project profiles; they do not require different model families or a routing receipt for every task.
Use project-defined tiers instead of hard-coded model names:

- `deterministic`: no model; use scripts, commands, tests, static tools, or CI.
- `fast`: simple docs, local search, mechanical edits, obvious formatting, shallow review.
- `standard`: normal implementation, focused planning, tests, and bounded reviews.
- `deep`: ambiguous architecture, security, privacy, public contracts, hard debugging, cross-cutting design, high-risk planning.
- `consensus`: independent review or second opinion for critical decisions, irreversible changes, or unresolved disagreement.

Each runtime may map these tiers to different model names. If no mapping exists, choose the closest available capability and state the fallback.

## Delegation patterns
Use the smallest useful pattern:

- `single-agent`: default for Micro/Tiny work and narrow Standard work.
- `read-only exploration`: explorer gathers context, relationships, risks, or options without editing.
- `cross-surface parity exploration`: for legacy-to-modern parity bugs, split read-only scouts by surface such as legacy implementation, modern UI consumer, API/backend owner, and data/fixture evidence; the orchestrator then synthesizes one parity contract before any write-capable worker starts.
- `bounded implementation`: worker edits only assigned files from an approved plan.
- `bundled implementation`: for low-risk Standard slices only, one worker prompt may include plan confirmation, bounded implementation, required verification, and a handoff packet when this reduces handoff overhead without reducing evidence.
- `parallel specialist review`: specialists review security, contracts, tests, maintainability, docs, or production readiness.
- `independent verification`: verifier runs commands and reports evidence without changing files.
- `independent reviewer`: reviewer inspects the diff/evidence packet in a read-only posture and separates blocking from non-blocking findings.
- `process learning review`: reviewer aggregates run evidence and recommends small SDLC improvements without editing files.
- `consensus review`: two or more independent reviews for critical decisions, with the orchestrator reconciling findings.

## Parallelism decision

Parallelize only when:

- workstreams can proceed without depending on each other's intermediate results;
- context, ownership, and expected outputs can be bounded independently;
- write ownership does not overlap;
- shared mutable state is absent or explicitly controlled;
- the orchestrator has a defined synthesis point; and
- expected elapsed-time, context, risk, or review benefits exceed coordination overhead.

Keep work sequential when tasks edit the same files, require ordered discoveries, depend on shared mutable state, duplicate the same investigation, or cannot be integrated against one evidence contract. State the maximum useful concurrency instead of spawning every possible role. When runtime subagents are unavailable, preserve the same role boundaries through sequential phases and record the capability cap.

## Default role rules

- The orchestrator owns classification, route choice, final synthesis, and human-facing decisions.
- Explorers and reviewers are read-only unless explicitly assigned a bounded fix.
- Workers need file ownership, allowed commands, stop conditions, and verification expectations.
- Specialists should receive narrow context packets and output findings, not broad rewrites.
- Subagents should request escalation instead of expanding scope or spawning more agents by default.
- In SDLC pilot work, assign fixture agents only to the fixture repository. Keep reusable skill-pack inspection, release-readiness judgment, edits, commits, and pushes with the orchestrator unless the human explicitly assigns that role elsewhere.
- Prefer a fixture prompt template for pilot agents so role boundaries and assigned phase are not recreated from memory.
- Bundled implementation reduces the number of handoffs, not the number of checks. The worker must return actual evidence for each required gate, or explicitly cap the result when a required command/tool such as browser review is unavailable.
- For Standard work, independent review is preferred when behavior, UI, tests, data, contracts, or multiple files changed.
- For High-risk, repeated-failure, or disputed work, independent review is required when runtime support or a separate review pass is available.

## Escalation triggers
Escalate model tier or request a specialist when:

- Confidence is below the threshold set by `run-sdlc` classification reference.
- Verification fails twice or fails for an unexplained reason.
- Requirements, contracts, code, tests, docs, or tool output conflict.
- Security, privacy, data, dependency, AI/agent, migration, deployment, or public-contract risk appears.
- The edit scope crosses the approved safe-edit boundary.
- The current agent cannot produce a testable plan, reviewable diff, or fresh verification evidence.

## Hard rules
- Do not delegate just to appear thorough.
- Do not parallelize overlapping writes, ordered discoveries, shared mutable state, or duplicated investigation.
- Do not change the user's chosen primary model merely to minimize token price. Evaluate cheaper models and effort levels against total delivery time and quality when relevant.
- Do not use a lower tier for high-risk decisions if it cannot reason about the relevant failure modes.
- Do not allow subagents to change files outside their assigned ownership.
- Do not let runtime-specific agent configs become the source of truth over `.agents/agents/*.md`, project `docs/agents/*`, skills, and `AGENTS.md`.
- Do not let subagents recursively create more subagents unless the runtime is configured for that and the orchestrator explicitly allows it.
- Do not let reviewer agents see implementer confidence as proof. Reviewers should inspect evidence before accepting claims.
- Do not accept a bundled implementation handoff that claims completion without fresh verification evidence for the selected gates.

## Next skills
Usually `tools`, `context`, planning implementation-plan guidance, review implementation-plan/agent-strategy/agent-work references, implementation execution, quality verification, or context save.
