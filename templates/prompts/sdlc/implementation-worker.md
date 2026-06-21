# SDLC Prompt Template: Implementation Worker

Purpose: help the orchestrator create a consistent implementation-worker prompt or internal phase packet from normal human intent, classification output, and planning artifacts.

This is an AI-filled template, not a user form. The human should not need to provide information in this shape.

Use with portable role definition: `.agents/agents/implementation-worker.md`.

## Template

```text
Use the AI SDLC workflow as installed/available in this environment.

## Repository Boundary
- Repository: {{repository_path_or_name}}
- Assigned repository role: {{repository_role}}
- Allowed context: {{allowed_context}}
- Forbidden context: {{forbidden_context}}
- Local scratch/output path, if any: {{local_scratch_path}}
- Git authority: no staging, commit, push, PR, or release action unless explicitly listed below

Work only inside the assigned repository and scope. Do not inspect, edit, or judge other repositories unless explicitly allowed.

## Assigned Role
Implementation worker.

## Feature Or Task Intent
{{feature_or_task_intent}}

## Work Classification
- Work class: {{work_class}}
- Risk level: {{risk_level}}
- Dirty surfaces: {{dirty_surfaces}}
- Evidence packet level: {{evidence_packet_level}}

## Acceptance Criteria
{{acceptance_criteria}}

## Approved Plan Or Bundled Defaults
{{implementation_plan_or_bundled_defaults}}

If this is a bundled implementation assignment, first confirm the plan, acceptance criteria, required verification, rendered-review requirement, and stop conditions; then implement; then return gate-by-gate evidence or a cap for unavailable evidence. Bundled means fewer handoffs, not fewer checks.

## Edit Boundary
- Files or areas allowed to edit: {{allowed_edits}}
- Files or areas forbidden to edit: {{forbidden_edits}}
- Protected evidence surfaces: {{protected_evidence_surfaces}}
- Local-only files that must not be staged or modified: {{local_only_paths}}

## Context To Inspect
{{context_to_inspect}}

## Required Verification
Run the relevant project checks discovered from local project artifacts, at minimum:

{{required_verification_commands}}

Rendered review expectation:
{{rendered_review_expectation}}

If a required verification tool is unavailable, say so plainly and mark the relevant claim capped/unverified. Do not claim success from code inspection alone.

## Stop Conditions
Stop and report instead of continuing if:

{{stop_conditions}}

## Return

SDLC mode:
Work class:
Repository boundaries:
Context inspected:
Current understanding:
Assumptions:
Acceptance criteria status:
Implementation plan:
Files changed:
Verification evidence with command/tool results:
Rendered review evidence or cap:
Evidence caps or unavailable tools:
Open questions with recommended defaults:
Process findings:
Recommended reusable SDLC change, if any:
SDLC feedback draft:
Stop condition:
Ready for review:
```

## Fill Rules

- Fill from the user's normal request, classification output, issue/PRD/contract/plan, safe-edit boundary, and current repository state.
- Keep the prompt specific enough to prevent scope drift.
- Do not include reusable SDLC testing context unless the task is explicitly testing workflow behavior.
- Do not let this template grant Git publication authority; use the release-handoff template for that phase.
- Include a sanitized SDLC feedback draft when there is meaningful process friction, caps, skipped evidence, or tool/runtime evidence.
