# Outcome reporting — closing the context-engine feedback loop

> Load when a task that used the context engine reaches an end state (delivered, verified, abandoned).
> This is the **highest-quality outcome stratum**: SDLC runs know the task, the diff, and the test
> result at completion, which ad-hoc sessions do not.

## Why this exists

The engine's retrieval, promotion, and case-based reasoning all eat **verified outcomes**. Without
them, a pack that led nowhere and a pack that led to a correct three-file change are indistinguishable.

Two distinct feedback channels — do not confuse them:

| Tool | Subject | Goes to |
|---|---|---|
| `sdlc_feedback` | the **process** (route fit, friction, caps, delegation) | SDLC process-learning queue |
| `feedback` | the **retrieval** (did the context work, what changed, did tests pass) | `outcome_feedback` — retrieval scoring |

Reporting process friction does not report a retrieval outcome. A run that used `get_task_context`
should send both.

## The rule: carry `pack_ref`

`get_task_context` returns `pack_ref` at the top level and at `pack.pack_ref`. **Record it in the run
artifacts as soon as the pack is retrieved** — it is the only handle that links an outcome back to the
retrieval that produced it. A report without it is stored but ungradable.

Keep it with the run state (e.g. in the run ledger under `.ai-local/sdlc-runs/`), because the phase that
retrieves context is usually not the phase that finishes the work.

If a run retrieved several packs, report against the `pack_ref` whose context actually drove the change.

## What to send, and when

At the end of a run, send what you actually know. Never guess.

```
feedback(kind="agent_diff", payload={
  pack_ref, files_changed: ["src/Payments/Refund.cs", "tests/RefundTests.cs"], success: true })

feedback(kind="test_result", payload={
  pack_ref, success: false, command: "dotnet test", workspace_id })

feedback(kind="outcome", payload={
  pack_ref, success: true, notes: "<sanitized one-line summary>" })

feedback(kind="missing_context", payload={
  pack_ref, notes: "pack had no trigger definition for tbl_claims" })
```

- **`files_changed`** — repo-relative paths actually edited, from the run's touched-surface ledger, not
  from intent. This list is the ground-truth label for change-surface scoring and is the single most
  valuable field an SDLC run can produce.
- **`test_result`** — report the real result. A failing test recorded honestly is a stronger signal than
  a success that was never verified.
- **`missing_context`** — send whenever the pack was thin, wrong, or missing something you had to go
  find yourself. This is how retrieval gaps get fixed.

The response echoes `{"linked": true}` when `pack_ref` resolved. If it says `false`, the row will not be
usable — check that the ref came from this client's own retrieval.

## Sanitization (same boundary as `sdlc_feedback`)

`notes` is free text and is stored. Never include raw code, raw diffs, ticket text, database output,
logs, secrets, or customer data. Summarize. `files_changed` is paths only — paths are fine, contents
are not.

## Failure handling

Feedback is best-effort and must never block delivery:

- MCP unavailable → note it in the run artifacts and continue. Do not retry in a loop.
- No `pack_ref` (the engine was not used) → skip `feedback` entirely; `sdlc_feedback` may still apply.
- Never fabricate a `pack_ref`, a file list, or a test result to make a report look complete.

## Checklist

- [ ] `pack_ref` captured when context was retrieved, stored in run state
- [ ] `agent_diff` sent with the real touched-surface list
- [ ] `test_result` sent with the real pass/fail
- [ ] `outcome` sent with sanitized notes
- [ ] `missing_context` sent if the pack fell short
- [ ] Response showed `"linked": true`
