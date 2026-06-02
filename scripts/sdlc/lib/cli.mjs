import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendControlJsonLine, dedupe, escapeCell, fail, formatInlineList, formatInlineStatus, formatList, formatOptionList, humanize, indentList, optionFiles, parseOptions, printGateRows, printObject, printTable, readJsonIfExists, safeWriteTextFile, slug, splitList, stamp, toCamel, writeOrPrint } from './common.mjs';
import { getGitInfo, git } from './git.mjs';
import { discoverCommands, loadProfile, normalizeKeys, profileAudit, profileDoctor, profileInit, profileShow, profileSuggest } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { appendPacketCompletion, completionTrackedPacketKinds, doneChecksForRoute, findLatestPacket, findPackets, firstMatch, latestPacketPath, packetHas, readPacket, resolvePacketPath, taskEvidenceSummary } from './packets.mjs';
import { runDashboard, runFinish, runNext, runPlan, runResume, runStart, runStartGates, runStartPacketCommand, runStatus } from './run.mjs';
import { appendControlEvent, classifyControlPathActivity, controlTraceRow, ensureControlRunDir, gitScopeRows, nextActionForStage, nextActionFromGates, readControlJsonLines, readCurrentState, readCurrentStateInfo, stateAdvance, stateBlockers, stateCurrent, stateExplain, stateInit, synthesizeState, writeGateRows } from './state.mjs';
import { matchRecipes, recipeCompile, recipeExplain, recipeList, recipeMatch, recipeRetire, recipeReview, recipeShow } from './recipes.mjs';
import { ensureEvidenceManifest, evidenceAdd, evidenceInit, evidencePlan, evidenceProvenance, evidenceRequired, evidenceRequirementsForTask, evidenceStatus, evidenceStatusRows, readEvidenceManifest } from './evidence.mjs';
import { detectCiSystems, detectDeploySystems, detectTestFrameworks, sharedContextDetails, sharedContextReachability } from './environment.mjs';
import { inferContracts, inferDirtySurfaces, inferLikelyRoute, inferRouteFromTask, securityTriggers } from './routes.mjs';
import { detectContextContradictions, evalAddCase, evalReport, evalRun, scenarioList, scenarioShow, scenarioTest, scenarioValidate } from './scenarios.mjs';
import { adapterGenerate, hooksPlan } from './adapters.mjs';
import { indexBuild, indexQuery } from './index.mjs';
import { configDiff, configExplain, configExport, configImport, configNormalize, configValidate } from './config.mjs';
import { contextAliases, contextAssemble, contextAudit, contextBucketCheck, contextBucketConfidence, contextBudget, contextCompact, contextConflictCheck, contextContradictions, contextDocCandidates, contextFinalCheck, contextFreshness, contextFreshnessRecommendations, contextFreshnessRow, contextGate, contextInventory, contextLedger, contextPack, contextPlace, contextPlacement, contextPlacementRecommendation, contextResolve, contextRestore, contextUpdatePlan, contextUpdateTargets, finalContextSignals, formatContextDocs, recommendedContextFile } from './context.mjs';
import { learnArchive, learnBacklog, learnCandidates, learnCapture, learnExport, learnFromRun, learnImport, learnPromote, learnPromoteCheck, learnQuick, learnReview, learnReviewCycle, learnRoute, learnSanitize, learnSplit, learnSuggest, learnSummary, learnSyncCheck } from './learning.mjs';
import { caseIdPolicy, expectedQaNeed, proposedCommitMessage, requiresCaseId, shouldSuggestTestPlan, taskBundle, taskCaseId, taskCurrent, taskDoctor, taskFastPass, taskFinish, taskId, taskLedger, taskLedgerRows, taskMetrics, taskOpen, taskPreflight, taskQa, taskReview, taskRunId, taskStart, taskStatus, taskType, taskVerify } from './task.mjs';
import { upgradeApply, upgradeExplain, upgradePlan } from './upgrade.mjs';
import { workspaceDoctor, workspaceGraph, workspaceImpact, workspaceInit, workspaceLedger, workspaceMap, workspacePacket, workspaceRepoRole, workspaceRepos, workspaceStatus } from './workspace.mjs';
import { multiLedger, multiPacket, multiQa, multiStatus } from './multi.mjs';
import { contractPacket } from './contract.mjs';
import { dataBoundary, dataEvidence, dataPacket, dataQueryPlan } from './data.mjs';
import { ticketDrift, ticketEvidence, ticketUpdatePreview } from './ticket.mjs';
import { integrationPacket } from './integration.mjs';
import { smokeComplete, smokePacket } from './smoke.mjs';
import { classifyRuntimeSurface, classifyTouchedSurface, needsManualQa } from './surface.mjs';
import { accessibilityPolicy, formatAccessibilityPolicy, formatSecurityOverlay, releaseComplete, releaseOrderNote, releasePacket, reviewComplete, reviewPacket } from './release.mjs';
import { renderEvidencePacket, renderedEvidencePlan, renderPlan, renderSmoke } from './render.mjs';
import { permissionPolicyPacket, riskAgentic, safetyFinish, safetyPreflight, toolAuditPacket } from './safety.mjs';
import { doctorFull, formatCommandList, formatCounts, groupCounts, health, installCheck, missingSetup, normalizeArray, processHealth, readinessChecks, readinessStatus, setupBootstrap, setupDoctor, setupFixPlan } from './health.mjs';
import { actionPreview, completeCheck, completeExplain, completeWaive, finalGate, finalGateOpenItems, finishPacket, gitGuard, gitPacket, suggestedFinalGateCommand } from './finish.mjs';
import { scopeCheck, scopeExpect } from './scope.mjs';
import { fixturePlan, testBootstrapPlan, testPlan, testRegressionPlan, testSuggest } from './testplan.mjs';
import { verifyComplete, verifyPacket } from './verify.mjs';
import { doneCheck, packetStatus, routeProof, routeRetire, routeStart } from './routepackets.mjs';
import { bugEvidenceCheck, bugEvidencePacket, bugLiveEvidence, bugNextCommand, bugWorkflowPacket, commandClassify, dotnetEfcoreDiagnose, fixScope, patternAnalog } from './diagnostics.mjs';
import { scorecardSummary, scorecardTask, scorecardTrends, traceAttach, traceEvent, traceExport, traceFinish, traceStart } from './telemetry.mjs';
import { automationBudget, feedbackCapture, feedbackQuick, feedbackReview, feedbackSummary, onboardingPilot, sdlcEvent } from './adoption.mjs';
import { calibrateAdd, calibrateFlows, calibrateInspect, calibratePromote, calibratePropose, calibrateSummary, learnedFlowCandidates, processProposals, readCalibrationRows } from './calibration.mjs';
import { dashboard as statusDashboard, gates as statusGates, handoff as statusHandoff, handoffDraft as statusHandoffDraft, readiness as statusReadiness } from './status.mjs';
import { intakeCheck, intakePacket } from './intake.mjs';
import { impactPacket, interactionPacket, touchedPacket, touchedUpdate } from './changeimpact.mjs';
import { confidenceBlock, detectWorkModes, fastPassAssessment, formatQualityFloorTable, formatValidationLadder, inferVerificationMaturity, preflightHumanJudgment, preflightInferred, preflightProved, qualityFloorRows, routeConfidence, safeDefaultsForPreflight, taskBreadthAssessment, validationLadder, validationLadderRows, verificationMaturity, verify, workmodeDetect } from './assessment.mjs';
import { changeGraph, changeGraphEdges, changeGraphImplications, classifySearchPath, formatSearchGroups, groupBy, searchClassify, searchPattern, searchRetireCheck } from './graphsearch.mjs';
import { createServices } from './services.mjs';
import { helpOnboarding, helpPrompts, helpWorkflow, printHelp } from './help.mjs';
import { policyCheck, policyDecision, policyExplain, policyList, policyRowsForAction, policyRowsForTask, policySimulate, policyValidateConfig } from './policy.mjs';
import { artifactBudget, artifactBudgetForRoute, artifactMigrate, artifactSummarize, artifactValidate, formatArtifactBudget } from './artifacts.mjs';
import { checksDoctor, checksPlan, checksRun, runCheck } from './checks.mjs';
import { impactAreas, primaryQaSteps, qaAreas, qaBuild, qaCompare, qaComplete, qaHandoff, qaModeCommand, qaOutline, qaOutlineForMode, qaReview, qaScenarios, qaScript, qaValidate } from './qa.mjs';
import { capabilityDoctor, capabilityFallback, capabilityRows, capabilitySnapshot, databaseApprovalGateText, databaseQueryShape, externalEvidenceProfile, externalEvidenceSensitive, ticketFallbackFields, toolCapabilityRows, toolFallbacksForTask, toolsDetect, toolsFallback, toolsStatus } from './tools.mjs';
import { affectedUnits, classifyTestingSurface, detectPackageManager, inferTestingSurfaces, matchesAny, qaModeForSurfaces, surfaceDetect, surfaceList, unitContext, unitDetect, unitDoctor, unitList, unitMap, unitProfile, unitRegistry, unitResolve } from './units.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const agentsRoot = resolve(dirname(scriptPath), '..', '..', '..');
const services = createServices({ agentsRoot });

export async function main(argv) {
  void services;
  const [area, action, ...rest] = argv;
  const areaOptions = parseOptions(argv.slice(1));

  if (!area || area === '-h' || area === '--help') {
    printHelp();
    return;
  }

  const options = parseOptions(rest);
  const repo = resolve(options.repo || process.cwd());

  if (area === 'run-check') return runCheck(resolve(areaOptions.repo || process.cwd()), parseOptions(argv.slice(1)), argv.slice(1), checkDependencies());
  if (area === 'help' && (action === 'prompts' || action === 'prompt')) return helpPrompts();
  if (area === 'help' && action === 'workflow') return helpWorkflow();
  if (area === 'help' && (action === 'onboarding' || action === 'start')) return helpOnboarding();
  if (area === 'profile' && action === 'show') return profileShow(repo);
  if (area === 'profile' && action === 'init') return profileInit(repo, options);
  if (area === 'profile' && action === 'audit') return profileAudit(repo, options);
  if (area === 'profile' && action === 'suggest') return profileSuggest(repo, options);
  if (area === 'profile' && action === 'doctor') return profileDoctor(repo, options);
  if (area === 'config' && action === 'normalize') return configNormalize(repo, options);
  if (area === 'config' && action === 'validate') return configValidate(repo, options);
  if (area === 'config' && action === 'explain') return configExplain(repo, options);
  if (area === 'config' && action === 'diff') return configDiff(repo, options);
  if (area === 'config' && action === 'export') return configExport(repo, options);
  if (area === 'config' && action === 'import') return configImport(repo, options);
  if (area === 'intake' && action === 'packet') return intakePacket(repo, options, intakeDependencies());
  if (area === 'intake' && action === 'check') return intakeCheck(repo, options, intakeDependencies());
  if (area === 'context' && action === 'restore') return contextRestore(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'pack') return contextPack(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'audit') return contextAudit(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'freshness') return contextFreshness(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'conflict-check') return contextConflictCheck(repo, options, contextControlDependencies());
  if (area === 'context' && (action === 'contradictions' || action === 'check')) return contextContradictions(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'inventory') return contextInventory(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'bucket-check') return contextBucketCheck(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'bucket-confidence') return contextBucketConfidence(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'resolve') return contextResolve(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'final-check') return contextFinalCheck(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'gate') return contextGate(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'place') return contextPlace(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'update-plan') return contextUpdatePlan(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'budget') return contextBudget(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'assemble') return contextAssemble(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'compact') return contextCompact(repo, options, contextControlDependencies());
  if (area === 'context' && action === 'ledger') return contextLedger(repo, options, contextControlDependencies());
  if (area === 'change' && (action === 'graph' || action === 'graph-lite')) return changeGraph(repo, options, graphSearchDependencies());
  if (area === 'search' && action === 'classify') return searchClassify(repo, options, graphSearchDependencies());
  if (area === 'search' && action === 'classify-results') return searchClassify(repo, options, graphSearchDependencies());
  if (area === 'search' && action === 'retire-check') return searchRetireCheck(repo, options, graphSearchDependencies());
  if (area === 'recipe' && action === 'show') return recipeShow(rest[0] || options.route);
  if (area === 'recipe' && action === 'match') return recipeMatch(repo, options);
  if (area === 'recipe' && action === 'list') return recipeList(repo, options);
  if (area === 'recipe' && action === 'review') return recipeReview(repo, options);
  if (area === 'recipe' && action === 'retire') return recipeRetire(repo, options);
  if (area === 'recipe' && action === 'compile') return recipeCompile(repo, options, { evidenceRequirementsForTask });
  if (area === 'recipe' && action === 'explain') return recipeExplain(repo, options);
  if (area === 'task' && action === 'id') return taskId(repo, options, taskDependencies());
  if (area === 'task' && action === 'current') return taskCurrent(repo, options, taskDependencies());
  if (area === 'task' && action === 'preflight') return taskPreflight(repo, options, taskDependencies());
  if (area === 'task' && (action === 'fast-pass' || action === 'fastpass')) return taskFastPass(repo, options, taskDependencies());
  if (area === 'task' && action === 'start') return taskStart(repo, options, taskDependencies());
  if (area === 'task' && (action === 'open')) return taskOpen(repo, options, taskDependencies());
  if (area === 'task' && (action === 'bundle')) return taskBundle(repo, options, taskDependencies());
  if (area === 'task' && action === 'status') return taskStatus(repo, options, taskDependencies());
  if (area === 'task' && action === 'doctor') return taskDoctor(repo, options, taskDependencies());
  if (area === 'task' && (action === 'review' || action === 'checkpoint')) return taskReview(repo, options, taskDependencies());
  if (area === 'task' && action === 'ledger') return taskLedger(repo, options, taskDependencies());
  if (area === 'task' && action === 'verify') return taskVerify(repo, options, taskDependencies());
  if (area === 'task' && action === 'qa') return taskQa(repo, options, taskDependencies());
  if (area === 'task' && (action === 'finish' || action === 'complete')) return taskFinish(repo, options, taskDependencies());
  if (area === 'state' && action === 'init') return stateInit(repo, options, stateDependencies());
  if (area === 'state' && action === 'current') return stateCurrent(repo, options);
  if (area === 'state' && action === 'advance') return stateAdvance(repo, options, stateDependencies());
  if (area === 'state' && action === 'blockers') return stateBlockers(repo, options, stateDependencies());
  if (area === 'state' && action === 'explain') return stateExplain(repo, options, stateDependencies());
  if (area === 'route' && action === 'start') return routeStart(repo, rest[0] || options.route, options, routePacketDependencies());
  if (area === 'route' && action === 'retire') return routeRetire(repo, options, routePacketDependencies());
  if (area === 'route' && action === 'proof') return routeProof(repo, options, routePacketDependencies());
  if (area === 'packet' && action === 'status') return packetStatus(repo, options, routePacketDependencies());
  if (area === 'done' && action === 'check') return doneCheck(repo, options, routePacketDependencies());
  if (area === 'run' && action === 'plan') return runPlan(repo, options);
  if (area === 'run' && action === 'status') return runStatus(repo, options, runActionDependencies());
  if (area === 'run' && action === 'next') return runNext(repo, options, runActionDependencies());
  if (area === 'run' && action === 'resume') return runResume(repo, options, runActionDependencies());
  if (area === 'run' && action === 'dashboard') return runDashboard(repo, options, runActionDependencies());
  if (area === 'run' && action === 'start') return runStart(repo, options, runLifecycleDependencies());
  if (area === 'run' && action === 'finish') return runFinish(repo, options, runLifecycleDependencies());
  if (area === 'workspace' && action === 'status') return workspaceStatus(repo, options);
  if (area === 'workspace' && action === 'init') return workspaceInit(repo, options);
  if (area === 'workspace' && action === 'doctor') return workspaceDoctor(repo, options);
  if (area === 'workspace' && action === 'packet') return workspacePacket(repo, options);
  if (area === 'workspace' && action === 'map') return workspaceMap(repo, options);
  if (area === 'workspace' && action === 'ledger') return workspaceLedger(repo, options);
  if (area === 'workspace' && action === 'graph') return workspaceGraph(repo, options);
  if (area === 'workspace' && action === 'impact') return workspaceImpact(repo, options);
  if (area === 'workmode' && action === 'detect') return workmodeDetect(repo, options, assessmentDependencies());
  if (area === 'surface' && (action === 'list' || action === 'taxonomy')) return surfaceList();
  if (area === 'surface' && action === 'detect') return surfaceDetect(repo, options);
  if (area === 'unit' && action === 'map') return unitMap(repo, options);
  if (area === 'unit' && action === 'detect') return unitDetect(repo, options);
  if (area === 'unit' && action === 'doctor') return unitDoctor(repo, options);
  if (area === 'unit' && action === 'profile') return unitProfile(repo, options);
  if (area === 'unit' && action === 'list') return unitList(repo, options);
  if (area === 'unit' && action === 'resolve') return unitResolve(repo, options);
  if (area === 'unit' && action === 'context') return unitContext(repo, options);
  if (area === 'touched' && action === 'packet') return touchedPacket(repo, options, changeImpactDependencies());
  if (area === 'touched' && action === 'update') return touchedUpdate(repo, options);
  if (area === 'impact' && action === 'packet') return impactPacket(repo, options, changeImpactDependencies());
  if (area === 'interaction' && action === 'packet') return interactionPacket(repo, options, changeImpactDependencies());
  if (area === 'review' && action === 'packet') return reviewPacket(repo, options, releaseDependencies());
  if (area === 'review' && action === 'complete') return reviewComplete(repo, options, releaseDependencies());
  if (area === 'release' && action === 'packet') return releasePacket(repo, options, releaseDependencies());
  if (area === 'release' && action === 'complete') return releaseComplete(repo, options, releaseDependencies());
  if (area === 'qa' && (action === 'script' || action === 'packet')) return qaScript(repo, options, qaDependencies());
  if (area === 'qa' && action === 'handoff') return qaHandoff(repo, options, qaDependencies());
  if (area === 'qa' && action === 'scenarios') return qaScenarios(repo, rest[0] || options.command || 'list', options);
  if (area === 'qa' && action === 'outline') return qaOutline(repo, options);
  if (area === 'qa' && action === 'compare') return qaCompare(repo, options, qaDependencies());
  if (area === 'qa' && ['ui', 'api', 'data', 'integration', 'scenario', 'multi', 'interactive', 'cli', 'job', 'docs'].includes(action)) return qaModeCommand(repo, action, options, rest, qaDependencies());
  if (area === 'qa' && action === 'complete') return qaComplete(repo, options, qaDependencies());
  if (area === 'qa' && action === 'review') return qaReview(repo, options, qaDependencies());
  if (area === 'qa' && action === 'build') return qaBuild(repo, options);
  if (area === 'qa' && action === 'validate') return qaValidate(repo, options);
  if (area === 'smoke' && action === 'packet') return smokePacket(repo, options, smokeDependencies());
  if (area === 'smoke' && action === 'complete') return smokeComplete(repo, options, smokeDependencies());
  if (area === 'multi' && action === 'status') return multiStatus(repo, options);
  if (area === 'multi' && action === 'packet') return multiPacket(repo, options);
  if (area === 'multi' && action === 'ledger') return multiLedger(repo, options, { classifyTouchedSurface });
  if (area === 'multi' && action === 'qa') return multiQa(repo, options);
  if (area === 'contract' && action === 'packet') return contractPacket(repo, options);
  if (area === 'data' && action === 'packet') return dataPacket(repo, options, { classifyTouchedSurface });
  if (area === 'data' && action === 'boundary') return dataBoundary(repo, options);
  if (area === 'data' && action === 'query-plan') return dataQueryPlan(repo, options);
  if (area === 'data' && action === 'evidence') return dataEvidence(repo, options);
  if (area === 'ticket' && action === 'evidence') return ticketEvidence(repo, options);
  if (area === 'ticket' && action === 'drift') return ticketDrift(repo, options);
  if (area === 'ticket' && action === 'update-preview') return ticketUpdatePreview(repo, options);
  if (area === 'integration' && action === 'packet') return integrationPacket(repo, options, { classifyTouchedSurface });
  if (area === 'validate' && action === 'ladder') return validationLadder(repo, options, assessmentDependencies());
  if (area === 'fixture' && action === 'plan') return fixturePlan(repo, options, testPlanDependencies());
  if (area === 'test' && action === 'plan') return testPlan(repo, options, testPlanDependencies());
  if (area === 'test' && action === 'suggest') return testSuggest(repo, options, testPlanDependencies());
  if (area === 'test' && action === 'bootstrap-plan') return testBootstrapPlan(repo, options, testPlanDependencies());
  if (area === 'test' && action === 'regression-plan') return testRegressionPlan(repo, options, testPlanDependencies());
  if (area === 'bug' && (action === 'evidence' || action === 'packet')) return bugEvidencePacket(repo, options, diagnosticsDependencies());
  if (area === 'bug' && action === 'live-evidence') return bugLiveEvidence(repo, options, diagnosticsDependencies());
  if (area === 'bug' && action === 'evidence-check') return bugEvidenceCheck(repo, options, diagnosticsDependencies());
  if (area === 'bug' && ['reproduce', 'diagnose', 'fix-plan', 'verify', 'qa'].includes(action)) return bugWorkflowPacket(repo, action, options, diagnosticsDependencies());
  if (area === 'dotnet' && action === 'efcore' && (rest[0] || options.command) === 'diagnose') return dotnetEfcoreDiagnose(repo, options, diagnosticsDependencies());
  if (area === 'pattern' && action === 'analog') return patternAnalog(repo, options, diagnosticsDependencies());
  if (area === 'fix' && action === 'scope') return fixScope(repo, options, diagnosticsDependencies());
  if (area === 'command' && action === 'classify') return commandClassify(repo, options, diagnosticsDependencies());
  if (area === 'tools' && action === 'detect') return toolsDetect(repo, options);
  if (area === 'tools' && action === 'status') return toolsStatus(repo, options);
  if (area === 'tools' && action === 'fallback') return toolsFallback(repo, options);
  if (area === 'capability' && action === 'snapshot') return capabilitySnapshot(repo, options);
  if (area === 'capability' && action === 'doctor') return capabilityDoctor(repo, options);
  if (area === 'capability' && action === 'fallback') return capabilityFallback(repo, options);
  if (area === 'checks' && action === 'plan') return checksPlan(repo, options);
  if (area === 'checks' && action === 'run') return checksRun(repo, options);
  if (area === 'checks' && action === 'doctor') return checksDoctor(repo, options);
  if (area === 'index' && action === 'build') return indexBuild(repo, options);
  if (area === 'index' && action === 'query') return indexQuery(repo, options);
  if (area === 'automation' && action === 'budget') return automationBudget(repo, options);
  if (area === 'event' && ['prompt-submit', 'post-edit', 'pre-stop', 'approval-request'].includes(action)) return sdlcEvent(repo, action, options);
  if (area === 'hooks' && action === 'plan') return hooksPlan(repo, options);
  if (area === 'onboarding' && action === 'pilot') return onboardingPilot(repo, options);
  if (area === 'feedback' && action === 'quick') return feedbackQuick(repo, options);
  if (area === 'feedback' && action === 'capture') return feedbackCapture(repo, options);
  if (area === 'feedback' && action === 'review') return feedbackReview(repo, options);
  if (area === 'feedback' && action === 'summary') return feedbackSummary(repo, options);
  if (area === 'trace' && action === 'start') return traceStart(repo, options, telemetryDependencies());
  if (area === 'trace' && action === 'event') return traceEvent(repo, options, telemetryDependencies());
  if (area === 'trace' && action === 'attach') return traceAttach(repo, options, telemetryDependencies());
  if (area === 'trace' && action === 'finish') return traceFinish(repo, options, telemetryDependencies());
  if (area === 'trace' && action === 'export') return traceExport(repo, options, telemetryDependencies());
  if (area === 'scorecard' && action === 'task') return scorecardTask(repo, options, telemetryDependencies());
  if (area === 'scorecard' && action === 'summary') return scorecardSummary(repo, options, telemetryDependencies());
  if (area === 'scorecard' && action === 'trends') return scorecardTrends(repo, options, telemetryDependencies());
  if (area === 'artifact' && action === 'budget') return artifactBudget(repo, options);
  if (area === 'evidence' && action === 'init') return evidenceInit(repo, options);
  if (area === 'evidence' && action === 'provenance') return evidenceProvenance(repo, options, { findPackets });
  if (area === 'evidence' && action === 'required') return evidenceRequired(repo, options);
  if (area === 'evidence' && action === 'status') return evidenceStatus(repo, options);
  if (area === 'evidence' && action === 'add') return evidenceAdd(repo, options);
  if (area === 'evidence' && action === 'plan') return evidencePlan(repo, options);
  if (area === 'verify' && action === 'packet') return verifyPacket(repo, options, verifyDependencies());
  if (area === 'verify' && action === 'complete') return verifyComplete(repo, options, verifyDependencies());
  if (area === 'verify') return verify(resolve(areaOptions.repo || process.cwd()), areaOptions);
  if (area === 'final' && action === 'gate') return finalGate(repo, options, finishDependencies());
  if (area === 'finish' && action === 'packet') return finishPacket(repo, options, finishDependencies());
  if (area === 'git' && action === 'packet') return gitPacket(repo, options, finishDependencies());
  if (area === 'git' && action === 'guard') return gitGuard(repo, options, finishDependencies());
  if (area === 'action' && action === 'preview') return actionPreview(repo, options, finishDependencies());
  if (area === 'complete' && action === 'check') return completeCheck(repo, options, finishDependencies());
  if (area === 'complete' && action === 'explain') return completeExplain(repo, options, finishDependencies());
  if (area === 'complete' && action === 'waive') return completeWaive(repo, options, finishDependencies());
  if (area === 'artifact' && action === 'validate') return artifactValidate(repo, options);
  if (area === 'artifact' && action === 'summarize') return artifactSummarize(repo, options);
  if (area === 'artifact' && action === 'migrate') return artifactMigrate(repo, options);
  if (area === 'dashboard') return statusDashboard(resolve(areaOptions.repo || repo), areaOptions, statusDependencies());
  if (area === 'adapter' && action === 'generate') return adapterGenerate(repo, options);
  if (area === 'eval' && action === 'run') return evalRun(repo, options);
  if (area === 'eval' && action === 'add-case') return evalAddCase(repo, options);
  if (area === 'eval' && action === 'report') return evalReport(repo, options);
  if (area === 'upgrade' && action === 'plan') return upgradePlan(repo, options);
  if (area === 'upgrade' && action === 'apply') return upgradeApply(repo, options);
  if (area === 'upgrade' && action === 'explain') return upgradeExplain(repo, options);
  if (area === 'scope' && action === 'expect') return scopeExpect(repo, options, scopeDependencies());
  if (area === 'scope' && action === 'check') return scopeCheck(repo, options, scopeDependencies());
  if (area === 'gates') return statusGates(repo, areaOptions, statusDependencies());
  if (area === 'handoff' && action === 'draft') return statusHandoffDraft(repo, options, statusDependencies());
  if (area === 'calibrate' && action === 'add') return calibrateAdd(repo, options);
  if (area === 'calibrate' && action === 'summary') return calibrateSummary(repo, options);
  if (area === 'calibrate' && action === 'inspect') return calibrateInspect(repo, options);
  if (area === 'calibrate' && action === 'propose') return calibratePropose(repo, options);
  if (area === 'calibrate' && (action === 'flows' || action === 'promote-candidates')) return calibrateFlows(repo, options);
  if (area === 'calibrate' && action === 'promote') return calibratePromote(repo, options);
  if (area === 'learn' && action === 'capture') return learnCapture(repo, options, learningDependencies());
  if (area === 'learn' && action === 'quick') return learnQuick(repo, options, learningDependencies());
  if (area === 'learn' && action === 'sanitize') return learnSanitize(repo, options, learningDependencies());
  if (area === 'learn' && action === 'sync-check') return learnSyncCheck(repo, options, learningDependencies());
  if (area === 'learn' && action === 'review-cycle') return learnReviewCycle(repo, options, learningDependencies());
  if (area === 'learn' && action === 'archive') return learnArchive(repo, options, learningDependencies());
  if (area === 'learn' && action === 'route') return learnRoute(repo, options, learningDependencies());
  if (area === 'learn' && action === 'summary') return learnSummary(repo, options, learningDependencies());
  if (area === 'learn' && action === 'review') return learnReview(repo, options, learningDependencies());
  if (area === 'learn' && action === 'promote-check') return learnPromoteCheck(repo, options, learningDependencies());
  if (area === 'learn' && action === 'candidates') return learnCandidates(repo, options, learningDependencies());
  if (area === 'learn' && action === 'split') return learnSplit(repo, options, learningDependencies());
  if (area === 'learn' && action === 'from-run') return learnFromRun(repo, options, learningDependencies());
  if (area === 'learn' && action === 'suggest') return learnSuggest(repo, options, learningDependencies());
  if (area === 'learn' && action === 'backlog') return learnBacklog(repo, options, learningDependencies());
  if (area === 'learn' && action === 'promote') return learnPromote(repo, options, learningDependencies());
  if (area === 'learn' && action === 'export') return learnExport(repo, options);
  if (area === 'learn' && action === 'import') return learnImport(repo, options);
  if (area === 'readiness') return statusReadiness(resolve(areaOptions.repo || process.cwd()), statusDependencies());
  if (area === 'setup' && action === 'doctor') return setupDoctor(repo, options, healthDependencies());
  if (area === 'setup' && action === 'bootstrap') return setupBootstrap(repo, options, healthDependencies());
  if (area === 'doctor' && action === 'full') return doctorFull(repo, options, healthDependencies());
  if (area === 'install' && action === 'check') return installCheck(repo, options, healthDependencies());
  if (area === 'health') return health(resolve(areaOptions.repo || process.cwd()), areaOptions, healthDependencies());
  if (area === 'process' && action === 'health') return processHealth(repo, options, healthDependencies());
  if (area === 'policy' && action === 'check') return policyCheck(repo, options);
  if (area === 'policy' && action === 'explain') return policyExplain(repo, options);
  if (area === 'policy' && action === 'list') return policyList(repo, options);
  if (area === 'policy' && action === 'validate-config') return policyValidateConfig(repo, options);
  if (area === 'policy' && action === 'simulate') return policySimulate(repo, options);
  if (area === 'render' && action === 'plan') return renderPlan(repo, options);
  if (area === 'render' && action === 'evidence') return renderEvidencePacket(repo, options);
  if (area === 'render' && action === 'smoke') return renderSmoke(repo, options);
  if (area === 'release' && action === 'note') return releaseOrderNote(repo, options, releaseDependencies());
  if (area === 'security' && (action === 'permissions' || action === 'policy')) return permissionPolicyPacket(repo, options);
  if (area === 'security' && (action === 'audit' || action === 'tool-audit')) return toolAuditPacket(repo, options);
  if (area === 'safety' && action === 'preflight') return safetyPreflight(repo, options);
  if (area === 'safety' && action === 'finish') return safetyFinish(repo, options);
  if (area === 'risk' && action === 'agentic') return riskAgentic(repo, options);
  if (area === 'scenario' && action === 'list') return scenarioList();
  if (area === 'scenario' && action === 'show') return scenarioShow(rest[0] || options.name);
  if (area === 'scenario' && action === 'validate') return scenarioValidate(rest[0] || options.name, repo, options);
  if (area === 'scenario' && action === 'test') return scenarioTest(repo, options);
  if (area === 'handoff') return statusHandoff(resolve(areaOptions.repo || process.cwd()), areaOptions);

  fail(`Unknown command: ${argv.join(' ')}`);
}

function getRecipe(route) {
  if (!route) fail('Pass a route name, such as standard, release-push, review-only, or multi-repo-integration.');

  const recipesPath = join(agentsRoot, 'skills', 'run-sdlc', 'references', 'route-recipes.md');
  if (!existsSync(recipesPath)) fail(`Missing route recipes: ${recipesPath}`);

  const text = readFileSync(recipesPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `### ${String(route).toLowerCase()}`);
  if (start < 0) fail(`Route recipe not found: ${route}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (lines[index].startsWith('### ')) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join('\n').trimEnd();
}

function qaDependencies() {
  return { appendPacketCompletion, findPackets, matchRecipes, packetHas, resolvePacketPath, taskCaseId, taskEvidenceSummary };
}

function smokeDependencies() {
  return { renderedEvidencePlan, resolvePacketPath, appendPacketCompletion };
}

function releaseDependencies() {
  return {
    appendPacketCompletion,
    contextDocCandidates,
    escapeCommandArg,
    formatContextDocs,
    resolvePacketPath,
  };
}

function healthDependencies() {
  return {
    agentsRoot,
    completionTrackedPacketKinds,
    contextDocCandidates,
    contextInventory,
    detectCiSystems,
    detectDeploySystems,
    detectTestFrameworks,
    findPackets,
    formatCounts,
    groupCounts,
    learnedFlowCandidates,
    normalizeArray,
    processProposals,
    readCalibrationRows,
    readiness: statusReadiness,
    setupFixPlan,
    sharedContextDetails,
    sharedContextReachability,
  };
}

function finishDependencies() {
  return {
    appendControlEvent,
    caseIdPolicy,
    classifyTouchedSurface,
    controlGateRows,
    finalGateOpenItems,
    findPackets,
    gitScopeRows,
    proposedCommitMessage,
    readControlJsonLines,
    suggestedFinalGateCommand,
    synthesizeState,
    taskCaseId,
    taskEvidenceSummary,
    writeGateRows,
  };
}

function scopeDependencies() {
  return { appendControlEvent, classifyControlPathActivity, classifyTouchedSurface };
}

function testPlanDependencies() {
  return {
    detectTestFrameworks,
    formatValidationLadder,
    validationLadderRows,
    verificationMaturity,
  };
}

function verifyDependencies() {
  return { appendPacketCompletion, formatCommandList, inferVerificationMaturity, resolvePacketPath };
}

function routePacketDependencies() {
  return {
    accessibilityPolicy,
    classifySearchPath,
    completionTrackedPacketKinds,
    doneChecksForRoute,
    findLatestPacket,
    findPackets,
    formatAccessibilityPolicy,
    formatCommandList,
    formatSearchGroups,
    formatSecurityOverlay,
    getRecipe,
    groupBy,
    readPacket,
    resolvePacketPath,
    searchPattern,
  };
}

function diagnosticsDependencies() {
  return {
    bugNextCommand,
    findPackets,
    formatQualityFloorTable,
    humanize,
    packetHas,
    qualityFloorRows,
    resolvePacketPath,
    searchPattern,
    taskCaseId,
  };
}

function telemetryDependencies() {
  return { appendControlJsonLine, controlTraceRow, humanize, resolvePacketPath };
}

function statusDependencies() {
  return {
    completionTrackedPacketKinds,
    contextDocCandidates,
    finalGateOpenItems,
    findPackets,
    nextActionForStage,
    readinessChecks,
    readinessStatus,
    suggestedFinalGateCommand,
    synthesizeState,
  };
}

function intakeDependencies() {
  return { caseIdPolicy, requiresCaseId, taskCaseId, taskType };
}

function changeImpactDependencies() {
  return {
    classifyRuntimeSurface,
    classifyTouchedSurface,
    formatValidationLadder,
    impactAreas,
    needsManualQa,
    qaAreas,
    taskBreadthAssessment,
    validationLadderRows,
  };
}

function assessmentDependencies() {
  return { detectWorkModes, formatValidationLadder, validationLadderRows, verificationMaturity };
}

function runActionDependencies() {
  return { findPackets, finalGateOpenItems, suggestedFinalGateCommand, taskEvidenceSummary };
}

function runLifecycleDependencies() {
  return { doneChecksForRoute, findLatestPacket, readPacket, resolvePacketPath, runStartGates, runStartPacketCommand };
}

function stateDependencies() {
  return { appendControlEvent, controlGateRows, ensureEvidenceManifest, nextActionFromGates, readControlJsonLines, readEvidenceManifest };
}

function graphSearchDependencies() {
  return { changeGraphEdges, changeGraphImplications, classifySearchPath, classifyTouchedSurface, formatSearchGroups, groupBy, searchPattern };
}

function checkDependencies() {
  return { appendControlEvent };
}

function contextControlDependencies() {
  return {
    classifyTouchedSurface,
    contextAliases,
    contextDocCandidates,
    contextFreshnessRecommendations,
    contextFreshnessRow,
    contextGateRows,
    contextPlacement,
    contextPlacementRecommendation,
    contextUpdateTargets,
    detectContextContradictions,
    finalContextSignals,
    findPackets,
    formatCommandList,
    formatContextDocs,
    missingSetup,
    printGateRows,
    recommendedContextFile,
  };
}

function learningDependencies() {
  return { agentsRoot, findPackets, matchRecipes, packetHas, resolvePacketPath, taskBreadthAssessment, taskEvidenceSummary };
}

function taskDependencies() {
  return {
    changeGraph,
    changeImpactDependencies,
    confidenceBlock,
    contextContradictions,
    contextFreshness,
    detectWorkModes,
    escapeCommandArg,
    expectedQaNeed,
    fastPassAssessment,
    finalGateOpenItems,
    findPackets,
    firstMatch,
    formatQualityFloorTable,
    graphSearchDependencies,
    humanize,
    impactPacket,
    latestPacketPath,
    optionFiles,
    preflightHumanJudgment,
    preflightInferred,
    preflightProved,
    proposedCommitMessage,
    qaDependencies,
    qualityFloorRows,
    routeConfidence,
    runStartGates,
    safeDefaultsForPreflight,
    shouldSuggestTestPlan,
    smokeDependencies,
    smokePacket,
    suggestedFinalGateCommand,
    taskBreadthAssessment,
    taskCaseId,
    taskEvidenceSummary,
    taskLedgerRows,
    taskMetrics,
    taskRunId,
    taskType,
    touchedPacket,
    verificationMaturity,
    verifyDependencies,
    verifyPacket,
  };
}

function controlGateRows(repo, state, runDir, options = {}) {
  const manifest = ensureEvidenceManifest(repo, runDir, state.task, state.route, options);
  const evidenceRows = evidenceStatusRows(repo, runDir, manifest).map((row) => ({
    id: `evidence-${row.id}`,
    status: row.status === 'missing' && row.level === 'required' ? 'block' : row.status === 'missing' ? 'warn' : 'pass',
    detail: row.summary,
    next: row.status === 'missing' ? `sdlc evidence add --kind ${row.id} --summary "..."` : '',
  }));
  const contextRows = contextGateRows(repo, state.task, loadProfile(repo), getGitInfo(repo), options);
  const policyRows = policyRowsForTask(repo, state.task, loadProfile(repo).values);
  const waiverRows = readControlJsonLines(join(runDir, 'waivers.jsonl'));
  const rows = [...evidenceRows, ...contextRows, ...policyRows];
  return rows.map((row) => waiverRows.some((waiver) => waiver.gate === row.id) ? { ...row, status: 'waived', detail: `${row.detail} (waived)` } : row);
}

function contextGateRows(repo, task, profile, git, options = {}) {
  const rows = [];
  const docs = contextDocCandidates(repo, profile.values || profile);
  const missing = docs.filter((item) => !existsSync(item.path));
  const stale = docs.map((item) => contextFreshnessRow(repo, item, Number(options.days || 60))).filter((row) => row.status === 'stale');
  const multi = matchesAny(String(task || '').toLowerCase(), ['multi-repo', 'multi repo', 'multiple repositories', 'workspace', 'deployable codebase', 'multiple projects', 'multi-project', 'multi project']);
  rows.push({ id: 'context-profile', status: profile.path ? 'pass' : 'warn', detail: profile.path ? `profile ${relative(repo, profile.path)}` : 'profile not found', next: profile.path ? '' : 'sdlc profile init' });
  rows.push({ id: 'context-missing-docs', status: missing.length > 3 ? 'warn' : 'pass', detail: missing.length ? `${missing.length} context docs missing/unconfigured` : 'no major missing context docs', next: missing.length > 3 ? 'sdlc context inventory' : '' });
  rows.push({ id: 'context-stale-docs', status: stale.length ? 'warn' : 'pass', detail: stale.length ? `${stale.length} stale context docs` : 'no stale context docs detected', next: stale.length ? `sdlc context freshness --task "${escapeCommandArg(task || 'current task')}"` : '' });
  rows.push({ id: 'context-unit-map', status: multi && unitRegistry(repo, profile).length <= 1 ? 'block' : 'pass', detail: multi ? 'multi-repo/project task needs unit/workspace mapping' : 'unit map not required by task signals', next: multi ? 'sdlc unit doctor' : '' });
  return rows;
}

function escapeCommandArg(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
