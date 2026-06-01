
# decision-brief

## Description
Document meaningful forks before committing to a path.

## Use for
- Architecture choices
- Data model choices
- Dependency/library choices
- Scope decisions
- Testing strategy
- Build vs defer decisions
- Pattern or abstraction choices
- Tradeoffs involving simplicity, duplication, coupling, or future change

## Format
```text
Decision:
Stakes:
Recommended option:
Options considered:
Pros / cons:
First-principles reasoning:
Assumptions being made:
Engineering principle tradeoffs:
  - simplicity / YAGNI:
  - DRY vs premature abstraction:
  - cohesion / coupling:
  - readability / story flow:
  - pattern or dependency rationale:
Net tradeoff:
Impact on application model:
Impact on PRD:
Impact on contract:
Impact on issues:
Impact on context-state:
```

## Rule
Major decisions should not remain only in conversation history. Record them in the relevant artifact or ADR.

Principles are review lenses, not slogans. If a principle conflicts with local constraints, document the tradeoff instead of pretending the answer is universal.
