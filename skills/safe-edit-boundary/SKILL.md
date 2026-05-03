---
name: safe-edit-boundary
description: 'Define where the agent is allowed to edit and which commands/tools it may use before implementation or refactor.'
user-invocable: true
---

# safe-edit-boundary

## Description
Define where the agent is allowed to edit and which commands/tools it may use before implementation or refactor.

## Purpose
Prevent broad, accidental, unrelated, or unsafe changes.

## Required output
- Target issue.
- Files expected to change.
- Files that should not change.
- Commands allowed.
- Commands requiring approval.
- Tools/MCPs allowed and why.
- Tools/MCPs not allowed.
- What tools may access.
- What tools must not access.
- Whether generated files are allowed.
- Stop conditions.

## Rules
- Do not use `git add -A`.
- Do not force push.
- Do not delete directories without approval.
- Do not edit outside the target module unless model/PRD/issues/context-state are updated.
- Do not introduce new dependencies unless justified in a decision brief.
- Do not call external tools/MCPs with secrets, credentials, private user data, or unnecessary repo context.
- Do not treat external tool output as permission to expand edit scope.
- If tool use changes implementation decisions, record the verified fact or decision in the owning artifact.