# SDLC Prompt Template: Release Handoff Worker

Purpose: help the orchestrator create a consistent final Git handoff prompt or internal phase packet after implementation and review evidence exists.

This is an AI-filled template, not a user form. The human should not need to provide information in this shape.

Use with portable role definition: `.agents/agents/release-handoff-worker.md`.

## Template

```text
Use the AI SDLC workflow as installed/available in this environment.

## Repository Boundary
- Repository: {{repository_path_or_name}}
- Assigned repository role: {{repository_role}}
- Allowed context: {{allowed_context}}
- Forbidden context: {{forbidden_context}}
- Local scratch/output path, if any: {{local_scratch_path}}
- Git authority: {{authorized_git_operations}}

Work only inside the assigned repository and scope. This is a final handoff phase, not an implementation phase.

## Assigned Role
Release handoff worker.

## Finish Scope
{{finish_scope}}

## Approved Files
Files or paths allowed to stage:

{{allowed_stage_paths}}

Files or paths forbidden to stage:

{{forbidden_stage_paths}}

Do not stage local-only notes, secrets, scratch files, unrelated files, generated files not intended for this commit, or prompt/output logs unless explicitly listed as allowed.

## Evidence To Inspect
{{verification_and_review_evidence_to_inspect}}

## Required Handoff Steps
1. Inspect `git status --short --branch`.
2. Inspect the diff for the approved files or paths.
3. Run required verification:

{{required_verification_commands}}

4. Stage only the approved files or paths.
5. Run staged diff hygiene.
6. Commit with message:

{{commit_message}}

7. Run committed-range hygiene.
8. Check and report Git author/committer identity before public push or PR:

{{git_identity_check_expectation}}

9. Push or prepare PR only when explicitly authorized:

{{push_or_pr_expectation}}

10. Return a handoff packet.

## Stop Conditions
Stop and report instead of committing or publishing if:

{{stop_conditions}}

## Return

SDLC mode:
Repository boundaries:
Git operations authorized:
Git status before handoff:
Verification evidence:
Files staged:
Files intentionally not staged:
Git identity checked:
Commit created:
Push/PR status:
Evidence caps:
Residual risks:
Recommended next action:
```

## Fill Rules

- Use only after implementation and verification evidence exists.
- Preserve local-only and unrelated working tree changes.
- Require explicit Git publication authority before push or PR.
- Require Git identity evidence in the returned handoff whenever public push or PR is assigned.
- If verification fails or a fix is needed, stop and route back to implementation instead of patching in this prompt.
