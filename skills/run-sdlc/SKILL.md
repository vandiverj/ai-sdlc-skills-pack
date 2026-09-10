---
name: run-sdlc
description: 'Route software work to the smallest useful planning, implementation, verification, review, and handoff workflow.'
user-invocable: true
---

# run-sdlc

## Purpose

Carry a software request from intent to verified result without making the human operate the process.

Use this as the top-level router for substantive repository work. Skip it when the user requests a narrower skill or caps the workflow.

## Operating model

1. Preserve the user's request, repository instructions, existing decisions, and unrelated work.
2. Choose the smallest route using the table below. Read `references/classify-work.md` only when classification is uncertain or changes materially.
3. Inspect only the context needed for the next decision. Prefer repository commands and configuration over guessed conventions.
4. Route one phase at a time to `planning`, `implementation`, `quality`, `review`, `release`, `context`, `agents`, or `tools`.
5. Continue through routine, reversible work. Pause only for a real ambiguity or an action that needs additional authority.
6. Verify the changed behavior with evidence appropriate to the affected surface.
7. Update durable documentation only when durable truth changed.

The workflow is a dependency graph, not a mandatory ladder. Do not create an artifact unless it preserves a decision, enables restart, or carries evidence that would otherwise be lost.

Phase output fields are internal guidance, not mandatory reports to the user. Give one concise final handoff; do not print repeated classification, reference, and approval forms between ordinary steps. Use existing task/check records as evidence instead of copying them into new packets.

## Experience and impact

For observable behavior, retain a compact trace:

- outcome: who is affected and what observable result changes,
- impact: the connected path or consumer most likely to regress,
- proof: the evidence that covers the result and recovery behavior.

Expand this trace only when risk or uncertainty warrants it. High-risk, cross-boundary, persistent-data, or multi-repository work may require explicit upstream, downstream, adjacent, ownership, and scenario mapping. A local reversible change may need only one primary scenario and one relevant recovery or regression check.

## Routes

| Class | Minimum useful route |
| --- | --- |
| Micro | scoped edit, inspection or smallest check |
| Tiny | context, scoped edit, focused verification |
| Standard | context, lightweight plan when needed, implementation, verification, concise review |
| High-risk | explicit plan, affected contracts/risks, rollback, strong verification, review |
| Exploratory | bounded experiment, findings, recommendation; no production claim |
| Review-only | inspect and report; do not edit without a separate request |
| Release/handoff | fresh evidence, reviewable status, authorized Git or release action only |

Load `references/router-map.md` only when ownership between skills is unclear. Load `references/route-recipes.md` only when a specialized route needs a concrete evidence recipe.

## CLI

The normal lifecycle is:

```bash
sdlc start --task "<task>"
sdlc next --task "<task>"
sdlc prove --task "<task>"
sdlc qa-ready --task "<task>"
sdlc finish-ready --task "<task>"
```

These commands are optional mechanical aids. Use `sdlc help expert` only when the normal lifecycle cannot represent the task. Do not run multiple commands that answer the same process question.

## Human decisions

Ask only when the answer could materially change scope, observable behavior, a public contract, data ownership, architecture, security/privacy, a dependency, migration, rollback, or an external/irreversible action. Include a recommendation and explain the tradeoff.

Commit, push, merge, deploy, release, destructive actions, migrations, new dependencies, secrets, and external-service changes require the authority defined by the user and repository policy. Prepare all safe prerequisite work before asking for the final action.

## Required handoff

```text
Route and scope:
What changed or was learned:
Evidence:
Remaining risk or human judgment:
Next action:
```

## Stop rules

- Do not replace the user's request with process production.
- Do not invent requirements to fill a template.
- Do not treat a packet, generic build, or model confidence as proof.
- Do not broaden verification after relevant checks pass unless new evidence justifies it.
- Reclassify when scope, risk, or the affected surface materially changes.
