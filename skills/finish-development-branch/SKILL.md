# finish-development-branch

## Description
Finish a development branch with verification, documentation checks, and an explicit next action.

## Purpose
Avoid vague endings and preserve a clean GitHub workflow.

## Process
1. Run verification-before-completion.
2. Run health-check if appropriate.
3. Summarize changed files.
4. Confirm docs/context updates.
5. Provide commit message.
6. Present finish options:
   - push/create PR
   - merge locally
   - keep branch
   - discard branch
7. Save context checkpoint.

## Do not
- Claim the branch is done without verification evidence.
- Push or merge without an explicit user instruction or configured workflow.
