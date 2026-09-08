# SDLC Prompt Template: Independent Reviewer

Purpose: help the orchestrator create a consistent read-only independent review prompt or internal phase packet from a diff, commit, evidence packet, or handoff.

This is an AI-filled template, not a user form. The human should not need to provide information in this shape.

Use with portable role definition: `.agents/agents/independent-reviewer.md`.

## Template

```text
Use the AI SDLC workflow as installed/available in this environment.

## Repository Boundary
- Repository: {{repository_path_or_name}}
- Assigned repository role: {{repository_role}}
- Allowed context: {{allowed_context}}
- Forbidden context: {{forbidden_context}}
- Local scratch/output path, if any: {{local_scratch_path}}
- Git authority: read-only; do not stage, commit, push, edit files, or open a PR

Work only inside the assigned repository and scope. This is a read-only review.

## Assigned Role
Independent reviewer.

## Review Target
{{review_target}}

## Original Intent Or Acceptance Criteria
{{original_intent_or_acceptance_criteria}}

## Outcome, Connected Impact, and Claimed Proof
{{experience_impact_trace_and_closure}}

## Expected Review Route
- Work class: {{work_class}}
- Dirty surfaces: {{dirty_surfaces}}
- Reviews expected: {{expected_reviews}}
- Evidence needed: {{evidence_needed}}

## Context To Inspect
Use the smallest safe context packet needed to review the target.

Suggested context and commands:

{{context_and_commands_to_inspect}}

Do not modify files. Do not stage or commit.

## Known Evidence Packet
{{known_evidence_packet}}

Distinguish evidence you personally run from external evidence supplied by the orchestrator, CI, another agent, or a human. External evidence may satisfy a gap only when its source, freshness, scope, and cap are visible.

## Review Focus
{{review_focus}}

## Stop Conditions
Stop and report instead of continuing if:

{{stop_conditions}}

## Return

Reviewed scope:
Verdict: pass / pass-with-nonblocking-notes / blocked / needs-human-review
Blocking findings:
Non-blocking findings:
Evidence inspected:
Evidence personally run:
External evidence accepted:
Evidence gaps or caps:
Experience-impact closure findings:
Test/evidence integrity findings:
Rendered review findings or cap:
Git reviewability findings:
SDLC feedback draft:
Recommended action:
```

## Fill Rules

- Fill from the diff/commit, implementation handoff, review-router route, and required evidence.
- Keep reviewer context narrower than implementer context when possible.
- Do not include implementer confidence as evidence.
- Block when the intended outcome or a material connected impact disappeared or lacks claim-specific evidence.
- Do not ask the reviewer to fix findings in this prompt.
- Include a sanitized SDLC feedback draft when there is meaningful process friction, caps, skipped evidence, or tool/runtime evidence.
