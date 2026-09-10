# Model and reasoning policy

Use the user's selected primary model. For this pack's GPT-6 profile, start with `gpt-6-astra` at `medium` reasoning for ordinary development. This is a workload default, not a universal claim of equal quality at every effort level.

- Use deterministic tools for search, formatting, compilation, and executable checks.
- Use `medium` for normal implementation, focused diagnosis, planning, and review.
- Use `high` when ambiguity, consequential architecture, concurrency, security, or unresolved failures need deeper analysis.
- Reserve `xhigh` for unusually difficult or disputed work when a concrete reason justifies its time cost. It is not the default for every security-related file or review.
- Use cheaper models or `low` only when requested or representative evaluation supports the tradeoff.

Inherit the model/effort in child agents unless their bounded task needs an explicit override. If the runtime cannot change effort during a task, state the limitation; do not claim that an instruction changed the active model configuration.

Independent review is a role/context decision, not a mandatory second model family. Compare effort levels on the same task, permissions, runtime, and instructions before claiming a performance improvement. Count rework and user interruptions as well as tokens.

Keep concrete provider settings in the selected runtime configuration. Preserve other runtimes' existing choices unless the user requests a change.
