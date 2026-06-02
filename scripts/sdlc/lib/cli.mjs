import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendControlJsonLine, dedupe, escapeCell, fail, formatInlineList, formatInlineStatus, formatList, formatOptionList, indentList, optionFiles, parseOptions, printGateRows, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteTextFile, slug, splitList, stamp, toCamel, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile, normalizeKeys, profileAudit, profileDoctor, profileInit, profileShow, profileSuggest } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { appendPacketCompletion, completionTrackedPacketKinds, doneChecksForRoute, findLatestPacket, findPackets, firstMatch, latestPacketPath, packetHas, readPacket, resolvePacketPath, taskEvidenceSummary } from './packets.mjs';
import { runDashboard, runFinish, runNext, runPlan, runResume, runStart, runStatus } from './run.mjs';
import { ensureControlRunDir, nextActionForStage, readCurrentState, readCurrentStateInfo, stateAdvance, stateBlockers, stateCurrent, stateExplain, stateInit } from './state.mjs';
import { matchRecipes, recipeCompile, recipeExplain, recipeList, recipeMatch, recipeRetire, recipeReview, recipeShow } from './recipes.mjs';
import { ensureEvidenceManifest, evidenceAdd, evidenceInit, evidencePlan, evidenceProvenance, evidenceRequired, evidenceRequirementsForTask, evidenceStatus, evidenceStatusRows, readEvidenceManifest } from './evidence.mjs';
import { detectCiSystems, detectDeploySystems, detectTestFrameworks, sharedContextDetails, sharedContextReachability } from './environment.mjs';
import { inferContracts, inferDirtySurfaces, inferLikelyRoute, inferRouteFromTask, securityTriggers } from './routes.mjs';
import { detectContextContradictions, evalAddCase, evalReport, evalRun, scenarioList, scenarioShow, scenarioTest, scenarioValidate } from './scenarios.mjs';
import { adapterGenerate, hooksPlan } from './adapters.mjs';
import { indexBuild, indexQuery } from './index.mjs';
import { configDiff, configExplain, configExport, configImport, configNormalize, configValidate } from './config.mjs';
import { contextAssemble, contextAudit, contextBucketCheck, contextBucketConfidence, contextBudget, contextCompact, contextConflictCheck, contextContradictions, contextFinalCheck, contextFreshness, contextGate, contextInventory, contextLedger, contextPack, contextPlace, contextResolve, contextRestore, contextUpdatePlan, recommendedContextFile } from './context.mjs';
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
import { doctorFull, health, installCheck, processHealth, setupBootstrap, setupDoctor } from './health.mjs';
import { actionPreview, completeCheck, completeExplain, completeWaive, finalGate, finishPacket, gitGuard, gitPacket } from './finish.mjs';
import { scopeCheck, scopeExpect } from './scope.mjs';
import { fixturePlan, testBootstrapPlan, testPlan, testRegressionPlan, testSuggest } from './testplan.mjs';
import { verifyComplete, verifyPacket } from './verify.mjs';
import { doneCheck, packetStatus, routeProof, routeRetire, routeStart } from './routepackets.mjs';
import { bugEvidenceCheck, bugEvidencePacket, bugLiveEvidence, bugWorkflowPacket, commandClassify, dotnetEfcoreDiagnose, fixScope, patternAnalog } from './diagnostics.mjs';
import { scorecardSummary, scorecardTask, scorecardTrends, traceAttach, traceEvent, traceExport, traceFinish, traceStart } from './telemetry.mjs';
import { automationBudget, feedbackCapture, feedbackQuick, feedbackReview, feedbackSummary, onboardingPilot, sdlcEvent } from './adoption.mjs';
import { calibrateAdd, calibrateFlows, calibrateInspect, calibratePromote, calibratePropose, calibrateSummary, learnedFlowCandidates, processProposals, readCalibrationRows } from './calibration.mjs';
import { dashboard as statusDashboard, gates as statusGates, handoff as statusHandoff, handoffDraft as statusHandoffDraft, readiness as statusReadiness } from './status.mjs';
import { intakeCheck, intakePacket } from './intake.mjs';
import { impactPacket, interactionPacket, touchedPacket, touchedUpdate } from './changeimpact.mjs';
import { confidenceBlock, fastPassAssessment, formatQualityFloorTable, formatValidationLadder, inferVerificationMaturity, preflightHumanJudgment, preflightInferred, preflightProved, qualityFloorRows, routeConfidence, safeDefaultsForPreflight, taskBreadthAssessment, validationLadder, validationLadderRows, verificationMaturity, verify, workmodeDetect } from './assessment.mjs';
import { changeGraph, searchClassify, searchRetireCheck } from './graphsearch.mjs';
import { createServices } from './services.mjs';
import { helpOnboarding, helpPrompts, helpWorkflow, printHelp } from './help.mjs';
import { policyCheck, policyDecision, policyExplain, policyList, policyRowsForAction, policyRowsForTask, policySimulate, policyValidateConfig } from './policy.mjs';
import { artifactBudget, artifactBudgetForRoute, artifactMigrate, artifactSummarize, artifactValidate, formatArtifactBudget } from './artifacts.mjs';
import { checksDoctor, checksPlan, checksRun, runCheck } from './checks.mjs';
import { impactAreas, primaryQaSteps, qaAreas, qaBuild, qaCompare, qaComplete, qaHandoff, qaModeCommand, qaOutline, qaOutlineForMode, qaReview, qaScenarios, qaScript, qaValidate } from './qa.mjs';
import { capabilityDoctor, capabilityFallback, capabilityRows, capabilitySnapshot, databaseApprovalGateText, databaseQueryShape, externalEvidenceProfile, externalEvidenceSensitive, ticketFallbackFields, toolCapabilityRows, toolFallbacksForTask, toolsDetect, toolsFallback, toolsStatus } from './tools.mjs';
import { affectedUnits, classifyTestingSurface, detectPackageManager, detectStack, findRepoFiles, inferTestingSurfaces, matchesAny, normalizeUnitPath, qaModeForSurfaces, surfaceDetect, surfaceList, unitContext, unitDetect, unitDoctor, unitList, unitMap, unitProfile, unitRegistry, unitResolve } from './units.mjs';

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

function bugNextCommand(action, task) {
  const order = ['reproduce', 'diagnose', 'fix-plan', 'verify', 'qa'];
  const next = order[order.indexOf(action) + 1] || 'qa';
  return action === 'qa' ? `sdlc qa scenario --task "${escapeCommandArg(task)}"` : `sdlc bug ${next} --task "${escapeCommandArg(task)}"`;
}

function contextAliases(profile = {}) {
  const raw = profile.contextAliases || profile.contextAlias || '';
  return splitList(raw).map((item) => {
    const [match, bucket] = item.split(/->|=>|=/).map((value) => value?.trim());
    return match && bucket ? { match, bucket } : null;
  }).filter(Boolean);
}

function finalContextSignals(task, files, packets) {
  const signals = [];
  if (matchesAny(task, ['route', 'endpoint', 'download', 'workflow', 'context', 'learning', 'api'])) signals.push('task language suggests durable workflow/API/context knowledge may have changed');
  if (files.some((file) => classifyTouchedSurface(file) === 'docs/context')) signals.push('context/docs files changed');
  if (packets.some((packet) => packet.kind === 'route-retirement')) signals.push('route retirement evidence may produce durable product context');
  if (packets.some((packet) => packet.kind === 'learning-summary')) signals.push('process learning summary exists');
  if (!signals.length) signals.push('no obvious durable context signal detected; still confirm before final handoff');
  return signals;
}

function searchPattern(scope, pattern) {
  const results = [];
  const regex = new RegExp(escapeRegExp(pattern), 'i');
  for (const file of findRepoFiles(scope, () => true, 8, 20000)) {
    if (isLikelyBinary(file)) continue;
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (regex.test(line)) results.push({ path: file, line: index + 1, text: line.trim().slice(0, 220) });
    });
  }
  return results;
}

function classifySearchPath(path) {
  const value = normalizeUnitPath(path).toLowerCase();
  if (/(^|\/)(archive|archived|archivedpages|old|legacy-archive)(\/|$)/.test(value)) return 'archived historical reference';
  if (/(^|\/)(dist|build|bin|obj|out|coverage|generated|wwwroot\/dist)(\/|$)/.test(value) || /\.(min|bundle)\.(js|css)$/.test(value)) return 'generated/deployed artifact';
  if (/(^|\/)(node_modules|packages|vendor)(\/|$)/.test(value)) return 'dependency/build output';
  if (/(^|\/)(test|tests|__tests__|fixtures|spec)(\/|$)/.test(value) || /\.(test|spec)\./.test(value)) return 'test/reference fixture';
  if (value.endsWith('.md') || /(^|\/)(docs|learnings)(\/|$)/.test(value)) return 'context/doc note';
  return 'active source/page reference';
}

function formatSearchGroups(repo, groups) {
  const entries = Object.entries(groups);
  if (!entries.length) return '- none';
  return entries.map(([category, items]) => `### ${category}

${formatList(items.slice(0, 80).map((item) => `${relative(repo, item.path)}:${item.line} ${item.text}`))}${items.length > 80 ? `\n- ... ${items.length - 80} more` : ''}`).join('\n\n');
}

function isLikelyBinary(path) {
  return /\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|gz|dll|exe|pdb|woff|woff2|ttf|eot|mp4|mov)$/i.test(path);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

function git(repo, args) {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function runStartPacketCommand(route, task) {
  if (route === 'review-only') return `sdlc review packet --task "${escapeCommandArg(task)}"`;
  if (route === 'release-push') return 'sdlc release packet';
  if (route === 'multi-repo-integration') return `sdlc multi packet --task "${escapeCommandArg(task)}"`;
  if (route === 'contract-first') return `sdlc contract packet --task "${escapeCommandArg(task)}"`;
  if (route === 'bugfix-live-system') return `sdlc bug evidence --task "${escapeCommandArg(task)}"`;
  return `sdlc evidence init --route ${route}`;
}

function runStartGates(route, task, gitInfo, profile) {
  const gates = [];
  if (!profile.releasePolicy && route === 'release-push') gates.push('release policy missing from profile');
  if (!profile.sharedContextRoot && route === 'multi-repo-integration') gates.push('shared context root or service map may be needed');
  if (gitInfo.status) gates.push('dirty working tree must be scoped');
  gates.push(...securityTriggers(task, profile).map((item) => `security/tool trigger: ${item}`));
  return gates.length ? gates : ['normal route gates only'];
}

function suggestedFinalGateCommand(gate, task) {
  if (gate.includes('touched')) return 'sdlc touched packet';
  if (gate.includes('impact')) return `sdlc impact packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('verification')) return `sdlc verify packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('QA')) return `sdlc qa script --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('smoke')) return `sdlc smoke packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('data')) return `sdlc data packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('integration')) return `sdlc integration packet --task "${escapeCommandArg(task || 'current task')}"`;
  if (gate.includes('test introduction')) return `sdlc test plan --task "${escapeCommandArg(task || 'current task')}"`;
  return 'sdlc packet status';
}

function finalGateOpenItems(repo, task, gitInfo, packets) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  const maturity = verificationMaturity(profile.values, commands);
  const modes = detectWorkModes(repo, task, profile.values, gitInfo.changedFiles);
  const surfaces = dedupe(gitInfo.changedFiles.map(classifyTouchedSurface));
  const taskText = String(task || '').toLowerCase();
  const hasTouched = packets.some((packet) => packet.kind === 'touched');
  const hasImpact = packets.some((packet) => packet.kind === 'impact');
  const hasVerify = packets.some((packet) => packet.kind === 'developer-verification' && packet.completed);
  const hasQa = packets.some((packet) => packet.kind === 'qa-script');
  const hasSmoke = packets.some((packet) => packet.kind === 'manual-smoke' && packet.completed);
  const hasData = packets.some((packet) => packet.kind === 'data');
  const hasIntegration = packets.some((packet) => packet.kind === 'integration');
  const hasTestPlan = packets.some((packet) => packet.kind === 'test-plan');
  const manualQaMaturity = ['manual qa only', 'no automated tests'].some((item) => maturity.toLowerCase().includes(item));
  const requiresSmoke =
    manualQaMaturity ||
    surfaces.includes('frontend/UI') ||
    modes.includes('manual-QA-heavy') ||
    matchesAny(taskText, ['manual smoke', 'smoke test', 'no automated tests', 'manual qa']);
  const requiresData = surfaces.includes('database/storage') || modes.includes('database-heavy') || matchesAny(taskText, ['database', 'sql', 'data storage', 'migration']);
  const requiresIntegration = surfaces.includes('external integration') || modes.includes('integration-heavy') || matchesAny(taskText, ['third-party', 'third party', 'webhook', 'integration', 'external system']);
  const requiresTestPlan = manualQaMaturity || surfaces.includes('dependencies') || matchesAny(taskText, ['package', 'dependency', 'upgrade', 'no automated tests', 'missing tests']);
  const open = [];
  if (gitInfo.status && !hasTouched) open.push('touched packet missing for dirty work');
  if (task && !hasImpact) open.push('impact packet missing for scoped task');
  if (['mature CI', 'partial automated tests', 'smoke tests'].some((item) => maturity.toLowerCase().includes(item.toLowerCase())) && !hasVerify) open.push('developer verification packet completion missing or capped');
  if (manualQaMaturity && !hasQa) open.push('human QA Markdown script missing for manual-QA/no-tests workflow');
  if (!hasVerify) open.push('developer verification packet completion missing or capped');
  if (!hasQa && !manualQaMaturity) open.push('human QA Markdown script missing or explicitly not needed');
  if (requiresSmoke && !hasSmoke) open.push('manual smoke packet completion missing or capped');
  if (requiresData && !hasData) open.push('data packet missing for data/storage workflow');
  if (requiresIntegration && !hasIntegration) open.push('integration packet missing for external integration workflow');
  if (requiresTestPlan && !hasTestPlan) open.push('test introduction plan missing for no-tests/dependency workflow');
  return dedupe(open);
}

function profileToken(value) {
  return Array.isArray(value) ? value.join(' ') : String(value || '');
}

function detectWorkModes(repo, task, profile = {}, files = []) {
  const text = `${task} ${profileToken(profile.classification)} ${profile.repositoryRole || ''}`.toLowerCase();
  const stack = detectStack(repo);
  const modes = [];
  if (matchesAny(text, ['personal'])) modes.push('personal product');
  if (matchesAny(text, ['company', 'client', 'customer', 'production'])) modes.push('company/customer product');
  if (matchesAny(text, ['internal', 'admin'])) modes.push('internal tool');
  if (stack.includes('ASP Classic')) modes.push('legacy system');
  if (stack.includes('Node/TypeScript') || stack.includes('Deno/JSR') || stack.includes('Next.js')) modes.push('modern web/app package');
  if (files.some((file) => classifyTouchedSurface(file) === 'backend/API') || matchesAny(text, ['api', 'service'])) modes.push('API/service');
  if (files.some((file) => classifyTouchedSurface(file) === 'database/storage') || matchesAny(text, ['database', 'sql', 'data'])) modes.push('database-heavy');
  if (files.some((file) => classifyTouchedSurface(file) === 'external integration') || matchesAny(text, ['third-party', 'integration', 'webhook', 'vendor'])) modes.push('integration-heavy');
  if (matchesAny(text, ['qa', 'manual test', 'youtrack'])) modes.push('manual-QA-heavy');
  if (matchesAny(text, ['multi repo', 'multi-repo', 'cross repo'])) modes.push('multi-repo');
  return dedupe(modes);
}

function contextUpdateTargets(route, dirtySurfaces, contracts, profile) {
  const targets = [];
  if (!profile.sharedContextRoot && route === 'multi-repo-integration') targets.push('SDLC profile: configure shared context root or related repository map');
  if (dirtySurfaces.includes('docs/context')) targets.push('docs/memory-bank or docs/context-state: update active state if durable truth changed');
  if (contracts.length || route === 'contract-first' || route === 'multi-repo-integration') targets.push('docs/contracts or shared context root: update interface/contract truth');
  if (dirtySurfaces.includes('rendered UI')) targets.push('feature context or code-local docs: update visible workflow facts only if behavior changed');
  if (dirtySurfaces.includes('API/contracts/events')) targets.push('service map/workflow map: update cross-boundary facts');
  if (!targets.length) targets.push('no durable context update required unless implementation changes source truth');
  return dedupe(targets);
}

function setupFixPlan(gaps, profile, commands) {
  const plan = [];
  const add = (item) => {
    const normalized = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!plan.some((existing) => existing.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === normalized)) plan.push(item);
  };
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) add('Configure shared/product/repo context paths in `.ai-local/sdlc-profile.md`, using external storage when multiple repos need the same context.');
  if (!commands.test) add('Add or record the narrowest reliable test command.');
  if (!commands.build) add('Add or record build/typecheck command when the repo can support it.');
  if (!profile.verificationMaturity) add('Record verification maturity so final gates can choose automated checks versus manual QA scripts.');
  if (!profile.releasePolicy) add('Record release policy and approval gates before using release packets for push/deploy work.');
  if (!profile.approvedTools && !profile.blockedTools) add('Record approved/blocked tools and sensitive-data restrictions.');
  for (const gap of gaps) {
    if (['context', 'commands', 'release', 'security'].includes(gap.area)) continue;
    add(gap.fix);
  }
  return plan;
}

function humanize(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function readinessChecks(repo, profile, commands, existingDocs, related) {
  const values = profile.values;
  return [
    { area: 'context', status: profile.path ? 'ready' : 'missing', fix: 'create .ai-local/sdlc-profile.md with sdlc profile init' },
    { area: 'context', status: existingDocs.some((item) => item.label === 'AGENTS.md') ? 'ready' : 'partial', fix: 'add or update AGENTS.md with repo commands and conventions' },
    { area: 'context', status: values.sharedContextRoot || values.productContext || values.repoContext || values.productContextIndex ? 'ready' : 'partial', fix: 'configure shared/product/repo context paths when the repo participates in larger systems' },
    { area: 'commands', status: commands.test ? 'ready' : 'missing', fix: 'record a test command in the SDLC profile or package scripts' },
    { area: 'commands', status: commands.build ? 'ready' : 'partial', fix: 'record a build/typecheck command when applicable' },
    { area: 'commands', status: commands.rendered || !requiresRenderedReview(repo) ? 'ready' : 'partial', fix: 'record rendered UI review command/tool if the repo has visible UI' },
    { area: 'commands', status: values.verificationMaturity ? 'ready' : 'partial', fix: 'record verification maturity so final gates can choose automated checks versus manual QA scripts' },
    { area: 'release', status: values.releasePolicy || values.humanApprovalGates ? 'ready' : 'partial', fix: 'record release policy and human approval gates' },
    { area: 'security', status: values.approvedTools || values.blockedTools || values.sensitiveDataRestrictions ? 'ready' : 'partial', fix: 'record approved/blocked tools and sensitive data restrictions' },
    { area: 'security', status: values.ticketMcpAvailability || values.databaseMcpAvailability ? 'ready' : 'partial', fix: 'record optional ticket/database MCP availability or mark unavailable/blocked' },
    { area: 'multi-repo', status: related.length === 0 || values.serviceMap || values.productContextIndex ? 'ready' : 'partial', fix: 'add service map/product context index for related repositories' },
  ];
}

function readinessStatus(checks, area) {
  const relevant = checks.filter((item) => item.area === area);
  if (!relevant.length) return 'unknown';
  if (relevant.every((item) => item.status === 'ready')) return 'ready';
  if (relevant.some((item) => item.status === 'missing')) return 'missing';
  return 'partial';
}

function requiresRenderedReview(repo) {
  return existsSync(join(repo, 'src')) || existsSync(join(repo, 'app')) || existsSync(join(repo, 'pages'));
}

function contextFreshnessRow(repo, item, days) {
  if (!existsSync(item.path)) return { label: item.label, status: 'missing', ageDays: '', path: relative(repo, item.path) || item.path };
  const stats = statSync(item.path);
  const ageDays = Math.max(0, Math.floor((Date.now() - stats.mtimeMs) / 86400000));
  return { label: item.label, status: ageDays > days ? 'stale' : 'fresh', ageDays, path: relative(repo, item.path) || '.' };
}

function contextFreshnessRecommendations(existingRows, staleRows, profile) {
  const recommendations = [];
  if (!existingRows.length) recommendations.push('No context docs found; run setup bootstrap/doctor and create the smallest useful repo or shared context docs.');
  if (staleRows.length) recommendations.push(`Review stale docs before trusting them: ${staleRows.map((row) => row.label).join(', ')}.`);
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) recommendations.push('Configure external shared context root when this repository participates in larger multi-repo systems.');
  if (!recommendations.length) recommendations.push('Context docs are present and within the freshness window; still cross-check source files touched by the task.');
  return recommendations;
}

function contextPlacement(repo, path) {
  const relativePath = relative(repo, path);
  if (!relativePath || relativePath.startsWith('..')) return 'external/shared';
  if (relativePath.startsWith('.ai-local')) return 'local ignored evidence/context';
  if (relativePath.startsWith('docs/')) return 'tracked repo software memory';
  if (['AGENTS.md', '.sdlc/profile.md', '.sdlc/profile.json'].includes(relativePath)) return 'tracked process/setup';
  return 'repo-local';
}

function contextPlacementRecommendation(fact, profile = {}) {
  const text = String(fact || '').toLowerCase();
  if (matchesAny(text, ['test result', 'command output', 'verification', 'screenshot', 'smoke', 'temporary', 'today', 'this task'])) {
    return { placement: 'ignored local task evidence', target: '.ai-local/sdlc-runs/', reason: 'The fact sounds task-specific or ephemeral.', trackingRule: 'Do not track unless sanitized and intentionally promoted.' };
  }
  if (matchesAny(text, ['learning', 'process lesson', 'route gap', 'workflow miss', 'case id', 'testing surface'])) {
    return { placement: 'sanitized SDLC learning or process-learning event', target: 'learnings/ for redacted shared lessons, or project-local docs/process-improvement for product-specific details', reason: 'The fact appears to improve the SDLC process rather than define product behavior.', trackingRule: 'Separate portable process guidance from product/client details before committing to the skills pack.' };
  }
  if (matchesAny(text, ['service map', 'cross repo', 'cross-repo', 'workflow map', 'release order', 'multiple repositories', 'product-wide'])) {
    return { placement: 'external shared context', target: profile.sharedContextRoot || profile.serviceMap || profile.workflowMap || 'shared context root', reason: 'The fact affects more than one repository.', trackingRule: 'Keep secrets/customer data out; use sanitized shared docs.' };
  }
  if (matchesAny(text, ['api contract', 'public api', 'api', 'calls', 'schema', 'event', 'message', 'integration', 'database', 'sql', 'stores', 'data', 'business rule', 'user workflow', 'workflow'])) {
    return { placement: 'repo or shared software memory', target: profile.repoContext || profile.productContext || 'docs/context-state.md or shared context root', reason: 'The fact is durable software behavior future agents should not rediscover.', trackingRule: 'Track in repo docs only when team-approved; otherwise use shared context.' };
  }
  if (matchesAny(text, ['sdlc', 'agent should', 'process', 'gate', 'skill', 'router'])) {
    return { placement: 'SDLC process pack', target: '.agents skills/references/templates', reason: 'The fact changes how agents should work rather than how the software behaves.', trackingRule: 'Keep reusable process guidance in the SDLC pack.' };
  }
  return { placement: 'repo-local context or task evidence', target: profile.repoContext || '.ai-local/ until durability is clear', reason: 'Durability and scope are unclear.', trackingRule: 'Start local; promote only after it proves reusable.' };
}

function contextDocCandidates(repo, profile) {
  const candidates = [
    { label: 'AGENTS.md', path: join(repo, 'AGENTS.md') },
    { label: 'SDLC profile JSON', path: join(repo, '.sdlc', 'profile.json') },
    { label: 'SDLC profile Markdown', path: join(repo, '.sdlc', 'profile.md') },
    { label: 'Agent-local SDLC profile', path: join(repo, '.ai-local', 'sdlc-profile.md') },
    { label: 'Agent-local repository setup', path: join(repo, '.ai-local', 'repository-setup.md') },
    { label: 'Memory context index', path: join(repo, 'docs', 'memory-bank', 'contextIndex.md') },
    { label: 'Memory active context', path: join(repo, 'docs', 'memory-bank', 'activeContext.md') },
    { label: 'Context state', path: join(repo, 'docs', 'context-state.md') },
    { label: 'Application model', path: join(repo, 'docs', 'application-model.md') },
  ];

  for (const [key, label] of [
    ['sharedContextRoot', 'Shared context root'],
    ['productContext', 'Product context'],
    ['repoContext', 'Repo context'],
    ['productContextIndex', 'Product context index'],
    ['repoContextIndex', 'Repo context index'],
    ['serviceMap', 'Service map'],
    ['workflowMap', 'Workflow map'],
    ['releaseOrder', 'Release order'],
    ['knownFailureModes', 'Known failure modes'],
  ]) {
    if (profile[key]) candidates.push({ label, path: resolveContextPath(repo, profile[key]) });
  }

  return dedupeByPath(candidates);
}

function dedupeByPath(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item.path || seen.has(item.path)) continue;
    seen.add(item.path);
    out.push(item);
  }
  return out;
}

function resolveContextPath(repo, value) {
  const raw = String(value || '').trim();
  if (!raw) return repo;
  if (raw.startsWith('~')) return raw;
  if (raw.startsWith('/')) return raw;
  return resolve(repo, raw);
}

function missingSetup(profile, commands) {
  const missing = [];
  if (!profile.sharedContextRoot && !profile.productContext && !profile.repoContext) missing.push('no external/shared context paths configured');
  if (!commands.test) missing.push('no test command discovered');
  if (!commands.build) missing.push('no build command discovered');
  return missing;
}

function formatContextDocs(repo, items) {
  if (!items.length) return '- none';
  return items.map((item) => `- ${item.label}: ${relative(repo, item.path) || '.'}`).join('\n');
}

function formatCommandList(commands, route) {
  const selected = new Set(['test']);
  if (['standard', 'release-push', 'multi-repo-integration', 'ui-rendered-review', 'bugfix-live-system'].includes(route)) selected.add('build');
  if (route === 'ui-rendered-review') selected.add('rendered');
  if (route === 'release-push') selected.add('lint');
  const lines = Object.entries(commands)
    .filter(([key, command]) => command && (selected.has(key) || ['install', 'dev'].includes(key)))
    .map(([key, command]) => `- ${key}: \`${command}\``);
  return lines.length ? lines.join('\n') : '- none discovered';
}

function changeGraphEdges(task, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const edges = [];
  const add = (from, relationship, to, evidence) => edges.push({ from, relationship, to, evidence });
  if (surfaces.includes('frontend/UI')) add('frontend/UI', 'drives or displays', 'user workflow', 'changed UI files or UI task language');
  if (surfaces.includes('backend/API')) add('user workflow', 'calls', 'API/service behavior', 'backend/API files changed');
  if (surfaces.includes('database/storage')) add('API/service behavior', 'reads or writes', 'data/storage', 'database/storage files or task language');
  if (surfaces.includes('external integration')) add('API/service behavior', 'exchanges data with', 'external provider/system', 'integration files or task language');
  if (surfaces.includes('contracts/interfaces')) add('producer', 'must remain compatible with', 'consumer contract', 'contract/interface files changed');
  if (surfaces.includes('dependencies')) add('runtime/tooling', 'can affect', 'startup/build/test/regression paths', 'dependency files changed');

  const text = String(task || '').toLowerCase();
  if (!edges.length && matchesAny(text, ['api', 'service'])) add('task', 'likely affects', 'API/service behavior', 'task language');
  if (!edges.length && matchesAny(text, ['database', 'sql', 'data'])) add('task', 'likely affects', 'data/storage', 'task language');
  if (!edges.length && matchesAny(text, ['third-party', 'webhook', 'integration'])) add('task', 'likely affects', 'external provider/system', 'task language');
  if (!edges.length && matchesAny(text, ['ui', 'site', 'page', 'react'])) add('task', 'likely affects', 'frontend/UI', 'task language');
  return edges;
}

function changeGraphImplications(graph, task, files) {
  const nodes = new Set(graph.flatMap((edge) => [edge.from, edge.to]));
  const implications = [];
  if (nodes.has('user workflow')) implications.push('QA script should name the primary user workflow and one nearby regression workflow.');
  if (nodes.has('API/service behavior')) implications.push('Developer verification should include the smallest API/service-level check or an explicit cap.');
  if (nodes.has('data/storage')) implications.push('Generate a data packet and define QA-safe test data/persistence checks.');
  if (nodes.has('external provider/system')) implications.push('Generate an integration packet and record sandbox/provider availability.');
  if (nodes.has('consumer contract')) implications.push('Generate a contract packet before implementation if compatibility is unclear.');
  if (nodes.has('startup/build/test/regression paths')) implications.push('Generate a test introduction plan for dependency or tooling work.');
  if (!implications.length && files.length === 0) implications.push('No changed files yet; use this graph after initial implementation or with explicit task surfaces.');
  if (!implications.length) implications.push('No extra graph implication detected; keep evidence scoped to the task.');
  return implications;
}

function groupCounts(values) {
  const counts = new Map();
  for (const value of values) {
    const key = String(value || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function formatCounts(counts) {
  if (!counts.length) return '- none';
  return counts.map(([key, count]) => `- ${key}: ${count}`).join('\n');
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  return splitList(value);
}

function synthesizeState(repo, task, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  return {
    taskId: options.taskId || slug(task || 'ad-hoc'),
    task,
    repo,
    route: options.route || inferRouteFromTask(task, git, profile.values),
    stage: options.stage || 'finish-ready',
    status: 'ad-hoc',
  };
}

function readControlJsonLines(path) {
  return readJsonLines(path);
}

function appendControlEvent(repo, runDir, type, summary, extra = {}) {
  appendControlJsonLine(repo, join(runDir, 'trace.jsonl'), controlTraceRow(repo, { type, summary, ...extra }));
}

function controlTraceRow(repo, options = {}) {
  return {
    timestamp: new Date().toISOString(),
    repo,
    type: options.type || 'event',
    summary: options.summary || '',
    route: options.route || '',
    task: options.task || '',
    stage: options.stage || '',
    status: options.status || '',
    gate: options.gate || '',
    evidence: options.evidence || '',
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

function writeGateRows(repo, runDir, rows) {
  for (const row of rows) appendControlJsonLine(repo, join(runDir, 'gates.jsonl'), { ...row, recordedAt: new Date().toISOString() });
}

function nextActionFromGates(rows, task) {
  const open = rows.find((row) => ['block', 'warn'].includes(row.status));
  return open?.next || `sdlc finish packet --task "${escapeCommandArg(task || 'current task')}"`;
}

function gitScopeRows(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  const runDir = stateInfo.runDir || '';
  const expected = runDir ? readJsonIfExists(join(runDir, 'expected-scope.json')) : null;
  const git = getGitInfo(repo);
  const rows = [];
  if (expected?.files?.length) {
    const unexpected = git.changedFiles.filter((file) => !expected.files.includes(file));
    rows.push({ id: 'scope-unexpected-files', status: unexpected.length ? 'warn' : 'pass', detail: unexpected.join(', ') || 'actual files match expected scope', next: unexpected.length ? 'review dirty files before commit' : '' });
  } else {
    rows.push({ id: 'scope-expected-files', status: git.changedFiles.length ? 'warn' : 'pass', detail: git.changedFiles.length ? 'no expected scope recorded' : 'clean worktree', next: git.changedFiles.length ? 'sdlc scope expect --files "..."' : '' });
  }
  if (git.changedFiles.some((file) => classifyControlPathActivity(file) !== 'active-source')) rows.push({ id: 'scope-non-active-files', status: 'warn', detail: 'generated/archived/dependency-like files changed', next: 'review before commit' });
  return rows;
}

function classifyControlPathActivity(file) {
  const value = String(file || '').toLowerCase();
  if (value.includes('node_modules/') || value.includes('/vendor/') || value.includes('/dist/') || value.includes('/build/') || value.includes('/coverage/')) return 'generated-or-dependency';
  if (value.includes('/archive/') || value.startsWith('archive/') || value.includes('/archived/')) return 'archived-reference';
  if (value.endsWith('.min.js') || value.endsWith('.map')) return 'generated-or-dependency';
  return 'active-source';
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
