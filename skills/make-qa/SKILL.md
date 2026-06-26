---
name: make-qa
description: Create or revise YouTrack QA Test Script content for non-technical human product testers. Use when Codex needs to turn a YouTrack issue, parent or linked issue context, comments, curated engineering-context knowledge, git history, code changes, screenshots or attachments, and development chat context into a staging-focused, assignment-ready QA script written in product workflow language; default to presenting the proposed script in chat for developer approval and only update YouTrack when explicitly instructed.
---

# make-qa

Current version: v0.3

## Purpose

Create assignment-ready QA scripts for staging testers who are experienced product and CSR users, not technical validators. Translate development work into user-lane, menu, URL/access, and workflow steps that can be followed without guessing.

## Operating Rules

- Default to presenting the proposed QA script in chat. Update YouTrack only when the user explicitly asks to write or update the case.
- Produce an assignment-ready script by default. If the user asks for a draft or blockers remain, label it `DRAFT - not ready because: <blockers>`.
- Use staging as the environment unless the developer explicitly says otherwise.
- Treat testers as domain experts who know business workflows and have many staging users/companies available.
- Name the tester lane and business condition before naming exact accounts. Require exact data only for rare, reset-sensitive, known-bug, or developer-prepared states.
- Use product navigation language in tester-facing steps. Do not mention filenames, endpoints, controllers, table names, tokens, feature flags, or fixture IDs outside developer notes.
- Ground every concrete claim in evidence: YouTrack, comments, parent/linked issues, context MCP results that cite engineering-context docs, local engineering-context fallback docs, code, git diff/history, screenshots, image attachments if viewable, or explicit developer confirmation.
- Apply grounding to tester steps, developer notes, business facts, deprecations, eligibility rules, and source attributions. Never attribute a claim to a source that does not actually say it.
- Never invent menu names, button labels, dropdown options, statuses, fields, messages, page names, URLs, or business rules. Ask, omit, or flag a gap when not grounded.
- Expected results must be observable. Avoid vague wording such as "verify it works."
- Separate the surface under test from the navigation path used to reach it. If a related case already owns full regression for a navigation surface, use that surface only as an access path and say which case owns the broader regression.
- Avoid redundant tester work across related cases. When multiple cases overlap, assign one owner for full workflow regression and keep the other scripts to their distinct validation slice.
- Verify user-facing navigation labels from product source, durable context, YouTrack evidence, screenshots, or explicit developer correction. Use exact menu/button labels when grounded; otherwise ask or mark the script draft.
- If the tester would have to guess, the script is not ready.

## Access And Navigation Gate

For any comparison, parity, or "open page" script, include a concrete access method for each surface being tested.

- Use context MCP first to load `staging-access-map.md` when building navigation steps. If MCP is unavailable or stale, read the configured local `engineering-context/staging-access-map.md` fallback.
- Use the access map to ground staging URLs, menu paths, and techniques for opening old and new views side by side.
- If the access map does not exist or lacks the needed surface, create or append to it only from grounded evidence or developer confirmation.
- For role-specific pages, provide separate access paths per tester lane when they differ, using exact visible labels such as menu group names, submenu names, or button text.
- Never invent a staging URL or menu path. If the access method is not grounded, ask the developer or mark the script as draft with that blocker.
- A comparison script is not assignment-ready until every compared surface has a concrete, grounded access method.

## No Human QA Gate

Before writing a script, decide whether a non-technical tester can verify anything meaningful through the staging UI.

If no human-testable surface exists, do not manufacture QA work. Output:

```markdown
No human QA tester work needed.

Reason:
<why this is technical-only or not visible through staging UI>

Developer verification needed:
<concise technical verification path>

Technical Notes For Developer:
QA script drafted by make-qa v0.2
<preserved context>
```

For mixed cases, do not force all-or-nothing. Write a tester script for the human-verifiable slice and route backend-only or developer-only verification into developer notes.

## Research Workflow

For a YouTrack case:

1. Read the YouTrack issue details, including existing QA Test Script if present.
2. Read recent comments and attachment metadata. If image attachments are viewable, use them as grounding for UI claims.
3. Read parent and linked issues when they explain scope or user workflow.
4. Use context MCP to read `staging-access-map.md` for grounded staging URLs, menu paths, and old/new comparison techniques; fall back to the configured local engineering-context checkout when needed.
5. Search context MCP for the product area, user lane, workflow, and known business language; fall back to local engineering-context docs when MCP is unavailable or missing coverage. Treat these docs as partial but primary grounding.
6. Search git history for both the issue key and any parent issue key, because development may have happened before subtasks were split.
7. Inspect relevant diffs and changed files to understand visible behavior and related product areas. Do not use live staging as the source of truth while drafting before deploy.
8. Use current development chat context.
9. Check related cases for overlap so the new script does not duplicate full workflow coverage owned elsewhere.
10. Identify tester lane, access path, product workflow, safe actions, scope, observable expected result, related spot checks, and failure details.
11. Ask the developer before finalizing when a load-bearing element is unclear.

If neither tools nor developer context can answer a key question, mark it as a case-understanding gap and record it in feedback.

## Clarification Triggers

Ask before finalizing if unclear:

- tester role/lane
- site area, menu path, URL, or workflow
- access method for each compared surface
- visible behavior that proves the case
- safe actions versus actions that should not be submitted
- developer setup or mid-test assistance
- in-scope versus out-of-scope coverage
- whether any UI, business, or developer-note claim is grounded
- whether the case is human-testable at all

For time-limited drafting, support a "draft now with assumptions flagged inline" mode. Clearly mark assumptions and provide one consolidated list of questions.

## Script Structure

Use the leanest script that covers the case. The minimum sections are:

- `Purpose`
- `Environment`
- `Tester Role`
- `Steps`
- `Expected Result`
- `If This Fails`

Add these only when useful:

- `Test Data`
- `Developer Assistance`
- `Do Not Change / Do Not Submit`
- `Related Areas To Spot Check`

Do not use a generic bug-report template. Instead, write a few case-specific sentences about what details would help development if the test fails.

Use `references/qa-script-template.md` when a full template or examples are needed.

## Developer Notes

Include a `Technical Notes For Developer` section after the tester script when technical context should not be lost. Keep it clearly separate from tester instructions.

Always stamp generated scripts with the current skill version exactly:

```markdown
QA script drafted by make-qa v0.3
```

Developer notes may include affected files, routes, endpoints, automation coverage, setup risks, unresolved questions, backend-only verification, or why no human QA is needed. They must obey the same grounding and attribution rules as tester-facing content.

Write deprecation, "no longer offered," "changed," and eligibility claims only when grounded. Otherwise write them as `Confirm: <question>`.

## Feedback Capture

When context MCP supports knowledge candidates, submit QA-script feedback or gaps as candidates first. Otherwise, maintain `engineering-context/qa-script-feedback.md` in the workspace when feedback or gaps arise.

Append concise entries for:

- developer corrections to a generated script
- tester confusion reported in comments or standup notes
- case-understanding gaps found while drafting
- recurring patterns that should update this skill later

Use this shape:

```markdown
## YYYY-MM-DD - <issue key or area>

- Signal: <correction, confusion, gap, or recurring pattern>
- Evidence: <YouTrack comment, developer correction, or observed gap>
- Learning: <small reusable improvement>
```

Do not treat this feedback file as validation by the skill. Real validation comes from developer review, tester comments, and standup feedback.
