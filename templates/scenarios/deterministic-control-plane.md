# Scenario: Deterministic Control Plane

Use this scenario when validating the SDLC local control-plane commands for task state, evidence requirements, command capture, completion gates, scope checks, policy checks, and learning suggestions.

## Route Expectations

- The agent should initialize or recover task state instead of relying on chat memory.
- Required evidence should be resolved from route, recipe, surface, profile, and policy signals.
- Checks should be recorded through `sdlc run-check` or explicit evidence/cap entries.
- `sdlc complete check` should block unsupported completion claims and list exact missing gates.
- Push, merge, deploy, release, ticket writes, database writes, dependency installs, and network actions remain approval-gated.

## Helper Commands

```bash
sdlc state init --task "<task>"
sdlc evidence required --task "<task>"
sdlc run-check --name test -- <command>
sdlc complete check --task "<task>"
sdlc scope check --task "<task>"
sdlc policy check --task "<task>"
sdlc learn suggest --task "<task>"
```

