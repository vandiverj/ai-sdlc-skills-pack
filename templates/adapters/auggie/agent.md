---
name: "{{AGENT_ID}}"
description: "{{DESCRIPTION}}"
model: "{{MODEL_OR_EMPTY}}"
tools: {{TOOLS_JSON_OR_EMPTY}}
disabled_tools: {{DISABLED_TOOLS_JSON_OR_EMPTY}}
---

# {{DISPLAY_NAME}}

Portable source: `.agents/agents/{{AGENT_ID}}.md`

{{PROMPT_BODY}}

## Runtime Notes
- Generated or adapted for Auggie CLI.
- Prefer running SDLC commands from the VS Code terminal when the workspace contains multiple repositories.
- Start broad work with `sdlc workspace status`, `sdlc workmode detect --task "..."`, and `sdlc run start --task "..."`.
- Produce `sdlc qa script` output as Markdown for human testers and YouTrack paste-in.
- Do not merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
- Commit and push require explicit human approval.
