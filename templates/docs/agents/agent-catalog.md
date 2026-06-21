# Agent Catalog

## Status
Draft / Active / Needs Review

## Role definition format

```text
Agent id:
Purpose:
Use when:
Do not use when:
Default model tier:
Escalation tier:
Allowed tools:
Disallowed tools:
Write access:
Required context:
Expected output:
Verification/evidence required:
Escalation triggers:
Can delegate:
Learning signals:
Status: portable agent / router reference / conceptual role / future candidate
```

## Core roles

### orchestrator
- Purpose: Own SDLC routing, delegation, synthesis, user updates, and final accountability.
- Default model tier: `standard`; escalate to `deep` for high-risk or ambiguous decisions.
- Write access: Only when also acting as a bounded worker.
- Can delegate: Yes, when the runtime supports it and the strategy allows it.

### context-scout
- Purpose: Find the smallest safe context packet, related artifacts, risks, and contradictions.
- Status: portable agent. Alias: `context-explorer`.
- Default model tier: `fast` or `standard`.
- Write access: No.
- Expected output: Files/artifacts to load, why they matter, uncertainty, and next recommended skill.
- Codex frontier adapter: `sdlc_context_scout` using `gpt-5.3-codex-spark`.
- Auggie adapter: `sdlc-context-scout`; default model unless installed with available frontier GPT mapping.

### read-only-code-scout
- Purpose: Perform bounded read-only code discovery for a named language profile and task type.
- Status: portable agent.
- Default model tier: `local`, `fast`, or `standard` depending on runtime support and sensitivity.
- Write access: No.
- Expected output: Source-linked findings, uncertainty, verification questions, caps, and recommended next action.
- Common task types: duplication-scan, abandoned-code-scan, extraction-candidate-scan, test-gap-scan, risk-surface-scan, context-summary.
- Escalation triggers: unclear scope, missing source pointers, sensitive boundary uncertainty, invented facts, or findings more expensive to verify than manual review.
- Codex frontier adapter: `sdlc_read_only_code_scout` using `gpt-5.3-codex-spark`.
- Auggie adapter: `sdlc-read-only-code-scout`; default model unless installed with available frontier GPT mapping.

### implementation-planner
- Purpose: Convert approved issue/contract/context into an executable, testable, bounded plan.
- Status: portable agent.
- Default model tier: `standard`; escalate to `deep` for high-risk planning.
- Write access: No implementation edits.
- Expected output: Plan sections required by the `planning` implementation-plan reference.
- Codex frontier adapter: `sdlc_implementation_planner` using `gpt-5.4-mini`.
- Auggie adapter: `sdlc-implementation-planner`; default model unless installed with available frontier GPT mapping.

### implementation-worker
- Purpose: Execute an approved plan within a safe-edit boundary.
- Status: portable agent.
- Default model tier: `standard`.
- Write access: Only assigned files.
- Expected output: Changed files, tests run, blockers, and deviations from plan.
- Codex frontier adapter: `sdlc_implementation_worker` using `gpt-5.4`.
- Auggie adapter: `sdlc-implementation-worker`; default model unless installed with available frontier GPT mapping.

### verification-worker
- Purpose: Run approved verification commands and tool-backed checks without editing files.
- Status: portable agent.
- Default model tier: `deterministic` when commands are specified; `standard` when interpreting failures.
- Write access: No.
- Expected output: Commands/tools run, results, failed/skipped checks, rendered-review evidence or cap, and residual evidence risk.
- Codex frontier adapter: `sdlc_verification_worker` using `gpt-5.4-mini`.
- Auggie adapter: `sdlc-verification-worker`; default model unless installed with available frontier GPT mapping.

### independent-reviewer
- Purpose: Review a bounded plan, diff, or evidence packet independently from the implementing agent.
- Status: portable agent.
- Default model tier: `standard`; escalate to `deep` for high-risk work or unresolved evidence conflicts.
- Write access: No.
- Expected output: Blocking findings first, non-blocking findings, evidence gaps, residual risks, and a recommendation.
- Codex frontier adapter: `sdlc_independent_reviewer` using `gpt-5.4`.
- Auggie adapter: `sdlc-independent-reviewer`; default model unless installed with available frontier GPT mapping.

### release-handoff-worker
- Purpose: Perform final Git/status hygiene and publish only when explicitly assigned.
- Status: portable agent.
- Default model tier: `standard`.
- Write access: May stage, commit, or push only inside the assigned repository and only when the handoff phase grants that authority.
- Expected output: Final status, staged-file boundary, verification evidence, commit/push result or cap, and residual release risk.
- Codex frontier adapter: `sdlc_release_handoff_worker` using `gpt-5.4-mini`.
- Auggie adapter: `sdlc-release-handoff-worker`; default model unless installed with available frontier GPT mapping.

### process-learning-reviewer
- Purpose: Aggregate repeated process evidence and recommend small SDLC improvements.
- Status: portable agent.
- Default model tier: `standard`; escalate to `deep` for broad process architecture changes.
- Write access: No.
- Expected output: Patterns observed, reusable gaps, fixture-only issues, strategic questions, overfitting risk, and recommended artifact updates.
- Codex frontier adapter: `sdlc_process_learning_reviewer` using `gpt-5.4-mini`.
- Auggie adapter: `sdlc-process-learning-reviewer`; default model unless installed with available frontier GPT mapping.

### test-engineer
- Purpose: Design or review tests, edge cases, regression checks, and verification commands.
- Status: router reference or future candidate; no portable agent by default.
- Default model tier: `standard`.
- Write access: Usually read-only; may write tests when explicitly assigned.
- Expected output: Missing tests, test-first recommendations, verification evidence gaps.

### spec-compliance-reviewer
- Purpose: Check implementation against issue, PRD, model, and contract.
- Status: router reference; no portable agent by default.
- Default model tier: `standard`.
- Write access: No.
- Expected output: Pass/fail, missing requirements, contract mismatches, scope creep.

### code-quality-reviewer
- Purpose: Review maintainability, cohesion, coupling, abstractions, documentation, and operability.
- Status: router reference; no portable agent by default.
- Default model tier: `standard`.
- Write access: No.
- Expected output: Findings ordered by risk, optional improvements, accepted risks.

### contract-reviewer
- Purpose: Review public API, CLI, schema, event, SDK, plugin, integration, or UI workflow contracts.
- Status: router reference; no portable agent by default.
- Default model tier: `standard`; escalate to `deep` for high-risk public surfaces.
- Write access: No.
- Expected output: Ambiguity, invalid states, compatibility issues, stress-test gaps.

### threat-modeler
- Purpose: Review security, privacy, abuse cases, data, dependency, tool-access, and AI/agent risks.
- Status: portable agent via `security-privacy-reviewer`; `threat-modeler` is a conceptual alias.
- Default model tier: `deep`.
- Write access: No.
- Expected output: Threat-model findings, required mitigations, tests/checks, residual risks.
- Codex frontier adapter: `sdlc_security_privacy_reviewer` using `gpt-5.5`.
- Auggie adapter: `sdlc-security-privacy-reviewer`; default model unless installed with available frontier GPT mapping.

### production-readiness-reviewer
- Purpose: Review release, rollback, observability, migration, CI/local parity, and Git reviewability.
- Status: router reference or future candidate; no portable agent by default.
- Default model tier: `standard`; escalate to `deep` for high-risk release decisions.
- Write access: No.
- Expected output: Ready/needs fixes/not ready, blocking issues, accepted risks, commit boundary advice.

### doc-sync-reviewer
- Purpose: Check that code, tests, contracts, docs, feature context, Memory Bank, and AGENTS.md agree.
- Status: router reference or future candidate; no portable agent by default.
- Default model tier: `fast` or `standard`.
- Write access: No, unless assigned a bounded docs update.
- Expected output: Drift findings and owning artifacts to update.

### qa-handoff-worker
- Purpose: Create tester-readable QA handoff material from implementation evidence.
- Status: portable agent.
- Default model tier: `standard`.
- Write access: QA/handoff docs only when explicitly assigned.
- Expected output: Tester setup, scenarios, expected results, regression checks, caps.
- Codex frontier adapter: `sdlc_qa_handoff_worker` using `gpt-5.4-mini`.
- Auggie adapter: `sdlc-qa-handoff-worker`; default model unless installed with available frontier GPT mapping.

### feedback-reporter
- Purpose: Draft sanitized SDLC feedback events for parent-mediated submission.
- Status: portable agent.
- Default model tier: `standard`.
- Write access: No direct MCP submission by default.
- Expected output: `airtera.sdlc.feedback.v1`-compatible draft with `rawContentIncluded: false`.
- Codex frontier adapter: `sdlc_feedback_reporter` using `gpt-5.4-mini`.
- Auggie adapter: `sdlc-feedback-reporter`; default model unless installed with available frontier GPT mapping.

## Feedback rule
Specialist agents return SDLC feedback drafts. The parent orchestrator validates and submits through AirteraCode MCP when available, or local `sdlc feedback add` fallback when not.

## Specialist additions
Add a specialist only when repeated work proves a stable need, the output contract is clear, and the role improves quality, safety, reviewability, or cost.

## Last updated
- Date:
- Updated because:
- Confidence:
