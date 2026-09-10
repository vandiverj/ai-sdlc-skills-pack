# GPT-6 software development improvement plan

Date: 2026-09-08, America/Chicago  
Status: items 1–3 implemented following user authorization; later phases remain proposals  
Audited baseline: `8376f33` on `personalAgents`; initially clean, one commit ahead of upstream

The recommended direction is a smaller, internally consistent development system built around a capable GPT-6 primary agent, focused repository evidence, and selective delegation. The highest-priority work is to finish the existing simplification across metadata and executable helpers. Adding more agents, instruction layers, or automatic gates would compound the inconsistencies found in this audit.

This proposal covers the reusable pack under `~/.agents`. The initial audit was read-only. The authorized implementation below changes skills, helpers, templates, and the saved Codex reasoning default. The companion [research note](2026-09-08-gpt6-agent-development-research.md) contains the vendor guidance and its limitations.

## Authorized implementation — 2026-09-08

The owner approved items 1–3 and selected medium as the likely default. The saved
Codex configuration now selects `gpt-6-astra` with `medium` reasoning. Hosted agent
templates inherit the chosen model and effort; local experimental adapters remain
separate. High and xhigh are deliberate escalations for consequential ambiguity or
unusually difficult work. This supersedes the proposal's earlier high/xhigh comparison.
Existing sessions may retain their original effort until a new session starts.

Routing uses task scope rather than incidental dirty documentation. Completion uses
current task-bound, revision-bound checks and contract-bound acceptance criteria across normal and
legacy entry points. Failed checks, caps, missing criteria, and newly introduced
source scope remain open. Compact impact closure replaces mandatory packets;
expanded contract analysis remains applicable for consequential changes. Git staging
alone preserves evidence freshness; changes to repository inputs conservatively
invalidate it, including unrelated edits. No helper can grant action authority.

Discoverable skills decreased from 21 to 16. Classification, interviews, process
learning, and skill testing moved into their owning skill's references. Generic
legacy document guidance moved outside discovery into `compatibility/`. Meta skills
use explicit invocation metadata. Setup and retrieval guidance load only as needed;
active authority instructions recognize authorization already provided by the user.

Validation: five repository suites, diff hygiene, and the skill control-character
scan passed. Readiness integration tests exercise missing, stale, failing, capped,
wrong-task, wrong-contract, mutated-contract, newly expanded scope, and staged-content cases. Independent
review identified false-readiness paths and fixes were applied. One independent
GPT-6 medium forward test corrected a README spelling error with a focused diff check,
without extra questions, skills, packets, dependencies, or Git actions. This is a
behavioral screening result, not proof of general time/token savings or optimal effort.

Hooks, agent-role consolidation, new dependencies, external actions, and Pitchlight
product changes are outside this implementation. No commit or push was performed.

## Evidence and current state

The audit inventoried all tracked paths, read the main instructions, routers, metadata, role/adaptor examples, prior improvement records, and relevant CLI implementation and tests. This was a targeted structural and behavior audit, not a line-by-line security review of every helper. Local historical material was treated as evidence of prior intent, not new user authorization.

| Surface | Observed baseline | Interpretation |
| --- | --- | --- |
| Tracked repository | 386 files; 2,278,113 bytes | Maintenance size, not prompt size |
| Skills | 21 `SKILL.md` files, 75 reference files, five `agents/openai.yaml` files | Progressive loading is already established; activation and consistency need work |
| Roles and templates | 11 portable roles; 134 template files across purposes/runtimes | Substantial opportunity to reduce active choices and duplicate policy |
| Helper implementation | 72 library modules; 103 distinct literal CLI `area` branches | Branch count includes aliases; it is not a count of necessary user commands |
| Supporting docs | 44 tracked files, about 590 KB | Historical material needs clearer separation from current guidance |
| Local Codex | CLI `0.135.0`; config selects `gpt-6-astra`, `xhigh` | Preserve this quality baseline while evaluating workflow changes |
| Local runtime installation | No entries in `~/.codex/agents`; no `~/.codex/AGENTS.md` or `~/.codex/hooks.json` | Repository templates are not evidence of installed agents or hooks |
| Existing validation | Four prescribed Node checks passed on the initially clean baseline; approximately 4.2 seconds combined. Routing validation then failed after adding these research documents. | A reproduced dependence on unrelated working-tree state; see below. No measurement of GPT-6 task outcomes. |

Config-file observations do not establish every desktop-session override, managed policy, or plugin-provided hook. The runtime supplied to this conversation already provides generic subagent tools. Nothing here requires installing the full custom roster.

Disk size should not become a proxy for token cost. Skill descriptions are discovered up front; full skills and references are loaded selectively. Measure what actually enters a task, including tool output and child-agent context. [Official skill documentation](https://learn.chatgpt.com/docs/build-skills)

## Findings that should drive the changes

| Priority | Finding and local evidence | Proposed response |
| --- | --- | --- |
| P0 | `skills/sdlc-process-improvement/agents/openai.yaml` still requests **10 review/revision loops**, although its skill body now calls for a proportionate review. `improvement-loop` metadata also preserves a heavier workflow. | Align descriptions, default prompts, skill bodies, and examples in one slice. Check metadata as well as `SKILL.md`. |
| P0 | Two metadata files use top-level interface fields; `run-sdlc` metadata contains a UTF-8 BOM. `test-skill-files.mjs` only scans `SKILL.md`. | Validate the current documented metadata shape and perform a real discovery/invocation smoke check. Do not claim an observed runtime failure merely from these structural differences. |
| P0 | `WORKFLOW.md` places task text below repository instructions, code, and tools in a single authority ordering. Generic approval language is repeated across README, skills, prompts, and helpers. | Separate instruction authority from factual evidence. Preserve current user scope and existing authorization; facts in code do not overrule requested behavior. Explain actual conflicts and attributable pauses. |
| P0 | `taskContract` in `contract.mjs` accepts scoped files but derives the route from ambient Git changes. With only unrelated Markdown changes present, a Swift behavior task becomes `tiny-docs`; `experienceImpactRequired` then disables its required checks. | Derive routing and proof applicability from the same explicit task scope. Test clean, unrelated-dirty, and scoped-dirty states independently. Fix this before simplifying completion gates. |
| P0 | Main docs make artifacts optional, but `journal.mjs` requests a verification packet when a dirty task lacks one; `gates.mjs` requires a separate impact packet for observable changes. Legacy `finalGateOpenItems` in `finish.mjs` additionally asks for touched, impact, verification, and QA artifacts broadly. | Make all readiness paths consume the same scoped evidence and applicability decisions. A missing document is a blocker only when its information is materially missing. |
| P1 | Codex templates pin GPT-5.3 Spark, GPT-5.4/mini, or GPT-5.5. `choose-strategy.md` prohibits a heavier model when a cheaper tier could suffice. | Inherit the selected GPT-6 model by default. Treat cheaper models as measured opt-in alternatives. Remove the compulsory cost-tier decision from ordinary work. |
| P1 | `delegationStrategyDecision` recommends delegation whenever its small-task suppression does not apply. Multiple role/prompt layers repeat evidence and feedback fields. | Require a positive reason to delegate: useful independent discovery, an isolated implementation boundary, or independent review of consequential judgment. |
| P1 | `document-processing` overlaps installed document plugins. `grill-me` references retired top-level names such as `to-prd`. `find-skills` activates on generic help requests and treats popularity as a quality proxy. | Remove duplicate active guidance where a verified replacement exists; narrow discovery triggers and evaluate skills by source, behavior, permissions, and maintenance. |
| P1 | `context/SKILL.md`, roles, adapters, and feedback tests embed AirteraCode/context-MCP conventions into otherwise portable defaults. | Move service-specific behavior behind the existing optional adapter boundary. Retain useful configured retrieval and outcome reporting for users who enable it. |
| P1 | Existing tests assert phrases, role rosters, helper recommendations, and constructed packet contents. They do not execute GPT-6 against representative development tasks. | Keep useful deterministic tests and add a small paired behavior evaluation. Do not infer developer productivity from lint or packet validation. |
| P2 | `adapters.mjs` describes Codex hooks as plugin/tool dependent and its audit searches `.codex/settings.json`, not current documented hook sources. | Update capability detection before proposing executable hooks. Avoid a false “no hooks” or safety verdict from this incomplete scan. |
| P2 | Historical cycles, a 156 KB local-model overview, legacy reviewer contract, and multi-runtime templates remain alongside current guidance. | Remove historical material from normal retrieval and installation paths; retire compatibility only after checking actual consumers. |

The prior ignored simplification plan explicitly deferred broad CLI deletion because usage evidence was insufficient. This plan retains that constraint. Absence of usage evidence is not proof that a capability is unused.

### Small executable probe

In a disposable, unconfigured Git repository with a README and ignore file, the normal CLI was exercised with `fix README typo`:

1. `start` selected `bugfix-regression` and created a task journal.
2. `next` requested a developer verification packet.
3. `prove` displayed missing diff/hygiene evidence but exited zero.
4. `finish-ready` blocked on scope, changed-file, and verification evidence, while warning about nine missing/unconfigured context documents.

This is a reproducible onboarding/proportionality signal, not proof that a verified task was incorrectly rejected: no verification evidence had been supplied. It shows that a journal already naming the task does not automatically satisfy the separate manifest, and that the advertised small lifecycle still exposes multiple representations. The ordinary `finish-ready` command uses `completeCheck`, not the older `finalGateOpenItems`; both need explicit tests rather than being conflated.

### Correctness failure discovered during final validation

After the two proposed research documents became untracked changes, `node scripts/test-routing-optimization.mjs` failed its assertion at line 82: an incomplete behavior contract should retain required outcome/impact/proof findings. Repeating the check alone reproduced it.

A read-only comparison called `taskContract` for the same saved-observation replacement task, the same explicit Swift file, and the same acceptance criterion:

| Git input to the contract | Route | Required behavior evidence |
| --- | --- | --- |
| Actual worktree containing unrelated research Markdown | `tiny-docs` | Disabled; zero required open findings |
| Explicit Git input scoped to the Swift file | `standard` | Three required open findings |
| Explicit clean Git input | `standard` | Three required open findings |

The cause is visible in `taskContract`: route inference precedes and ignores `context.files`. `inferRouteFromTask` can fall back to the ambient docs-only classification, and `experienceImpactRequired` exits early for `tiny-docs`. This is stronger evidence than a generic flaky-test report: irrelevant repository state changes a required evidence decision. The implementation and tests were left unchanged so the research task does not silently become a software rewrite. The next implementation should address both task-scope consistency and fixture isolation.

## Intended operating model

The ordinary workflow is: understand the desired result and constraints, inspect relevant source, make the complete bounded change, obtain direct proof, inspect the diff, and finish the authorized work. A plan is useful when it resolves uncertainty or preserves a long-running task. Independent review is useful when a second examination could catch an expensive mistake. Neither should be a required stop after every small edit.

| Mechanism | Owns | Boundary |
| --- | --- | --- |
| User request and runtime policy | Scope, authorization, system/tool restrictions | Existing authorization persists; readiness cannot grant permission |
| Repository `AGENTS.md` | Non-obvious local constraints, exact commands, important pitfalls | Link relevant deeper material; avoid a copied SDLC manual |
| Skills | Reusable procedures that demonstrably improve a class of work | One clear trigger and outcome; detailed references loaded when needed |
| Agent preset | Access boundary and bounded role | A role does not need to be a separate agent on every task |
| Project commands and deterministic helpers | Executable checks, scoped evidence, mechanical summaries | Do not ask an LLM to simulate a compiler or build system |
| Hooks | Small, observable event-driven actions | Optional; no second workflow engine or automatic authorization |
| Durable docs and compact checkpoints | Decisions, unresolved facts, restart state | Keep history and speculative findings out of active instructions |

OpenAI's GPT-6 guidance specifically identifies needless pauses and excessive testing as behaviors to address through clear authority and proportional verification. That supports correcting this pack's conflicting layers; it does not establish that removing all guidance improves this user's work. A fresh, smaller comparison baseline is this plan's proposed experiment. [GPT-6 guidance](https://developers.openai.com/api/docs/guides/latest-model)

The independent evidence supports selective retention. An AGENTS.md study found no general success benefit from context files and higher average inference cost, while SkillsBench found substantial benefits from curated, focused procedural skills. These are different interventions and evaluated settings. Neither result predicts a GPT-6 or Pitchlight effect size. The practical inference is to retain tested, non-obvious guidance and evaluate subtraction. [AGENTS.md study, v2](https://arxiv.org/abs/2602.11988v2), [SkillsBench, v4](https://arxiv.org/abs/2602.12670v4)

## Proposed skill and agent consolidation

Preserve the current phase routers initially. Their bodies are already relatively small, and a wholesale rewrite would discard useful distinctions before measuring them.

| Current surface | Target disposition |
| --- | --- |
| `run-sdlc`, `planning`, `implementation`, `quality`, `review`, `context`, `release`, `setup-sdlc-in-repo` | Keep eight principal software capabilities. Remove repeated intake/output contracts; use relevant references directly. Trim setup to a minimal default plus selected extensions. |
| `classify-work` | Fold the short classification decision into a `run-sdlc` reference. Retain an explicit compatibility entry only while callers migrate. |
| `sdlc-process-improvement` | Own process changes, recurring learning, and their evaluation. |
| `process-learning`, `test-skill-behavior` | Move their useful procedures under process improvement; preserve explicit callers during migration. |
| `agents`, `tools` | Keep for explicit strategy/configuration and difficult retrieval/tool decisions; remove automatic detours from ordinary coding. |
| `counterpoint`, `improvement-loop` | Keep distinct, explicitly requested critique capabilities. Remove “highest-quality result” as a catch-all trigger and fixed-loop behavior from metadata. |
| `make-qa` | Keep its concrete tester-facing workflow; invoke when QA authoring is requested or actually part of the task. |
| `caveman` | Keep as an explicit style preference; avoid activation merely because an engineering task mentions performance or token accounting. |
| `find-skills` | Keep for explicit capability discovery. Inspect existing capabilities first; remove generic “how do I…” activation and popularity-based acceptance. |
| `document-processing` | Disable in this profile after confirming installed document tools cover needed workflows. Retain a portable fallback outside default discovery if other environments need it. |
| `grill-me` | Retire or redirect to the existing requirements interview capability after checking saved invocations; migrate retired references. |

This would yield roughly 16 substantive skills after compatibility entries are retired. That is a consequence of ownership decisions, not a required numerical target. Use documented implicit-invocation controls for specialist/meta skills, and validate them in the actual runtime. Do not use an undocumented frontmatter flag as a substitute. [Skill invocation policy](https://learn.chatgpt.com/docs/build-skills)

For agents, use the primary agent plus three reusable role presets: **scout**, **worker**, and **reviewer**. A scout receives a bounded question and returns exact evidence. A worker receives exclusive file ownership and required proof. A reviewer receives the original requirement, diff, and evidence, with findings separated from implementation confidence. Security, QA, planning, verification, and process-learning references remain available as expertise within these roles. Promote a specialist back to a distinct installed role only if measured work benefits from its distinct access or context needs.

Do not install all eleven adapters as a prerequisite. For the initial GPT-6 profile, omit per-role model pins so supported runtimes inherit the selected model. Keep the present `xhigh` primary baseline; compare `high` on representative ordinary tasks later. Routine shell search and deterministic checks need no separate model. Cost comparisons should include rework, delegated context, integration time, and human interruption, not just model rates.

Prefer one independently useful child at a time during the initial rollout; permit more when separate work can actually proceed concurrently. The practical bound is the number of independent tasks and the active runtime's limit. Honor runtime restrictions on when spawning is allowed. Review independence comes from fresh task/evidence assessment, not automatically selecting another model. [Subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## Implementation sequence and acceptance

Each phase is a reversible slice. Use isolated changes and the repository's applicable Git policy; preserve the pre-existing unpushed commit. This proposal itself grants no commit, push, global installation, or runtime-configuration authority.

| Phase | Concrete work | Acceptance and rollback |
| --- | --- | --- |
| 0 — Freeze the comparison | Retain this baseline; select representative tasks and record actual loaded guidance, time, corrections, and evidence. Reuse existing scenarios and local tooling. | Establish GPT-6 behavior before claiming improvement. No new evaluation service or framework is required. |
| 1a — Repair scope correctness | Make explicit task scope govern contract routing and evidence applicability; isolate routing fixtures from the pack's live worktree. Preserve behavior proof when unrelated files are dirty. | The reproduced failure passes in clean and dirty states, and risky tasks retain required proof. Restore the scoped change if classification or evidence regresses. |
| 1b — Repair instruction contradictions | Align five metadata files with their skills; correct authority/evidence distinction; remove redundant approval stops and old compulsory model-tier language. Update relevant READMEs, references, examples, and metadata validation together. | Existing checks pass after 1a. Metadata/discovery probes pass. Small authorized tasks complete without a renewed permission request; an unauthorized external write still stops. Restore this slice if either boundary regresses. |
| 2 — Make optional tooling genuinely optional | Align `console`, `journal`, `evidence`, `gates`, `finish`, and routing behavior. Reuse the task record as the scope source. Let existing direct check records satisfy relevant criteria. Make QA, impact, and planning detail conditional. Unify readiness semantics across the normal and compatibility paths. | Docs-only, local behavior, high-risk, and stale-evidence cases behave consistently. A tool report distinguishes advisory output, missing required proof, and a failed command. No extra packet solely to restate known information. Revert adapters/consumers together if compatibility fails. |
| 3 — Reduce active guidance and presets | Apply the consolidation table. Migrate callers, catalogs, installers, prompts, and tests. Remove service-specific defaults from the portable path. Keep optional adapters for runtimes actually used; maintain one role contract instead of hand-editing parallel policy copies. | Positive and negative activation cases pass in fresh sessions. Explicit specialist requests still work. Retired references are either migrated or intentional aliases. Re-enable individual skills/presets if a specific workflow regresses. |
| 4 — Evaluate one hook | First update hook discovery/capability documentation. Trial only the narrow hook described below in a disposable environment, then an opt-in local profile. | Supported events, trust behavior, latency, recursion, and failure handling demonstrated on the installed runtime. Removing the hook leaves the normal workflow usable. |
| 5 — Retire proven dead weight | Move historical cycle material out of active lookup; reduce setup templates to selected needs. Deprecate redundant CLI aliases/subsystems only after checking import references, configured users, and sampled real usage. | Compare subsequent task outcomes; preserve required downstream compatibility. Delete one independent group at a time. Restore a group from its scoped change if its consumer was missed. |

Phase 2 must preserve the distinction between *required verification failed* and *verification could not be performed*. A cap can truthfully describe partial work; it cannot turn an unverified required outcome into a passed task. Evidence should identify the relevant command/check, result, inspected revision or content, and affected claim. Reuse existing records; do not introduce another packet schema unless an actual missing field makes it necessary.

For repository setup, the minimum is a concise `AGENTS.md` and reliable existing check commands. Add a profile only for information that cannot be inferred safely. Add a context checkpoint for long work, a decision record for consequential choices, and specialist artifacts for their actual consumers. Do not copy the entire template tree into a new repository.

## Hook policy and initial experiment

Current Codex documentation exposes lifecycle, tool, permission, compaction, and subagent hook events. That does not prove the installed CLI, desktop session, plugin, and managed configuration all expose identical behavior. Post-tool hooks run after the tool's side effects, so they cannot provide pre-execution protection. Matching hooks can run concurrently. [Hook reference](https://learn.chatgpt.com/docs/hooks)

The initial candidate is one **advisory post-tool hook** for recognized file-edit operations: mark existing verification evidence stale when relevant content changes. It should use the existing record if available, coalesce duplicate events, and emit context only when the state actually changes. It runs no tests, calls no model, performs no network request, and stores no source text or full command transcript. If reliable changed-path attribution is unavailable, omit this hook and refresh evidence at the next explicit verification boundary.

Every readiness consumer must independently compare the relevant current revision/content with the recorded evidence. Shell writes, external edits, and missed hook events must also invalidate affected proof. The hook provides earlier notice; absence of an event never establishes freshness.

| Event/application | Initial decision |
| --- | --- |
| Session start / compaction | Rely on native instructions and a compact checkpoint. Add automation only after a reproduced resume failure. |
| Before tool / permission request | Use runtime permissions and repository policy. Do not auto-approve through a hook or rely on shell regex for authorization. |
| After file edits | Optional stale-evidence experiment above, only on verified supported payloads. |
| Every command | No automatic broad testing, formatting, feedback generation, or repetitive process output. |
| Stop | No blocking hook initially. First remove the existing paperwork-driven completion failures. |

Require a strict runtime budget, idempotent updates, concurrent-event tests, malformed-input tests, timeout handling, and an off switch. An advisory hook failure reports the cap and does not trap the agent in a continuation loop. Actual command permissions remain enforced by the runtime. Hook configuration and invoked code must be reviewable; confirm what trust approvals cover when code changes. Reuse the standalone helper as the fallback.

If no useful effect appears in the small pilot, keep zero hooks. Their value must come from correcting a repeated failure that ordinary commands and concise instructions do not already handle.

## Evaluation that can justify adoption

Compare the current pack with each meaningful candidate on the **same GPT-6 model and reasoning setting**, task, checkout, tool access, and acceptance criteria. Change reasoning effort, agent count, or retrieval separately; otherwise attribution is lost. Fresh sessions prevent instructions from one condition contaminating the other. Randomize baseline/candidate order where practical and record caching/runtime variance.

Use six representative development cases initially, with two runs per condition when affordable: a docs correction, a bounded regression fix, a stateful UI change, a difficult diagnosis, a long-running resume, and a consequential contract/data change. In each applicable phase, also run development checks for negative skill activation, preserved dirty user work, existing local authorization, unauthorized external actions, and stale or irrelevant verification evidence. Use controlled tool stubs for unauthorized actions so an evaluation cannot actually publish or damage data. Reserve four unseen variants of these boundary cases for final evaluation; do not postpone basic boundary checks until then. Use sanitized fixtures and representative native-app work; do not use Pitchlight's protected second-match holdout or tune product acceptance thresholds.

| Measure | Adoption rule |
| --- | --- |
| Correctness and completed user outcome | No known important regression. Use actual tests and artifact/interaction inspection, not an agent's claimed success. |
| Authority and evidence integrity | Any unauthorized action, overwritten user work, false completion claim, or weakened required proof rejects the candidate. |
| Human interruption | Zero unnecessary approval re-asks in the small authorized cases. Count correction effort as well as messages. |
| Elapsed delivery time | Seek at least a 20% median reduction for simple tasks, or a clear quality improvement that justifies added time. This is a proposed decision threshold, not a forecast. |
| Context/process cost | Count loaded instructions, tool output, agent calls, artifacts, and repeated checks. A 25% reduction in loaded process guidance is a useful initial target only if outcomes hold. |
| Verification | Preserve relevant coverage; count unnecessary reruns separately from justified reruns after a change or failure. |
| Hook experiment | No loops, stale pass results, or unexplained pauses; measured benefit must justify its latency and maintenance. |

The initial sample is a screening exercise, not statistical proof of non-inferiority. Investigate variance and regressions; expand only the uncertain comparisons. Prefer deterministic or blinded artifact grading where possible. An independent model reviewer can supplement this, but its verdict does not replace execution or owner judgment. Record model, reasoning, runtime, skill revision, outcome, time, interruptions, proof, and token counts when available in one local results file. Do not equate word-count estimates with billed tokens or API rates with Codex subscription cost.

Existing structural checks remain useful, but extend them to metadata, migrated references, and realistic readiness paths. A wording assertion can catch the known ten-loop regression; a real invocation must verify the behavioral effect. Preserve specific failure fixtures so shortening a skill cannot silently discard a needed guardrail.

## Decisions to avoid and remaining uncertainty

Do not add a new orchestrator, graph/vector store, telemetry service, model roster, or plugin bundle for this cleanup. Existing local search, runtime tools, skills, and focused scripts are enough to test the hypotheses. Preserve currently useful external retrieval as an optional configured capability. A new abstraction must replace an existing burden and solve a demonstrated failure.

A subtraction-only proposal also has risks: deleting specialized guidance could harm QA or native workflows; merging all routers could create another large prompt; removing compatibility without consumer evidence could break other repositories. The selected approach therefore repairs contradictions first, disables before deleting, preserves distinct useful expertise, and checks outcomes before retirement.

Still unproved: the amount of real GPT-6 time/token savings, whether `high` is preferable to the user's current `xhigh`, which legacy commands other projects depend on, and whether any hook produces a net benefit. These are bounded evaluation questions, not reasons to delay the directly evidenced metadata and authority repairs once implementation is requested.

The first implementation slices should be Phase 1a and 1b. They address a reproduced correctness issue and active instruction contradictions with limited structural change, creating a reliable baseline for the larger reductions.
