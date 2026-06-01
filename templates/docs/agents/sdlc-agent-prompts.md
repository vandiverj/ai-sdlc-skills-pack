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

## Generate QA Script

```text
Use SDLC and generate the human QA Markdown script for this task: <task>. The QA tester will not use AI and the output should be suitable for YouTrack.
```

## Finish Decision

```text
Use SDLC and prepare the finish decision for this task: <task>. Do not commit, push, merge, deploy, create an MR/PR, trigger a pipeline, or move files between environments.
```

## Suggested CLI Mapping

- Start: `sdlc task open --task "..."`
- Checkpoint/review: `sdlc task review --task "..."`
- QA: `sdlc task qa --task "..."` then `sdlc qa script --task "..."`
- Finish: `sdlc task finish --task "..."` then `sdlc git packet`
