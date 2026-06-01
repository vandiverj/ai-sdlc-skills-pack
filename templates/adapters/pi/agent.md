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
