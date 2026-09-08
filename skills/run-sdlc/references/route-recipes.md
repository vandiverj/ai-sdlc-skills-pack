# Route Recipes

Load only the recipe selected by the task. Recipes identify the minimum useful context, proof, and stop gate; they do not require packets when direct evidence is available.

Every route preserves scoped edits, relevant verification or an explicit evidence gap, and user authority over external or irreversible actions.

### tiny-docs

- Context: target text and its source of truth.
- Proof: diff inspection; link/path check when references change.
- Stop: unclear source truth or contradiction with behavior.

### tiny-code-cleanup

- Context: target code and nearest relevant check.
- Proof: focused test or inspection plus diff hygiene.
- Stop: behavior, public contract, or ownership changes.

### standard

- Context: repository guidance, intended outcome, affected source/tests.
- Proof: focused behavior check, broader check proportional to blast radius, concise review.
- Stop: unresolved behavior, ownership, contract, or material risk.

### interactive-stateful-feature

- Context: starting state, action, resulting state, and relevant persistence or consumer.
- Proof: primary interaction plus the most relevant reset, cancel, retry, or regression path.
- Stop: unclear success state or no credible automated/manual validation path.

### fixture-validation-kept-change

- Context: why the fixture represents the SDLC behavior and why its product change should remain.
- Proof: normal product checks plus the process behavior comparison.
- Stop: fixture evidence presented as broader production proof or unapproved Git action.

### bugfix-regression

- Context: reproduction, expected behavior source, affected implementation/tests.
- Proof: reproduction before when practical, focused regression after, relevant surrounding check.
- Stop: expected behavior or root cause remains materially unclear.

### ui-rendered-review

- Context: changed flow, states, viewport/platform, accessibility expectations when applicable.
- Proof: logic tests plus rendered interaction or an explicit tooling cap.
- Stop: visible behavior cannot be inspected and no credible human handoff exists.

### api-contract

- Context: caller, schema/contract, implementation, compatibility expectation.
- Proof: contract/schema validation and representative success/error behavior.
- Stop: unapproved public contract or compatibility decision.

### bugfix-live-system

- Context: sanitized exact failure evidence and analogous successful path.
- Proof: targeted regression plus the safest available environment evidence.
- Stop: sensitive data, production write, or deployment authority is missing.

### ticket-evidence

- Context: refreshed ticket requirements and relevant local code/tests.
- Proof: implementation mapped to current acceptance criteria.
- Stop: ticket drift or any unapproved ticket mutation.

### database-evidence

- Context: bounded metadata/aggregate/existence question and data sensitivity.
- Proof: redacted read-only evidence plus code-level verification.
- Stop: row-level exposure, write, migration, or production query without authority.

### generated-spa-artifact-promotion

- Context: source app, owning publish script, host boundary, generated ownership.
- Proof: source build, host diff, and served behavior.
- Stop: unclear artifact owner or unapproved movement between repositories/environments.

### review-only

- Context: reviewed claim, scoped artifacts, available evidence.
- Proof: findings tied to files, requirements, or executed checks.
- Stop: requested fix or external action without separate authority.

### release-push

- Context: changed files, fresh verification, branch/remote, local-only exclusions.
- Proof: committed or staged diff hygiene and explicit authorized action.
- Stop: failed checks, unrelated changes, unclear target, or missing approval.

### contract-first

- Context: consumers, compatibility, errors, schema/types, rollout needs.
- Proof: contract examples/tests and implementation agreement.
- Stop: unresolved public behavior, ownership, or migration decision.

### weak-test-legacy

- Context: expected behavior, analogous path, practical test foothold, manual surface.
- Proof: narrow regression when feasible plus explicit human QA.
- Stop: broad rewrite used to compensate for missing evidence.

### multi-repo-integration

- Context: repository roles, ownership, contracts, edit/push permissions, integration order.
- Proof: per-repository checks and one cross-boundary scenario.
- Stop: ambiguous ownership, version compatibility, or release authority.
