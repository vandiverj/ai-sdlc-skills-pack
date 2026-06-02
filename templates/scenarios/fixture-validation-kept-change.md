# Scenario: Fixture Validation With Kept Change

Use this scenario when a fixture app or sample repository is used to validate SDLC behavior and the resulting product change should be saved instead of discarded.

## Route Expectations

- Treat useful fixture changes as real product work.
- Keep changed-file scope, verification evidence, and QA readiness explicit.
- Generate a finish packet with `--intent keep-change` before recommending a commit preview.
- Do not push, merge, deploy, create MR/PRs, trigger pipelines, or move files without explicit human approval.

## Helper Commands

```bash
sdlc fixture plan --task "<task>"
sdlc verify packet --task "<task>"
sdlc finish packet --task "<task>" --intent keep-change
sdlc action preview --action commit
```

