---
name: release
description: 'Router skill for development branches, release documentation, finishing work, handoff, and final branch hygiene.'
user-invocable: true
---

# release

## Purpose
Own the finalization path after implementation, verification, and review: branch hygiene, release docs, handoff, and finish steps.

## Use When
- Work is ready to finish, commit, hand off, merge, ship, or document.
- A branch/worktree needs creation or final reviewable cleanup.

## Reference Selection

| Trigger or surface | Load reference |
| --- | --- |
| Create an isolated branch or worktree before implementation | `references/create-work-branch.md` |
| Update user-facing or developer-facing release docs | `references/document-release.md` |
| Finish a development branch with verification and next action | `references/finish-development-branch.md` |
| Prepare final git handoff details | `references/final-git-handoff.md` |

## Handoffs
- Use `quality` before completion claims.
- Use `review` for production readiness and release risk review.
- Use `context` to save final state.
- Escalate to `run-sdlc` for protected branches, push approval, or cross-repo release boundaries.

## Required Output
```text
Release task:
Branch/status:
Verification evidence:
Review status:
Docs/handoff:
Git action allowed:
Next action:
```

## Stop Rules
- Do not push to protected branches without explicit approval.
- Do not merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines unless the human explicitly asks and the project-specific process is known.
- Commit and push require explicit human approval.
- Do not finish release-facing work with missing verification, unresolved high-risk findings, or unclear rollback/handoff.
