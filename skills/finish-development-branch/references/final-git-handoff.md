# Final Git Handoff

Purpose: define when the SDLC may delegate final staging, commit, push, PR preparation, or handoff packet creation.

This reference is owned by `finish-development-branch`. Load it when a finish phase involves Git publication or when an implementation worker is asking for commit/push authority.

## Boundary

Normal implementation workers do not stage, commit, push, or open PRs.

Git handoff belongs to:

- the orchestrator, when the human expects Codex to own final branch mechanics,
- a release/handoff worker, when the finish phase explicitly delegates those mechanics,
- the fixture agent, only when the fixture task explicitly assigns final Git handoff inside the fixture repository.

## Required Evidence Before Git Handoff

- Current diff and status have been inspected.
- Required verification has passed, or failed/skipped checks have accepted caps.
- Local-only files and unrelated changes are identified.
- Staged files are intentionally selected.
- Diff hygiene is clean before commit.
- Commit author/committer identity is checked before public push or PR.
- The target branch, remote, and PR expectation are known.

## Delegation Prompt Requirements

When assigning a release/handoff worker, include:

```text
Repository:
Finish scope:
Authorized Git operations:
Files or paths allowed to stage:
Files or paths forbidden to stage:
Required verification evidence to inspect:
Commit message guidance:
Target branch/remote:
Push/PR expectation:
Stop conditions:
Expected handoff format:
```

## Stop Conditions

Stop and return to the orchestrator when:

- verification evidence is missing, failed, or stale,
- unrelated changes are mixed into the diff,
- local-only notes, secrets, or scratch files might be staged,
- the branch target or remote is unclear,
- the work needs a PR but no PR policy is known,
- a fix is needed before finish,
- the operation would publish sensitive or unreviewed material.

## Review Checklist

- Git operations were explicitly authorized.
- The release/handoff worker did not perform implementation fixes.
- Staging was file-specific and reviewable.
- Commit message matches the scoped change.
- Push or PR state matches the assignment.
- Caps and residual risks are visible in the handoff.
