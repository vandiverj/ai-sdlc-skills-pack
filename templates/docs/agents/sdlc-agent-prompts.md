# SDLC Agent Prompt Examples

Purpose: give humans simple chat prompts for using the SDLC through Augment, Codex, Auggie CLI, or another coding agent.

## Start A Task

```text
Use SDLC for this task: <task>. Determine the scope, gather context, implement, verify, generate QA Markdown if needed, and stop at the finish decision before any commit or push.
```

## Review Completion

```text
Use SDLC and review the current completion state of this task: <task>. Tell me what changed, what evidence exists, what gates are open, whether QA is ready, and the recommended next action.
```

## Resume A Task

```text
Use SDLC and resume the current task. Find the latest task ledger/evidence, review the open gates, and tell me the next useful action before changing code.
```

## Generate QA Script

```text
Use SDLC and generate the human QA Markdown script for this task: <task>. The QA tester will not use AI and the output should be suitable for YouTrack.
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

- Start: `sdlc task open --task "..."`
- Bundle evidence: `sdlc task bundle --task "..."`
- Current task: `sdlc task current`
- Checkpoint/review: `sdlc task review --task "..."`
- QA: `sdlc task qa --task "..."` then `sdlc qa script --task "..."`
- Finish: `sdlc task finish --task "..."` then `sdlc git packet`
