# process-review-feedback

## Description
Evaluate and apply code review feedback intentionally.

## Purpose
Avoid blindly accepting reviewer suggestions that create new drift.

## Process
1. Read each review item.
2. Restate the technical issue.
3. Verify whether it applies to this codebase.
4. Decide: accept, reject, or defer.
5. If accepted, implement one review item or coherent batch at a time.
6. If feedback changes design, update model/PRD/issues/context-state/context.md.
7. Re-run verification after fixes.

## Output
- Accepted feedback
- Rejected feedback with reason
- Deferred feedback with revisit trigger
- Verification evidence
