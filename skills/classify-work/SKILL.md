---
name: classify-work
description: 'Choose the lightest safe route for a software task from scope, risk, uncertainty, changed surfaces, and available proof.'
user-invocable: true
---

# classify-work

## Purpose

Prevent expensive under-processing without turning ordinary work into ceremony.

Use at the start of a task or when new evidence changes its scope or risk.

## Classes

- `Micro`: obvious, local, no intended behavior change.
- `Tiny`: local, low-risk behavior or configuration change with direct proof.
- `Standard`: bounded feature, bugfix, or refactor spanning meaningful behavior or responsibilities.
- `High-risk`: public contracts, sensitive data, auth, permissions, migrations, infrastructure, dependencies, external integrations, concurrency, irreversible effects, or broad architecture.
- `Exploratory`: research or prototype without a production completion claim.
- `Review-only`: inspection without edit authority.
- `Release/handoff`: completion, Git publication, deployment, or transfer of responsibility.

File count and keywords are signals, not classifications. A one-file behavior fix may be Tiny when its outcome and proof are clear. A small diff may be High-risk when its consequences are not.

## Classification

Consider:

1. What observable result or internal invariant can change?
2. How far can the effect travel?
3. What is uncertain or irreversible?
4. What evidence can directly prove the claim?
5. What authority does the next action require?

Use the fast pass for docs-only or explicitly mechanical work and for genuinely local, reversible behavior when the repository has direct focused proof. Escalate when the task crosses modules, contracts, persistence, repositories, security/data boundaries, or lacks a credible verification path.

For observable behavior, require a compact outcome/impact/proof trace. Require expanded journey and dependency mapping only for Standard work when the blast radius is unclear, or for High-risk/cross-boundary work.

Apply `references/security-route-triggers.md` when security, data, tools, dependencies, production, or irreversible actions may be involved.

## Output

```text
Class and confidence:
Why:
Affected surface and likely blast radius:
Required context:
Required proof or evidence gap:
Next action and consent gate:
```

Keep this short. A skipped gate needs explanation only when it would normally protect a plausible failure.

## Reclassify when

- the affected surface or repository scope grows,
- expected behavior or ownership becomes unclear,
- a public contract, persistence, data, security, dependency, migration, or external effect appears,
- verification does not prove the intended result,
- the user changes the task or its constraints.

## Stop rules

- Do not equate process volume with risk reduction.
- Do not block local reversible work on fields or artifacts that do not affect the decision.
- Do not downgrade real safety, data, contract, or irreversible-action concerns for speed.
