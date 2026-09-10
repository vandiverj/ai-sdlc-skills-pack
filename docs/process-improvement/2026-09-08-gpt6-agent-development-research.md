# GPT-6 Astra agent development research

Research date: 2026-09-08. Scope: current primary-source guidance for improving the reusable skills, agents, hooks, and software development workflow in this repository. This is evidence and proposed implications, not an implementation plan or a claim that runtime features have been verified locally. The local audit and final plan should determine exact files and migration order. All linked sources were opened and their relevant body text read; living documentation may change after this date.

## 1. GPT-6 changes the most valuable optimization target

OpenAI's Astra guidance identifies stronger sensitivity to instructions in skills and `AGENTS.md`, more clarification pauses, less delegation than some workflows expect, and potentially excessive testing for small changes. Its recommended controls are explicit persistence within authorized scope, clear user-over-skill priority, identifying the exact instruction behind a pause, intentional delegation boundaries, and verification proportional to the change. For migration, preserve effective reasoning effort; map unsupported `none` or `minimal` to `low` and compare. [GPT-6 Astra guidance](https://developers.openai.com/api/docs/guides/latest-model)

**Implication:** Audit active instructions for contradictory obligations before adding new process. Pay particular attention to unconditional approval gates, mandatory templates, repeated routing, required rereading, and rules that turn optional practices into blockers. Consolidate each behavior into one authoritative instruction and exercise it with realistic tasks. A more capable model does not make conflicting instructions harmless. Preserve constraints that protect user work and establish correctness; remove rituals whose value cannot be demonstrated.

## 2. Model and effort policy should be measured separately

The current model page identifies `gpt-6-astra` for complex coding and end-to-end work. It lists API effort values `low`, `medium`, `high`, `xhigh`, and `max`, a 1,050,000-token context window, and 128,000 maximum output tokens. Standard API pricing is $10 input and $50 output per million tokens; prompts beyond 272K input incur higher whole-request rates. These are API facts, not guarantees about subscription billing, client limits, or account availability. [GPT-6 Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)

**Proposed experiment:** Keep Astra as the principal model. Compare current effective effort with a lower effort on routine tasks while holding instructions constant. Compare higher effort on a separate difficult-task set. Evaluate accepted result quality, time, retries, and total usage together. Do not install a complicated model-routing system merely to exploit cheaper names. A secondary model deserves a role only after representative runs show an acceptable tradeoff. Version any resulting policy and record the tested client as well as the model.

## 3. Keep persistent guidance and optional expertise distinct

Codex's customization guidance assigns durable project expectations to `AGENTS.md`, reusable workflows to skills, previous-work context to memories, external access to MCP, and delegated work to subagents. It recommends keeping project guidance small, placing rules close to their scope, and pairing instructions with deterministic enforcement such as linters, type checkers, and pre-commit checks. Recurring mistakes and repeated review feedback are reasons to revise guidance. [Customization](https://learn.chatgpt.com/docs/customization/overview)

**Implication:** Separate this pack's maintenance rules from downstream product instructions. Give each rule one owner: personal preferences, project constraints, task-specific workflow, or executable verification. Introduce a rule because an observed failure warrants it. Review the rule when the model or runtime changes. A concise routing index can point to specialized references without injecting every reference into every task. Avoid making the archive, research library, and every historical corrective instruction part of routine startup.

## 4. Instruction discovery is a concrete runtime contract

Codex discovers global guidance under its home directory, preferring `AGENTS.override.md` to `AGENTS.md`. Project discovery walks from repository root to the launch directory, selects at most one instruction file per directory, and concatenates from broader to narrower scope. The default combined limit is 32 KiB. Discovery occurs once per run, so editing a file is not proof that an existing session received it. [AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

**Implication:** The contents of `~/.agents/AGENTS.md` govern maintenance of this repository when applicable; that path alone does not establish a universal Codex instruction file. Document how portable guidance reaches its consumer. Validate in a fresh session launched from representative root and nested directories. Record which source actually loaded and test one distinguishing behavior. Do not increase instruction limits before checking whether duplicated prose or misplaced guidance caused the pressure.

## 5. Skill catalog quality matters before skill body quality

Current Codex initially exposes skill names, descriptions, and paths, then reads selected `SKILL.md` bodies. The catalog budget is 2% of the model context window, or 8,000 characters when unknown; descriptions may be shortened and skills omitted. Descriptions therefore need their strongest use case first. Same-name skills are not merged. User discovery includes `~/.agents/skills`; `agents/openai.yaml` can disable implicit invocation while preserving explicit invocation. Local skills can also be disabled through configuration. [Build skills](https://learn.chatgpt.com/docs/build-skills)

**Implication:** Inventory what a real session discovers, including installed plugins and other roots. Measure ambiguous matches and accidental activation, rather than treating raw file count as the sole problem. Prefer a small number of distinct entry points with bounded references. Make rare, expensive, or intrusive workflows explicit-only when suitable. Archive or disable replaced entries outside active discovery and test ordinary user wording after changes. Shortening descriptions indiscriminately can make matching worse; remove overlap while retaining clear triggers and exclusions.

## 6. Give the model outcomes and constraints

OpenAI's general reasoning guidance recommends simple, direct prompts, explicit goals and constraints, and trying zero-shot instructions before adding examples. It advises against requesting chain-of-thought because reasoning models already reason internally. Some implementation examples on this page concern older models; they should not be copied as Astra-specific configuration. [Reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)

**Implication:** A reusable software task contract can specify the intended behavior, protected boundaries, available evidence, completion evidence, and when to stop. Avoid prescribing a universal sequence of planning documents, debates, agents, and reviews. Keep an example only when it resolves a demonstrated ambiguity. Where a step really must be deterministic, use a tested command with an explicit result contract. Human-readable rationale should explain decisions and uncertainty without requiring the model to narrate every internal deliberation.

## 7. Delegate independent work with a clear integration owner

Current local Codex delegates following a direct request or applicable project/skill instruction. Official guidance favors read-heavy exploration, testing, triage, and summarization; parallel editing brings conflict and coordination costs. Subagents consume additional tokens. Custom agents live in `.codex/agents/` or `~/.codex/agents/`; files require `name`, `description`, and `developer_instructions`. Model settings in custom files take precedence, which can defeat an intended parent-model policy. [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

**Implication:** Prefer one principal owner plus bounded delegation when work can proceed independently. A delegation should state its question or output, relevant context, write boundary, evidence expected, and stop condition. Exploration and adversarial review are useful initial roles; one generic worker can cover isolated implementation. Avoid a permanent specialist for every lifecycle phase. Keep ownership of shared edits, integration, and acceptance explicit. Review old model pins and unnecessary role files. A second agent's agreement is a review signal, not independent proof that the software behaves correctly.

## 8. Hooks are supported, but their semantics matter

Hooks reached general availability on 2026-05-14. That establishes product support, not compatibility of every event with a particular installed build. [Codex changelog](https://learn.chatgpt.com/docs/changelog)

Current events include `SessionStart/End`, `Pre/PostToolUse`, `PermissionRequest`, `Pre/PostCompact`, `UserPromptSubmit`, `SubagentStart/Stop`, `Stop`, and `Interrupt`. Matching sources merge; same-event commands run concurrently. Changed non-managed definitions require renewed hash-bound trust. `PostToolUse` cannot undo effects; plain stdout is ignored, so use structured JSON. A blocking post-hook in code mode rejects the nested promise after execution. `Stop` exit 0 requires JSON; `decision: block`, or exit 2 with stderr, creates continuation. `stop_hook_active` identifies prior continuation. Async hooks cannot enforce decisions. [Hooks reference](https://learn.chatgpt.com/docs/hooks)

**Proposed pilot:** One optional, bounded local verification hook, only after the equivalent command works manually. Test no-op, real failure, timeout, duplicate invocation, changed definition, and unsupported-client behavior. Return compact evidence and suppress repeated checks on unchanged inputs. Avoid broad command rewriting and automatic retry loops. Keep the command usable without hooks. Do not enable a pilot until its actual client has demonstrated event delivery and trusted execution.

## 9. Remove procedural pauses without weakening execution boundaries

Codex distinguishes the OS sandbox from approval policy. Auto-review evaluates actions already requiring approval; actions inside the sandbox do not gain an extra review step. The current documentation recommends `codex exec --sandbox workspace-write` for non-interactive editing and identifies `--full-auto` as a deprecated compatibility path. [Agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)

**Implication:** Make ordinary authorized edits and checks proceed within the configured boundaries. Preserve applicable runtime restrictions and the user's specific requirements for consequential external actions. Do not use a process-cleanup effort to broaden filesystem access, disable trust, or bypass automatic approval review. Hook convenience and role prompts should not become substitutes for permissions. When a run is blocked, report the concrete rejected operation and source of the restriction, then complete independent work that remains authorized.

## 10. Test skill behavior with actual agent runs

OpenAI's January 22, 2026 skill-evaluation article proposes a prompt, captured trace and artifacts, targeted checks, and comparable score. It separates outcome, process, style, and efficiency, recommends small must-pass sets, and uses 10–20 positive and negative prompts as a useful initial sample. It demonstrates deterministic checks alongside rubric-based assessment. Its historical CLI and discovery examples should be reconciled with current references before reuse. [Testing agent skills systematically](https://developers.openai.com/blog/eval-skills)

**Implication:** Keep structural checks, but do not call them behavioral verification. Test whether the right skill activates, adjacent tasks avoid it, the user-requested result is completed, required evidence appears, and unrelated files remain untouched. Include interrupted work, pre-existing changes, missing tools, contradictory lower-priority guidance, and user steering. Capture pauses, repeated tests, irrelevant reading, and unnecessary artifacts as efficiency failures. A clean YAML file with correct links can still produce a poor development session.

## 11. Measure quality and cost without building another platform

Official evaluation guidance favors task-specific cases, representative and adversarial examples, automated scoring calibrated against human judgment, and comparisons over time. It recommends validating model judges against human labels; numerical scores alone are insufficient. [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)

The Evals dashboard and API were deprecated on June 3, 2026, become read-only October 31, and are scheduled to shut down November 30. Starting a new dependency on that platform would be inappropriate. [Deprecations](https://developers.openai.com/api/docs/deprecations)

**Proposed measurement design:** Use repository-local fixtures, scripts, traces, and an ordinary results table first. Compare baseline and candidate instructions on the same tasks, model, effort, permissions, and client. Repeat variable cases. Separate correctness and authorization failures from time and usage. Require no observed critical regression before considering an efficiency gain. Preserve raw evidence locally with retention limits; add infrastructure only if maintaining this small evaluation set becomes an observed bottleneck.

## 12. Context continuity should preserve actionable state

Responses API compaction carries essential prior state and reasoning forward in fewer tokens. Its opaque compaction representation is not a human-readable project record, and standalone compact output must be retained as returned. These are API semantics; they do not establish which controls a particular Codex client exposes. [Compaction](https://developers.openai.com/api/docs/guides/compaction)

**Implication:** Let the runtime manage conversation compaction. Keep durable project context focused on accepted decisions, current work, evidence locations, unresolved questions, and the next action. Remove stale status and avoid duplicating full transcripts into permanent instructions. A restart should recover the active objective without reopening every historical report. Measure repeated discovery and lost constraints during the evaluation rather than treating more saved text as inherently better memory.

## 13. Independent research supports selective context, with limits

The abstract of *Evaluating AGENTS.md*, revised June 23, 2026, reports that context files did not generally improve completion in its coding-agent experiments and increased inference costs by over 20% on average. It distinguishes useful nonstandard-practice instructions from unhelpful repository overviews. [Evaluating AGENTS.md, v2 abstract](https://arxiv.org/abs/2602.11988)

The current *SkillsBench* abstract, revised June 14, reports 87 tasks and 18 model/harness configurations: curated skills raised average pass rate from 33.9% to 50.5%. Focused skills with at most three modules outperformed larger bundles. These results concern different interventions and evaluations; they do not justify either removing all guidance or accumulating skills indiscriminately. [SkillsBench, v4 abstract](https://arxiv.org/abs/2602.12670)

These are abstract-level research findings, not a reproduced methodology audit or GPT-6/Pitchlight effect-size evidence. Their practical implication is a paired local experiment: retain distinctive knowledge and measurable checks, and compare removal of generic or overlapping guidance against the existing setup.

The implementation plan should combine these findings with the local audit, prioritize conflicting active instructions and stale runtime adapters, then compare a smaller candidate workflow against the baseline before adding hooks or further orchestration. Exact optimal skill count, default effort, agent count, and performance gains remain empirical questions for this setup.
