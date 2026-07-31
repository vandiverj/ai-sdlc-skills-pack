---
name: counterpoint
description: 'Adversarial pass against a plan, design, approach, decision, or artifact before committing to it. Use when the user asks for counterpoint, adversarial review, devil''s advocate, second opinion, alternative perspective, challenge my plan, avoid confirmation bias, or the highest-quality result before proceeding.'
user-invocable: true
---

# Counterpoint

## Purpose

Use this skill to deliberately challenge the current direction before treating it as settled.

The goal is not to be negative, contrarian, or indecisive. The goal is to produce a stronger final answer by testing whether the current conclusion still holds after a credible opposing viewpoint has been considered.

## Core Rule

Argue the strongest useful counterposition, then reconcile it with the current position.

Do not let the counterpoint automatically override the main plan. Do not let the main plan ignore the counterpoint because work has already begun.

## Use Pattern

1. State the current position.
2. Identify the decision already being favored.
3. Name the strongest counterpoint lens to apply.
4. Challenge assumptions, evidence, scope, tradeoffs, and failure modes.
5. Generate at least one credible alternative or modification.
6. Compare the current position and counterpoint.
7. Decide whether to keep, modify, pause, or replace the current direction.
8. Record changed assumptions, open questions, or artifact updates needed.

## Counterpoint Lenses

Choose the fewest lenses that fit the task:

- Root-cause skeptic: asks whether the plan solves the actual problem or a symptom.
- User/operator skeptic: asks whether the workflow is understandable, usable, and worth the effort.
- Maintenance skeptic: asks whether future maintainers can safely change the result.
- Simplicity skeptic: asks whether the plan adds unnecessary abstraction, ceremony, agents, tools, or files.
- Evidence skeptic: asks what is proved, inferred, stale, missing, or overclaimed.
- Security/privacy skeptic: asks whether data, tools, permissions, prompts, or outputs can be abused or leaked.
- Cost skeptic: asks whether the solution is oversized for the value or has hidden time/token/retry cost.
- Failure-mode skeptic: asks how the plan breaks when assumptions are wrong.
- Reversibility skeptic: asks how hard the decision is to undo.
- Scope skeptic: asks whether the plan touches too much, too little, or the wrong layer.
- Dependency skeptic: asks whether new tools, libraries, services, agents, or MCPs are justified.
- Domain outsider: asks what someone unfamiliar with local conventions would misunderstand.

## Decision Inertia Checks

Always check for these signs:

- Continuing because a prior choice was already made.
- Defending the current approach because work has already been invested.
- Treating missing evidence as acceptable because the plan feels plausible.
- Adding process, abstraction, or agents because they are available.
- Avoiding a simpler path because the more complex path is already drafted.
- Ignoring new context because it would force rework.
- Using model agreement as proof.
- Treating a local optimum as the final answer.

If any sign appears, name it directly and state what evidence would change the decision.

## Output

Use this structure unless the caller asks for something smaller:

```text
Current position:
Favored decision:
Counterpoint lens:
Strongest opposing argument:
Assumptions challenged:
Evidence gaps:
Credible alternatives:
Tradeoff comparison:
Decision inertia risk:
Recommendation: keep / modify / pause / replace
Why:
Artifact updates or next checks:
```

For small tasks, compress to:

```text
Counterpoint:
Risk:
Recommendation:
```

## Reconciliation Rules

- Keep the current direction when the counterpoint is weaker, speculative, or more costly than the risk it reduces.
- Modify the direction when the counterpoint finds a real weakness but the core approach still fits.
- Pause when a missing fact could change the decision and is cheap or necessary to obtain.
- Replace the direction when the counterpoint exposes a better, safer, simpler, or more evidence-backed option.
- Defer non-blocking improvements instead of expanding scope.

## Boundaries

- Do not invent objections just to sound adversarial.
- Do not block progress on low-risk work with speculative concerns.
- Do not require consensus when deterministic evidence, requirements, or human direction already decide the issue.
- Do not turn every task into a broad review. Keep the challenge proportional to risk.
- Do not use counterpoint as a substitute for tests, security review, design review, or domain expertise when those are required.

## Integration

Use with:

- `planning` before meaningful product, architecture, contract, or implementation-plan decisions.
- `implementation` before committing to a risky abstraction, dependency, or refactor path.
- `review` when an independent outside voice is needed but the question is broader than code review.
- `agents` when choosing delegation, model tiers, local agents, or runtime adapters.
- `sdlc-process-improvement` before promoting a workflow change from idea to experiment or durable rule.
- `improvement-loop` as one viewpoint inside iterative artifact improvement.

When the counterpoint changes requirements, contracts, architecture, risk, uncertainty, or workflow policy, update the owning artifact or record the open question before proceeding.
