# Multi-Repo Validation Fixture

Purpose: provide a reusable validation shape for tasks that span a legacy site, APIs, database scripts, and newer app packages.

## Fixture Shape

- `legacy-site`: ASP Classic or similar UI/workflow surface.
- `api-service`: .NET or Node API used by the site.
- `database`: SQL scripts, stored procedures, migrations, seed/test data.
- `integration-adapter`: third-party webhook/API/file exchange boundary.
- `modern-app`: TypeScript/Deno/JSR app or supporting package.

## Validation Scenario

Task: implement a small behavior change that requires a UI touch, one API change, one data assumption, and a QA handoff script.

Required SDLC artifacts:

- `sdlc workspace packet --task "..."`
- `sdlc touched packet`
- `sdlc impact packet --task "..."`
- `sdlc data packet --task "..."` when SQL/data is touched or required.
- `sdlc integration packet --task "..."` when third-party/API boundaries are touched.
- `sdlc test plan --task "..."` when automated coverage is weak or missing.
- `sdlc smoke packet --task "..."` and `sdlc smoke complete ...`
- `sdlc qa script --task "..."`
- `sdlc final gate --task "..."`
- `sdlc git packet`

## Success Criteria

- The workspace packet names all affected repositories and dirty states.
- The impact packet explains what QA should care about without source-code assumptions.
- The QA script is Markdown, human-testable, and suitable for a tracking ticket.
- The final gate does not propose merge, deploy, release, pipeline trigger, or branch movement.
- Commit/push remains an explicit human approval decision.
