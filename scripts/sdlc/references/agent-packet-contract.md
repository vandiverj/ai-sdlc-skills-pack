# SDLC Agent Packet Contract

Status: active

Purpose: make handoff packets useful as bounded work orders without requiring subagent support.

## Recommendation Levels

- `skip`: packet would add overhead.
- `optional`: packet may help if work grows or session may be interrupted.
- `recommended`: packet likely improves evidence or clarity.
- `strongly-recommended`: high-risk, multi-repo, sensitive, release, no-test, or complex handoff work should use this packet unless the human chooses to skip.

## Packet Roles

- `implementation-worker`: bounded approved edit.
- `verification-worker`: local proof, caps, and verification evidence.
- `independent-reviewer`: review diff, risk, evidence, and claims without editing.
- `release-handoff-worker`: prepare human finish/QA/git decision material without release automation.
- `process-learning-reviewer`: capture sanitized process learning without product-sensitive detail.

## Packet Required Sections

- Role
- Task
- Why this packet exists
- Allowed scope
- Forbidden scope
- Prompt analysis
- Local-first plan
- Linked artifacts
- Commands/tools allowed
- Evidence required
- Output format
- Stop conditions
- Run journal update

## Guardrails

- Packets are not autonomous subagents.
- Orchestrator keeps route, scope, human gates, and final synthesis.
- Tiny work should usually skip packets.
- Packets should link artifacts instead of dumping large context.
