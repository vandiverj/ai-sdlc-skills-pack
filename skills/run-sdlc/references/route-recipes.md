# Route Recipes

Purpose: define compact, repeatable route recipes that agents and SDLC helper tooling can use without re-deriving the workflow every time.

## Use

Load this reference when:

- a route needs concrete required context/check/evidence expectations,
- the `sdlc` CLI is generating evidence or restore guidance,
- a runtime needs a concise process card rather than the full SDLC.

## Common Fields

Each recipe defines:

- trigger,
- context packet,
- checks,
- evidence,
- stop gates,
- done criteria.

Use `sdlc done check --route <route> --packet <packet>` before final completion claims. The helper checks route-specific evidence shape and reports unresolved gates; it does not replace human approval, source review, or command interpretation.

For implementation, bugfix, maintenance, optimization, or release-facing work that needs human QA or handoff, prefer the universal evidence set:

- `sdlc task preflight --task "..."` for a one-screen route/unit/surface/context/QA/artifact/confidence decision before editing,
- `sdlc state init --task "..."`, `sdlc state current`, and `sdlc state explain` for resumable local task state,
- `sdlc evidence required --task "..."`, `sdlc evidence status --task "..."`, and `sdlc evidence add --kind <kind> --summary "..."` for deterministic evidence expectations and captured proof,
- `sdlc run-check --name <name> -- <command>` for command evidence with timestamps, exit code, output summary, and product-vs-tool failure classification,
- `sdlc complete check --task "..."` for local state/evidence/gate validation before completion claims,
- `sdlc scope check --task "..."`, `sdlc git guard --action commit|push`, and `sdlc policy check --task "..."` for dirty-file scope and human-controlled action boundaries,
- `sdlc task fast-pass --task "..."` for micro/tiny work that can stay inline while preserving the quality floor,
- `sdlc task start --task "..."` for the normalized task contract,
- `sdlc task open --task "..."` for start + context freshness + context contradiction check + change graph + ledger in one checkpoint,
- `sdlc task current`, `sdlc task id --task "..."`, and `sdlc task bundle --task "..."` when multiple task runs or packet grouping could make latest-packet selection ambiguous,
- `sdlc task ledger --task "..."` for the evidence index,
- `sdlc task review --task "..."` or `sdlc task checkpoint --task "..."` for current completion state,
- `sdlc surface detect --task "..."` and `sdlc unit detect --task "..."` before choosing rendered UI, API-contract, service, data, integration, background-job, package/tooling, or docs/process evidence,
- `sdlc context inventory`, `sdlc context bucket-check --task "..."`, `sdlc context resolve --path <path> --task "..."`, `sdlc context final-check --task "..."`, `sdlc context place --fact "..."`, `sdlc context freshness --task "..."`, `sdlc context contradictions --task "..."`, and `sdlc change graph --task "..."` for context placement, confidence, contradiction checks, final verification discoveries, and impact graph-lite,
- `sdlc touched packet` for changed technical surfaces,
- `sdlc impact packet --task "..."` for user/system impact,
- `sdlc interaction packet --task "..."` for games, dashboards, wizards, settings, animation/feedback loops, and other stateful workflows,
- `sdlc validate ladder --task "..."` to choose the strongest practical validation surface and record fallback caps,
- `sdlc verify packet --task "..."` for developer/agent verification,
- `sdlc smoke packet --task "..."` for developer/agent manual smoke evidence before completion, especially UI/manual-QA/no-tests work,
- `sdlc qa script --task "..."` for Markdown manual QA test scripts that can be pasted into YouTrack,
- `sdlc qa review --packet <path>` for YouTrack/human-tester readiness checks,
- `sdlc final gate --task "..."` and `sdlc git packet` for human-approved final action decisions.
- `sdlc workspace status`, `sdlc workspace init`, `sdlc workspace doctor`, `sdlc workspace map --task "..."`, `sdlc workspace packet --task "..."`, and `sdlc multi ledger --task "..."` when multiple repositories may be open or affected.
- `sdlc unit map` and `sdlc unit doctor` when one repository contains multiple deployable/codebase units with different context buckets, test surfaces, commands, or deploy methods.
- `sdlc workmode detect --task "..."` to surface product/repo/task modifiers such as legacy, modern web, API/service, manual-QA-heavy, no-tests, integration-heavy, or multi-repo.
- `sdlc test plan --task "..."` when automated coverage is missing or should grow from the active task.
- `sdlc test suggest --task "..."` when the repo has weak/no tests or a dependency/package upgrade.
- `sdlc test bootstrap-plan --unit <unit> --framework dotnet|node|deno|generic` when a focused test project/harness must be introduced for the active task.
- `sdlc data packet --task "..."` and `sdlc integration packet --task "..."` when data/storage or third-party/cross-system behavior is affected.
- `sdlc data boundary --task "..."`, `sdlc data query-plan --task "..."`, and `sdlc data evidence --task "..."` when read-only database evidence can reduce uncertainty; the helper plans and captures evidence shape but does not execute queries.
- `sdlc ticket evidence --task "..."`, `sdlc ticket drift --task "..."`, and `sdlc ticket update-preview --task "..."` when a YouTrack/ticket issue provides task intake, acceptance criteria, QA expectations, or closeout notes; posting/updating remains approval-gated.
- `sdlc bug evidence --task "..."` for live-connected staging/production-safe bug investigations that need exact logs, failing SQL/API/contract evidence, minimal fix discipline, targeted regression, and QA scenario retest.
- `sdlc bug evidence-check --packet <path>` before closing a live-system bugfix.
- `sdlc bug reproduce`, `sdlc bug diagnose`, `sdlc bug fix-plan`, `sdlc bug verify`, and `sdlc bug qa` when a live-system bug needs stepwise evidence-first handling.
- `sdlc search classify --pattern "..."` when search results may include archived, generated, dependency, test, docs, or active-source references.
- `sdlc route retire --old "..." --new "..." --task "..."` when replacing routes/endpoints/links and needing positive/negative search evidence.
- `sdlc command classify --command "..." --status <code> --stderr "..."` when a failed command might be quoting, tooling, sandbox, setup, flaky external, or product failure.
- `sdlc tools detect`, `sdlc tools status --task "..."`, and `sdlc tools fallback --task "..."` when current runtime capability should be made explicit before selecting evidence paths.
- `sdlc artifact budget --route <route>` for proportional evidence expectations.
- `sdlc artifact spa-plan --task "..."` when generated SPA bundles must be built, published, copied, or promoted into a separate host repository.
- `sdlc automation budget --route <route>` and `sdlc hooks plan --runtime <runtime>` when deterministic hook/event automation is being configured.
- `sdlc risk agentic --task "..."` when tool authority, identity, memory/context, untrusted input, cascading actions, release authority, or sensitive data needs explicit gates.
- `sdlc learn quick`, `sdlc learn capture`, `sdlc learn sanitize`, `sdlc learn sync-check`, `sdlc learn review-cycle`, `sdlc learn archive`, `sdlc learn route`, `sdlc learn summary`, `sdlc learn review`, and `sdlc learn promote` for cross-environment process-learning candidates; keep product/client facts in repo/unit/shared context unless redacted and generalized.
- `sdlc fixture plan --task "..."`, `sdlc finish packet --task "..." --intent keep-change`, and `sdlc learn from-run --task "..."` when a fixture app is used to validate the SDLC and the resulting product improvement should be kept.
- `sdlc gates --task "..."` for the open-gate dashboard.
- `sdlc handoff draft --task "..."` for MR/release/QA/deployment text drafts without creating or triggering anything.
- `sdlc render plan --task "..."` or `sdlc render evidence --task "..."` for visible UI work when tooling is available or caps must be explicit.
- `sdlc security permissions --task "..."` and `sdlc security audit --task "..."` when tool authority, external calls, dependency installs, generated skills/prompts/agents, secrets, or release surfaces are involved.
- `sdlc process health` for process-level repeated caps, open packets, and improvement signals.
- `sdlc task finish --task "..."` for the final human approval decision screen.

The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines. Commit and push require explicit human approval.

## Quality Floor

Every route, including micro/tiny fast-pass work, must keep:

- changed-files awareness,
- at least one verification path or explicit cap,
- surface-correct evidence,
- context placement decision when durable knowledge changed,
- human QA Markdown when testers are involved,
- developer-controlled finish for commit/push,
- final confidence summary separating proved facts, inferred facts, human judgment, and safe next action.

## Security Trigger Overlay

Apply `classify-work/references/security-route-triggers.md` before starting any route. Security/tool triggers add consent gates, threat-model/security review expectations, and evidence fields to the base route. They may escalate risk while preserving the selected route name.

### tiny-docs

Trigger: typo, wording, link, or tiny documentation routing update.

Context packet:

- target file,
- nearby section,
- `git status --short`.

Checks:

- `git diff --check`.
- Link/path search when references changed.

Evidence:

- short summary,
- files changed,
- checks run,
- unresolved questions.

Stop gates:

- unclear source truth,
- docs contradict code or requirements.

Done criteria:

- text is updated,
- references are not stale,
- diff hygiene passes.

### tiny-code-cleanup

Trigger: low-risk private cleanup with no intended behavior change.

Context packet:

- target file,
- existing tests/check command,
- `git status --short`.

Checks:

- narrow relevant test if available,
- `git diff --check`.

Evidence:

- summary of no intended behavior change,
- checks run,
- files changed.

Stop gates:

- public behavior changes,
- test/build tooling changes,
- unclear ownership.

Done criteria:

- cleanup is scoped,
- checks pass,
- no unrelated files changed.

### standard

Trigger: ordinary feature, bugfix, or refactor with testable behavior.

Context packet:

- `AGENTS.md`,
- SDLC profile or repository setup,
- relevant app/model/context docs,
- affected source/tests,
- `git status --short`.

Checks:

- route-appropriate tests,
- build/typecheck when applicable,
- `git diff --check`,
- rendered review for UI-visible changes when available.

Evidence:

- standard evidence packet,
- command results,
- caps,
- review/handoff notes.

Stop gates:

- scope/contract uncertainty,
- missing verification path,
- security/privacy/dependency risk,
- human approval needed for external effects.

Done criteria:

- implementation matches scope,
- tests/checks support the claim,
- docs/context are updated when durable truth changed.

### interactive-stateful-feature

Trigger: games, dashboards, wizards, settings/mode changes, animation/feedback loops, or any workflow where user actions change visible or persistent state.

Context packet:

- task preflight with task breadth,
- interaction packet,
- affected unit/surface detection,
- changed files and existing validation commands.

Checks:

- state/domain logic test when practical,
- build/typecheck,
- rendered UI/API/CLI/job smoke matching the actual surface,
- regression path for reset/retry/back/adjacent behavior.

Evidence:

- starting state,
- action sequence,
- state changes,
- expected feedback/animation/result,
- recovery/reset path,
- validation ladder and caps.

Stop gates:

- unclear user-facing success state,
- state changes spread across units without context bucket mapping,
- no runnable or manual validation surface,
- animation/feedback added without proving the underlying state transition.

Done criteria:

- primary interaction works,
- state and feedback agree,
- nearby regression path is checked or capped,
- QA Markdown exists when human testers are involved.

### fixture-validation-kept-change

Trigger: Battle Soccer or another fixture app is used to validate the SDLC and the resulting product improvement should be saved.

Context packet:

- fixture plan,
- task preflight,
- changed-file scope,
- validation ladder,
- finish packet with `--intent keep-change`.

Checks:

- route/breadth classification,
- tests/build or strongest practical surface check,
- diff hygiene,
- rendered/API/CLI/job smoke or explicit cap,
- commit preview only after verification is summarized.

Evidence:

- why the task tests the SDLC behavior,
- why the product change is worth keeping,
- commands/screens/smoke used,
- QA readiness or cap,
- process learning review.

Stop gates:

- fixture-only experiment presented as production-ready evidence,
- useful product changes left unverified,
- commit/push/merge/deploy/release implied without explicit human approval.

Done criteria:

- useful change is validated like normal product work,
- SDLC learning is captured separately from product facts,
- finish packet distinguishes kept change from throwaway process test.

### bugfix-regression

Trigger: broken behavior with known or discoverable expected behavior.

Context packet:

- bug report or reproduction,
- expected behavior source,
- affected source/tests,
- prior related evidence if available.

Checks:

- failing test or reproduction before fix when practical,
- regression test after fix,
- relevant broader check.

Evidence:

- reproduction,
- root cause,
- fix summary,
- regression check.

Stop gates:

- expected behavior unclear,
- bug implies broader contract/product change.

Done criteria:

- regression is covered,
- fix passes relevant checks,
- no unrelated behavior changes.

### ui-rendered-review

Trigger: visible product UI, layout, interaction, copy, or rendered workflow change.

Do not use this route for Swagger/OpenAPI-only APIs, backend services, jobs, data changes, or provider integrations unless a rendered browser workflow is actually changed.

Context packet:

- target workflow,
- UI files,
- design/context docs if present,
- rendered-review tooling profile.

Checks:

- tests/build as applicable,
- browser/rendered inspection,
- viewport coverage appropriate to risk,
- accessibility check when available and when repository policy or the human asks for it.

Evidence:

- screenshots or rendered notes,
- tool used,
- viewports,
- interaction path,
- caps.

Stop gates:

- no rendered path for release-sensitive UI,
- layout risk cannot be inspected,
- accessibility risk cannot be inspected when repository policy marks accessibility required.

Done criteria:

- rendered evidence supports the claim or caps are explicit,
- skipped optional accessibility is recorded as a cap/note, not a failure.

### api-contract

Trigger: Swagger/OpenAPI, HTTP endpoint, request/response, SDK/consumer contract, or API-only developer testing surface.

Context packet:

- OpenAPI/Swagger or endpoint source,
- affected service/unit,
- auth/config/test data requirements,
- consumers when known.

Checks:

- unit/service tests when available,
- Swagger/OpenAPI/API-client request with QA-safe payload when appropriate,
- contract compatibility review.

Evidence:

- endpoint/path,
- request payload shape,
- expected status/response,
- logs or data side effects when safe,
- caps.

Stop gates:

- auth/test data unavailable,
- compatibility or consumer ownership unclear,
- production/customer data would be needed.

Done criteria:

- API behavior is verified or caps are explicit,
- QA script uses API-contract mode rather than rendered UI mode.

### bugfix-live-system

Trigger: production/staging-safe bug investigation where logs, generated SQL, external provider traces, or environment-specific evidence identify the failing behavior.

Context packet:

- case identifier,
- affected unit/context bucket,
- exact log/error source,
- failing endpoint/table/contract/job,
- analogous successful path.

Checks:

- targeted reproduction or log-backed evidence,
- smallest evidence-backed fix,
- targeted regression test,
- relevant broader safe check.

Evidence:

- observed failure,
- root cause,
- confirming log/request/SQL evidence,
- fallback plan rejected,
- developer validation,
- QA scenario retest instructions.

Stop gates:

- exact failure source unavailable for risky broad fixes,
- product/client sensitive data cannot be safely redacted,
- deploy/release order unclear.

Done criteria:

- root cause and fix are evidence-backed,
- developer validation is separated from QA scenario validation,
- durable context and sanitized learnings are placed in the correct buckets.

### ticket-evidence

Trigger: YouTrack issue ID/link, ticket-driven work, acceptance criteria, QA case, or issue comments that define scope.

Context packet:

- ticket provider and read mode,
- issue id/link,
- summary and acceptance criteria,
- relevant comments and linked issues,
- attachments/articles considered only when allowed,
- fallback pasted context when MCP is unavailable.

Checks:

- ticket evidence is current enough for the task,
- acceptance criteria are explicit or the gap is surfaced,
- ticket drift is checked before closeout when MCP is available,
- ticket write/update actions are previews until explicitly approved.

Evidence:

- ticket evidence packet,
- drift status or cap,
- QA Markdown derived from acceptance criteria,
- update preview when closeout notes are needed.

Stop gates:

- ticket scope changed since task start,
- private/sensitive ticket data cannot be summarized safely,
- write-capable ticket action requested without explicit approval.

Done criteria:

- implementation and QA handoff align with current ticket scope or caps are explicit,
- no raw ticket text is promoted into shared `.agents/learnings`.

### database-evidence

Trigger: read-only database MCP access, SQL/data mismatch, EF/provider issue, report/export bug, API data issue, schema/stored procedure concern, or live-system diagnosis where database state can reduce uncertainty.

Context packet:

- database provider/context,
- environment and access mode,
- allowed and blocked operations,
- sensitive schemas/tables/data classes,
- redaction rules,
- fallback evidence path.

Checks:

- query purpose is tied to a task question,
- metadata/aggregate/existence checks are preferred before row-level reads,
- production/private row-level evidence is approval-gated,
- results are reconciled with code, schema, logs, tests, and desired behavior.

Evidence:

- safe query plan,
- redacted result summary or explicit cap,
- environment/timestamp/source provenance,
- confidence and conflicts.

Stop gates:

- query would expose secrets, credentials, broad customer data, or unrelated tenant data,
- query would mutate data or execute DDL/jobs/stored procedures,
- wrong environment/read-replica freshness/tenant scope is unresolved.

Done criteria:

- database evidence supports observed state only,
- desired behavior remains grounded in ticket/spec/product context,
- raw query output and proprietary schema details are not promoted to shared learnings.

### generated-spa-artifact-promotion

Trigger: generated React/SPA/Webpack/Vite artifacts need build, publish, copy, cleanup, or promotion into a separate host repository or legacy site folder.

Context packet:

- changed source package(s),
- package scripts and package type signals,
- consuming app/deployable unit,
- host repository/folder and host page files,
- current generated artifact diff.

Checks:

- classify packages as library/package vs deployable app bundle,
- build libraries before consuming apps,
- prefer app `publish` script when present,
- for build-only apps, map package `homepage` or repo profile context to the host target,
- inspect host files before copying,
- `git diff --stat`, `git diff --numstat`, and `git diff --check`.

Evidence:

- package type and artifact owner,
- publish/build command used,
- host target path,
- stale generated asset cleanup scope,
- meaningful generated diff summary,
- smoke/QA cap for hosted workflow.

Stop gates:

- deployable unit or host target is unclear,
- promotion would replace/delete host pages, auth/server config, uploads, or unrelated assets,
- cleanup would wipe a target folder or remove files outside the app-owned generated asset pattern,
- publish/deploy/push/release would run without explicit human approval.

Done criteria:

- only the changed app-owned generated assets are promoted,
- host pages and local server config are preserved,
- generated script/style tags are updated without unrelated markup churn,
- no-op generated-file noise is restored or explicitly capped,
- source and artifact repositories are committed separately when they are separate repos.

### review-only

Trigger: inspect existing work without editing.

Context packet:

- diff or target artifacts,
- requirements/spec/context,
- evidence packet if present.

Checks:

- read-only inspection,
- optional command verification if requested or needed.

Evidence:

- review packet,
- review completion,
- findings by severity,
- evidence gaps,
- no-edit confirmation.

Stop gates:

- review request becomes implementation,
- missing source truth prevents a fair verdict.

Done criteria:

- findings are actionable or the review clearly passes with residual risks.

### release-push

Trigger: commit, push, release handoff, or publication validation.

Context packet:

- current branch/upstream,
- working tree status,
- latest commit,
- verification evidence,
- release policy.

Checks:

- `git diff --check` or `git show --check`,
- tests/build expected by release profile,
- ahead/behind check,
- ignored local evidence check when relevant.

Evidence:

- release packet,
- release completion,
- commit/branch identity,
- checks,
- caps,
- exact Git action taken or not taken.

Stop gates:

- dirty unrelated work,
- failed verification,
- unclear push/PR approval,
- wrong author/committer identity for public work.

Done criteria:

- release action matches approval,
- post-action branch state is verified.

### contract-first

Trigger: public API, SDK, CLI, configuration, event/message schema, data contract, or cross-boundary interface change.

Context packet:

- current contract/interface source,
- producers and consumers,
- compatibility expectations,
- release or migration order,
- contract packet.

Checks:

- contract review before implementation plan,
- type/schema/API tests where available,
- consumer impact check when known.

Evidence:

- contract packet,
- compatibility decision,
- verification path,
- unresolved ownership or rollout caps.

Stop gates:

- unclear producer/consumer ownership,
- compatibility or migration ambiguity,
- missing release order for dependent consumers.

Done criteria:

- contract direction is reviewable,
- implementation can proceed without rediscovering interface intent,
- verification path is named or explicitly capped.

### weak-test-legacy

Trigger: prove whether existing tests can catch a likely regression.

Context packet:

- behavior under test,
- relevant test file,
- safe mutation boundary,
- restoration plan.

Checks:

- temporary mutation or equivalent negative check,
- expected failure,
- restoration,
- passing post-restore test.

Evidence:

- mutation,
- failing assertion,
- restoration proof,
- residual coverage cap.

Stop gates:

- mutation cannot be safely restored,
- test environment is too expensive or unstable.

Done criteria:

- evidence shows tests catch or miss the regression,
- original code is restored cleanly.

### multi-repo-integration

Trigger: one task spans multiple repositories, services, APIs, events, schemas, deployments, or release order.

Context packet:

- SDLC profile,
- shared context root,
- product context index,
- service map,
- related repo map,
- integration contracts,
- repo-specific checks.

Checks:

- per-repo narrow checks,
- contract/integration checks where available,
- cross-repo smoke or manual QA path when needed.

Evidence:

- repos touched,
- contracts/events involved,
- per-repo checks,
- cross-repo caps,
- release order and approval gates.

Stop gates:

- missing service map or ownership,
- unclear contract direction,
- unsafe release ordering,
- work/personal data boundary risk.

Done criteria:

- all affected repos and contracts are accounted for,
- per-repo and cross-repo verification supports the claim,
- deployment/handoff order is clear.
