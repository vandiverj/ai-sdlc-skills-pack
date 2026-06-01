# Contract Spec Review

Use when `write-contract-spec` produced or changed a public contract, or when implementation planning depends on public API, CLI, UI workflow, schema, exported type, integration, or cross-module boundary behavior.

## Read First
- Contract spec.
- Target issue and acceptance criteria.
- Related PRD and application model sections.
- Related feature context, ADRs, public docs, schemas, examples, tests, and context-state questions.

## Checks
- Contract matches the PRD, issue, and application model.
- Public surface is explicit enough to implement without guessing.
- Inputs, outputs, success cases, error behavior, state changes, compatibility, and migration expectations are testable.
- Examples match existing project conventions and realistic consumer behavior.
- Unsupported behaviors and non-goals are stated.
- Required docs, schemas, type surfaces, E2E/acceptance tests, and stress tests are identified.
- The contract does not leak private implementation details.
- Decision-bearing questions are surfaced in chat with a recommendation, tradeoff, and default action.

## Hard Gates
- Do not approve a contract that cannot be tested.
- Do not approve a contract that adds requirements unsupported by the PRD/model unless those artifacts are updated.
- Do not approve vague public error behavior or compatibility expectations when they matter.
- Do not approve a type/schema/API surface that permits important invalid states without an explicit reason.

## Output
- Pass/fail.
- Required fixes.
- Optional improvements.
- Contract/type/schema stress findings.
- Scope or compatibility risks.
- Chat attention items.
- Required context-state updates.
- Recommendation: approve, revise, or return to PRD/model/issue refinement.
