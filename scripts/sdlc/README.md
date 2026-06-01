# SDLC CLI

Small dependency-free helper for repetitive SDLC mechanics.

Run from a repository:

```bash
sdlc readiness
sdlc context restore
sdlc context pack --task "fix payment webhook contract"
sdlc route start multi-repo-integration --task "fix payment webhook contract"
sdlc review packet --task "review the current diff without edits"
sdlc release packet
sdlc setup doctor
sdlc scenario list
sdlc scenario test
sdlc scenario validate ui-rendered-issue --task "add animation to the computer turn"
sdlc render smoke --url http://127.0.0.1:5173/
sdlc evidence init --route standard
sdlc verify --commands test,build
sdlc calibrate add --route standard --outcome pass --route-fit right
sdlc calibrate summary
```

The CLI is an affordance over the Markdown SDLC. It does not replace agent judgment, human approval gates, source review, or route-specific skill guidance.
