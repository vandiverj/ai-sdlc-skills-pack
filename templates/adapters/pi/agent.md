---
name: "{{AGENT_ID}}"
description: "{{DESCRIPTION}}"
model: "{{MODEL_OR_EMPTY}}"
tools: {{TOOLS_JSON_OR_EMPTY}}
thinking: "{{THINKING_OR_EMPTY}}"
---

# {{DISPLAY_NAME}}

Portable source: `.agents/agents/{{AGENT_ID}}.md`

{{PROMPT_BODY}}

## Runtime Notes
- Generated or adapted for Pi.
- Tool names, model names, and thinking settings are runtime-specific.
- Do not broaden write access beyond the portable definition.
- Use `sdlc qa script` for Markdown human QA scripts and `sdlc final gate` before final Git decisions.
- Do not merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines.
