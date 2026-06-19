# Retrieval Eval Contract

Status: Implemented helper contract
Promotion state: Experiment
Last updated: 2026-06-19

## Purpose

Measure whether retrieval or knowledge-layer output points agents to the right source-of-truth artifacts within a small context budget.

This contract builds the Cycle 3 ruler. It does not implement semantic retrieval, MCP ranking, local-model consolidation, or automatic tuning.

## Case Shape

Required fields:

- `schemaVersion`
- `id`
- `name`
- `query`
- `gradingMode`: `deterministic` or `human-graded`
- `difficulty`: `mechanical` or `semantic-tail`
- `holdout`: `train`, `test`, or `adhoc`
- `ownerArtifact`

Optional fields:

- `pattern`
- `expectedArtifacts`
- `topK`
- `costBudget.maxArtifacts`
- `costBudget.maxBytes`
- `createdAt`

## Result Shape

- `status`: `pass`, `fail`, or `capped`
- `hitAtK`
- `precisionAtSmallK`
- `candidateArtifacts`
- `expectedArtifacts`
- `missingExpected`
- `overreturned`
- `contextBytes`
- `caps`

## Deterministic Floor

Stage 1 cases should use mechanical queries where local search can produce ground truth:

```bash
sdlc eval retrieval-run --repo .
```

The helper uses local `rg` search for deterministic cases. If `rg` is unavailable, the result is capped and must be manually graded. The knowledge layer must not perform worse than the deterministic floor on these mechanical cases.

## Semantic-Tail Cases

Semantic-tail cases cover indirect relationships, rationale, ownership, constraints, and "why this exists" questions. They must be marked `human-graded` until a reviewed evaluation method exists.

## Source Of Truth

Retrieval output is pointer quality, not proof. Claims used for planning, implementation, verification, or completion still need source artifacts such as code, tests, contracts, approved docs, AGENTS.md, context-state, or human review.

## Forbidden Claims

- Do not claim retrieval quality from candidate capture alone.
- Do not claim a candidate is correct because its envelope validates.
- Do not use this contract to promote MCP retrieval, local-model consolidation, learned routing, or model scorecards.
- Do not index secrets, production data, customer/client data, raw ticket text, raw database output, or unapproved external documents.

## Validation Path

Add an ad hoc deterministic case:

```bash
sdlc eval retrieval-add --name "knowledge candidate references" --query "Find knowledge-candidate references" --pattern "knowledge-candidate"
```

Run the deterministic floor:

```bash
sdlc eval retrieval-run --repo .
```

Use JSON output when another helper needs machine-readable evidence:

```bash
sdlc eval retrieval-run --repo . --json
```

Run negative regression checks for impossible expected artifacts and semantic-tail caps:

```bash
sdlc eval retrieval-test --repo .
```

## No-Install Fallback

Use Markdown or JSONL cases under `.ai-local/sdlc-retrieval-eval-cases.jsonl`, run `rg -l` manually, and record caps when deterministic search is unavailable.
