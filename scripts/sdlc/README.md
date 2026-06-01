# SDLC CLI

Small dependency-free helper for repetitive SDLC mechanics.

Run from a repository:

```bash
node /path/to/.agents/scripts/sdlc/sdlc.mjs context restore
node /path/to/.agents/scripts/sdlc/sdlc.mjs evidence init --route standard
node /path/to/.agents/scripts/sdlc/sdlc.mjs verify --commands test,build
node /path/to/.agents/scripts/sdlc/sdlc.mjs calibrate add --route standard
```

The CLI is an affordance over the Markdown SDLC. It does not replace agent judgment, human approval gates, source review, or route-specific skill guidance.
