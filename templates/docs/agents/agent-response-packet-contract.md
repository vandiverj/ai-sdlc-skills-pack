# Agent Response Packet Contract

Use this shape when a delegated SDLC role returns work to the orchestrator.

```text
Status: complete / partial / blocked / needs-human-review
Role:
Scope handled:
Evidence used:
Structured claims:
Boundary check:
Caps/risks:
Recommended next action:
```

Rules:

- Failed, skipped, stale, or capped evidence must be named.
- Claims should be deterministic or source-linked whenever possible.
- Commit, push, merge, deploy, release, ticket writes, migrations, dependency installs, and external-service actions require explicit human approval.
