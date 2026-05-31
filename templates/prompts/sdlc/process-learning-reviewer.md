# SDLC Prompt Template: Process Learning Reviewer

Purpose: help the orchestrator create a consistent process-learning prompt or internal phase packet from accumulated run evidence.

This is an AI-filled template, not a user form. The human should not need to provide information in this shape.

Use with portable role definition: `.agents/agents/process-learning-reviewer.md`.

## Template

```text
Use the AI SDLC workflow as installed/available in this environment.

## Boundary
- Repositories or workspaces allowed: {{allowed_workspaces}}
- Context allowed: {{allowed_context}}
- Context forbidden: {{forbidden_context}}
- Edit authority: read-only unless a separate update route is explicitly assigned

This is a process-learning review. Do not implement fixes or update durable SDLC artifacts in this prompt.

## Assigned Role
Process learning reviewer.

## Process Evidence To Review
{{process_evidence_to_review}}

## Current Operating Model Or Rules
{{current_operating_model_or_rules}}

## Review Focus
{{review_focus}}

Classify each finding as:

- already covered by the SDLC,
- fixture-only issue,
- reusable SDLC gap,
- strategic question,
- not worth changing.

## Stop Conditions
Stop and report instead of continuing if:

{{stop_conditions}}

## Return

Reviewed process evidence:
Patterns observed:
Already covered by SDLC:
Fixture-only issues:
Reusable SDLC gaps:
Strategic questions:
Not worth changing:
Recommended artifact updates:
Why this is not overfit:
Risks:
Recommended next action:
```

## Fill Rules

- Provide sanitized summaries, not raw private logs.
- Prefer small skill/template/reference updates over broad restructuring.
- Keep Pi-specific or Codex-specific runtime issues out of reusable rules unless they generalize.
- If evidence is weak, recommend more validation rather than permanent guidance.
