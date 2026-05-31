# SDLC Prompt Template: Evidence Packet

Purpose: give the orchestrator a consistent compact evidence packet shape to include in delegated prompts or final handoffs.

This is an AI-filled template, not a user form. Use it to summarize what is known before delegating review, release handoff, or continuation.

## Template

```text
## Evidence Packet

Original request:
{{original_request}}

Work class and route:
{{work_class_and_route}}

Acceptance criteria:
{{acceptance_criteria}}

Changed files or target diff:
{{changed_files_or_target_diff}}

Verification personally run by orchestrator:
{{orchestrator_verification}}

Verification reported by worker/CI/tool:
{{external_verification}}

Rendered/browser/UI evidence:
{{rendered_review_evidence}}

Evidence caps:
{{evidence_caps}}

Known risks or non-blocking notes:
{{known_risks_or_notes}}

Local-only/untracked surfaces:
{{local_only_surfaces}}

Recommended next phase:
{{recommended_next_phase}}
```

## Fill Rules

- Keep the packet compact enough to review.
- Label evidence source clearly: orchestrator-run, worker-reported, CI/tool-reported, or human-provided.
- Include failed, skipped, capped, or stale checks rather than smoothing them away.
- Do not include secrets, private prompts, or local-only scratch unless the downstream role needs the fact that they exist.
