export function printHelp() {
  console.log(`SDLC helper CLI

Usage:
  sdlc start --task "..." [--repo <path>]
  sdlc next --task "..." [--repo <path>]
  sdlc prove --task "..." [--repo <path>]
  sdlc qa-ready --task "..." [--repo <path>]
  sdlc finish-ready --task "..." [--repo <path>]
  sdlc console help
  sdlc console start|status|next|verify|qa|finish --task "..." [--repo <path>]
  sdlc welcome [--repo <path>]
  sdlc setup wizard [--repo <path>]
  sdlc demo [--task "..."] [--repo <path>]
  sdlc profile show [--repo <path>]
  sdlc help prompts
  sdlc help workflow
  sdlc help onboarding
  sdlc help quickstart
  sdlc help operator
  sdlc help expert
  sdlc help artifacts
  sdlc help sensitive-work
  sdlc help local-first
  sdlc help handoff-packets
  sdlc help route <route>
  sdlc help phase <phase>
  sdlc profile init [--repo <path>] [--shared-context-root <path>]
  sdlc profile audit [--repo <path>]
  sdlc profile suggest --task "..." [--repo <path>]
  sdlc profile doctor [--repo <path>]
  sdlc config normalize [--repo <path>] [--out <path>]
  sdlc config validate [--repo <path>]
  sdlc config explain [--repo <path>]
  sdlc config diff [--repo <path>]
  sdlc config export --sanitized [--repo <path>] [--out <path>]
  sdlc config import --file <path> [--repo <path>] [--out <path>]
  sdlc intake packet --task "..." [--case <id>] [--repo <path>] [--out <path>]
  sdlc intake check --task "..." [--repo <path>]
  sdlc context restore [--repo <path>] [--include-related-repos]
  sdlc context pack --task "..." [--repo <path>] [--out <path>]
  sdlc context audit [--repo <path>] [--out <path>]
  sdlc context freshness --task "..." [--repo <path>] [--days <number>] [--out <path>]
  sdlc context conflict-check --task "..." [--repo <path>] [--out <path>]
  sdlc context contradictions --task "..." [--repo <path>] [--out <path>]
  sdlc context inventory [--repo <path>] [--out <path>]
  sdlc context bucket-check --task "..." [--repo <path>] [--out <path>]
  sdlc context bucket-confidence --path <path> --task "..." [--repo <path>]
  sdlc context resolve --path <path> [--task "..."] [--repo <path>]
  sdlc context final-check --task "..." [--repo <path>] [--out <path>]
  sdlc context place --fact "..." [--repo <path>]
  sdlc context update-plan --task "..." [--repo <path>] [--out <path>]
  sdlc context budget [--task "..."] [--phase intake|planning|implementation|verification|qa|finish|learning] [--repo <path>]
  sdlc context assemble --phase <phase> [--task "..."] [--repo <path>] [--out <path>]
  sdlc context compact [--task "..."] [--repo <path>] [--out <path>]
  sdlc context ledger [--task "..."] [--repo <path>]
  sdlc context decision --task "..." --phase <phase> [--repo <path>] [--out <path>]
  sdlc context why --path <path> --task "..." [--phase <phase>] [--repo <path>]
  sdlc context prune --task "..." --phase <phase> [--repo <path>] [--out <path>]
  sdlc change graph --task "..." [--repo <path>] [--out <path>]
  sdlc search classify --pattern "..." [--scope <path>] [--repo <path>] [--out <path>]
  sdlc search classify-results --pattern "..." [--scope <path>] [--repo <path>] [--out <path>]
  sdlc search retire-check --old <pattern> --new <pattern> [--scope <path>] [--repo <path>] [--out <path>]
  sdlc recipe show <route>
  sdlc recipe match --task "..." [--repo <path>]
  sdlc recipe list [--repo <path>]
  sdlc recipe review [--since YYYY-MM-DD] [--repo <path>]
  sdlc recipe retire --recipe <id> --reason "..." [--repo <path>] [--out <path>]
  sdlc recipe compile --task "..." [--repo <path>] [--out <path>]
  sdlc recipe explain --recipe <id> [--repo <path>]
  sdlc recipe maturity [--repo <path>]
  sdlc recipe promote --recipe <id> --level emerging|validated|standard|deprecated|superseded [--repo <path>] [--out <path>]
  sdlc task id --task "..." [--repo <path>]
  sdlc task current [--repo <path>]
  sdlc task preflight --task "..." [--repo <path>] [--lock] [--out <path>]
  sdlc task fast-pass --task "..." [--repo <path>]
  sdlc task start --task "..." [--repo <path>] [--out <path>]
  sdlc task open --task "..." [--repo <path>]
  sdlc task bundle --task "..." [--repo <path>]
  sdlc task status [--task "..."] [--repo <path>]
  sdlc task journal-check [--task "..."] [--repo <path>] [--json]
  sdlc task doctor --task "..." [--repo <path>]
  sdlc task review --task "..." [--repo <path>]
  sdlc task checkpoint --task "..." [--repo <path>]
  sdlc task ledger --task "..." [--repo <path>] [--out <path>] [--refresh]
  sdlc task verify --task "..." [--repo <path>]
  sdlc task qa --task "..." [--repo <path>]
  sdlc task finish --task "..." [--repo <path>] [--out <path>]
  sdlc task complete --task "..." [--repo <path>] [--out <path>]
  sdlc state init --task "..." [--repo <path>] [--out-root <path>]
  sdlc state current [--repo <path>]
  sdlc state advance --to scoped|implementing|verifying|qa-ready|finish-ready|committed [--reason "..."]
  sdlc state blockers [--repo <path>]
  sdlc state explain [--repo <path>]
  sdlc route start <route> [--task "..."] [--repo <path>] [--out <path>]
  sdlc route retire --old <pattern> --new <pattern> --task "..." [--scope <path>] [--repo <path>] [--out <path>]
  sdlc route proof --old <pattern> --new <pattern> --task "..." [--scope <path>] [--repo <path>] [--out <path>]
  sdlc packet status [--repo <path>]
  sdlc done check --route <route> [--repo <path>] [--packet <path>]
  sdlc run plan --task "..." [--repo <path>] [--out <path>]
  sdlc run status --task "..." [--repo <path>]
  sdlc run next --task "..." [--repo <path>]
  sdlc run resume --task "..." [--repo <path>]
  sdlc run dashboard --task "..." [--repo <path>] [--out <path>]
  sdlc run start --task "..." [--repo <path>]
  sdlc run finish --route <route> [--repo <path>] [--packet <path>]
  sdlc guide start --task "..." [--repo <path>]
  sdlc guide status [--task "..."] [--repo <path>]
  sdlc guide finish --task "..." [--repo <path>]
  sdlc workspace status [--repo <path>] [--workspace <path>]
  sdlc workspace init [--repo <path>] [--shared-context-root <path>]
  sdlc workspace doctor [--repo <path>]
  sdlc workspace packet --task "..." [--repo <path>] [--out <path>]
  sdlc workspace map --task "..." [--repo <path>] [--out <path>]
  sdlc workspace ledger --task "..." [--repo <path>] [--out <path>] [--refresh]
  sdlc workspace graph [--repo <path>] [--out <path>]
  sdlc workspace impact --task "..." [--repo <path>] [--out <path>]
  sdlc workspace dependencies --task "..." [--repo <path>]
  sdlc workmode detect [--task "..."] [--repo <path>]
  sdlc surface list
  sdlc surface detect [--task "..."] [--repo <path>] [--files "a,b"]
  sdlc unit map [--repo <path>] [--out <path>]
  sdlc unit detect [--task "..."] [--repo <path>] [--files "a,b"]
  sdlc unit doctor [--repo <path>] [--out <path>]
  sdlc unit profile --unit <name> [--repo <path>]
  sdlc unit list [--repo <path>]
  sdlc unit resolve --path <path> [--repo <path>]
  sdlc unit context --unit <name> [--repo <path>]
  sdlc touched packet [--repo <path>] [--out <path>]
  sdlc touched update --surface <kind> [--evidence "..."] [--repo-name <name>] [--repo <path>]
  sdlc impact packet --task "..." [--repo <path>] [--out <path>]
  sdlc interaction packet --task "..." [--repo <path>] [--out <path>]
  sdlc review packet --task "..." [--repo <path>] [--out <path>]
  sdlc review complete --packet <path> --verdict "..." [--findings "..."] [--checks "..."] [--caps "..."]
  sdlc release packet [--task "..."] [--repo <path>] [--out <path>]
  sdlc release complete --packet <path> --action "none|commit|push|handoff" [--verdict "..."] [--checks "..."] [--caps "..."]
  sdlc qa script --task "..." [--repo <path>] [--out <path>]
  sdlc qa handoff --task "..." [--repo <path>] [--out <path>]
  sdlc qa scenarios init|list|match [--task "..."] [--repo <path>]
  sdlc qa outline --task "..." [--repo <path>] [--out <path>]
  sdlc qa compare --packet <path> [--repo <path>]
  sdlc qa lint --packet <path> [--repo <path>]
  sdlc qa coverage --task "..." [--repo <path>]
  sdlc qa ui|api|data|integration|scenario|multi|interactive|cli|job|docs --task "..." [--repo <path>] [--scenario <id>] [--out <path>]
  sdlc qa complete --packet <path> --status "draft|ready|blocked" [--caps "..."]
  sdlc qa build --task "..." [--repo <path>] [--out <path>]
  sdlc qa validate --packet <path> [--repo <path>]
  sdlc qa review --packet <path> [--repo <path>]
  sdlc smoke packet --task "..." [--repo <path>] [--out <path>]
  sdlc smoke complete --packet <path> --status "pass|fail|blocked" [--steps "..."] [--caps "..."]
  sdlc multi status [--repo <path>]
  sdlc multi packet --task "..." [--repo <path>] [--out <path>]
  sdlc multi ledger --task "..." [--repo <path>] [--out <path>]
  sdlc multi qa --task "..." [--repo <path>] [--out <path>]
  sdlc contract packet --task "..." [--repo <path>] [--out <path>]
  sdlc contract task --task "..." [--acceptance "..."] [--ticket <id>] [--repo <path>] [--out <path>]
  sdlc contract check --packet <path> [--repo <path>]
  sdlc data packet --task "..." [--repo <path>] [--out <path>]
  sdlc data boundary --task "..." [--repo <path>]
  sdlc data query-plan --task "..." [--repo <path>] [--out <path>]
  sdlc data evidence --task "..." [--repo <path>] [--out <path>]
  sdlc ticket evidence --task "..." [--repo <path>] [--out <path>]
  sdlc ticket drift --task "..." [--repo <path>]
  sdlc ticket update-preview --task "..." [--repo <path>] [--out <path>]
  sdlc integration packet --task "..." [--repo <path>] [--out <path>]
  sdlc validate ladder --task "..." [--repo <path>] [--out <path>]
  sdlc fixture plan --task "..." [--repo <path>] [--out <path>]
  sdlc fixture battle-soccer plan [--repo <path>]
  sdlc fixture battle-soccer run --scenario <id> [--repo <path>]
  sdlc test plan --task "..." [--repo <path>] [--out <path>]
  sdlc test suggest --task "..." [--repo <path>] [--out <path>]
  sdlc test bootstrap-plan --unit <name> --framework dotnet|node|deno|generic [--repo <path>] [--out <path>]
  sdlc test regression-plan --task "..." [--repo <path>] [--out <path>]
  sdlc test foothold --task "..." [--repo <path>]
  sdlc bug evidence --task "..." [--repo <path>] [--out <path>]
  sdlc bug live-evidence --task "..." [--repo <path>] [--out <path>]
  sdlc bug evidence-check --packet <path> [--repo <path>]
  sdlc bug reproduce|diagnose|fix-plan|verify|qa --task "..." [--repo <path>] [--out <path>]
  sdlc dotnet efcore diagnose --task "..." [--repo <path>] [--out <path>]
  sdlc pattern analog --task "..." [--hint "..."] [--repo <path>] [--out <path>]
  sdlc fix scope --task "..." [--repo <path>] [--out <path>]
  sdlc command classify --command "..." --status <code> [--stderr "..."] [--repo <path>]
  sdlc command plan --task "..." [--phase <phase>] [--repo <path>] [--json] [--out <path>]
  sdlc command recommend --task "..." [--phase <phase>] [--repo <path>] [--json]
  sdlc command capture --task "..." --command "..." --status pass|fail|cap|warn [--summary "..."] [--repo <path>]
  sdlc command interpret --task "..." --command "..." --status pass|fail|cap|warn [--summary "..."] [--repo <path>]
  sdlc command next --task "..." [--repo <path>]
  sdlc command explain --command "..." [--task "..."] [--repo <path>]
  sdlc tools detect [--repo <path>]
  sdlc tools inventory [--repo <path>] [--json] [--out <path>]
  sdlc tools status --task "..." [--repo <path>]
  sdlc tools gaps --task "..." [--repo <path>]
  sdlc tools recommend --task "..." [--repo <path>]
  sdlc tools fallback --task "..." [--repo <path>]
  sdlc tools experiment add --name <name> --command "..." [--repo <path>]
  sdlc tools experiment review [--repo <path>]
  sdlc capabilities negotiate --task "..." [--repo <path>] [--out <path>]
  sdlc local-first plan --task "..." [--repo <path>] [--out <path>]
  sdlc operator start|inspect|next --task "..." [--repo <path>] [--json]
  sdlc operator implement-ready|verify-ready|qa-ready|finish-ready --task "..." [--repo <path>] [--json]
  sdlc prompt clean|structure|audit|score|sanitize --text "..." [--repo <path>]
  sdlc prompt compile --phase <phase>|--role <role> --task "..." [--repo <path>]
  sdlc agents plan --task "..." [--repo <path>] [--out <path>]
  sdlc agents packet --role <role> --task "..." [--repo <path>] [--out <path>]
  sdlc agents status --task "..." [--repo <path>]
  sdlc agents lint --packet <path> [--repo <path>]
  sdlc review local --task "..." [--repo <path>] [--out <path>]
  sdlc response lint --file <path> [--repo <path>]
  sdlc qa human-lint --packet <path> [--repo <path>]
  sdlc acceptance coverage --contract <path> [--repo <path>] [--out <path>]
  sdlc human review-packet --task "..." [--repo <path>] [--out <path>]
  sdlc override add --task "..." --gate <id> --reason "..." [--repo <path>]
  sdlc capability snapshot [--repo <path>] [--out <path>]
  sdlc capability doctor [--repo <path>]
  sdlc capability fallback --capability <name> [--task "..."] [--repo <path>]
  sdlc checks plan [--repo <path>] [--out <path>]
  sdlc checks run [--profile standard] [--repo <path>]
  sdlc checks doctor [--repo <path>]
  sdlc index build [--repo <path>] [--out <path>]
  sdlc index query --kind docs|tests|api|config [--unit <name>] [--repo <path>]
  sdlc run-check --name <name> -- <command...>
  sdlc automation budget --route <route> [--repo <path>]
  sdlc event prompt-submit|post-edit|pre-stop|approval-request [--task "..."] [--repo <path>]
  sdlc hooks plan --runtime claude|codex|auggie|augment|generic [--repo <path>] [--out <path>]
  sdlc hooks audit --runtime claude|codex|auggie|augment|generic [--repo <path>]
  sdlc onboarding pilot [--repo <path>]
  sdlc feedback quick --task "..." [--friction "..."] [--note "..."] [--repo <path>]
  sdlc feedback friction --task "..." --type confusion|delay|redundancy|cap|other --note "..." [--repo <path>]
  sdlc feedback synthesize|action-plan [--repo <path>] [--json]
  sdlc feedback capture --task "..." --source developer|self|fixture [--repo <path>]
  sdlc feedback review [--since YYYY-MM-DD] [--repo <path>] [--out <path>]
  sdlc feedback summary [--since YYYY-MM-DD] [--repo <path>] [--out <path>]
  sdlc activity on|off|status [--repo <path>]
  sdlc activity config --mode off|light|full|debug [--repo <path>]
  sdlc activity start --task "..." [--runtime codex|augment|auggie|manual] [--repo <path>]
  sdlc activity event --event <name> [--phase <phase>] [--surface <surface>] [--target <target>] [--repo <path>]
  sdlc activity command --command "..." [--phase verification] [--status pass|fail|cap|warn] [--repo <path>]
  sdlc activity cap --reason "..." [--phase <phase>] [--surface <surface>] [--repo <path>]
  sdlc activity summary|redundancy|learn [--task "..."] [--repo <path>]
  sdlc activity export --format json|otel-lite [--task "..."] [--repo <path>] [--out <path>]
  sdlc activity quickstart [--task "..."] [--repo <path>]
  sdlc activity wrap [--task "..."] [--phase verification] -- <command...>
  sdlc trace start --task "..." [--repo <path>]
  sdlc trace event --type <type> --summary "..." [--repo <path>]
  sdlc trace attach --type <type> --summary "..." [--repo <path>]
  sdlc trace finish --task "..." [--repo <path>]
  sdlc trace export --trace <path> --format json|otel-lite [--repo <path>] [--out <path>]
  sdlc scorecard task --trace <path> [--repo <path>]
  sdlc scorecard summary [--since YYYY-MM-DD] [--repo <path>]
  sdlc scorecard trends [--since YYYY-MM-DD] [--repo <path>]
  sdlc artifact budget --route <route> [--repo <path>]
  sdlc artifact spa-plan --task "..." [--package <package.json>] [--repo <path>] [--out <path>]
  sdlc evidence init --route <route> [--repo <path>] [--out <path>]
  sdlc evidence from-command --task "..." --command "..." --status pass|fail|cap|warn [--summary "..."] [--repo <path>]
  sdlc evidence ledger|gaps|confidence --task "..." [--repo <path>] [--json]
  sdlc evidence provenance --task "..." [--repo <path>] [--out <path>]
  sdlc evidence sanitize-check --file <path> [--repo <path>]
  sdlc evidence required --task "..." [--repo <path>]
  sdlc evidence status --task "..." [--repo <path>]
  sdlc evidence add --kind <kind> --summary "..." [--repo <path>]
  sdlc evidence plan --task "..." [--repo <path>] [--out <path>]
  sdlc evidence matrix --task "..." [--contract <path>] [--repo <path>] [--out <path>]
  sdlc evidence gap --task "..." [--contract <path>] [--repo <path>]
  sdlc verify packet --task "..." [--repo <path>] [--out <path>]
  sdlc verify complete --packet <path> --checks "..." [--caps "..."]
  sdlc verify ladder --task "..." [--repo <path>]
  sdlc verify run --task "..." [--level targeted|broad|surface|qa] [--command "..."] [--repo <path>]
  sdlc verify [--repo <path>] [--commands test,build]
  sdlc final gate [--task "..."] [--repo <path>]
  sdlc finish packet --task "..." [--intent normal|keep-change|handoff-only] [--repo <path>] [--out <path>]
  sdlc git packet [--repo <path>] [--out <path>]
  sdlc git guard --action commit|push [--repo <path>]
  sdlc action preview --action commit|push|tool|network|dependency|learning-promotion [--repo <path>] [--command "..."]
  sdlc complete check --task "..." [--repo <path>]
  sdlc complete explain --task "..." [--repo <path>]
  sdlc context project --task "..." [--phase <phase>] [--repo <path>] [--check] [--json]
  sdlc response draft --task "..." [--repo <path>] [--json]
  sdlc handoff compile --task "..." [--audience future-agent|human|qa] [--repo <path>]
  sdlc setup inspect|recommend|apply-local [--repo <path>] [--apply] [--json]
  sdlc adapter profile|prompt|limits|doctor --runtime generic|augment|auggie|codex [--task "..."] [--repo <path>] [--json]
  sdlc event validate|replay [--event <name>] [--repo <path>] [--json]
  sdlc hooks contract --runtime generic|augment|auggie|codex [--repo <path>] [--json]
  sdlc eval local-first-suite [--repo <path>]
  sdlc complete waive --gate <id> --reason "..." [--owner "..."] [--repo <path>]
  sdlc artifact validate [--repo <path>] [--task-id <id>]
  sdlc artifact summarize [--repo <path>] [--out <path>]
  sdlc artifact cleanup-plan [--repo <path>] [--run-dir <path>] [--out <path>]
  sdlc artifact lifecycle [--repo <path>] [--root <path>] [--out <path>] [--json]
  sdlc artifact scratch-policy [--repo <path>] [--json]
  sdlc artifact scratch-audit [--repo <path>] [--json]
  sdlc artifact scratch-cleanup [--repo <path>] [--max-age-days 7] [--apply] [--json]
  sdlc artifact migrate [--repo <path>]
  sdlc dashboard [--repo <path>] [--out <path>]
  sdlc adapter generate --runtime augment|auggie|codex|claude|generic [--repo <path>] [--out <path>]
  sdlc eval run [--repo <path>] [--out <path>]
  sdlc eval suite [--repo <path>] [--out <path>]
  sdlc eval add-case --name <name> --task "..." [--route <route>] [--repo <path>]
  sdlc eval case --name <name> --task "..." [--expect <route>] [--repo <path>]
  sdlc eval compare --before <path> --after <path> [--repo <path>]
  sdlc eval report [--repo <path>] [--out <path>]
  sdlc upgrade plan [--repo <path>] [--out <path>]
  sdlc upgrade apply [--repo <path>] [--write]
  sdlc upgrade explain [--repo <path>]
  sdlc scope expect --files "a,b" [--repo <path>]
  sdlc scope check --task "..." [--repo <path>]
  sdlc gates [--task "..."] [--repo <path>]
  sdlc handoff draft [--task "..."] [--repo <path>] [--out <path>]
  sdlc handoff split [--task "..."] [--repo <path>] [--out-dir <path>]
  sdlc calibrate add --route <route> [--repo <path>] [--out <path>]
  sdlc calibrate summary [--repo <path>] [--in <path>] [--out <path>]
  sdlc calibrate inspect [--repo <path>] [--in <path>]
  sdlc calibrate propose [--repo <path>] [--in <path>] [--out <path>]
  sdlc calibrate flows [--repo <path>] [--in <path>] [--out <path>]
  sdlc calibrate promote --candidate "..." [--repo <path>] [--out <path>]
  sdlc learn capture --summary "..." [--case <id>] [--repo <path>] [--out <path>]
  sdlc learn quick --summary "..." [--case <id>] [--source work|personal|fixture] [--repo <path>]
  sdlc learn sanitize --packet <path> [--repo <path>] [--out <path>]
  sdlc learn sync-check [--repo <path>]
  sdlc learn review-cycle [--since YYYY-MM-DD] [--repo <path>] [--out <path>]
  sdlc learn archive --packet <path> --reason "..." [--repo <path>]
  sdlc learn route --packet <path> [--repo <path>]
  sdlc learn summary [--repo <path>] [--out <path>]
  sdlc learn review --packet <path> [--repo <path>]
  sdlc learn promote-check --packet <path> [--repo <path>]
  sdlc learn candidates [--since YYYY-MM-DD] [--repo <path>]
  sdlc learn split --packet <path> [--repo <path>] [--out <path>]
  sdlc learn from-run --task "..." [--repo <path>] [--out <path>]
  sdlc learn suggest --task "..." [--repo <path>]
  sdlc learn backlog [--repo <path>]
  sdlc learn workbench [--repo <path>] [--out <path>]
  sdlc learn dedupe [--repo <path>] [--out <path>]
  sdlc learn propose-change --candidate <id-or-keyword> [--repo <path>] [--out <path>]
  sdlc learn candidate-validate --file <json|jsonl> [--repo <path>]
  sdlc learn candidate-add --claim "..." --source <path> --owner <artifact> [--repo <path>] [--out <path>]
  sdlc learn candidate-export [--file <json|jsonl>] [--repo <path>] [--out <path>] [--format json|jsonl]
  sdlc learn promote --packet <path> --target "process|template|route|context" [--repo <path>] [--out <path>]
  sdlc readiness [--repo <path>]
  sdlc health [--repo <path>]
  sdlc process health [--repo <path>] [--out <path>]
  sdlc process dashboard [--repo <path>] [--out <path>]
  sdlc process friction [--repo <path>] [--out <path>]
  sdlc process review --task "..." [--repo <path>] [--out <path>]
  sdlc policy check --task "..." [--action commit|push|ticket-update|db-query|install|network] [--repo <path>]
  sdlc policy list [--repo <path>]
  sdlc policy validate-config [--repo <path>]
  sdlc policy simulate --action commit|push|ticket-update|db-query|merge|deploy|network|install [--task "..."] [--repo <path>]
  sdlc policy explain --gate <id> [--repo <path>]
  sdlc setup doctor [--repo <path>] [--fix-plan]
  sdlc setup bootstrap [--repo <path>] [--shared-context-root <path>]
  sdlc doctor full [--repo <path>]
  sdlc install check [--repo <path>]
  sdlc render plan --task "..." [--repo <path>] [--out <path>]
  sdlc render evidence --task "..." [--repo <path>] [--out <path>]
  sdlc render smoke --url <url> [--repo <path>] [--cdp <url>] [--screenshot-dir <path>]
  sdlc release note --task "..." [--repo <path>] [--out <path>]
  sdlc security permissions [--task "..."] [--repo <path>] [--out <path>]
  sdlc security audit [--task "..."] [--repo <path>] [--out <path>]
  sdlc safety preflight --task "..." [--repo <path>] [--out <path>]
  sdlc safety finish --task "..." [--repo <path>] [--out <path>]
  sdlc risk agentic --task "..." [--repo <path>] [--out <path>]
  sdlc risk agentic-preflight --task "..." [--repo <path>] [--out <path>]
  sdlc risk instruction-audit [--repo <path>] [--out <path>]
  sdlc scenario list
  sdlc scenario show <name>
  sdlc scenario validate <name> --task "..." [--repo <path>]
  sdlc scenario test [--repo <path>]
  sdlc handoff [--repo <path>]

This CLI automates mechanical SDLC evidence and context tasks. It does not replace
agent judgment, source review, human approvals, or the .agents skill guidance.`);
}

export function helpQuickstart() {
  console.log(`# SDLC Quickstart

Use chat first and let the coding agent run the CLI.

\`\`\`text
Use SDLC for this task: <task>. Start local-first, keep context bounded, implement only the scoped change, verify with local evidence, prepare QA Markdown if needed, and stop before commit or push.
\`\`\`

Small local path:

\`\`\`bash
sdlc start --task "<task>"
sdlc operator dashboard --task "<task>"
sdlc operator next --task "<task>"
sdlc command capture --task "<task>" --command "<check>" --status pass --summary "<evidence>"
sdlc finish-ready --task "<task>"
\`\`\`

Boundaries:

- Commit and push require explicit human approval.
- Merge, deploy, release, ticket writes, and database changes are not automated.
- Temporary scripts belong under \`.ai-local/sdlc-scratch/scripts/\`.`);
}

export function helpOperator() {
  console.log(`# SDLC Operator Help

The operator surface is the paved path for normal work.

\`\`\`bash
sdlc operator start --task "<task>"
sdlc operator dashboard --task "<task>"
sdlc operator next --task "<task>"
sdlc operator implement-ready --task "<task>"
sdlc operator verify-ready --task "<task>"
sdlc operator qa-ready --task "<task>"
sdlc operator finish-ready --task "<task>"
\`\`\`

Use \`dashboard\` when asking "where are we?" It summarizes local facts, evidence, gaps, scratch-script warnings, QA/finish readiness, and one next action.

The operator does not commit, push, merge, deploy, release, post tickets, or query sensitive data.`);
}

export function helpExpert() {
  console.log(`# SDLC Expert Help

Use expert commands when the operator path is too coarse.

Common expert groups:

- Context: \`context assemble\`, \`context project\`, \`context prune\`, \`context final-check\`
- Evidence: \`evidence matrix\`, \`evidence ledger\`, \`verify ladder\`, \`command capture\`
- Scope: \`scope expect\`, \`scope check\`, \`touched packet\`, \`impact packet\`
- Multi-repo: \`workspace status\`, \`workspace ledger\`, \`multi qa\`
- Learning: \`learn workbench\`, \`feedback synthesize\`, \`process review\`
- Safety: \`policy check\`, \`safety finish\`, \`artifact scratch-audit\`

Run \`sdlc --help\` for the full command list.`);
}

export function helpArtifacts() {
  console.log(`# SDLC Artifact Help

Local run artifacts should live under ignored \`.ai-local/\` paths.

Key locations:

- Run evidence: \`.ai-local/sdlc-runs/\`
- Scratch scripts: \`.ai-local/sdlc-scratch/scripts/\`
- Local profile: \`.ai-local/sdlc-profile.md\`

Useful commands:

\`\`\`bash
sdlc artifact cleanup-plan --repo <path>
sdlc artifact lifecycle --repo <path>
sdlc artifact scratch-policy --repo <path>
sdlc artifact scratch-audit --repo <path>
sdlc artifact scratch-cleanup --repo <path>
sdlc artifact scratch-cleanup --repo <path> --apply
\`\`\`

Cleanup is dry-run unless \`--apply\` is passed and must stay inside controlled local artifact folders.`);
}

export function helpSensitiveWork() {
  console.log(`# SDLC Sensitive Work Help

Ticket systems, read-only databases, private logs, customer data, private URLs, and client names are sensitive evidence surfaces.

Rules:

- Use optional MCPs only when available, allowed, and useful.
- Prefer metadata, aggregates, existence checks, and redacted summaries.
- Do not write tickets, mutate databases, run migrations, deploy, or release without explicit approval.
- Do not promote raw ticket text, database rows, private URLs, secrets, logs, or client/customer names into shared learnings.

Useful commands:

\`\`\`bash
sdlc policy check --action db-query --task "<task>"
sdlc data query-plan --task "<task>"
sdlc ticket evidence --task "<task>"
sdlc learn sanitize --packet <path>
\`\`\``);
}

export function helpPrompts() {
  console.log(`# SDLC Agent Prompts

Start a task:

\`\`\`text
Use SDLC for this task: <task>. Determine the scope, gather context, implement, verify, generate QA Markdown if needed, and stop at the finish decision before any commit or push.
\`\`\`

Review current completion:

\`\`\`text
Use SDLC and review the current completion state of this task: <task>. Tell me what changed, what evidence exists, what gates are open, whether QA is ready, and the recommended next action.
\`\`\`

Generate QA script:

\`\`\`text
Use SDLC and generate the human QA Markdown script for this task: <task>. The QA tester will not use AI and the output should be suitable for YouTrack.
\`\`\`

Finish decision:

\`\`\`text
Use SDLC and prepare the finish decision for this task: <task>. Do not commit, push, merge, deploy, create an MR/PR, trigger a pipeline, or move files between environments.
\`\`\``);
}

export function helpWorkflow() {
  console.log(`# SDLC Workflow

1. Open: \`sdlc task open --task "..."\`
2. Implement with the agent using repo context and route judgment.
3. Evidence: \`sdlc task bundle --task "..."\`, then complete verify/smoke/QA packets as needed.
4. Checkpoint: \`sdlc task review --task "..."\`
5. Finish: \`sdlc task finish --task "..."\`
6. Git decision: \`sdlc git packet\`, then human chooses no action / commit only / commit and push.

The SDLC never merges, deploys, releases, creates MR/PRs, triggers pipelines, moves branches, or moves files between environments by default.`);
}

export function helpOnboarding() {
  console.log(`# SDLC First-Use Onboarding

Use the chat prompt first. The helper CLI exists so the agent can make setup, evidence, QA, and finish checks concrete.

## What To Type

\`\`\`text
Use SDLC to set up this repository for AI-assisted work. Explain what files you propose to create or update before changing them.
\`\`\`

\`\`\`text
Use SDLC for this task: <task>. Determine the scope, implement, verify, generate QA Markdown if needed, and stop at the finish decision before commit or push.
\`\`\`

\`\`\`text
Use SDLC to review the current completion state of this task: <task>. Tell me what evidence exists, what is missing, whether QA is ready, and what you recommend next.
\`\`\`

## First Pilot

1. Run \`sdlc onboarding pilot\`.
2. Ask the agent to run setup on a small repo or workspace.
3. Run one tiny safe task.
4. Ask for completion review.
5. Capture feedback with \`sdlc feedback quick --task "..."\`.

## Boundaries

- Commit and push require explicit human approval.
- Merge, deploy, release, MR/PR creation, pipeline triggers, and manual file movement stay outside default automation.
- Feedback is local/sanitized by default and is for improving the SDLC, not measuring individual developers.`);
}

export function helpLocalFirst() {
  console.log(`# SDLC Local-First Help

Use local-first commands to gather deterministic facts before spending model context on reasoning.

\`\`\`bash
sdlc tools inventory --repo <path>
sdlc tools gaps --task "<task>" --repo <path>
sdlc tools recommend --task "<task>" --repo <path>
sdlc capabilities negotiate --task "<task>" --repo <path>
sdlc prompt audit --task "<task>" --repo <path>
sdlc review local --task "<task>" --repo <path>
\`\`\`

Behavior contract:

- local facts are evidence,
- recommendations are suggestions,
- model output remains judgment until verified,
- generated artifacts default to ignored .ai-local paths,
- commit/push/merge/deploy/release stay human-controlled.

Reference: scripts/sdlc/references/local-first-command-contract.md`);
}

export function helpHandoffPackets() {
  console.log(`# SDLC Handoff Packet Help

Use handoff packets when they reduce ambiguity, improve verification, support restart, or make human review clearer.

\`\`\`bash
sdlc agents plan --task "<task>"
sdlc agents packet --role verification-worker --task "<task>"
sdlc agents lint --packet <path>
sdlc agents status --task "<task>"
\`\`\`

Recommendation levels:

- skip: packet would add overhead,
- optional: useful if work grows,
- recommended: likely improves evidence or clarity,
- strongly-recommended: high-risk, multi-repo, sensitive, release, no-test, or complex handoff work.

Packets are bounded work orders, not autonomous subagents.

Reference: scripts/sdlc/references/agent-packet-contract.md`);
}
