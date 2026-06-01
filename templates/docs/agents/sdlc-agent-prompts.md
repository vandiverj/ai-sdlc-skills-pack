# SDLC Agent Prompt Examples

Purpose: give humans simple chat prompts for using the SDLC through Augment, Codex, Auggie CLI, or another coding agent.

## Start A Task

```text
Use SDLC for this task: <task>. Determine the scope, gather context, implement, verify, generate QA Markdown if needed, and stop at the finish decision before any commit or push.
```

## First-Time Setup

```text
Use SDLC to set up this repository for AI-assisted work. Explain the local files you propose to create or update, detect repositories and deployable units, and keep product-specific context local.
```

## First Pilot

```text
Use SDLC and guide me through my first small pilot task in this repository. Tell me what to type, what you will check, what local files you create, and how to capture sanitized feedback afterward.
```

## Review Completion

```text
Use SDLC and review the current completion state of this task: <task>. Tell me what changed, what evidence exists, what gates are open, whether QA is ready, and the recommended next action.
```

## Confused Or Interrupted

```text
Use SDLC to explain where we are, what evidence exists, what is missing, and what I should decide next.
```

## Resume A Task

```text
Use SDLC and resume the current task. Find the latest task ledger/evidence, review the open gates, and tell me the next useful action before changing code.
```

## Generate QA Script

```text
Use SDLC and generate the human QA Markdown script for this task: <task>. The QA tester will not use AI and the output should be suitable for YouTrack.
```

## Route Replacement

```text
Use SDLC for this route replacement: <task>. Classify active versus archived/generated references, prove the new active route is used, prove old active callers are retired, and produce human QA Markdown.
```

## Live Bug Or Database Failure

```text
Use SDLC for this live bug: <task>. Start from sanitized exact logs/errors, identify the failing table/endpoint/provider behavior, search for an analogous successful path, choose the smallest evidence-backed fix, and separate developer validation from QA retest steps.
```

## API-Only Or Non-UI Work

```text
Use SDLC for this API-only task: <task>. Treat Swagger/OpenAPI, API clients, logs, and contract checks as test surfaces, but do not require rendered product UI evidence unless an actual UI changed.
```

## Multi-Repo Or Multi-Project Work

```text
Use SDLC for this task across the current workspace: <task>. Build the workspace ledger, identify affected deployable units and context buckets, and produce one QA Markdown script for the tester-visible workflow.
```

## Finish Decision

```text
Use SDLC and prepare the finish decision for this task: <task>. Do not commit, push, merge, deploy, create an MR/PR, trigger a pipeline, or move files between environments.
```

## Commit Only

```text
Use SDLC and prepare a commit-only finish for this task: <task>. Review gates and evidence first. Do not push, merge, deploy, create an MR/PR, trigger a pipeline, or move files.
```

## Commit And Push

```text
Use SDLC and prepare commit-and-push for this task: <task>. Review gates and evidence first, then wait for my explicit approval before the Git action.
```

## Handoff Without Git Action

```text
Use SDLC and prepare a no-commit handoff for this task: <task>. Generate the QA Markdown and finish decision, then stop.
```

## Suggested CLI Mapping

- Onboarding: `sdlc help onboarding` then `sdlc onboarding pilot`
- Start: `sdlc run plan --task "..."` then `sdlc task open --task "..."`
- Intake/recipes: `sdlc intake packet --task "..."` then `sdlc recipe match --task "..."`
- Dashboard: `sdlc run dashboard --task "..."` and `sdlc run next --task "..."`
- Confused state: `sdlc task doctor --task "..."`
- Bundle evidence: `sdlc task bundle --task "..."`
- Current task: `sdlc task current`
- Checkpoint/review: `sdlc task review --task "..."`
- QA: `sdlc task qa --task "..."` then `sdlc qa script --task "..."`
- Trace/scorecard: `sdlc trace start --task "..."`, `sdlc trace finish --task "..."`, then `sdlc scorecard task --trace <trace>`
- Finish: `sdlc safety finish --task "..."`, `sdlc finish packet --task "..."`, `sdlc action preview --action commit`, then `sdlc git packet`
- Feedback: `sdlc feedback quick --task "..." --friction "..." --note "..."`
