# SDLC Prompt Analysis Contract

Status: active

Purpose: make rough human prompts easier for agents to use without changing intent.

## Rules

- Original prompt is authoritative.
- Cleaned prompt is a suggestion.
- High-confidence, low-risk spelling corrections may be applied to the cleaned prompt.
- Medium/low-confidence corrections are shown as suggestions only.
- Product names, ticket IDs, file paths, branch names, code symbols, API names, and local acronyms are not rewritten unless a local dictionary explicitly maps them.
- Sanitization is best-effort and must be labeled that way.

## Structured Output

Prompt analysis should include:

- `originalPrompt`
- `cleanedPrompt`
- `sanitizedPrompt`
- `corrections`
- `intent`
- `entities`
- `constraints`
- `approvals`
- `denials`
- `riskTerms`
- `ambiguities`
- `contradictions`
- `sensitivity`
- `doneCriteria`
- `score`

## Detection Expectations

- `Soccer` must not match `SOC`.
- `SQL` and `database` should match only as meaningful terms.
- `do not push`, `no merge`, and `do not deploy` are denials.
- `commit` and `push` mentions are not approvals to run git actions; final human approval is still required.
- Database/ticket/production-sensitive prompts should raise sensitivity only when terms appear as terms, not substrings.
