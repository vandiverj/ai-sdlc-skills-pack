---
name: write-contract-spec
description: 'Write a public contract specification before implementation planning when an issue changes an observable boundary.'
user-invocable: true
---

# write-contract-spec

## Description
Write a public contract specification before implementation planning when an issue changes an observable boundary.

## Use when
- An issue changes a public API, library export, SDK surface, plugin interface, CLI command, configuration format, event/message schema, data contract, UI workflow, or external integration.
- A feature depends on cross-module behavior that other work will consume.
- Tests or implementation would otherwise require the agent to invent signatures, examples, states, or error behavior.

## Purpose
Turn "build this from a PRD" into "satisfy this reviewed contract." The contract makes observable behavior precise before implementation begins.

## Output artifact
Usually `docs/contracts/<feature-or-interface>.md`, unless the project has an existing contract/spec location.

Language-specific companion artifacts may be appropriate, such as schema files, interface sketches, type tests, OpenAPI fragments, CLI help snapshots, protocol examples, or generated declaration expectations. Do not assume TypeScript or `.d.ts` files unless the project calls for them.

## Read first
1. Selected context packet from `select-context`.
2. Target issue and acceptance criteria.
3. Related PRD sections.
4. Related application model sections and diagrams.
5. Related feature `context.md`.
6. Related ADRs or decision index entries.
7. Relevant context-state open questions.
8. Existing public contract files, schemas, API docs, CLI docs, tests, or examples.

## Required sections
- Contract status: Draft / Approved / Needs Review / Superseded.
- Scope and owning issue.
- Related PRD, model, feature context, ADRs, and open questions.
- Public surface being changed.
- Consumers or actors.
- Inputs.
- Outputs.
- Success behavior.
- Error behavior.
- State transitions or side effects.
- Compatibility expectations.
- Examples.
- Acceptance or E2E test outline.
- Contract/type/schema stress test plan.
- Type, schema, protocol, or signature sketch when relevant.
- Invalid states or invalid inputs that should be rejected.
- Non-goals and explicitly unsupported behavior.
- Documentation impact.

## Contract types
Choose the smallest contract form that makes the boundary reviewable:

- API contract: routes, methods, request/response examples, errors, auth, compatibility.
- Library contract: exported functions/classes/types, examples, error behavior, type expectations.
- CLI contract: commands, flags, stdin/stdout/stderr, exit codes, config, examples.
- UI workflow contract: user journey, visible states, validation, empty/loading/error behavior, accessibility expectations.
- Event/data contract: schema, producer/consumer responsibilities, ordering, versioning, failure modes.
- Integration contract: external dependency behavior, retries, auth, rate limits, data ownership.

## Stress testing guidance
Design how the contract can be challenged before implementation:

- Type stress: can invalid states be represented by the type surface?
- Schema stress: are invalid payloads rejected?
- API stress: are malformed requests, missing permissions, and edge cases defined?
- CLI stress: are invalid flags, missing input, and exit codes defined?
- UI stress: are invalid inputs, disabled states, empty/loading/error states defined?
- Integration stress: are retries, timeouts, rate limits, and partial failures defined?

For TypeScript, this may include type tests or examples that should fail. For other ecosystems, use the local equivalent: schemas, contract tests, property tests, invalid examples, or compile-time checks.

## Hard gates
- Do not implement while writing the contract.
- Do not duplicate the entire PRD. Link to it and specify only observable boundary behavior.
- Do not invent public behavior unsupported by PRD/model/context.
- Do not hand-author language-specific declaration files unless that is the best local artifact for the project.
- If the contract exposes unclear requirements, update `docs/context-state.md` and return to PRD, model, issue, or grilling before implementation planning.
- If no public or cross-boundary contract changes, state that this skill is not needed and proceed to `write-implementation-plan`.

## Next skills
Usually `review-contract-spec`, then `write-implementation-plan`.