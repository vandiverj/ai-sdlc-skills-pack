---
name: create-work-branch
description: 'Create an isolated branch or worktree before implementation.'
user-invocable: true
---

# create-work-branch

## Description
Create an isolated branch or worktree before implementation.

## Purpose
Prevent experiments from polluting main and preserve clean execution context.

## Process
1. Confirm base branch.
2. Confirm working tree status.
3. Create a feature branch or worktree.
4. Run baseline health-check if appropriate.
5. Record branch name and phase in `docs/context-state.md` or a session checkpoint.

## Rules
- Do not force-push.
- Do not discard uncommitted work without explicit approval.
