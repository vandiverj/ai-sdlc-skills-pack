
# to-prd

## Description
Synthesize developed conversation context and the application model into a durable PRD.

## Purpose
Turn clarified context into product requirements without re-interviewing the user unnecessarily or jumping directly into issues.

## Inputs
- Conversation context from `grill-me` or approved design notes.
- `docs/application-model.md`.
- Relevant `docs/context-state.md` open questions.
- Related feature `context.md`, ADRs, or existing repo context when applicable.

## Required sections
- Status: Draft / Active / Superseded / Implemented / Needs Review.
- Problem statement.
- Goals.
- Non-goals / NOT in scope.
- User stories or user workflows.
- Requirements.
- UX, API, CLI, data, or system behavior as applicable.
- Acceptance criteria.
- Test expectations.
- Dependencies.
- Risks.
- MVP scope.
- What already exists.
- Related open questions.
- Related model sections and diagrams.

## Rules
- Do not invent major requirements unsupported by prior context.
- Do not create implementation issues inside this skill.
- Do not treat unresolved blocking questions as resolved.
- If context is insufficient, identify exact missing questions and update `context-state.md`.
- If the PRD changes the application model, mark the model as needing review.

## Next skills
Usually `review-prd-against-model`, then `diagram-issues`, then `to-issues`.
