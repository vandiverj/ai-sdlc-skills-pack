# AI SDLC Skills Pack

A user-level skills pack for AI-assisted software development. Its job is to preserve intent, choose proportionate process, make connected effects visible, and require fresh evidence without turning every change into a ceremony.

## Start Here

Ask the coding agent:

```text
Use SDLC for this task: <task>. Keep the workflow proportional, implement the complete bounded change, verify the claims with fresh evidence, and stop before commit or push.
```

For first-time repository setup:

```text
Use SDLC to set up this repository for AI-assisted work. Explain the proposed repo-local files before changing them.
```

The normal CLI lifecycle is deliberately small:

```bash
sdlc start --task "<task>"
sdlc next --task "<task>"
sdlc prove --task "<task>"
sdlc qa-ready --task "<task>"       # optional
sdlc finish-ready --task "<task>"
```

Use `sdlc help expert` only when an unusual route needs a specialist command. The larger internal command set remains available for compatibility and diagnostics; it is not a checklist.

## Operating Model

The agent should:

1. Read repository instructions and relevant source-of-truth artifacts.
2. Classify the work by uncertainty, blast radius, reversibility, and proof difficulty.
3. Choose the smallest coherent edit boundary.
4. Implement the full bounded outcome, following material connections into tests, contracts, consumers, docs, and recovery behavior when relevant.
5. Gather fresh claim-specific proof.
6. Report what changed, what was proved, remaining caps, and the next human decision.

For observable behavior, keep one compact trace:

- Observable outcome: what a person or consuming system can now observe.
- Connected impact: the material path most likely to be affected or regress.
- Proof and recovery: evidence for the claim and the important failure/recovery behavior.

Expand that trace into detailed before/after workflow, ownership, dependency, and scenario mapping only for high-risk, cross-boundary, or genuinely uncertain work.

## Process Budget

- Micro/Tiny: direct context, edit, focused proof, short handoff.
- Standard: add a plan or independent review only when it prevents meaningful guessing or catches a plausible expensive failure.
- High-risk: use the relevant contract, security, migration, data, rollback, integration, and review gates.
- Exploratory: produce findings and boundaries, not production-completion claims.

Artifacts are tools, not progress. Create one only when it preserves a decision, coordinates ownership, enables restart, or records evidence that cannot be stated directly.

## Safety Kernel

Always preserve unrelated user work and obey repository instructions. Fresh proof must support the claims being made. Explicit human authority is required for commit, push, merge, deploy, release, destructive actions, dependency changes, migrations, secrets, and external-service writes.

Local run state and temporary scripts belong under ignored `.ai-local/` paths. Never treat generated packets, prior agent claims, or generic build success as proof of unrelated behavior.

## Pack Layout

- `skills/` — focused workflow capabilities and routers.
- `agents/` — portable bounded worker/reviewer roles.
- `templates/` — optional downstream artifacts and runtime adapters.
- `scripts/sdlc/` and `bin/sdlc` — dependency-free local helper CLI.
- `WORKFLOW.md` — canonical routing and completion rules.
- `SUMMARY.md` — compact repository map and design status.

Install the pack at the user level, normally `~/.agents`. Downstream repositories should keep only project-specific instructions and context. Use `setup-sdlc-in-repo` to bootstrap or refresh those files.

## Development Checks

After changing this pack, run:

```bash
git diff --check
node scripts/test-skill-files.mjs
node scripts/test-agent-contracts.mjs
node scripts/test-routing-optimization.mjs
node scripts/test-deterministic-tools.mjs
```

The SDLC should make important omissions harder while leaving straightforward work straightforward.
