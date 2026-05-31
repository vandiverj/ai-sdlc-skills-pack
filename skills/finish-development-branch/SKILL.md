---
name: finish-development-branch
description: 'Finish a development branch with verification, documentation checks, and an explicit next action.'
user-invocable: true
---

# finish-development-branch

## Description
Finish a development branch with verification, documentation checks, and an explicit next action.

## Purpose
Avoid vague endings and preserve a clean GitHub workflow.

For delegated final Git handoff, use the local reference `references/final-git-handoff.md`. Portable release/handoff agent definitions live in `.agents/agents/*.md`; runtime adapters should stay thin.

## Process
1. Run verification-before-completion.
2. Run health-check if appropriate.
3. Confirm Git status is reviewable and local-only notes are not staged accidentally.
4. For committed work, run committed-range diff hygiene such as `git show --check HEAD` or `git diff --check <base>..HEAD`.
5. Before public push or PR, verify latest commit author/committer identity with `git log --format=fuller -1`.
6. Summarize changed files.
7. Confirm docs/context updates.
8. Provide commit message.
9. Present finish options:
   - push/create PR
   - merge locally
   - keep branch
   - discard branch
10. Save context checkpoint.

## Do not
- Claim the branch is done without verification evidence.
- Push or merge without an explicit user instruction or configured workflow.
- Push public/shared work without checking Git identity and local-only files.
