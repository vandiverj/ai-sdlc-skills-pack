# SDLC CLI

Small dependency-free helper for repetitive SDLC mechanics.

The CLI is an affordance over the Markdown SDLC. It does not replace agent judgment, source review, human approval gates, or route-specific skill guidance.

## Golden Path

Use chat first and let the agent pick the smallest useful route.

```bash
sdlc intake packet --task "<task>"
sdlc recipe match --task "<task>"
sdlc run dashboard --task "<task>"
sdlc task preflight --task "<task>"
```

During implementation, generate only the evidence that matches the route:

```bash
sdlc touched packet
sdlc impact packet --task "<task>"
sdlc interaction packet --task "<task>"
sdlc validate ladder --task "<task>"
sdlc verify packet --task "<task>"
sdlc qa script --task "<task>"
```

At the end:

```bash
sdlc finish packet --task "<task>"
sdlc finish packet --task "<task>" --intent keep-change
sdlc action preview --action commit
sdlc git packet
```

Commit and push still require explicit human approval. The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.

## Recovery

When the state is unclear:

```bash
sdlc task doctor --task "<task>"
sdlc run resume --task "<task>"
```

For setup uncertainty:

```bash
sdlc readiness
sdlc profile audit
sdlc profile suggest --task "<task>"
```

## Task-Shape Recipes

Recipes are advisory overlays. They add proof likely needed for a task shape; they are not mandatory stack flows.

Route replacement:

```bash
sdlc route proof --old "<old route>" --new "<new route>" --task "<task>"
```

Live-system bug:

```bash
sdlc bug live-evidence --task "<task>"
sdlc pattern analog --task "<task>" --hint "<known working path>"
sdlc fix scope --task "<task>"
```

EF Core SQL Server failure:

```bash
sdlc dotnet efcore diagnose --task "<task>"
```

Weak/no-test legacy work:

```bash
sdlc test regression-plan --task "<task>"
sdlc test bootstrap-plan --unit <unit> --framework dotnet|node|deno|generic
```

Command/tooling failure:

```bash
sdlc command classify --command "<command>" --status <code> --stderr "<stderr>"
```

Context or learning placement:

```bash
sdlc context bucket-confidence --path <path> --task "<task>"
sdlc context final-check --task "<task>"
sdlc learn split --packet <learning-packet>
```

Ticket-driven work:

```bash
sdlc ticket evidence --task "<task>"
sdlc ticket drift --task "<task>"
sdlc ticket update-preview --task "<task>"
```

Read-only database evidence:

```bash
sdlc data boundary --task "<task>"
sdlc data query-plan --task "<task>"
sdlc data evidence --task "<task>"
```

These helpers are capability-aware overlays. They do not require YouTrack or database MCP access, do not execute database queries, and do not post ticket updates. When MCPs are unavailable, use pasted ticket details or sanitized human-provided data/log evidence.

Interactive/stateful feature work:

```bash
sdlc interaction packet --task "<task>"
sdlc validate ladder --task "<task>"
sdlc qa interactive --task "<task>"
```

Fixture validation where useful changes are kept:

```bash
sdlc fixture plan --task "<task>"
sdlc finish packet --task "<task>" --intent keep-change
sdlc learn from-run --task "<task>"
```

## Lower-Level Helpers

Use `sdlc --help` for the full command reference. Most commands are lower-level helpers for agents and process maintainers, not commands a developer should run by hand during normal work.

Maintenance examples:

```bash
sdlc scenario test
sdlc recipe list
sdlc recipe review --since YYYY-MM-DD
sdlc trace export --trace .ai-local/sdlc-runs/<trace>.jsonl --format otel-lite
sdlc learn backlog
```

## Human QA

`sdlc qa script` generates Markdown manual QA scripts for human testers and YouTrack paste-in. It does not assume QA testers use AI, inspect code, run developer commands, or know the SDLC.
