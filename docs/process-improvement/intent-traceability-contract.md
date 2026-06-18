# Intent Traceability Contract

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Preserve the developer's original request and map every packet, plan change, evidence claim, and final outcome back to that request.

## Required Fields

- `originalTask`
- `interpretedObjective`
- `acceptedScope`
- `outOfScope`
- `acceptanceEvidenceExpected`
- `planAdjustments`
- `currentPacketClaim`
- `humanVisibleNextAction`

## Optional Fields

- `taskId`
- `journalPath`
- `ticketOrIssue`
- `humanCorrections`
- `waivers`
- `deferredQuestions`

## Source Of Truth

The run journal and generated packets carry the trace. Process docs explain the shape but do not replace task-local state.

## Forbidden Claims

- Do not rewrite the user's intent silently.
- Do not treat a packet generation step as proof that work executed.
- Do not hide scope changes in model output summaries.

## Validation Path

Packet lint checks that generated packets include an `Intent Trace` section. Completion review checks whether the final summary maps back to the original task.

## No-Install Fallback

Add a short intent trace section to any manual packet or handoff.
