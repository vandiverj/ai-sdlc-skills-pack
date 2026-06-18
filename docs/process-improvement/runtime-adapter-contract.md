# Runtime Adapter Contract

Status: Candidate contract
Promotion state: Experiment
Last updated: 2026-06-18

## Purpose

Keep runtime-specific invocation thin while preserving portable SDLC role authority, evidence rules, and human approval gates.

## Required Fields

- `runtime`
- `invocationMethod`
- `supportsStructuredOutput`
- `supportsNoninteractiveExecution`
- `supportsLocalProvider`
- `supportsMcp`
- `supportsHooksEvents`
- `supportsSandboxToolBoundaries`
- `supportsResponseSchemaEnforcement`
- `supportsUsageTokenCapture`
- `knownCaps`
- `fallback`
- `recommendedNextArtifact`

## Optional Fields

- `runtimeVersion`
- `configuredModels`
- `configuredMcpServers`
- `approvedCommands`
- `localConfigPath`
- `usageCapturePath`

## Source Of Truth

Portable policy lives in `agents/*.md`, generated packets, and this contract. `scripts/sdlc/lib/adapters.mjs` projects runtime capability checks.

## Forbidden Claims

- Runtime adapters must not silently grant write authority, change role scope, hide approval gates, or downgrade evidence requirements.
- Runtime-specific config is not the SDLC source of truth.

## Validation Path

Run:

```text
sdlc adapter doctor --runtime codex-exec --json
sdlc adapter doctor --runtime claude-code --json
sdlc adapter doctor --runtime manual-packet --json
```

## No-Install Fallback

Use `manual-packet` and record unavailable runtime features as caps.
