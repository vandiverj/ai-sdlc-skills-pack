import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendControlJsonLine, dedupe, escapeCell, fail, formatInlineList, formatInlineStatus, formatList, formatOptionList, indentList, parseOptions, printGateRows, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteTextFile, slug, splitList, stamp, toCamel, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile, normalizeKeys, profileAudit, profileDoctor, profileInit, profileShow, profileSuggest } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { doneChecksForRoute, findLatestPacket, findPackets, firstMatch, packetHas, readPacket, resolvePacketPath } from './packets.mjs';
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
import { contextAssemble, contextAudit, contextBucketCheck, contextBucketConfidence, contextBudget, contextCompact, contextConflictCheck, contextContradictions, contextFinalCheck, contextFreshness, contextGate, contextInventory, contextLedger, contextPack, contextPlace, contextResolve, contextRestore, contextUpdatePlan } from './context.mjs';
import { learnArchive, learnBacklog, learnCandidates, learnCapture, learnExport, learnFromRun, learnImport, learnPromote, learnPromoteCheck, learnQuick, learnReview, learnReviewCycle, learnRoute, learnSanitize, learnSplit, learnSuggest, learnSummary, learnSyncCheck } from './learning.mjs';
import { taskBundle, taskCurrent, taskDoctor, taskFastPass, taskFinish, taskId, taskLedger, taskOpen, taskPreflight, taskQa, taskReview, taskStart, taskStatus, taskVerify } from './task.mjs';
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
import { validationLadder, verify, workmodeDetect } from './assessment.mjs';
import { changeGraph, searchClassify, searchRetireCheck } from './graphsearch.mjs';
import { createServices } from './services.mjs';
import { helpOnboarding, helpPrompts, helpWorkflow, printHelp } from './help.mjs';
import { policyCheck, policyDecision, policyExplain, policyList, policyRowsForAction, policyRowsForTask, policySimulate, policyValidateConfig } from './policy.mjs';
import { artifactBudget, artifactBudgetForRoute, artifactMigrate, artifactSummarize, artifactValidate, formatArtifactBudget } from './artifacts.mjs';
import { checksDoctor, checksPlan, checksRun, runCheck } from './checks.mjs';
import { primaryQaSteps, qaBuild, qaCompare, qaComplete, qaHandoff, qaModeCommand, qaOutline, qaOutlineForMode, qaReview, qaScenarios, qaScript, qaValidate } from './qa.mjs';
import { capabilityDoctor, capabilityFallback, capabilityRows, capabilitySnapshot, databaseApprovalGateText, databaseQueryShape, externalEvidenceProfile, externalEvidenceSensitive, ticketFallbackFields, toolCapabilityRows, toolFallbacksForTask, toolsDetect, toolsFallback, toolsStatus } from './tools.mjs';
import { affectedUnits, classifyTestingSurface, detectPackageManager, detectStack, existsAny, findRepoFiles, hasFileExt, inferTestingSurfaces, matchesAny, normalizeUnitPath, qaModeForSurfaces, surfaceDetect, surfaceList, unitContext, unitDetect, unitDoctor, unitList, unitMap, unitProfile, unitRegistry, unitResolve } from './units.mjs';

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
    finishCommitReadiness,
    finishIntentNotes,
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
    classifyTouchedSurface,
    detectTestFrameworks,
    formatValidationLadder,
    inferBootstrapFramework,
    testBootstrapChecklist,
    testPlanRecommendations,
    testRecommendationsForSurfaces,
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
    classifyCommandFailure,
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

function fastPassAssessment(repo, task, route, git, profile, units, surfaces, triggers) {
  const reasons = [];
  const files = git.changedFiles || [];
  const breadth = taskBreadthAssessment(task, files, surfaces);
  const related = splitList(profile.values.relatedRepositories);
  const riskyRoute = ['release-push', 'multi-repo-integration', 'contract-first', 'bugfix-live-system', 'weak-test-legacy'].includes(route);
  const securityLike = triggers.length > 0;
  const multiContext = related.length > 0 || units.length > 1 || dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)).length > 1;
  const irreversible = matchesAny(task, ['delete', 'drop', 'truncate', 'migrate production', 'deploy', 'release', 'merge', 'pipeline']);
  const broadTask = breadth.level !== 'narrow';
  const eligible = !riskyRoute && !securityLike && !multiContext && !irreversible && !broadTask && files.length <= 5;
  reasons.push(eligible ? 'Eligible: one small scope, no risk triggers, no multi-context ambiguity.' : 'Not eligible for micro/tiny fast-pass.');
  if (riskyRoute) reasons.push(`Route ${route} needs normal preflight.`);
  if (securityLike) reasons.push(`Security/tool triggers present: ${triggers.join('; ')}.`);
  if (multiContext) reasons.push('Multiple repos, units, or context buckets require normal preflight.');
  if (irreversible) reasons.push('Task wording suggests irreversible/release/data action.');
  if (broadTask) reasons.push(`Task breadth is ${breadth.level}: ${breadth.signals.join('; ')}.`);
  if (files.length > 5) reasons.push(`Changed files count ${files.length} exceeds fast-pass threshold.`);
  if (surfaces.includes('rendered-product-ui')) reasons.push('Rendered UI work can still be fast-pass only with rendered/behavior evidence.');
  return { eligible, reasons };
}

function taskBreadthAssessment(task, files = [], surfaces = []) {
  const text = String(task || '').toLowerCase();
  const signals = [];
  const broadPhrases = [
    'full game',
    'fuller product',
    'closer to a full',
    'more fully developed',
    'complete experience',
    'polish experience',
    'multiple improvements',
    'bring it more',
    'whole workflow',
    'end-to-end',
  ];
  const interactionPhrases = ['interactive', 'stateful', 'workflow', 'settings', 'mode', 'difficulty', 'animation', 'feedback', 'dashboard', 'wizard', 'multi-step', 'gameplay', 'turn'];
  if (matchesAny(text, broadPhrases)) signals.push('broad product/experience wording');
  if (matchesAny(text, interactionPhrases)) signals.push('interactive/stateful behavior');
  if (matchesAny(text, ['logic', 'rules', 'ai behavior', 'computer opponent', 'smart opponent'])) signals.push('domain logic or AI behavior');
  if (matchesAny(text, ['qa', 'test plan', 'human tester', 'manual test'])) signals.push('QA/handoff expectation');
  const surfaceCount = dedupe(surfaces.filter(Boolean)).length;
  if (surfaceCount > 1) signals.push(`${surfaceCount} testing surfaces`);
  if (files.length > 5) signals.push(`${files.length} changed files`);
  const level = signals.length >= 2 || files.length > 5 ? 'broad' : signals.length === 1 ? 'moderate' : 'narrow';
  return { level, signals };
}

function routeConfidence({ task, route, files, units, surfaces, profile, triggers }) {
  let score = 60;
  if (task) score += 10;
  if (route && route !== 'standard') score += 5;
  if (files.length) score += 5;
  if (units.length && units.every((unit) => unit.contextBucket && unit.testSurface)) score += 10;
  if (surfaces.length) score += 5;
  if (profile.path) score += 5;
  if (triggers.length) score -= 10;
  if (score >= 85) return 'high';
  if (score >= 65) return 'medium';
  return 'low';
}

function qualityFloorRows({ task, git, units, surfaces, qaMode, packets }) {
  const hasVerificationPacket = packets.some((packet) => ['developer-verification', 'manual-smoke', 'route', 'review', 'release'].includes(packet.kind));
  const hasQa = packets.some((packet) => packet.kind === 'qa-script');
  const durableContextLikely = matchesAny(task, ['context', 'docs', 'learning', 'process', 'workflow', 'scenario', 'api contract', 'deployable unit']);
  return [
    { item: 'Changed-files awareness', status: git.changedFiles.length || git.status === '' ? 'pass' : 'note', detail: `${git.changedFiles.length} changed file(s); status ${formatInlineStatus(git.status)}` },
    { item: 'One verification path', status: hasVerificationPacket ? 'pass' : 'open', detail: hasVerificationPacket ? 'evidence packet present' : 'run/check one relevant automated, manual, rendered, API, or data path' },
    { item: 'Surface-correct evidence', status: surfaces.length ? 'pass' : 'open', detail: surfaces.join(', ') || 'surface not detected' },
    { item: 'Context placement decision', status: durableContextLikely || units.some((unit) => unit.contextBucket) ? 'note' : 'open', detail: durableContextLikely ? 'durable context likely; decide bucket' : formatInlineList(units.map((unit) => unit.contextBucket).filter(Boolean)) || 'not configured' },
    { item: 'Human QA readiness', status: qaMode && (hasQa || !requiresHumanQa(task, surfaces)) ? 'note' : 'open', detail: requiresHumanQa(task, surfaces) ? 'QA Markdown needed when handing to testers' : 'QA optional for this route' },
    { item: 'Developer finish control', status: 'pass', detail: 'commit/push require approval; merge/deploy/release forbidden by default' },
    { item: 'Confidence summary', status: 'open', detail: 'include proved/inferred/human-judgment/safe-next-action at final response' },
  ];
}

function requiresHumanQa(task, surfaces) {
  return matchesAny(task, ['qa', 'tester', 'youtrack', 'ticket', 'production issue']) || surfaces.some((surface) => ['rendered-product-ui', 'api-contract', 'data-persistence', 'integration-provider'].includes(surface));
}

function formatQualityFloorTable(rows) {
  return `| Item | Status | Detail |
| --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.item)} | ${row.status} | ${escapeCell(row.detail)} |`).join('\n')}`;
}

function safeDefaultsForPreflight(route, fast, profile) {
  return [
    fast.eligible ? 'Use inline fast-pass unless new risk appears.' : 'Use normal preflight packet before implementation.',
    'Do not commit or push without explicit human approval.',
    'Do not merge, deploy, release, create MR/PR, trigger pipeline, or move files between environments.',
    profile.accessibilityReviewPolicy ? `Accessibility policy: ${profile.accessibilityReviewPolicy}.` : 'Accessibility is optional unless profile/human requires it.',
    `Route ${route} uses the minimum evidence needed for the likely failure mode.`,
  ];
}

function preflightProved(route, units, surfaces, git) {
  return [`route selected as ${route}`, `${units.length} affected unit candidate(s)`, `${surfaces.length || 1} testing surface candidate(s)`, `git status observed as ${formatInlineStatus(git.status)}`];
}

function preflightInferred(route, qaMode) {
  return [`QA mode inferred as ${qaMode}`, `artifact budget inferred from route ${route}`];
}

function preflightHumanJudgment(fast, triggers) {
  const items = [];
  if (!fast.eligible) items.push('confirm normal-route scope before implementation when ambiguity matters');
  if (triggers.length) items.push('approve or cap security/tool-triggered actions before use');
  items.push('approve commit/push choice at finish');
  return items;
}

function confidenceBlock({ proved = [], inferred = [], human = [], nextAction = '' }) {
  return `### Proved

${formatList(proved)}

### Inferred

${formatList(inferred)}

### Needs Human Judgment

${formatList(human)}

### Safe Next Action

- ${nextAction || 'continue with the smallest route that satisfies the quality floor'}`;
}

function recommendedContextFile(unit) {
  if (unit.contextBucket) return `${unit.contextBucket}/context.md`;
  if (unit.path && unit.path !== '.') return `${unit.path}/.ai-local/sdlc-profile.md`;
  return '.ai-local/sdlc-profile.md';
}

function bugNextCommand(action, task) {
  const order = ['reproduce', 'diagnose', 'fix-plan', 'verify', 'qa'];
  const next = order[order.indexOf(action) + 1] || 'qa';
  return action === 'qa' ? `sdlc qa scenario --task "${escapeCommandArg(task)}"` : `sdlc bug ${next} --task "${escapeCommandArg(task)}"`;
}

function qaScenarioRecords(repo, options = {}) {
  const profile = loadProfile(repo);
  const candidates = [
    options.library ? resolve(repo, options.library) : '',
    profile.values.qaScenarioLibrary ? resolve(repo, profile.values.qaScenarioLibrary) : '',
    join(repo, '.ai-local', 'qa-scenarios.md'),
    join(repo, 'docs', 'qa-scenarios.md'),
  ].filter(Boolean);
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) return [];
  const text = readFileSync(path, 'utf8');
  const sections = text.split(/^##\s+/m).slice(1);
  return sections.map((section) => {
    const [titleLine, ...bodyLines] = section.split(/\r?\n/);
    const title = titleLine.trim();
    const body = bodyLines.join('\n');
    return {
      id: firstMatch(body, /^ID:\s*(.+)$/m) || slug(title),
      title,
      unit: firstMatch(body, /^Unit:\s*(.+)$/m) || '',
      surface: firstMatch(body, /^Surface:\s*(.+)$/m) || '',
      path,
      body: body.trim(),
    };
  });
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

function inferBootstrapFramework(repo) {
  if (hasFileExt(repo, ['.csproj', '.sln'])) return 'dotnet';
  if (existsAny(repo, ['package.json'])) return 'node';
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) return 'deno';
  return 'generic';
}

function testBootstrapChecklist(framework) {
  if (framework === 'dotnet') return [
    'Create or identify the focused test project.',
    'Add project reference to the unit under test.',
    'Add required test packages through the package manager.',
    'Add the test project to the solution when the repo uses a solution file.',
    'Add the smallest regression/invariant test for the active task.',
    'Run the focused test project.',
    'Run solution build/test when feasible.',
    'Record dependency warnings separately from failures.',
  ];
  if (framework === 'node') return [
    'Detect package manager and existing test runner.',
    'Add or verify the focused test runner without broad tool churn.',
    'Add the smallest regression/unit/component test for the active task.',
    'Run the focused test.',
    'Run build/typecheck when feasible.',
    'Record missing test harness as a cap if adding one is out of scope.',
  ];
  if (framework === 'deno') return [
    'Confirm deno.json/deno.jsonc task conventions.',
    'Add the smallest Deno test near the changed unit.',
    'Run the focused deno test command.',
    'Run broader Deno check/task when feasible.',
  ];
  return [
    'Identify the smallest testable unit.',
    'Choose the lowest-friction test harness already used by the repo.',
    'Add a focused regression/invariant check.',
    'Run the focused check.',
    'Record harness/setup caps separately from product failures.',
  ];
}

function testRecommendationsForSurfaces(surfaces = [], task = '') {
  const text = String(task || '').toLowerCase();
  const recommendations = [];
  const surfaceText = surfaces.join(' ').toLowerCase();
  if (matchesAny(`${text} ${surfaceText}`, ['foreign key', 'relationship', 'ef core', 'sql', 'database', 'data'])) recommendations.push('Add the smallest data/ORM invariant test that fails for the observed root cause.');
  if (matchesAny(`${text} ${surfaceText}`, ['route', 'endpoint', 'download', 'api'])) recommendations.push('Add focused API/controller/route coverage for old/new behavior when a harness exists.');
  if (matchesAny(`${text} ${surfaceText}`, ['ui', 'screen', 'page', 'layout'])) recommendations.push('Add rendered/manual smoke coverage for the changed user-visible path.');
  if (matchesAny(`${text} ${surfaceText}`, ['no automated tests', 'manual qa', 'weak test', 'legacy'])) recommendations.push('Create a test-bootstrap plan or record why manual QA is the accepted cap.');
  if (matchesAny(`${text} ${surfaceText}`, ['dependency', 'package', 'upgrade'])) recommendations.push('Run startup/build/focused regression checks that would catch the dependency break.');
  if (!recommendations.length) recommendations.push('Use the existing test command when available, or record why no new test is needed.');
  return dedupe(recommendations);
}

function classifyCommandFailure(command, status, stderr) {
  const text = `${command}\n${stderr}`.toLowerCase();
  if (matchesAny(text, ['eperm', 'permission denied', 'operation not permitted', 'sandbox'])) return { kind: 'permission/sandbox failure', evidenceUse: 'cap until rerun with permission or alternate output path', nextAction: 'rerun with approved permission or record sandbox cap' };
  if (matchesAny(text, ['unexpected token', 'unterminated', 'quote', 'parsererror', 'syntax error near', 'no matches found'])) return { kind: 'invocation/tooling failure', evidenceUse: 'not product evidence', nextAction: 'fix quoting/shell invocation and rerun' };
  if (matchesAny(text, ['command not found', 'not recognized', 'cannot find module', 'no such file or directory', 'missing script'])) return { kind: 'environment/setup cap', evidenceUse: 'setup evidence, not product failure', nextAction: 'record missing tool/dependency or install with approval' };
  if (matchesAny(text, ['timeout', 'econnreset', 'enotfound', 'rate limit', 'temporarily unavailable'])) return { kind: 'flaky/transient external failure', evidenceUse: 'inconclusive until retried or capped', nextAction: 'retry once or record external cap' };
  if (String(status) !== '' && Number(status) !== 0) return { kind: 'product/test failure', evidenceUse: 'valid failing evidence if command invocation was correct', nextAction: 'debug failing check or record accepted cap' };
  return { kind: 'pass or unclassified', evidenceUse: 'usable only with command output context', nextAction: 'record check result normally' };
}

function optionFiles(options, fallback = []) {
  if (!options.files) return fallback;
  return splitList(options.files).map((file) => file.trim()).filter(Boolean);
}

function qaSummaryForMode(mode) {
  if (mode === 'api-contract') return 'Validate the changed API behavior through Swagger/OpenAPI, an approved API client, or documented request/response evidence. This Markdown is for human QA or developer-test handoff and does not assume QA will inspect source code or use AI.';
  if (mode === 'cli-workflow') return 'Validate the changed command-line behavior through command execution, help/version smoke, expected output, and error handling. This script is for human or developer-test handoff and should name exact commands when safe.';
  if (mode === 'background-job') return 'Validate the changed background job, queue, import/export, or scheduled process through a dry-run, sandbox execution, logs, output files, or explicit environment caps.';
  if (mode === 'data-persistence') return 'Validate the changed data behavior with QA-safe data setup, visible application/API evidence, and approved SQL/log checks when available. This script is for human testers and tracking-system paste-in.';
  if (mode === 'integration-provider') return 'Validate the provider or cross-system behavior through sandbox-safe requests, callbacks, exports/imports, or logs approved for QA. This script does not require source-code inspection.';
  if (mode === 'interactive-stateful') return 'Validate the changed interactive or stateful workflow, including setup, mode/settings changes, primary user path, feedback/animation, reset/recovery, and nearby regression behavior.';
  if (mode === 'multi-repo-workflow') return 'Validate the full tester-visible workflow that spans repositories or deployable units. The script should hide repository mechanics and focus on environment, steps, expected results, and release-order caps.';
  if (mode === 'docs-process') return 'Validate the documentation/process change by checking the intended reader path, links, examples, and whether current instructions match source truth.';
  if (mode === 'scenario-retest') return 'Validate the named QA/business scenario in the target environment and record pass/fail evidence for the tracking ticket.';
  return 'Validate the changed behavior for this task and regression-test the affected site/application areas. This Markdown is intended to be pasted into YouTrack and followed by human QA testers. It does not assume QA will use AI, inspect source code, run developer commands, or know the SDLC.';
}

function validationLadderRows(task, surfaces = []) {
  const text = String(task || '').toLowerCase();
  const rows = [];
  const add = (surface, steps) => rows.push({ surface, steps });
  if (surfaces.includes('rendered-product-ui') || matchesAny(text, ['ui', 'screen', 'browser', 'rendered', 'interactive', 'game', 'dashboard', 'form'])) {
    add('UI / rendered product', ['browser/rendered automation', 'local dev server smoke', 'screenshot or manual rendered notes', 'build-only cap']);
  }
  if (surfaces.includes('api-contract') || matchesAny(text, ['api', 'swagger', 'openapi', 'endpoint', 'contract'])) {
    add('API / contract', ['automated API/integration test', 'Swagger/API-client smoke', 'contract/static review', 'build-only cap']);
  }
  if (matchesAny(text, ['cli', 'command line', 'terminal command'])) {
    add('CLI / command workflow', ['command execution test', 'golden output or snapshot', 'help/version command smoke', 'static review cap']);
  }
  if (surfaces.includes('background-job') || matchesAny(text, ['worker', 'job', 'queue', 'import', 'export', 'scheduled'])) {
    add('Backend job / worker', ['unit/integration test', 'local job dry-run', 'log/queue/data evidence', 'static review cap']);
  }
  if (surfaces.includes('data-persistence') || matchesAny(text, ['database', 'sql', 'migration', 'data'])) {
    add('Database / data', ['migration/schema test', 'read-only safe evidence', 'generated SQL/log review', 'manual DBA/developer cap']);
  }
  if (surfaces.includes('integration-provider') || matchesAny(text, ['webhook', 'provider', 'third-party', 'integration'])) {
    add('External integration', ['sandbox integration test', 'provider/API callback smoke', 'contract/log evidence', 'integration cap']);
  }
  if (surfaces.includes('docs-process') || matchesAny(text, ['docs', 'readme', 'process'])) {
    add('Docs / process', ['render/link/example check', 'source-truth comparison', 'reader-path review', 'docs-only cap']);
  }
  if (!rows.length) add('Generic service behavior', ['focused unit/integration test', 'build/typecheck', 'manual smoke', 'static review cap']);
  return rows;
}

function formatValidationLadder(rows) {
  return rows.map((row) => `### ${row.surface}\n\n${row.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`).join('\n\n');
}

function scenarioRetestSection(options = {}) {
  const scenario = options.scenario || options.case || '';
  if (!scenario) return '';
  return `### QA-Scenario: ${scenario}

**Purpose:** Retest the named business/QA scenario connected to this task.

**Steps**
1. Prepare the scenario-specific test data and user role.
   - Expected: Preconditions match the tracking ticket.
2. Execute the scenario from start to finish in QA/staging.
   - Expected: The scenario completes with the expected result.
3. Record environment, build/branch, and observed outcome.
   - Expected: The tracking ticket has enough detail for release review.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`;
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

function taskType(task) {
  const text = String(task || '').toLowerCase();
  if (matchesAny(text, ['bug', 'fix', 'regression', 'broken', 'failure'])) return 'bugfix';
  if (matchesAny(text, ['upgrade', 'package', 'dependency', 'maintenance'])) return 'maintenance';
  if (matchesAny(text, ['optimize', 'performance', 'speed'])) return 'optimization';
  if (matchesAny(text, ['release', 'handoff', 'push'])) return 'release/handoff';
  if (matchesAny(text, ['review', 'audit', 'inspect'])) return 'review';
  return 'feature/change';
}

function taskRunId(task, options = {}) {
  return options.taskId || `${stamp()}-${slug(task || 'task')}`;
}

function expectedQaNeed(task, files, profile = {}) {
  const text = `${task} ${profile.verificationMaturity || ''}`.toLowerCase();
  if (matchesAny(text, ['no automated tests', 'manual qa', 'youtrack', 'qa script'])) return 'human QA Markdown script expected';
  if (files.some(needsManualQa)) return 'likely human QA or manual smoke';
  if (matchesAny(text, ['docs', 'readme'])) return 'usually no QA script unless behavior is affected';
  return 'decide after impact packet';
}

function taskLedgerRows(repo, packets) {
  const kinds = ['touched', 'impact', 'developer-verification', 'manual-smoke', 'qa-script', 'test-plan', 'data', 'integration', 'git-action'];
  return kinds.map((kind) => {
    const packet = packets.find((item) => item.kind === kind);
    return `| ${kind} | ${packet ? escapeCell(relative(repo, packet.path)) : 'missing'} | ${packet ? (completionTrackedPacketKinds().includes(kind) ? (packet.completed ? 'yes' : 'no') : 'n/a') : 'missing'} |`;
  });
}

function taskMetrics(repo, task, git, packets) {
  const profile = loadProfile(repo);
  const commands = discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')));
  return {
    changedFiles: git.changedFiles.length,
    touchedSurfaces: dedupe(git.changedFiles.map(classifyTouchedSurface)).length,
    packets: packets.length,
    completedTrackedPackets: packets.filter((packet) => completionTrackedPacketKinds().includes(packet.kind) && packet.completed).length,
    hasQaScript: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no',
    hasManualSmoke: packets.some((packet) => packet.kind === 'manual-smoke' && packet.completed) ? 'yes' : 'no',
    verificationMaturity: verificationMaturity(profile.values, commands),
    route: task ? inferRouteFromTask(task, git, profile.values) : 'unknown',
  };
}

function latestPacketPath(repo, packets, kind) {
  const packet = packets.find((item) => item.kind === kind);
  return packet ? relative(repo, packet.path) : 'missing';
}

function shouldSuggestTestPlan(repo, task, files) {
  const profile = loadProfile(repo);
  const maturity = verificationMaturity(profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')))).toLowerCase();
  return maturity.includes('manual qa') || maturity.includes('no automated') || files.some((file) => classifyTouchedSurface(file) === 'dependencies') || matchesAny(String(task || '').toLowerCase(), ['package', 'dependency', 'upgrade', 'missing test', 'no automated']);
}

function taskEvidenceSummary(repo, packets) {
  const latestByKind = dedupe(packets.map((packet) => packet.kind)).map((kind) => packets.find((packet) => packet.kind === kind));
  return latestByKind.slice(0, 12).map((packet) => `${packet.kind}: ${relative(repo, packet.path)}${completionTrackedPacketKinds().includes(packet.kind) ? ` (${packet.completed ? 'completed' : 'open'})` : ''}`);
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

function qaSourceHints(repo, options = {}) {
  const hints = { scope: [], risks: [] };
  for (const key of ['fromImpact', 'impact']) {
    if (!options[key]) continue;
    const text = readPacketTextIfExists(repo, options[key]);
    hints.scope.push(...extractBulletsAfter(text, '## QA Coverage Areas'));
    hints.risks.push(...extractBulletsAfter(text, '## Risks, Unknowns, And Caps'));
  }
  for (const key of ['fromTouched', 'touched']) {
    if (!options[key]) continue;
    const text = readPacketTextIfExists(repo, options[key]);
    hints.scope.push(...extractTableColumn(text, 1).filter((item) => item && !['Surface', '---'].includes(item)).map((item) => `Validate touched surface: ${item}.`));
  }
  hints.scope = dedupe(hints.scope).slice(0, 12);
  hints.risks = dedupe(hints.risks).slice(0, 12);
  return hints;
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

function verificationMaturity(profile, commands) {
  return profile.verificationMaturity || inferVerificationMaturity(commands);
}

function readPacketTextIfExists(repo, value) {
  const path = resolve(repo, value);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function extractBulletsAfter(text, heading) {
  if (!text) return [];
  const start = text.indexOf(heading);
  if (start < 0) return [];
  const rest = text.slice(start + heading.length);
  const end = rest.search(/\n## /);
  const section = end >= 0 ? rest.slice(0, end) : rest;
  return section.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim()).filter(Boolean);
}

function extractTableColumn(text, columnIndex) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|') && line.includes('|'))
    .map((line) => line.split('|').map((cell) => cell.trim())[columnIndex + 1])
    .filter(Boolean);
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

function completionTrackedPacketKinds() {
  return ['review', 'release', 'developer-verification', 'qa-script', 'manual-smoke'];
}

function appendPacketCompletion(packetPath, entry) {
  const existing = readFileSync(packetPath, 'utf8');
  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  writeFileSync(packetPath, `${existing}${separator}${entry}`, 'utf8');
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

function impactAreas(task, files, profile = {}) {
  const text = `${task} ${profile.repositoryRole || ''}`.toLowerCase();
  const areas = [];
  if (files.some((file) => classifyTouchedSurface(file) === 'frontend/UI') || matchesAny(text, ['site', 'page', 'screen', 'ui', 'client', 'animation', 'game', 'turn', 'workflow', 'feature'])) areas.push('user-visible site/application workflow');
  if (files.some((file) => classifyTouchedSurface(file) === 'backend/API') || matchesAny(text, ['api', 'service', 'endpoint'])) areas.push('API/service behavior');
  if (files.some((file) => classifyTouchedSurface(file) === 'database/storage') || matchesAny(text, ['database', 'sql', 'data', 'storage'])) areas.push('data/storage behavior');
  if (files.some((file) => classifyTouchedSurface(file) === 'external integration') || matchesAny(text, ['third party', 'third-party', 'vendor', 'webhook', 'integration'])) areas.push('external integration behavior');
  if (files.some((file) => classifyTouchedSurface(file) === 'dependencies') || matchesAny(text, ['package', 'dependency', 'upgrade'])) areas.push('dependency/package behavior');
  if (!areas.length) areas.push('task-specific behavior to identify during implementation');
  return dedupe(areas);
}

function qaAreas(task, files) {
  const areas = impactAreas(task, files, {});
  const checks = areas.map((area) => `Validate ${area}.`);
  if (files.some((file) => classifyTouchedSurface(file) === 'config/environment')) checks.push('Validate environment/configuration-dependent behavior.');
  if (files.some((file) => classifyTouchedSurface(file) === 'dependencies')) checks.push('Run a regression smoke path for dependency/package upgrade side effects.');
  if (!checks.length) checks.push('Validate the changed behavior described in the task.');
  return dedupe(checks);
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

function qaDomainSections(task, files) {
  const text = String(task || '').toLowerCase();
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const sections = [];

  if (surfaces.includes('frontend/UI') || matchesAny(text, ['ui', 'site', 'page', 'screen', 'workflow', 'react'])) {
    sections.push(`### QA-003: UI / Browser Workflow

**Purpose:** Validate the visible workflow from a tester's point of view.

**Steps**
1. Open the affected page or workflow in the QA environment.
   - Expected: The page loads without visible errors.
2. Complete the changed action in the most common browser/device combination.
   - Expected: The visible state, copy, animation, and success/error behavior match the expected change.
3. Repeat on one secondary viewport or browser when practical.
   - Expected: The layout remains usable and no text overlaps or controls disappear.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('backend/API') || matchesAny(text, ['api', 'service', 'endpoint'])) {
    sections.push(`### QA-004: API-Backed Behavior

**Purpose:** Validate the user-visible result of the changed service/API path.

**Steps**
1. Perform the site/app action that calls the affected service.
   - Expected: The action succeeds and the user-visible result is correct.
2. Try a common validation or error case for the same action.
   - Expected: The site/app shows the expected error or fallback without an unexpected failure.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('database/storage') || matchesAny(text, ['database', 'sql', 'data', 'stored procedure'])) {
    sections.push(`### QA-005: Data Persistence

**Purpose:** Validate that changed data behavior is correct with safe QA data.

**Steps**
1. Create or update QA-safe data through the affected workflow.
   - Expected: The workflow saves the expected data.
2. Refresh, revisit, or search for the same record.
   - Expected: The saved data displays correctly and existing related data is unchanged.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('external integration') || matchesAny(text, ['third-party', 'third party', 'webhook', 'integration', 'vendor'])) {
    sections.push(`### QA-006: External Integration Observable Result

**Purpose:** Validate the integration result that QA can observe.

**Steps**
1. Confirm the sandbox/provider/test configuration is available.
   - Expected: QA has the required non-production integration path or a documented cap.
2. Trigger the affected integration behavior.
   - Expected: The site/app records the expected result, message, status, or fallback.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  if (surfaces.includes('dependencies') || matchesAny(text, ['package', 'dependency', 'upgrade'])) {
    sections.push(`### QA-007: Package / Maintenance Regression

**Purpose:** Smoke the most important workflows after a dependency or maintenance change.

**Steps**
1. Open the primary application page or startup workflow.
   - Expected: The application starts and loads normally.
2. Run one high-value existing workflow near the changed package/tooling area.
   - Expected: Existing behavior is unchanged.

**Result**
- Pass/Fail:
- Actual result:
- Notes:`);
  }

  return sections.join('\n\n');
}

function qaReviewFindings(text) {
  const findings = [];
  const required = ['## Summary', '## Scope', '## Environment', '## Preconditions', '## Test Cases', '## Regression Checklist', '## Known Risks / Notes'];
  const isApiMode = /QA Mode:\s*api-contract/i.test(text);
  for (const heading of required) {
    if (!text.includes(heading)) findings.push(`Missing section: ${heading}.`);
  }
  if (!/Expected:/i.test(text)) findings.push('Expected results are missing or too sparse.');
  const developerOnlyLines = text
    .split(/\r?\n/)
    .filter((line) => /inspect source|developer-only|run npm|run git|run tests/i.test(line))
    .filter((line) => !/does not assume|do not|should not|out of scope/i.test(line));
  if (developerOnlyLines.length) findings.push('QA script may contain developer-only language; QA testers should follow site/app steps.');
  if (!isApiMode && /Browser\/device:\s*$/m.test(text)) findings.push('Browser/device field is blank.');
  if (isApiMode && /API client \/ Swagger:\s*$/m.test(text)) findings.push('API client / Swagger field is blank.');
  if (/Test account\/data:\s*$/m.test(text)) findings.push('Test account/data field is blank.');
  if (/Feature flags\/config:\s*$/m.test(text)) findings.push('Feature flags/config field is blank.');
  if (!isApiMode && /Navigate to the affected area/i.test(text)) findings.push('Step may be too vague: name the affected page/workflow when known.');
  if (isApiMode && !/Expected status|Expected response|Request payload/i.test(text)) findings.push('API QA script should include request payload and expected status/response.');
  return dedupe(findings);
}

function inferVerificationMaturity(commands) {
  if (commands.test && commands.build && commands.lint) return 'partial automated tests';
  if (commands.test) return 'smoke tests or partial automated tests';
  return 'manual QA only / no automated tests configured';
}

function testPlanRecommendations(maturity, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const recommendations = [];
  if (maturity.toLowerCase().includes('no automated') || maturity.toLowerCase().includes('manual qa')) {
    recommendations.push('Produce a human QA Markdown script and add the smallest future automated test around the touched behavior.');
  }
  if (surfaces.includes('backend/API')) recommendations.push('Prefer an API/service smoke or characterization test for the changed endpoint/service path.');
  if (surfaces.includes('frontend/UI')) recommendations.push('Prefer a rendered smoke check or focused UI interaction test for the changed workflow.');
  if (surfaces.includes('database/storage')) recommendations.push('Add a data/schema validation or migration smoke where practical.');
  if (surfaces.includes('external integration')) recommendations.push('Add a sandbox/mock integration check or record the unavailable integration cap.');
  if (surfaces.includes('dependencies')) recommendations.push('Prefer the smallest startup/build/regression smoke that would fail if the package upgrade broke the touched workflow.');
  if (surfaces.includes('frontend/UI') && surfaces.includes('backend/API')) recommendations.push('For mixed UI/API work, add one task-level test at the narrowest stable boundary and keep the rest as manual QA or smoke caps if the repo lacks harnesses.');
  if (!recommendations.length) recommendations.push('Run existing project checks and record why no new test is needed for this task.');
  return recommendations;
}

function proposedCommitMessage(files, impactPacket, options = {}) {
  const caseId = options.caseId || '';
  const prefix = caseId ? `${caseId}: ` : '';
  if (!caseId && requiresCaseId(options.profile || {})) return 'CASE ID REQUIRED: ask for the case identifier before suggesting a commit message';
  if (impactPacket?.text) {
    const task = firstMatch(impactPacket.text, /^Task:\s*(.+)$/m);
    if (task) {
      const message = task.length > 72 ? task.slice(0, 69).trimEnd() + '...' : task;
      return `${prefix}${message}`;
    }
  }
  const surfaces = dedupe(files.map(classifyTouchedSurface)).filter((item) => item !== 'source/other');
  if (surfaces.length === 1) return `${prefix}Update ${surfaces[0]}`;
  if (files.length) return `${prefix}Update task implementation`;
  return 'No tracked changes to commit';
}

function taskCaseId(task, options = {}, profile = {}) {
  if (options.case || options.caseId) return options.case || options.caseId;
  const text = String(task || '');
  const match = text.match(/\b[A-Z][A-Z0-9]+[_-]\d+\b|\b[A-Z]{2,10}-\d+\b/);
  return match ? match[0] : profile.currentCaseId || '';
}

function requiresCaseId(profile = {}) {
  return /^(true|yes|required)$/i.test(String(profile.requireCaseIdInCommitMessages || profile.requireCaseId || ''));
}

function caseIdPolicy(profile = {}) {
  return requiresCaseId(profile) ? `required (${profile.commitMessageFormat || 'CASE_ID: concise summary'})` : 'optional unless task/profile requires it';
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

function printEvidenceRows(rows) {
  console.log('\n| Evidence | Level | Summary |');
  console.log('| --- | --- | --- |');
  for (const row of rows) console.log(`| ${escapeCell(row.id)} | ${row.level} | ${escapeCell(row.summary)} |`);
}

function printEvidenceStatusRows(rows) {
  console.log('\n| Evidence | Level | Status | Summary |');
  console.log('| --- | --- | --- | --- |');
  for (const row of rows) console.log(`| ${escapeCell(row.id)} | ${row.level} | ${row.status} | ${escapeCell(row.summary)} |`);
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

function finishIntentNotes(intent) {
  if (intent === 'keep-change') {
    return formatList([
      'Treat the result as real product work, not a disposable fixture experiment.',
      'Require verification evidence or explicit caps before recommending a commit.',
      'Generate a commit preview only after changed-file scope and QA/verification readiness are clear.',
      'Push, merge, deploy, release, MR/PR creation, pipeline triggers, and file movement still require separate explicit approval.',
    ]);
  }
  if (intent === 'handoff-only') {
    return formatList([
      'Prepare evidence, QA Markdown, and next actor notes only.',
      'Do not recommend commit/push as the default next action unless the human asks.',
      'Name open caps and owner for the handoff.',
    ]);
  }
  return formatList([
    'Normal finish decision: summarize proof, caps, QA readiness, and human-controlled Git/release options.',
  ]);
}

function finishCommitReadiness(intent, open) {
  if (intent === 'handoff-only') return 'not requested; handoff evidence only';
  if (open.length) return 'not ready without accepted caps';
  if (intent === 'keep-change') return 'ready for explicit human approval after commit preview';
  return 'ready for explicit human approval only';
}
