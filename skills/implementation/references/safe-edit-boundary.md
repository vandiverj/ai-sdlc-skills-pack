# Safe Edit Boundary

Use before modifying files.

## Checks
- Identify files and directories allowed for the task.
- Identify commands allowed for verification.
- Note dirty worktree files and avoid reverting unrelated user changes.
- Confirm destructive commands, dependency installs, migrations, network calls, and external writes require approval.
- Keep unrelated refactors and metadata churn out of scope.

## Output
- Allowed edit paths.
- Read-only paths.
- Allowed commands.
- Approval-needed commands.
- Known user changes to preserve.
- Stop condition.
