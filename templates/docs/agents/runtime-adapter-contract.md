# Runtime Adapter Contract

Runtime adapters translate portable SDLC packets into runtime-specific invocation. They do not own SDLC policy.

Required capability fields:

```text
Runtime:
Invocation method:
Supports structured output:
Supports noninteractive execution:
Supports local provider:
Supports MCP:
Supports hooks/events:
Supports sandbox/tool boundaries:
Supports response schema enforcement:
Supports usage/token capture:
Known caps:
Fallback:
Recommended next artifact:
```

Use `manual-packet` when runtime capability is unknown or unavailable.
