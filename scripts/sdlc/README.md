# SDLC CLI

Small dependency-free helper for repetitive SDLC mechanics.

Run from a repository:

```bash
sdlc readiness
sdlc health
sdlc context restore
sdlc context pack --task "fix payment webhook contract"
sdlc context audit
sdlc context update-plan --task "fix payment webhook contract"
sdlc route start multi-repo-integration --task "fix payment webhook contract"
sdlc run start --task "fix payment webhook contract"
sdlc run finish --route multi-repo-integration
sdlc packet status
sdlc done check --route review-only --packet .ai-local/sdlc-runs/<packet>.md
sdlc review packet --task "review the current diff without edits"
sdlc review complete --packet .ai-local/sdlc-runs/<packet>.md --verdict "pass with notes" --checks "git show --check HEAD,npm run test" --caps "rendered evidence not run"
sdlc release packet
sdlc release complete --packet .ai-local/sdlc-runs/<packet>.md --action none --verdict "ready for human release approval" --checks "npm run test,npm run build"
sdlc multi status
sdlc multi packet --task "change an API contract across services"
sdlc contract packet --task "change the public API contract"
sdlc setup doctor
sdlc setup doctor --fix-plan
sdlc scenario list
sdlc scenario test
sdlc scenario validate ui-rendered-issue --task "add animation to the computer turn"
sdlc render smoke --url http://127.0.0.1:5173/
sdlc evidence init --route standard
sdlc verify --commands test,build
sdlc calibrate add --route standard --outcome pass --route-fit right
sdlc calibrate summary
sdlc calibrate inspect
sdlc calibrate propose
```

The CLI is an affordance over the Markdown SDLC. It does not replace agent judgment, human approval gates, source review, or route-specific skill guidance.
