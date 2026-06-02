# Scenario: Interactive Stateful Feature

Use this scenario when a task changes a stateful or interactive workflow such as a game, dashboard, wizard, settings mode, animation, or feedback loop.

## Route Expectations

- Do not fast-pass broad interactive work.
- Produce or reason through an interaction contract: starting state, action sequence, state changes, feedback, recovery, and regression path.
- Validate through the strongest practical surface: state/domain tests, build/typecheck, rendered/API/CLI/job smoke, then explicit caps only when stronger evidence is unavailable.

## Helper Commands

```bash
sdlc task preflight --task "<task>"
sdlc interaction packet --task "<task>"
sdlc validate ladder --task "<task>"
sdlc qa script --task "<task>"
```

