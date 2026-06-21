# Cycle 8 Auggie Agent Adapters

## Improvement Hypothesis
- Hypothesis: If the portable SDLC roles have Auggie-native subagent adapters and a user-level installer, Auggie can operate with the same delegated workflow feel as Codex while preserving parent-owned judgment and feedback submission.
- Failure mode addressed: tool/runtime mismatch, under-process, poor handoff.
- Expected behavior change: Auggie users can call the same SDLC role roster with runtime-native subagents instead of hand-translating Codex adapters.
- Expected developer experience change: user-level install makes the roster available across repositories without copying workspace files.
- Expected code-quality change: read-only exploration/review, bounded implementation, and independent verification remain separated by role.
- How we will know it worked: deterministic adapter lint passes, user-level install dry run produces all expected files, and Auggie can discover them after reload.
- How it could make things worse: pinned model IDs could fail in organizations where Auggie exposes only a default model, or tool restrictions could be too narrow for a role.

## Evidence Summary
- Local SDLC sources reviewed: portable agent definitions, Codex adapters, runtime adapter rules, downstream agent docs, and `scripts/test-agent-contracts.mjs`.
- Augment documentation reviewed: Auggie subagents use Markdown files under `~/.augment/agents/` or `./.augment/agents/`, support frontmatter `name`, `description`, optional `model`, `tools`, and `disabled_tools`, and can be referenced by agent name.
- Augment documentation reviewed: Auggie skills discover `.agents/skills`, so the SDLC skills pack can remain portable while subagents provide role delegation.
- Local probe: `auggie models list` returned `Model registry is not available. Only the default model is supported.`

## Candidate Approaches Considered
- Incremental docs only: rejected because Auggie users would still hand-author adapters.
- Static Auggie adapter roster only: useful but incomplete because user-level install would remain manual.
- Adapter roster plus installer and lint: selected because it is deterministic, portable, and parallel to the Codex path.
- Hard-pinned GPT models in committed adapters: rejected for now because local Auggie reports only the default model.

## Selected Approach
- Add `templates/adapters/auggie/sdlc-*.md` for every current portable SDLC role.
- Add `sdlc agents install-auggie` with user-level `~/.augment/agents` as the default target.
- Keep model unset by default; support optional `--model-profile frontier-gpt` to inject recommended GPT mappings when `auggie models list` confirms availability.
- Extend contract lint to catch missing Auggie adapters, bad source paths, missing parent-mediated feedback behavior, and read-only tool drift.

## Quality Oracle Ladder
- Best proof: Auggie runtime discovery and a read-only fixture scout test after user-level install.
- Good proof: `sdlc agents install-auggie --dry-run --json` lists all expected targets and models.
- Fallback proof: deterministic adapter contract lint plus Markdown/JS syntax checks.
- Unavailable proof: model-specific runtime validation, because local Auggie model registry currently reports only the default model.
- Do not claim: that every named GPT model is available in every Augment organization.

## Process Weight Budget
- New commands: `sdlc agents install-auggie`.
- New concepts: optional Auggie model profile.
- New files/artifacts: Auggie adapter roster.
- New decisions required: whether to use default model or `frontier-gpt` profile after `auggie models list`.
- Removed complexity: manual Auggie adapter creation.
- Net process weight: neutral; a small installer and lint replace repeated hand translation.

## Ten-Loop Review Log
1. Usability: user-level install matches the requested adoption path; no workspace copy required.
2. Capability: Auggie gets the same portable roles as Codex, including feedback reporter and process learning reviewer.
3. Efficiency: adapters are thin; detailed behavior stays in portable roles.
4. Evidence integrity: local model probe prevents unsupported hard-pinned model claims.
5. Best practices: follows Augment subagent frontmatter and tool restriction guidance.
6. Safety: read-only roles use allowlisted read tools only.
7. Composability: installer parallels `install-codex` instead of creating a separate setup path.
8. Validation realism: contract lint can catch role parity and tool drift without requiring Auggie auth.
9. Maintainability: source matrix points to both Codex and Auggie adapters.
10. Adoption: downstream docs explain default model behavior and optional frontier GPT mapping.

## Acceptance Criteria
- Every current portable SDLC role has an Auggie adapter.
- Auggie adapters point back to portable source files.
- Read-only Auggie roles do not expose edit or shell tools.
- Every adapter preserves parent-mediated feedback submission.
- User-level install is the default.
- Optional GPT model mapping is documented and not forced when unavailable.

## Validation Target Plan
- Current repository deterministic checks first.
- User-level install dry run before any real install.
- Real user-level install only after deterministic validation passes.

## Rollback Path
- Remove `templates/adapters/auggie/sdlc-*.md`.
- Remove `adapterAuggieInstall` and CLI route.
- Revert docs and contract lint additions.
