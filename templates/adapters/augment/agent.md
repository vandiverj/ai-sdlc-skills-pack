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
- Generated or adapted for Augment/Auggie.
- Do not broaden tools beyond the portable definition without review.
- Keep runtime-specific policy here only when Augment/Auggie requires it.
