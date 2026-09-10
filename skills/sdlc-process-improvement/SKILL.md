---
name: sdlc-process-improvement
description: 'Evaluate and improve the AI SDLC using observed workflow evidence, with a preference for removing process weight.'
user-invocable: true
---

# sdlc-process-improvement

## Purpose

Improve coding outcomes, evidence quality, developer control, or workflow usability without turning isolated friction into permanent process.

Use for changes to SDLC skills, routing, helper commands, prompts, agent roles, setup, or validation.

## Default workflow

1. State the observed failure and the behavior expected after the change.
2. Inspect the smallest relevant local sources and current behavior. Use current primary sources when external guidance matters.
3. Compare at least one subtraction option with any additive option. Prefer the smallest change that addresses the evidence.
4. Review the candidate once from an adversarial process-weight perspective. Repeat only when risk, disagreement, or the user requests an iteration loop.
5. Implement a reversible slice and compare representative behavior before and after.
6. Run repository checks and report what is proved, uncertain, and still human judgment.

Do not require a planning artifact for a small, obvious process edit. For a broad or risky change, record the hypothesis, boundaries, validation, and rollback in a local plan.

## Decision criteria

A durable change should improve at least one of:

- correctness, maintainability, security, accessibility, testability, or release readiness,
- agent diagnosis, implementation, review, verification, or handoff,
- repo-specific adaptation without embedding product facts in shared guidance,
- developer effort, context load, command choice, or recovery from interruption.

Reject or keep experimental changes that add ceremony without reducing a demonstrated risk.

## Process-weight test

For each candidate ask:

```text
What existing rule, command, field, file, or decision can this replace?
What new context or human decision does it add?
Can direct evidence replace an artifact?
Can repo configuration replace a shared rule?
Can an existing skill own it?
```

Adding weight requires a concrete risk that a lighter option cannot address.

## Portability and safety

Keep shared guidance portable across repositories, platforms, and supported runtimes. Product facts remain local. Optional tools need a no-install fallback.

Preserve repository-specific instructions, unrelated work, fresh claim-specific verification, and human authority over commit, push, merge, deploy, release, destructive actions, migrations, dependencies, secrets, and external services.

Use `references/fixture-validation.md` only when a runnable fixture or dry run is necessary. Use `references/experimental-research.md` only for a genuinely novel representation or cross-domain experiment.

## Validation

Use `references/process-learning.md` to review recurring workflow evidence and `references/test-skill-behavior.md` to test activation and outcomes. Read their supporting references only for the relevant procedure. Learning remains local unless the user has authorized a configured external feedback workflow.

Prefer, in order:

1. current repository checks and representative dry runs,
2. a configured local validation target,
3. a developer-approved disposable fixture.

Test activation, non-activation, output usefulness, proportionality for small work, and preservation of high-risk gates. A wording match is not behavioral proof.

## Required output

```text
Observed problem:
Selected reduction and rejected alternatives:
Behavior before and after:
Validation evidence:
Remaining risk:
Git action requiring approval:
```

## Stop rules

- Do not add a new abstraction when deleting, merging, configuring, or clarifying solves the problem.
- Do not promote a durable rule from one weak or project-specific signal.
- Do not install tools, change dependencies, commit, push, merge, deploy, or release without the required approval.
