# Agent Response Packet Contract

Use this shape when a delegated SDLC role returns work to the orchestrator.

```text
Status: complete / partial / blocked / needs-human-review
Role:
ScopeHandled:
EvidenceUsed:
StructuredClaims:
BoundaryCheck:
CapsRisks:
FilesTouched:
CommandsRun:
RenderedEvidence:
HumanApprovalsNeeded:
FallbacksUsed:
SDLCFeedbackDraft:
Recommended next action:
```

Rules:

- Failed, skipped, stale, or capped evidence must be named.
- Claims should be deterministic or source-linked whenever possible.
- `SDLCFeedbackDraft` is required when the run reports meaningful process friction, caps, skipped evidence, or tool/runtime issues.
- Feedback drafts must be sanitized and set `rawContentIncluded: false`.
- Delegated agents draft feedback only. The parent orchestrator validates and submits through AirteraCode MCP when available or local `sdlc feedback add` fallback when not.
- Do not include raw code, raw diffs, secrets, private ticket text, database output, customer data, raw logs, or full prompt/chat transcripts in feedback.
- Commit, push, merge, deploy, release, ticket writes, migrations, dependency installs, and external-service actions require explicit human approval.
