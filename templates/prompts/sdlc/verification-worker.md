# SDLC Prompt Template: Verification Worker

Purpose: help the orchestrator create a consistent verification-worker prompt or internal phase packet after implementation and before review, handoff, or completion.

This is an AI-filled template, not a user form. The human should not need to provide information in this shape.

Use with portable role definition: `.agents/agents/verification-worker.md`.

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

Work only inside the assigned repository and scope. This is a verification phase, not an implementation or release phase.

## Assigned Role
Verification worker.

## Verification Target
{{verification_target}}

## Acceptance And Experience-Impact Evidence Map
{{acceptance_and_experience_evidence_map}}

## Work Classification
- Work class: {{work_class}}
- Dirty surfaces: {{dirty_surfaces}}
- Evidence needed: {{evidence_needed}}

## Context To Inspect
{{context_to_inspect}}

## Required Commands And Tools
Run only the approved checks:

{{required_verification_commands}}

Rendered review expectation:
{{rendered_review_expectation}}

## Known Evidence Or Caps
{{known_evidence_or_caps}}

## Stop Conditions
Stop and report instead of continuing if:

{{stop_conditions}}

## Return

Verification scope:
Repository boundaries:
Commands/tools run:
Results:
Acceptance-criterion and experience-scenario evidence map:
Rendered review evidence or cap:
Failed checks:
Skipped checks:
Evidence caps:
Environment notes:
Ready for review:
Recommended next action:
SDLC feedback draft:
```

## Fill Rules

- Use this template when evidence collection should be separate from implementation or review judgment.
- Do not ask the verification worker to fix failures.
- Include exact commands whenever possible.
- Require each result to identify the criterion/scenario it proves; generic build/test success does not satisfy unrelated behavior.
- Include rendered-review expectations for UI/user-facing behavior.
- Require caps for unavailable tools instead of substitute confidence.
- Include a sanitized SDLC feedback draft when there is meaningful process friction, caps, skipped evidence, or tool/runtime evidence.
