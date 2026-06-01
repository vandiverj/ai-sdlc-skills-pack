
# update-implementation-patterns

## Description
Create, revise, promote, deprecate, or supersede project-specific implementation pattern guidance based on reviewed evidence.

## Use when
- A repeated project pattern emerges across multiple good implementations.
- Review repeatedly finds the same form, table, API, test, error, layout, or feature-structure inconsistency.
- Requirements, design-system choices, frameworks, accessibility needs, security needs, or performance constraints change.
- A pattern has become stale, over-broad, too strict, or duplicated by deterministic tooling.
- `review/references/implementation-pattern.md`, process-learning review, or `review/references/code-quality.md` finds pattern guidance should change.

## Purpose
Let project conventions mature with the software. Patterns should start as Emerging, harden with evidence, and reopen when requirements or technical foundations change.

## Read first
1. Existing `docs/patterns/README.md` and relevant pattern docs.
2. Canonical source examples and tests.
3. Review findings, process-learning events, and implementation-pattern reviews.
4. Approved technical approach, quality automation, design-system/framework docs, and context-state entries.
5. Related PRDs, contracts, application model sections, feature contexts, and ADRs.

## Required output

```text
Pattern update:
Current status:
Proposed status:
Evidence considered:
Canonical examples:
Deprecated examples:
What changed:
Why:
Tooling overlap check:
Risks:
Exceptions:
Artifacts to update:
Verification:
Next skill:
```

## Maturity rules
- Use `Emerging` for promising observed patterns with limited evidence.
- Promote to `Validated` only after repeated successful use or strong design-system/framework support.
- Promote to `Standard` only when the pattern is stable enough that deviations should be explained.
- Mark `Deprecated` when old code should not be copied but may still exist.
- Mark `Superseded` when a replacement pattern is approved.
- Keep `Experimental` patterns behind spike or approval boundaries.

## Evidence rules
Good evidence:
- The same pattern appears in several reviewed implementations.
- Repeated reviews request the same structure.
- A bug or rework happened because implementations were inconsistent.
- A design system, framework, accessibility rule, or product requirement implies a stable shape.
- Tests, examples, or user workflows become clearer with the pattern.

Weak evidence:
- One implementation seemed nice.
- The AI generated it once.
- A reviewer has a preference without project impact.
- The rule duplicates deterministic tooling.

## Hard rules
- Do not turn preferences into Standard patterns without evidence.
- Do not duplicate lint, format, type, schema, accessibility, or CI rules.
- Do not update pattern guidance to justify unverified implementation.
- Do not force mature-project rigidity onto early exploratory work.
- Do not preserve obsolete patterns without marking them Deprecated or Superseded.

## Next skills
Usually implementation pattern guidance, `review/references/implementation-pattern.md`, quality automation guidance, context docs/save guidance, or process-learning review.
