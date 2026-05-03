---
name: review-contract-spec
description: 'Review a contract specification before implementation planning.'
user-invocable: true
---

# review-contract-spec

## Description
Review a contract specification before implementation planning.

## Use when
- `write-contract-spec` produced or changed a public contract.
- An issue affects a public API, CLI, UI workflow, schema, exported type surface, integration, or cross-module boundary.
- Implementation planning depends on examples, signatures, state behavior, or error behavior being clear.

## Purpose
Block ambiguous, untestable, over-broad, or unsupported contracts before they become implementation drift.

## Read first
1. Contract spec.
2. Target issue and acceptance criteria.
3. Related PRD sections.
4. Related application model sections.
5. Related feature `context.md`.
6. Related ADRs or decision index entries.
7. Relevant context-state open questions.
8. Existing public docs, schemas, examples, or tests affected by the contract.

## Checks
- Does the contract match the PRD and issue?
- Does it preserve or intentionally update the application model?
- Is the public surface explicit enough to implement without guessing?
- Are inputs, outputs, success cases, errors, and state changes testable?
- Are examples realistic and aligned with existing project conventions?
- Are compatibility and migration expectations clear?
- Are unsupported behaviors and non-goals stated?
- Does it avoid leaking private implementation details into the public contract?
- Are required docs, schemas, type surfaces, or E2E/acceptance tests identified?
- Does the contract/type/schema stress test plan try to break invalid states?
- Are unresolved questions recorded in `docs/context-state.md`?

## Stress review
Challenge the contract:
- What invalid states can still be represented?
- What invalid inputs might slip through?
- What edge cases are not specified?
- What would an API consumer misunderstand?
- What would a junior maintainer implement incorrectly?
- What must fail at compile time, validation time, or runtime?

## Output
- Pass/fail.
- Required fixes.
- Optional improvements.
- Contract/type/schema stress findings.
- Scope or compatibility risks.
- Required context-state updates.
- Recommendation: approve, revise, or return to PRD/model/issue refinement.

## Hard gates
- Do not approve a contract that cannot be tested.
- Do not approve a contract that introduces requirements not supported by the PRD/model without updating those artifacts.
- Do not approve a contract that leaves public error behavior or compatibility expectations vague when they matter.
- Do not approve a contract whose type/schema/API surface permits important invalid states without a documented reason.
- Do not proceed to implementation planning until blocking contract issues are resolved or explicitly accepted by the user.

## Next skills
Usually `write-implementation-plan`, or return to `write-contract-spec`, `to-prd`, `model-application`, or `manage-context-state` if gaps are found.