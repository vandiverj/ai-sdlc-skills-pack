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

- `sdlc task start --task "..."` for the normalized task contract,
- `sdlc task open --task "..."` for start + context freshness + context contradiction check + change graph + ledger in one checkpoint,
- `sdlc task current`, `sdlc task id --task "..."`, and `sdlc task bundle --task "..."` when multiple task runs or packet grouping could make latest-packet selection ambiguous,
- `sdlc task ledger --task "..."` for the evidence index,
- `sdlc task review --task "..."` or `sdlc task checkpoint --task "..."` for current completion state,
- `sdlc context inventory`, `sdlc context place --fact "..."`, `sdlc context freshness --task "..."`, `sdlc context contradictions --task "..."`, and `sdlc change graph --task "..."` for context placement, confidence, contradiction checks, and impact graph-lite,
- `sdlc touched packet` for changed technical surfaces,
- `sdlc impact packet --task "..."` for user/system impact,
- `sdlc verify packet --task "..."` for developer/agent verification,
- `sdlc smoke packet --task "..."` for developer/agent manual smoke evidence before completion, especially UI/manual-QA/no-tests work,
- `sdlc qa script --task "..."` for Markdown manual QA test scripts that can be pasted into YouTrack,
- `sdlc qa review --packet <path>` for YouTrack/human-tester readiness checks,
- `sdlc final gate --task "..."` and `sdlc git packet` for human-approved final action decisions.
- `sdlc workspace status`, `sdlc workspace map --task "..."`, `sdlc workspace packet --task "..."`, and `sdlc multi ledger --task "..."` when multiple repositories may be open or affected.
- `sdlc workmode detect --task "..."` to surface product/repo/task modifiers such as legacy, modern web, API/service, manual-QA-heavy, no-tests, integration-heavy, or multi-repo.
- `sdlc test plan --task "..."` when automated coverage is missing or should grow from the active task.
- `sdlc test suggest --task "..."` when the repo has weak/no tests or a dependency/package upgrade.
- `sdlc data packet --task "..."` and `sdlc integration packet --task "..."` when data/storage or third-party/cross-system behavior is affected.
- `sdlc gates --task "..."` for the open-gate dashboard.
- `sdlc handoff draft --task "..."` for MR/release/QA/deployment text drafts without creating or triggering anything.
- `sdlc render plan --task "..."` or `sdlc render evidence --task "..."` for visible UI work when tooling is available or caps must be explicit.
- `sdlc security permissions --task "..."` and `sdlc security audit --task "..."` when tool authority, external calls, dependency installs, generated skills/prompts/agents, secrets, or release surfaces are involved.
- `sdlc process health` for process-level repeated caps, open packets, and improvement signals.
- `sdlc task finish --task "..."` for the final human approval decision screen.

The SDLC must not automatically merge, deploy, release, move code between branches/environments, create merge requests/pull requests, or trigger deployment pipelines. Commit and push require explicit human approval.

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

Trigger: visible UI, layout, interaction, copy, or rendered workflow change.

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
