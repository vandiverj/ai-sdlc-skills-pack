import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendControlJsonLine, dedupe, escapeCell, fail, formatInlineList, formatInlineStatus, formatList, formatOptionList, indentList, parseOptions, printGateRows, printObject, printTable, readJsonIfExists, readJsonLines, safeWriteJsonFile, safeWriteTextFile, slug, splitList, stamp, toCamel, writeOrPrint } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile, normalizeKeys, profileAudit, profileDoctor, profileInit, profileShow, profileSuggest } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { runDashboard, runNext, runPlan, runResume, runStatus } from './run.mjs';
import { controlCurrentPointerPath, controlRunDir, controlRunRoot, ensureControlRunDir, nextActionForStage, readCurrentState, readCurrentStateInfo, validStateTransition } from './state.mjs';
import { matchRecipes, recipeCompile, recipeExplain, recipeList, recipeMatch, recipeRetire, recipeReview, recipeShow } from './recipes.mjs';
import { ensureEvidenceManifest, evidenceAdd, evidenceInit, evidencePlan, evidenceRequired, evidenceRequirementsForTask, evidenceStatus, evidenceStatusRows, readEvidenceManifest } from './evidence.mjs';
import { inferContracts, inferDirtySurfaces, inferLikelyRoute, inferRouteFromTask, securityTriggers } from './routes.mjs';
import { evalAddCase, evalReport, evalRun, scenarioList, scenarioShow, scenarioTest, scenarioValidate } from './scenarios.mjs';
import { adapterGenerate, hooksPlan } from './adapters.mjs';
import { indexBuild, indexQuery } from './index.mjs';
import { configDiff, configExplain, configExport, configImport, configNormalize, configValidate } from './config.mjs';
import { upgradeApply, upgradeExplain, upgradePlan } from './upgrade.mjs';
import { workspaceDoctor, workspaceGraph, workspaceImpact, workspaceInit, workspaceLedger, workspaceMap, workspacePacket, workspaceRepoRole, workspaceRepos, workspaceStatus } from './workspace.mjs';
import { multiLedger, multiPacket, multiQa, multiStatus } from './multi.mjs';
import { contractPacket } from './contract.mjs';
import { dataBoundary, dataEvidence, dataPacket, dataQueryPlan } from './data.mjs';
import { ticketDrift, ticketEvidence, ticketUpdatePreview } from './ticket.mjs';
import { integrationPacket } from './integration.mjs';
import { smokeComplete, smokePacket } from './smoke.mjs';
import { releaseComplete, releaseOrderNote, releasePacket, reviewComplete, reviewPacket } from './release.mjs';
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
import { createServices } from './services.mjs';
import { helpOnboarding, helpPrompts, helpWorkflow, printHelp } from './help.mjs';
import { policyCheck, policyDecision, policyExplain, policyList, policyRowsForAction, policyRowsForTask, policySimulate, policyValidateConfig } from './policy.mjs';
import { artifactBudget as artifactBudgetCommand, artifactBudgetForRoute, artifactMigrate, artifactSummarize, artifactValidate, formatArtifactBudget } from './artifacts.mjs';
import { addEvidenceFromCheck, checksDoctor, checksPlan, checksRun, classifyRunCheckFailure, summarizeCommandOutput } from './checks.mjs';
import { primaryQaSteps, qaBuild, qaOutlineForMode, qaValidate } from './qa.mjs';
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

  if (area === 'run-check') return runCheck(resolve(areaOptions.repo || process.cwd()), parseOptions(argv.slice(1)), argv.slice(1));
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
  if (area === 'intake' && action === 'packet') return intakePacket(repo, options);
  if (area === 'intake' && action === 'check') return intakeCheck(repo, options);
  if (area === 'context' && action === 'restore') return contextRestore(repo, options);
  if (area === 'context' && action === 'pack') return contextPack(repo, options);
  if (area === 'context' && action === 'audit') return contextAudit(repo, options);
  if (area === 'context' && action === 'freshness') return contextFreshness(repo, options);
  if (area === 'context' && action === 'conflict-check') return contextConflictCheck(repo, options);
  if (area === 'context' && (action === 'contradictions' || action === 'check')) return contextContradictions(repo, options);
  if (area === 'context' && action === 'inventory') return contextInventory(repo, options);
  if (area === 'context' && action === 'bucket-check') return contextBucketCheck(repo, options);
  if (area === 'context' && action === 'bucket-confidence') return contextBucketConfidence(repo, options);
  if (area === 'context' && action === 'resolve') return contextResolve(repo, options);
  if (area === 'context' && action === 'final-check') return contextFinalCheck(repo, options);
  if (area === 'context' && action === 'gate') return contextGate(repo, options);
  if (area === 'context' && action === 'place') return contextPlace(repo, options);
  if (area === 'context' && action === 'update-plan') return contextUpdatePlan(repo, options);
  if (area === 'context' && action === 'budget') return contextBudget(repo, options);
  if (area === 'context' && action === 'assemble') return contextAssemble(repo, options);
  if (area === 'context' && action === 'compact') return contextCompact(repo, options);
  if (area === 'context' && action === 'ledger') return contextLedger(repo, options);
  if (area === 'change' && (action === 'graph' || action === 'graph-lite')) return changeGraph(repo, options);
  if (area === 'search' && action === 'classify') return searchClassify(repo, options);
  if (area === 'search' && action === 'classify-results') return searchClassifyResults(repo, options);
  if (area === 'search' && action === 'retire-check') return searchRetireCheck(repo, options);
  if (area === 'recipe' && action === 'show') return recipeShow(rest[0] || options.route);
  if (area === 'recipe' && action === 'match') return recipeMatch(repo, options);
  if (area === 'recipe' && action === 'list') return recipeList(repo, options);
  if (area === 'recipe' && action === 'review') return recipeReview(repo, options);
  if (area === 'recipe' && action === 'retire') return recipeRetire(repo, options);
  if (area === 'recipe' && action === 'compile') return recipeCompile(repo, options, { evidenceRequirementsForTask });
  if (area === 'recipe' && action === 'explain') return recipeExplain(repo, options);
  if (area === 'task' && action === 'id') return taskId(repo, options);
  if (area === 'task' && action === 'current') return taskCurrent(repo, options);
  if (area === 'task' && action === 'preflight') return taskPreflight(repo, options);
  if (area === 'task' && (action === 'fast-pass' || action === 'fastpass')) return taskFastPass(repo, options);
  if (area === 'task' && action === 'start') return taskStart(repo, options);
  if (area === 'task' && (action === 'open')) return taskOpen(repo, options);
  if (area === 'task' && (action === 'bundle')) return taskBundle(repo, options);
  if (area === 'task' && action === 'status') return taskStatus(repo, options);
  if (area === 'task' && action === 'doctor') return taskDoctor(repo, options);
  if (area === 'task' && (action === 'review' || action === 'checkpoint')) return taskReview(repo, options);
  if (area === 'task' && action === 'ledger') return taskLedger(repo, options);
  if (area === 'task' && action === 'verify') return taskVerify(repo, options);
  if (area === 'task' && action === 'qa') return taskQa(repo, options);
  if (area === 'task' && (action === 'finish' || action === 'complete')) return taskFinish(repo, options);
  if (area === 'state' && action === 'init') return stateInit(repo, options);
  if (area === 'state' && action === 'current') return stateCurrent(repo, options);
  if (area === 'state' && action === 'advance') return stateAdvance(repo, options);
  if (area === 'state' && action === 'blockers') return stateBlockers(repo, options);
  if (area === 'state' && action === 'explain') return stateExplain(repo, options);
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
  if (area === 'run' && action === 'start') return runStart(repo, options);
  if (area === 'run' && action === 'finish') return runFinish(repo, options);
  if (area === 'workspace' && action === 'status') return workspaceStatus(repo, options);
  if (area === 'workspace' && action === 'init') return workspaceInit(repo, options);
  if (area === 'workspace' && action === 'doctor') return workspaceDoctor(repo, options);
  if (area === 'workspace' && action === 'packet') return workspacePacket(repo, options);
  if (area === 'workspace' && action === 'map') return workspaceMap(repo, options);
  if (area === 'workspace' && action === 'ledger') return workspaceLedger(repo, options);
  if (area === 'workspace' && action === 'graph') return workspaceGraph(repo, options);
  if (area === 'workspace' && action === 'impact') return workspaceImpact(repo, options);
  if (area === 'workmode' && action === 'detect') return workmodeDetect(repo, options);
  if (area === 'surface' && (action === 'list' || action === 'taxonomy')) return surfaceList();
  if (area === 'surface' && action === 'detect') return surfaceDetect(repo, options);
  if (area === 'unit' && action === 'map') return unitMap(repo, options);
  if (area === 'unit' && action === 'detect') return unitDetect(repo, options);
  if (area === 'unit' && action === 'doctor') return unitDoctor(repo, options);
  if (area === 'unit' && action === 'profile') return unitProfile(repo, options);
  if (area === 'unit' && action === 'list') return unitList(repo, options);
  if (area === 'unit' && action === 'resolve') return unitResolve(repo, options);
  if (area === 'unit' && action === 'context') return unitContext(repo, options);
  if (area === 'touched' && action === 'packet') return touchedPacket(repo, options);
  if (area === 'touched' && action === 'update') return touchedUpdate(repo, options);
  if (area === 'impact' && action === 'packet') return impactPacket(repo, options);
  if (area === 'interaction' && action === 'packet') return interactionPacket(repo, options);
  if (area === 'review' && action === 'packet') return reviewPacket(repo, options, releaseDependencies());
  if (area === 'review' && action === 'complete') return reviewComplete(repo, options, releaseDependencies());
  if (area === 'release' && action === 'packet') return releasePacket(repo, options, releaseDependencies());
  if (area === 'release' && action === 'complete') return releaseComplete(repo, options, releaseDependencies());
  if (area === 'qa' && (action === 'script' || action === 'packet')) return qaScript(repo, options);
  if (area === 'qa' && action === 'handoff') return qaHandoff(repo, options);
  if (area === 'qa' && action === 'scenarios') return qaScenarios(repo, rest[0] || options.command || 'list', options);
  if (area === 'qa' && action === 'outline') return qaOutline(repo, options);
  if (area === 'qa' && action === 'compare') return qaCompare(repo, options);
  if (area === 'qa' && ['ui', 'api', 'data', 'integration', 'scenario', 'multi', 'interactive', 'cli', 'job', 'docs'].includes(action)) return qaModeCommand(repo, action, options, rest);
  if (area === 'qa' && action === 'complete') return qaComplete(repo, options);
  if (area === 'qa' && action === 'review') return qaReview(repo, options);
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
  if (area === 'validate' && action === 'ladder') return validationLadder(repo, options);
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
  if (area === 'evidence' && action === 'provenance') return evidenceProvenance(repo, options);
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
  if (area === 'learn' && action === 'capture') return learnCapture(repo, options);
  if (area === 'learn' && action === 'quick') return learnQuick(repo, options);
  if (area === 'learn' && action === 'sanitize') return learnSanitize(repo, options);
  if (area === 'learn' && action === 'sync-check') return learnSyncCheck(repo, options);
  if (area === 'learn' && action === 'review-cycle') return learnReviewCycle(repo, options);
  if (area === 'learn' && action === 'archive') return learnArchive(repo, options);
  if (area === 'learn' && action === 'route') return learnRoute(repo, options);
  if (area === 'learn' && action === 'summary') return learnSummary(repo, options);
  if (area === 'learn' && action === 'review') return learnReview(repo, options);
  if (area === 'learn' && action === 'promote-check') return learnPromoteCheck(repo, options);
  if (area === 'learn' && action === 'candidates') return learnCandidates(repo, options);
  if (area === 'learn' && action === 'split') return learnSplit(repo, options);
  if (area === 'learn' && action === 'from-run') return learnFromRun(repo, options);
  if (area === 'learn' && action === 'suggest') return learnSuggest(repo, options);
  if (area === 'learn' && action === 'backlog') return learnBacklog(repo, options);
  if (area === 'learn' && action === 'promote') return learnPromote(repo, options);
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

function contextRestore(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const profileValues = profile.values;
  const related = splitList(profileValues.relatedRepositories);
  const contextDocs = contextDocCandidates(repo, profileValues).filter((item) => existsSync(item.path));

  const commands = discoverCommands(profileValues, packageJson);
  const output = {
    repository: repo,
    repositoryRole: profileValues.repositoryRole || '',
    branch: git.branch,
    status: git.status || 'clean',
    upstream: git.upstream,
    aheadBehind: `${git.behind} behind / ${git.ahead} ahead`,
    profilePath: profile.path ? relative(repo, profile.path) : 'not found',
    contextDocsFound: contextDocs.map((item) => `${item.label}: ${relative(repo, item.path) || '.'}`).join(', ') || 'none',
    sharedContextRoot: profileValues.sharedContextRoot || '',
    productContext: profileValues.productContext || '',
    repoContext: profileValues.repoContext || '',
    relatedRepositories: related.join(', '),
    commandsAvailable: Object.entries(commands)
      .filter(([, command]) => command)
      .map(([key, command]) => `${key}: ${command}`)
      .join('; ') || 'none discovered',
    likelyRoute: inferLikelyRoute(git),
    missingSetup: missingSetup(profileValues, commands).join('; ') || 'none detected',
    recommendedNextCommand: 'sdlc evidence init --route standard',
  };

  if (options.includeRelatedRepos && related.length > 0) {
    output.relatedRepoStatus = related.map((item) => summarizeRelatedRepo(repo, item)).join('\n');
  }

  printObject(output);
}

function contextPack(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context pack can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const related = splitList(profile.values.relatedRepositories);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const route = inferRouteFromTask(task, git, profile.values);
  const triggers = securityTriggers(task, profile.values);
  const dirtySurfaces = inferDirtySurfaces(task, git);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-context-pack.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Context Pack

Date: ${new Date().toISOString()}
Task: ${task}
Likely route: ${route}
Repository: ${repo}
Repository role: ${profile.values.repositoryRole || 'not configured'}
Branch: ${git.branch || 'unknown'}
Git status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Relevant Context Docs

${formatContextDocs(repo, existingDocs)}

## Missing Context

${formatContextDocs(repo, missingDocs)}

## Related Repositories

${formatList(related)}

## Contracts And Events Involved

${formatList(contracts)}

## Commands Likely Needed

${formatCommandList(commands, route)}

## Potential Dirty Surfaces

${formatList(dirtySurfaces)}

## Security And Tool Triggers

${formatList(triggers)}

## Recommended Next Command

\`\`\`bash
sdlc route start ${route}
\`\`\`
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function contextAudit(repo, options = {}) {
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = contextDocCandidates(repo, profile.values);
  const existingDocs = docs.filter((item) => existsSync(item.path));
  const missingDocs = docs.filter((item) => !existsSync(item.path));
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Audit

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Status: ${git.status || 'clean'}

## Process Docs

${formatContextDocs(repo, existingDocs.filter((item) => ['AGENTS.md', 'SDLC profile JSON', 'SDLC profile Markdown', 'Agent-local SDLC profile', 'Agent-local repository setup'].includes(item.label)))}

## Software Memory Docs

${formatContextDocs(repo, existingDocs.filter((item) => !['AGENTS.md', 'SDLC profile JSON', 'SDLC profile Markdown', 'Agent-local SDLC profile', 'Agent-local repository setup'].includes(item.label)))}

## Missing Or Unconfigured Context

${formatContextDocs(repo, missingDocs)}

## Guidance

- Process docs explain how agents should work.
- Software memory docs explain this software and cross-repo system state.
- External shared context roots are valid and should be configured in the SDLC profile instead of duplicated into every repository.
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextFreshness(repo, options = {}) {
  const task = options.task || '';
  const days = Number(options.days || 60);
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => contextFreshnessRow(repo, item, days));
  const existingRows = rows.filter((row) => row.status !== 'missing');
  const staleRows = rows.filter((row) => row.status === 'stale');
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Freshness

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Freshness window: ${days} days

## Context Documents Checked

| Document | Status | Age days | Path |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.ageDays} | ${escapeCell(row.path)} |`).join('\n')}

## Source Truth Cross-Check

- Changed files: ${git.changedFiles.length}
- Touched surfaces: ${formatInlineList(dedupe(git.changedFiles.map(classifyTouchedSurface)))}
- Context docs used by agent should be named in the task ledger.
- If stale docs contradict source files, source files win and context update should be recorded.

## Recommended Action

${formatList(contextFreshnessRecommendations(existingRows, staleRows, profile.values))}
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextConflictCheck(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so context conflict check can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const docs = contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => contextFreshnessRow(repo, item, Number(options.days || 60)));
  const stale = rows.filter((row) => row.status === 'stale');
  const missing = rows.filter((row) => row.status === 'missing');
  const contradictions = detectContextContradictions(repo, profile, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json'))), docs, splitList(profile.values.relatedRepositories));
  const severity = contextConflictSeverity({ stale, missing, contradictions, profile: profile.values });
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Conflict Check

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Severity: ${severity}

## Freshness And Ownership

| Document | Status | Age days | Path |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.ageDays} | ${escapeCell(row.path)} |`).join('\n')}

## Contradiction Signals

${formatList(contradictions)}

## Required Agent Behavior

- Treat source code, tests, logs, and current command output as stronger than stale context docs.
- Use context docs as routing memory, not proof.
- If stale context affected implementation or QA, record a context update plan or cap before finish.
- Product-sensitive facts stay in repo/unit/shared context, not global process learning.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
  if (severity === 'stale-and-risky' || severity === 'conflicting-sources') process.exitCode = 1;
}

function contextContradictions(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const docs = contextDocCandidates(repo, profile.values);
  const related = splitList(profile.values.relatedRepositories);
  const contradictions = detectContextContradictions(repo, profile, commands, docs, related);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Contradiction Check

Date: ${new Date().toISOString()}
Task: ${task || 'not provided'}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Possible Contradictions

${formatList(contradictions)}

## How To Use This

- Treat these as review prompts, not proof.
- Source files and runnable commands win over stale context docs.
- If a contradiction is real and durable, update the repo or shared context docs after the task.
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextInventory(repo, options = {}) {
  const profile = loadProfile(repo);
  const docs = contextDocCandidates(repo, profile.values);
  const rows = docs.map((item) => {
    const path = item.path;
    const exists = existsSync(path);
    return {
      label: item.label,
      status: exists ? 'present' : 'missing',
      placement: contextPlacement(repo, path),
      age: exists ? contextFreshnessRow(repo, item, Number(options.days || 60)).ageDays : '',
      path: relative(repo, path) || path,
    };
  });
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Inventory

Date: ${new Date().toISOString()}
Repository: ${repo}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Inventory

| Context | Status | Placement | Age days | Path |
| --- | --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.label)} | ${row.status} | ${row.placement} | ${row.age} | ${escapeCell(row.path)} |`).join('\n')}

## Placement Model

- Temporary task evidence belongs in ignored .ai-local/.
- Stable repository-specific software facts belong in repo docs when the team accepts tracked docs.
- Cross-repo product/service/workflow/release facts belong in the shared context root.
- Process mechanics belong in the SDLC pack, not downstream software memory.
`;

  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextBucketCheck(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so context bucket placement can be checked.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const facts = splitList(options.facts || options.fact || '');
  const rows = units.map((unit) => `| ${escapeCell(unit.name)} | ${escapeCell(unit.path)} | ${escapeCell(unit.contextBucket || 'not configured')} | ${escapeCell(unit.durableContextFile || recommendedContextFile(unit))} | ${escapeCell(unit.testSurface || 'not configured')} |`);
  const recommendations = [
    ...units.filter((unit) => !unit.contextBucket).map((unit) => `Configure context bucket for unit "${unit.name}".`),
    ...units.filter((unit) => !unit.durableContextFile && !profile.values.sharedContextRoot).map((unit) => `Decide durable context file or shared context root for "${unit.name}".`),
    ...facts.map((fact) => `${fact}: ${contextPlacementRecommendation(fact, profile.values).target}`),
  ];
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Context Bucket Check

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Source-Of-Truth Hierarchy

${formatList(['source/logs/tests', 'repo profile', 'unit profile', 'shared context', 'promoted learnings', 'conversation memory'])}

## Affected Unit Context Buckets

| Unit | Path | Context bucket | Durable context file | Testing surface |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Placement Recommendations

${formatList(recommendations.length ? recommendations : ['No obvious context bucket gaps detected.'])}

## Freshness Windows

- Source/logs/tests: current task evidence.
- Repo/unit profiles: refresh when deployable unit, context bucket, commands, or test surface changes.
- Shared context: refresh when cross-repo/product workflow truth changes.
- Promoted learnings: promote only after review; revisit when repeated failures stop matching reality.
- Conversation memory: never treat as durable source truth by itself.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextResolve(repo, options = {}) {
  const targetPath = options.path ? resolve(repo, options.path) : repo;
  const task = options.task || '';
  const profile = loadProfile(repo);
  const aliases = contextAliases(profile.values);
  const normalized = normalizeUnitPath(relative(repo, targetPath) || options.path || '.').toLowerCase();
  const alias = aliases.find((item) => normalized.includes(item.match.toLowerCase()) || String(task).toLowerCase().includes(item.match.toLowerCase()));
  const unit = affectedUnits(repo, [relative(repo, targetPath)], profile, options.unit)[0];
  const recommendedBucket = alias?.bucket || unit?.contextBucket || profile.values.productContext || profile.values.repoContext || profile.values.sharedContextRoot || 'not configured';
  printObject({
    repository: repo,
    path: relative(repo, targetPath) || '.',
    task: task || 'not provided',
    matchedAlias: alias ? `${alias.match} -> ${alias.bucket}` : 'none',
    affectedUnit: unit?.name || 'default',
    recommendedContextBucket: recommendedBucket,
    durableContextFile: unit?.durableContextFile || recommendedContextFile(unit || { contextBucket: recommendedBucket, path: '.' }),
    note: alias ? 'alias overrides folder/repo-name intuition' : 'no alias override found',
  });
}

function contextFinalCheck(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so final context check can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const contextSignals = finalContextSignals(task, git.changedFiles, packets);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Final Context Check

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Durable Knowledge Signals

${formatList(contextSignals)}

## Context Placement Decision

- Product-context bucket: ${profile.values.productContext || profile.values.sharedContextRoot || 'not configured'}
- Repo-context bucket: ${profile.values.repoContext || 'not configured'}
- Process-learning candidate: ${contextSignals.some((item) => item.includes('process')) ? 'yes' : 'only if verification exposed reusable SDLC behavior'}
- Sensitive/product-specific detail present: review before sharing in `.agents/learnings`

## Required Question Before Final Handoff

- Did final grep/test/log review discover durable product knowledge?
- Which bucket owns it?
- Is it product-specific, process-general, or both?
- Was the context update done, deferred, or capped?
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function contextPlace(repo, options = {}) {
  const fact = options.fact || options.text || '';
  if (!fact) fail('Pass --fact "..." so the SDLC can recommend context placement.');
  const profile = loadProfile(repo);
  const recommendation = contextPlacementRecommendation(fact, profile.values);
  printObject({
    repository: repo,
    fact,
    recommendedPlacement: recommendation.placement,
    suggestedTarget: recommendation.target,
    reason: recommendation.reason,
    trackingRule: recommendation.trackingRule,
  });
}

function contextUpdatePlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the context update plan can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = inferRouteFromTask(task, git, profile.values);
  const dirtySurfaces = inferDirtySurfaces(task, git);
  const contracts = inferContracts(task, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-context-update-plan.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Context Update Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Route: ${route}
Status: ${git.status || 'clean'}

## Update Only If Truth Changed

${formatList(contextUpdateTargets(route, dirtySurfaces, contracts, profile.values))}

## Dirty Surfaces

${formatList(dirtySurfaces)}

## Contracts Or Interfaces

${formatList(contracts)}

## Documentation Boundary

- Do not store process flow rediscovery in repo memory docs.
- Do store software-specific workflow, contract, service, release-order, and architecture facts when they help future agents avoid rediscovery.
- Prefer code-local docs for public exports, shared types, APIs, invariants, and examples.
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function changeGraph(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the change graph can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const graph = changeGraphEdges(task, files);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-change-graph-lite.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Change Graph Lite

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Repository role: ${profile.values.repositoryRole || 'not configured'}

## Changed Nodes

${formatList(files.length ? files.map((file) => `${file} (${classifyTouchedSurface(file)})`) : inferDirtySurfaces(task, git))}

## Likely Edges

| From | Relationship | To | Evidence |
| --- | --- | --- | --- |
${graph.length ? graph.map((edge) => `| ${escapeCell(edge.from)} | ${escapeCell(edge.relationship)} | ${escapeCell(edge.to)} | ${escapeCell(edge.evidence)} |`).join('\n') : '| task | affects | behavior to identify | no changed files yet |'}

## QA And Context Implications

${formatList(changeGraphImplications(graph, task, files))}

## Maintenance Rule

- This is a lightweight local graph, not a permanent architecture model.
- Promote repeated, stable edges into shared context docs such as service maps, workflow maps, API contracts, or known failure modes.
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function searchClassify(repo, options = {}) {
  const pattern = options.pattern || options.query || '';
  if (!pattern) fail('Pass --pattern "..." so search results can be classified.');
  const scope = options.scope ? resolve(repo, options.scope) : repo;
  const results = searchPattern(scope, pattern).map((item) => ({
    ...item,
    category: classifySearchPath(relative(repo, item.path)),
  }));
  const groups = groupBy(results, (item) => item.category);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Search Classification

Date: ${new Date().toISOString()}
Repository: ${repo}
Scope: ${relative(repo, scope) || '.'}
Pattern: ${pattern}

## Summary

${formatList(Object.entries(groups).map(([category, items]) => `${category}: ${items.length}`))}

## Results

${formatSearchGroups(repo, groups)}

## Completion Rule

- Active source/page references can drive implementation scope.
- Archived, generated, dependency, and build-output references are context only unless the task explicitly targets them.
- Remaining retired-route matches must be classified before completion.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function searchRetireCheck(repo, options = {}) {
  const oldPattern = options.old || options.oldPattern || '';
  const newPattern = options.new || options.newPattern || '';
  if (!oldPattern || !newPattern) fail('Pass --old <pattern> and --new <pattern>.');
  const scope = options.scope ? resolve(repo, options.scope) : repo;
  const oldResults = searchPattern(scope, oldPattern).map((item) => ({ ...item, category: classifySearchPath(relative(repo, item.path)) }));
  const newResults = searchPattern(scope, newPattern).map((item) => ({ ...item, category: classifySearchPath(relative(repo, item.path)) }));
  const activeOld = oldResults.filter((item) => item.category === 'active source/page reference');
  const activeNew = newResults.filter((item) => item.category === 'active source/page reference');
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Route Retirement Search Check

Date: ${new Date().toISOString()}
Repository: ${repo}
Scope: ${relative(repo, scope) || '.'}
Old pattern: ${oldPattern}
New pattern: ${newPattern}
Result: ${activeOld.length ? 'open - old active references remain' : activeNew.length ? 'pass - new active references found and old active references absent' : 'open - no new active references found'}

## Positive Search: New Route

${formatSearchGroups(repo, groupBy(newResults, (item) => item.category))}

## Negative Search: Old Route

${formatSearchGroups(repo, groupBy(oldResults, (item) => item.category))}

## Gate

${formatList([
    activeNew.length ? 'new route appears in active source/page references' : 'new route was not found in active source/page references',
    activeOld.length ? `${activeOld.length} old active reference(s) remain` : 'no old active source/page references remain',
  ])}
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
  if (activeOld.length || !activeNew.length) process.exitCode = 1;
}

function stateInit(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the state can be initialized.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const units = affectedUnits(repo, files, profile, options.unit);
  const recipes = matchRecipes(task, git, profile.values);
  const runDir = controlRunDir(repo, { ...options, task });
  const state = {
    schema: 'sdlc-state-v1',
    taskId: basename(runDir),
    task,
    repo,
    route,
    stage: 'intake',
    status: 'active',
    branch: git.branch || '',
    head: git.head || '',
    affectedUnits: units.map((unit) => unit.name),
    testingSurfaces: surfaces,
    selectedRecipes: recipes.map((recipe) => recipe.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextAction: `sdlc evidence required --task "${escapeCommandArg(task)}"`,
  };
  safeWriteJsonFile(repo, join(runDir, 'state.json'), state);
  safeWriteJsonFile(repo, controlCurrentPointerPath(repo, options), { taskId: state.taskId, path: relative(repo, runDir), updatedAt: state.updatedAt });
  appendControlEvent(repo, runDir, 'state', 'initialized task state', { task, route, stage: state.stage });
  ensureEvidenceManifest(repo, runDir, task, route, options);
  printObject({
    taskId: state.taskId,
    route,
    stage: state.stage,
    path: relative(repo, runDir),
    nextAction: state.nextAction,
  });
}

function stateCurrent(repo, options = {}) {
  const state = readCurrentState(repo, options);
  if (!state) {
    printObject({ repository: repo, state: 'not initialized', nextAction: 'sdlc state init --task "..."' });
    return;
  }
  printObject({
    taskId: state.taskId,
    task: state.task,
    route: state.route,
    stage: state.stage,
    status: state.status,
    updatedAt: state.updatedAt,
    nextAction: state.nextAction || 'sdlc state explain',
  });
}

function stateAdvance(repo, options = {}) {
  const to = options.to || '';
  if (!to) fail('Pass --to <stage>.');
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) fail('No current state found. Run `sdlc state init --task "..."` first.');
  const state = stateInfo.state;
  const valid = validStateTransition(state.stage, to);
  if (!valid && !options.force) fail(`Invalid state transition ${state.stage} -> ${to}. Pass --force --reason "..." if this is intentional.`);
  state.stage = to;
  state.status = to === 'committed' ? 'complete' : 'active';
  state.updatedAt = new Date().toISOString();
  state.nextAction = nextActionForStage(to, state.task);
  safeWriteJsonFile(repo, join(stateInfo.runDir, 'state.json'), state);
  appendControlEvent(repo, stateInfo.runDir, 'state', `advanced to ${to}`, { from: stateInfo.previousStage, to, forced: !valid, reason: options.reason || '' });
  printObject({ taskId: state.taskId, stage: state.stage, status: state.status, nextAction: state.nextAction });
}

function stateBlockers(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) fail('No current state found. Run `sdlc state init --task "..."` first.');
  const rows = controlGateRows(repo, stateInfo.state, stateInfo.runDir, options);
  const blockers = rows.filter((row) => row.status === 'block');
  printObject({
    taskId: stateInfo.state.taskId,
    blockers: blockers.length,
    result: blockers.length ? 'blocked' : 'clear',
  });
  printGateRows(rows);
  if (blockers.length) process.exitCode = 1;
}

function stateExplain(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  if (!stateInfo.state) {
    printObject({ repository: repo, state: 'not initialized', nextAction: 'sdlc state init --task "..."' });
    return;
  }
  const evidence = readEvidenceManifest(stateInfo.runDir);
  const checks = readControlJsonLines(join(stateInfo.runDir, 'checks.jsonl'));
  const waivers = readControlJsonLines(join(stateInfo.runDir, 'waivers.jsonl'));
  const gates = controlGateRows(repo, stateInfo.state, stateInfo.runDir, options);
  printObject({
    taskId: stateInfo.state.taskId,
    task: stateInfo.state.task,
    route: stateInfo.state.route,
    stage: stateInfo.state.stage,
    status: stateInfo.state.status,
    requiredEvidence: evidence.required?.length || 0,
    capturedEvidence: evidence.captured?.length || 0,
    checks: checks.length,
    waivers: waivers.length,
    openBlockers: gates.filter((row) => row.status === 'block').length,
    nextAction: nextActionFromGates(gates, stateInfo.state.task),
  });
  printGateRows(gates);
}

function runCheck(repo, options = {}, rawTokens = []) {
  const name = options.name || options.kind || 'check';
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task || '';
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task || 'current-task');
  const delimiter = rawTokens.indexOf('--');
  const commandTokens = delimiter >= 0 ? rawTokens.slice(delimiter + 1) : [];
  const start = new Date();
  let result;
  if (options.cap) {
    result = {
      name,
      kind: name,
      mode: 'cap',
      command: '',
      status: 'cap',
      exitCode: '',
      summary: options.reason || options.cap,
      startedAt: start.toISOString(),
      endedAt: new Date().toISOString(),
    };
  } else if (options.manual) {
    result = {
      name,
      kind: name,
      mode: 'manual',
      command: '',
      status: options.status || 'pass',
      exitCode: '',
      summary: options.manual,
      startedAt: start.toISOString(),
      endedAt: new Date().toISOString(),
    };
  } else {
    if (!commandTokens.length) fail('Pass a command after --, or use --manual "..." / --cap "...".');
    const command = commandTokens[0];
    const commandArgs = commandTokens.slice(1);
    const child = spawnSync(command, commandArgs, { cwd: repo, encoding: 'utf8' });
    const endedAt = new Date().toISOString();
    const output = `${child.stdout || ''}${child.stderr ? `\nSTDERR:\n${child.stderr}` : ''}`;
    const outputPath = join(runDir, 'outputs', `${stamp()}-${slug(name)}.log`);
    safeWriteTextFile(repo, outputPath, output);
    result = {
      name,
      kind: name,
      mode: 'command',
      command: commandTokens.join(' '),
      cwd: repo,
      status: child.status === 0 ? 'pass' : classifyRunCheckFailure(child),
      exitCode: child.status ?? '',
      signal: child.signal || '',
      summary: summarizeCommandOutput(output),
      outputPath: relative(repo, outputPath),
      startedAt: start.toISOString(),
      endedAt,
    };
  }
  appendControlJsonLine(repo, join(runDir, 'checks.jsonl'), result);
  addEvidenceFromCheck(repo, runDir, result);
  appendControlEvent(repo, runDir, 'check', `${name}: ${result.status}`, result);
  printObject(result);
  if (result.mode === 'command' && result.exitCode && result.exitCode !== 0) process.exitCode = Number(result.exitCode) || 1;
}

function qaOutline(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const mode = options.mode || qaModeForSurfaces(surfaces, task);
  const outline = qaOutlineForMode(mode, task, files, surfaces, qaAreas(task, files));
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-outline.md`);
  const content = `# SDLC QA Outline

Task: ${task}
Mode: ${mode}
Testing surfaces: ${formatInlineList(surfaces)}

## In Scope

${formatList(outline.scope)}

## Preconditions

${formatList(outline.preconditions)}

## Primary Test

${formatList(outline.primary)}

## Regression Tests

${formatList(outline.regression)}

## Known Caps / Setup Notes

${formatList(outline.caps)}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function qaCompare(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = [];
  if (!packetHas(text, ['## Preconditions'])) findings.push('Missing Preconditions section.');
  if (!packetHas(text, ['## Test Cases', '### QA-001'])) findings.push('Missing primary test case section.');
  if (!packetHas(text, ['Regression'])) findings.push('Missing regression coverage.');
  if (!packetHas(text, ['Known Risks', 'Known Caps', 'Developer caps'])) findings.push('Missing caps/risks section.');
  if (!packetHas(text, ['QA Completion'])) findings.push('Missing QA completion section.');
  printObject({ packet: relative(repo, packetPath), result: findings.length ? 'needs review' : 'ready-looking' });
  console.log(formatList(findings.length ? findings : ['No obvious QA structure gaps detected.']));
  if (findings.length) process.exitCode = 1;
}

function contextGate(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const rows = contextGateRows(repo, task, profile, git, options);
  const blocked = rows.filter((row) => row.status === 'block');
  printObject({ task: task || 'not provided', result: blocked.length ? 'blocked' : rows.some((row) => row.status === 'warn') ? 'warn' : 'pass' });
  printGateRows(rows);
  if (blocked.length) process.exitCode = 1;
}

function learnSuggest(repo, options = {}) {
  const stateInfo = readCurrentStateInfo(repo, options);
  const task = options.task || stateInfo.state?.task || '';
  const runDir = stateInfo.runDir || ensureControlRunDir(repo, options, task || 'current-task');
  const suggestions = learningSuggestionsFromRun(repo, runDir, task);
  printObject({ task: task || 'not provided', suggestions: suggestions.length });
  console.log(formatList(suggestions.length ? suggestions : ['No strong process-learning candidate detected from local run records.']));
}

function runStart(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the run can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-run-start.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Run Start

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Route: ${route}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Suggested Command Sequence

\`\`\`bash
sdlc readiness
sdlc context pack --task "${escapeCommandArg(task)}"
sdlc route start ${route} --task "${escapeCommandArg(task)}"
${runStartPacketCommand(route, task)}
\`\`\`

## Open Gates

${formatList(runStartGates(route, task, git, profile.values))}

## Finish Command

\`\`\`bash
sdlc run finish --route ${route}
\`\`\`
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function taskPreflight(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so preflight can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const triggers = securityTriggers(task, profile.values);
  const caseId = taskCaseId(task, options, profile.values);
  const breadth = taskBreadthAssessment(task, files, surfaces);
  const fast = fastPassAssessment(repo, task, route, git, profile, units, surfaces, triggers);
  const quality = qualityFloorRows({ task, git, route, units, surfaces, qaMode, profile, packets: findPackets(repo, {}) });
  const budget = artifactBudgetForRoute(route, fast.eligible ? 'micro' : '');
  const confidence = routeConfidence({ task, route, files, units, surfaces, profile, triggers });
  const next = fast.eligible ? `sdlc task fast-pass --task "${escapeCommandArg(task)}"` : `sdlc route start ${route} --task "${escapeCommandArg(task)}"`;
  const summary = {
    repository: repo,
    task,
    caseId: caseId || 'not provided',
    workClass: taskType(task),
    route,
    confidence,
    fastPassEligible: fast.eligible ? 'yes' : 'no',
    taskBreadth: breadth.level,
    taskBreadthSignals: breadth.signals.join(', ') || 'none',
    affectedRepos: splitList(profile.values.relatedRepositories).join(', ') || 'primary repository only / unknown',
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    contextBuckets: dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)).join(', ') || 'not configured',
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    qaMode,
    artifactBudget: budget.name,
    nextAction: next,
  };

  if (!options.lock && !options.out) {
    printObject(summary);
    console.log('\n## Human Gates\n');
    console.log(formatList(runStartGates(route, task, git, profile.values)));
    console.log('\n## Safe Defaults Assumed\n');
    console.log(formatList(safeDefaultsForPreflight(route, fast, profile.values)));
    console.log('\n## Quality Floor\n');
    console.log(formatQualityFloorTable(quality));
    console.log('\n## Fast-Pass Decision\n');
    console.log(formatList(fast.reasons));
    return;
  }

  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-preflight.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Task Preflight

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Case ID: ${caseId || 'not provided'}
Work class: ${taskType(task)}
Route: ${route}
Classification confidence: ${confidence}
Fast-pass eligible: ${fast.eligible ? 'yes' : 'no'}
Task breadth: ${breadth.level}

## One-Screen Decision Summary

- Affected repos: ${splitList(profile.values.relatedRepositories).join(', ') || 'primary repository only / unknown'}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(surfaces)}
- QA mode: ${qaMode}
- Artifact budget: ${budget.name}
- Task breadth signals: ${formatInlineList(breadth.signals)}
- Security/tool triggers: ${triggers.length ? triggers.join('; ') : 'none detected'}
- Next action: ${next}

## Safe Defaults Assumed

${formatList(safeDefaultsForPreflight(route, fast, profile.values))}

## Human Approval Gates

${formatList(runStartGates(route, task, git, profile.values))}

## Quality Floor Checklist

${formatQualityFloorTable(quality)}

## Artifact Budget

${formatArtifactBudget(budget)}

## Fast-Pass Assessment

${formatList(fast.reasons)}

## Confidence Summary

${confidenceBlock({ proved: preflightProved(route, units, surfaces, git), inferred: preflightInferred(route, qaMode), human: preflightHumanJudgment(fast, triggers), nextAction: next })}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function taskFastPass(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so fast-pass can be evaluated.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const triggers = securityTriggers(task, profile.values);
  const breadth = taskBreadthAssessment(task, files, surfaces);
  const fast = fastPassAssessment(repo, task, route, git, profile, units, surfaces, triggers);
  const budget = artifactBudgetForRoute(route, fast.eligible ? 'micro' : '');
  printObject({
    repository: repo,
    task,
    route,
    eligible: fast.eligible ? 'yes' : 'no',
    artifactBudget: budget.name,
    changedFiles: files.length,
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    taskBreadth: breadth.level,
    taskBreadthSignals: breadth.signals.join(', ') || 'none',
    nextAction: fast.eligible ? 'Proceed inline with one verification path and final confidence block.' : `Escalate to: sdlc task preflight --task "${escapeCommandArg(task)}" --lock`,
  });
  console.log('\n## Decision Reasons\n');
  console.log(formatList(fast.reasons));
  console.log('\n## Minimum Evidence\n');
  console.log(formatArtifactBudget(budget));
}

function taskStart(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task contract can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const modes = detectWorkModes(repo, task, profile.values, git.changedFiles);
  const triggers = securityTriggers(task, profile.values);
  const related = splitList(profile.values.relatedRepositories);
  const caseId = taskCaseId(task, options, profile.values);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-start.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Start Contract

Date: ${new Date().toISOString()}
Case ID: ${caseId || 'not provided'}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Suggested route: ${route}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}

## Normalized Task Shape

- Task type: ${taskType(task)}
- Work modes: ${formatInlineList(modes)}
- Affected repositories: ${related.length ? related.join(', ') : 'primary repository only / unknown'}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(testingSurfaces)}
- Deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}
- Expected QA need: ${expectedQaNeed(task, git.changedFiles, profile.values)}
- Likely surfaces: ${formatInlineList(inferDirtySurfaces(task, git))}
- Verification maturity: ${verificationMaturity(profile.values, commands)}
- Commit/push preference: human decision at finish; never automatic

## Constraints And Gates

${formatList(runStartGates(route, task, git, profile.values))}

## Context To Check

\`\`\`bash
sdlc context freshness --task "${escapeCommandArg(task)}"
sdlc context pack --task "${escapeCommandArg(task)}"
sdlc change graph --task "${escapeCommandArg(task)}"
\`\`\`

## Suggested Task Flow

\`\`\`bash
sdlc task ledger --task "${escapeCommandArg(task)}"
sdlc unit detect --task "${escapeCommandArg(task)}"
sdlc surface detect --task "${escapeCommandArg(task)}"
sdlc touched packet
sdlc impact packet --task "${escapeCommandArg(task)}"
sdlc verify packet --task "${escapeCommandArg(task)}"
sdlc smoke packet --task "${escapeCommandArg(task)}"
sdlc qa script --task "${escapeCommandArg(task)}"
sdlc task finish --task "${escapeCommandArg(task)}"
\`\`\`

## Security And Tool Triggers

${formatList(triggers)}
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function taskId(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." to generate a task id.');
  printObject({
    repository: repo,
    task,
    taskId: taskRunId(task, options),
  });
}

function taskCurrent(repo, options = {}) {
  const packets = findPackets(repo, {});
  const taskPackets = packets.filter((packet) => ['task-start', 'task-ledger', 'task-finish'].includes(packet.kind));
  const current = taskPackets[0] || packets[0];
  if (!current) {
    printObject({ repository: repo, currentTask: 'none', suggestedNextCommand: 'sdlc task open --task "..."' });
    return;
  }
  const task = firstMatch(current.text, /^Task:\s*(.+)$/m);
  const git = getGitInfo(repo);
  const open = finalGateOpenItems(repo, task, git, packets);
  printObject({
    repository: repo,
    currentPacket: relative(repo, current.path),
    currentKind: current.kind,
    task: task || 'not found',
    route: task ? inferRouteFromTask(task, git, loadProfile(repo).values) : current.route,
    changedFiles: git.changedFiles.length,
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: task ? (open[0] ? suggestedFinalGateCommand(open[0], task) : `sdlc task review --task "${task}"`) : 'sdlc task open --task "..."',
  });
}

function taskOpen(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task can be opened.');

  const outDir = options.outDir ? resolve(repo, options.outDir) : defaultRunsDir(repo);
  mkdirSync(outDir, { recursive: true });
  const taskSlug = taskRunId(task, options);
  const outputs = [
    ['task-start', () => taskStart(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-task-start.md`) })],
    ['context-freshness', () => contextFreshness(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-context-freshness.md`) })],
    ['context-contradictions', () => contextContradictions(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-context-contradictions.md`) })],
    ['change-graph', () => changeGraph(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-change-graph.md`) })],
    ['task-ledger', () => taskLedger(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-task-ledger.md`) })],
  ];

  printObject({
    repository: repo,
    task,
    taskId: taskSlug,
    action: 'opening task with start contract, context checks, change graph, and ledger',
  });
  for (const [, run] of outputs) run();
}

function taskBundle(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task bundle can be scoped.');
  const outDir = options.outDir ? resolve(repo, options.outDir) : defaultRunsDir(repo);
  const taskSlug = taskRunId(task, options);
  mkdirSync(outDir, { recursive: true });
  printObject({
    repository: repo,
    task,
    taskId: taskSlug,
    action: 'bundling task evidence',
  });
  touchedPacket(repo, { ...options, out: join(outDir, `${taskSlug}-touched-surface-ledger.md`) });
  impactPacket(repo, { ...options, out: join(outDir, `${taskSlug}-impact-packet.md`) });
  verifyPacket(repo, { ...options, out: join(outDir, `${taskSlug}-developer-verification-packet.md`) });
  smokePacket(repo, { ...options, out: join(outDir, `${taskSlug}-manual-smoke-packet.md`) }, smokeDependencies());
  qaScript(repo, { ...options, out: join(outDir, `${taskSlug}-qa-test-script.md`) });
  taskLedger(repo, { ...options, taskId: taskSlug, out: join(outDir, `${taskSlug}-task-ledger.md`), refresh: true });
}

function taskStatus(repo, options = {}) {
  const task = options.task || '';
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  const metrics = taskMetrics(repo, task, git, packets);

  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    route: task ? inferRouteFromTask(task, git, loadProfile(repo).values) : 'not provided',
    packets: packets.length,
    finalGate: open.length ? 'open' : 'ready with explicit human approval',
    openGates: open.join('; ') || 'none detected',
    suggestedNextCommand: open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc task finish --task "..."',
  });
  console.log('\n## Metrics\n');
  console.log(formatList(Object.entries(metrics).map(([key, value]) => `${humanize(key)}: ${value}`)));
}

function taskReview(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  const latest = (kind) => latestPacketPath(repo, packets, kind);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);

  printObject({
    repository: repo,
    task: task || 'not provided',
    branch: git.branch || 'unknown',
    status: git.status || 'clean',
    route: task ? inferRouteFromTask(task, git, profile.values) : 'not provided',
    changedFiles: git.changedFiles.length,
    affectedUnits: units.map((unit) => unit.name).join(', ') || 'default',
    testingSurfaces: testingSurfaces.join(', ') || 'service-behavior',
    finalGate: open.length ? 'open' : 'ready with explicit human approval',
    readyForQaHandoff: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no',
    readyToCommit: open.length ? 'no' : 'yes, with explicit human approval only',
    readyToPush: open.length ? 'no' : 'only with explicit human approval',
    mergeDeployRelease: 'forbidden by SDLC default; project-specific human process only',
  });

  console.log('\n## Evidence\n');
  console.log(formatList([
    `Task ledger: ${latest('task-ledger')}`,
    `Touched packet: ${latest('touched')}`,
    `Impact packet: ${latest('impact')}`,
    `Developer verification: ${latest('developer-verification')}`,
    `Manual smoke: ${latest('manual-smoke')}`,
    `QA script: ${latest('qa-script')}`,
    `Git packet: ${latest('git-action')}`,
  ]));
  console.log('\n## Open Gates\n');
  console.log(formatList(open));
  console.log('\n## Recommended Next Action\n');
  console.log(`- ${open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc task finish --task "..."'}`);
}

function taskLedger(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the task ledger can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Ledger

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route: ${route}
Status: ${git.status || 'clean'}

## Evidence Index

| Kind | Latest packet | Completed |
| --- | --- | --- |
${taskLedgerRows(repo, packets).join('\n')}

## Context And Change Understanding

- Context freshness:
- Context pack:
- Change graph:
- Context update plan:

## Verification And QA

- Developer verification:
- Manual smoke:
- Human QA Markdown script:
- Test introduction plan:
- Render/browser evidence:
- Caps:

## Files Touched

${formatList(git.changedFiles)}

## Finish Decision

\`\`\`bash
sdlc task finish --task "${escapeCommandArg(task)}"
\`\`\`
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function taskVerify(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so task verification can be scoped.');

  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  printObject({
    repository: repo,
    task,
    suggestedVerifyPacket: `sdlc verify packet --task "${task}"`,
    suggestedManualSmoke: `sdlc smoke packet --task "${task}"`,
    suggestedTestPlan: shouldSuggestTestPlan(repo, task, git.changedFiles) ? `sdlc test plan --task "${task}"` : 'not required by detected surfaces',
    latestDeveloperVerification: latestPacketPath(repo, packets, 'developer-verification'),
    latestManualSmoke: latestPacketPath(repo, packets, 'manual-smoke'),
  });
}

function taskQa(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so task QA can be scoped.');

  const packets = findPackets(repo, {});
  printObject({
    repository: repo,
    task,
    suggestedQaScript: `sdlc qa script --task "${task}"`,
    latestImpactPacket: latestPacketPath(repo, packets, 'impact'),
    latestQaScript: latestPacketPath(repo, packets, 'qa-script'),
    note: 'QA scripts are Markdown for human testers and YouTrack paste-in; they do not assume AI use.',
  });
}

function taskFinish(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the finish decision can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const open = finalGateOpenItems(repo, task, git, packets);
  const metrics = taskMetrics(repo, task, git, packets);
  const caseId = taskCaseId(task, options, profile.values);
  const units = affectedUnits(repo, git.changedFiles, profile, options.unit);
  const proposedMessage = proposedCommitMessage(git.changedFiles, packets.find((packet) => packet.kind === 'impact'), { caseId, profile: profile.values });
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-task-finish-decision.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Task Finish Decision

Date: ${new Date().toISOString()}
Case ID: ${caseId || 'not provided'}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Head: ${git.head || 'unknown'}
Route: ${route}
Status: ${git.status || 'clean'}

## Decision Summary

- Ready to commit: ${open.length ? 'no' : 'yes, with explicit human approval only'}
- Ready to push: ${open.length ? 'no' : 'only with explicit human approval'}
- Ready for QA handoff: ${packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no'}
- Merge/deploy/release: forbidden by SDLC default; project-specific human process only
- Suggested commit message: ${proposedMessage}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Testing surfaces: ${formatInlineList(inferTestingSurfaces(repo, task, git.changedFiles, profile))}
- Deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}

## Open Gates

${formatList(open)}

## Evidence Summary

${formatList(taskEvidenceSummary(repo, packets))}

## Task Metrics

${formatList(Object.entries(metrics).map(([key, value]) => `${humanize(key)}: ${value}`))}

## Human Approval Choices

- [ ] No action.
- [ ] Commit only.
- [ ] Commit and push.
- [ ] Generate/update QA handoff only.

## Next Commands

\`\`\`bash
${open.length ? suggestedFinalGateCommand(open[0], task) : 'sdlc git packet'}
sdlc calibrate add --route ${route} --outcome "" --route-fit "" --caps "" --friction "" --process-change-proposed ""
\`\`\`

## Final Response Shape For Agent

- Ready to commit: ${open.length ? 'no' : 'yes, with explicit human approval only'}
- Ready to push: ${open.length ? 'no' : 'only with explicit human approval'}
- QA script ready: ${packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no'}
- Tests/checks run:
- Caps:
- Files changed: ${git.changedFiles.length}
- Recommended next action: ${open[0] ? suggestedFinalGateCommand(open[0], task) : 'Ask human to choose no action / commit only / commit and push.'}

## Confidence Summary

${confidenceBlock({
    proved: [`${git.changedFiles.length} changed file(s) observed`, `${packets.length} SDLC packet(s) available`, `route inferred as ${route}`],
    inferred: [`QA readiness is ${packets.some((packet) => packet.kind === 'qa-script') ? 'available' : 'not available'}`, `commit message proposal: ${proposedMessage}`],
    human: open.length ? open : ['choose no action / commit only / commit and push'],
    nextAction: open[0] ? suggestedFinalGateCommand(open[0], task) : 'Ask human to choose finish action.',
  })}
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (open.length) process.exitCode = 1;
}

function runFinish(repo, options = {}) {
  const route = options.route || '';
  if (!route) fail('Pass --route <route> so run finish can check the right gates.');

  const git = getGitInfo(repo);
  const packet = options.packet ? readPacket(repo, resolvePacketPath(repo, options.packet)) : findLatestPacket(repo, route);
  const done = doneChecksForRoute(route, git, packet);
  const open = done.filter((item) => item.status === 'open');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(route)}-run-finish.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Run Finish

Date: ${new Date().toISOString()}
Repository: ${repo}
Route: ${route}
Packet: ${packet ? relative(repo, packet.path) : 'none'}
Result: ${open.length ? 'open gates remain' : 'done checks pass'}

## Done Checks

| Check | Status | Detail |
| --- | --- | --- |
${done.map((item) => `| ${escapeCell(item.name)} | ${item.status} | ${escapeCell(item.detail)} |`).join('\n')}

## Remaining Work

${formatList(open.map((item) => `${item.name}: ${item.detail}`))}
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (open.length) process.exitCode = 1;
}

function workmodeDetect(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const modes = detectWorkModes(repo, task, profile.values, git.changedFiles);
  printObject({
    repository: repo,
    task: task || 'not provided',
    workModes: modes.join(', ') || 'generic',
    verificationMaturity: verificationMaturity(profile.values, discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json')))),
    stack: detectStack(repo).join(', ') || 'generic',
    recommendedNextCommand: `sdlc impact packet --task "${escapeCommandArg(task || 'current task')}"`,
  });
}

function touchedPacket(repo, options = {}) {
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-touched-surface-ledger.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const rows = files.map((file) => ({
    file,
    surface: classifyTouchedSurface(file),
    runtime: classifyRuntimeSurface(file),
    qa: needsManualQa(file) ? 'yes' : 'maybe',
  }));

  const content = `# SDLC Touched Surface Ledger

Date: ${new Date().toISOString()}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Head: ${git.head || 'unknown'}

## Summary

- Changed files: ${files.length}
- Surfaces: ${formatInlineList(dedupe(rows.map((row) => row.surface)))}
- Runtime hints: ${formatInlineList(dedupe(rows.map((row) => row.runtime)))}

## Changed Files By Surface

| File | Surface | Runtime hint | Manual QA likely |
| --- | --- | --- | --- |
${rows.length ? rows.map((row) => `| ${escapeCell(row.file)} | ${row.surface} | ${row.runtime} | ${row.qa} |`).join('\n') : '| none |  |  |  |'}

## QA And Handoff Notes

- Use this ledger as an input to impact, developer verification, QA test scripts, and final handoff.
- Generated/build artifacts should be reviewed before commit.
- Manual QA is expected when changed behavior is user-visible, data-affecting, integration-affecting, or lacks automated coverage.
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function touchedUpdate(repo, options = {}) {
  const surface = options.surface || '';
  if (!surface) fail('Pass --surface <kind> so the touched-surface ledger can be updated.');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'touched-surface-live-ledger.jsonl');
  mkdirSync(dirname(outPath), { recursive: true });
  const row = {
    timestamp: new Date().toISOString(),
    repo: options.repoName || basename(repo),
    surface,
    evidence: options.evidence || '',
    task: options.task || '',
    privacy: options.privacy || 'internal',
  };
  appendFileSync(outPath, `${JSON.stringify(row)}\n`, 'utf8');
  console.log(relative(repo, outPath));
}

function impactPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the impact packet can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const units = affectedUnits(repo, files, profile, options.unit);
  const testingSurfaces = inferTestingSurfaces(repo, task, files, profile);
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-impact-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# SDLC Impact Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Status: ${git.status || 'clean'}
Profile: ${profile.path ? relative(repo, profile.path) : 'not found'}
Verification maturity: ${profile.values.verificationMaturity || 'not configured'}

## Impact Summary

- Runtime/product type: ${formatInlineList(dedupe(files.map(classifyRuntimeSurface)))}
- Touched surfaces: ${formatInlineList(surfaces)}
- Testing surfaces: ${formatInlineList(testingSurfaces)}
- Affected units: ${formatInlineList(units.map((unit) => unit.name))}
- Context buckets: ${formatInlineList(dedupe(units.map((unit) => unit.contextBucket).filter(Boolean)))}
- Deploy methods: ${formatInlineList(dedupe(units.map((unit) => unit.deployMethod).filter(Boolean)))}
- Changed files: ${files.length}

## Affected Areas To Consider

${formatList(impactAreas(task, files, profile.values))}

## User Or System Workflows

- Primary workflow:
- Secondary/regression workflows:
- Roles/permissions:
- Environments affected:

## Technical Impact

- APIs/contracts: ${surfaces.includes('backend/API') || surfaces.includes('contracts/interfaces') ? 'likely' : 'unknown/not detected'}
- Data/storage: ${surfaces.includes('database/storage') ? 'likely' : 'unknown/not detected'}
- External integrations: ${surfaces.includes('external integration') ? 'likely' : 'unknown/not detected'}
- Config/environment: ${surfaces.includes('config/environment') ? 'likely' : 'unknown/not detected'}
- Dependencies/packages: ${surfaces.includes('dependencies') ? 'likely' : 'unknown/not detected'}

## QA Coverage Areas

${formatList(qaAreas(task, files))}

## Risks, Unknowns, And Caps

- Unknown affected pages/screens:
- Unknown affected APIs/jobs:
- Test coverage cap:
- Release/handoff risk:
`;

  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function interactionPacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the interaction packet can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const breadth = taskBreadthAssessment(task, files, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-interaction-stateful-feature.md`);
  const content = `# SDLC Interactive / Stateful Feature Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Task breadth: ${breadth.level}

## Trigger Signals

${formatList(breadth.signals.length ? breadth.signals : ['interactive/stateful recipe selected manually'])}

## Interaction Contract

- Primary actor:
- Starting state:
- User action sequence:
- Mode/settings/state changes:
- Feedback/animation/response expected:
- Error/repeat/edge path:
- Reset/recovery path:

## Required Proof

- State/domain logic test or explicit cap:
- Build/typecheck:
- Rendered/execution-path smoke:
- Happy path:
- Regression path:
- QA Markdown when human testers are involved:

## Validation Surface Ladder

${formatValidationLadder(validationLadderRows(task, surfaces))}
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
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

function qaModeCommand(repo, action, options = {}, rest = []) {
  if (action === 'scenario' && (rest[0] === 'list' || options.list)) return qaScenarioList(repo, options);
  if (action === 'scenario' && (rest[0] === 'show' || options.show)) return qaScenarioShow(repo, rest[1] || options.scenario || options.id, options);
  if (action === 'scenario' && (rest[0] === 'draft' || options.draft)) return qaScript(repo, { ...options, mode: 'scenario-retest' });
  const modeMap = {
    ui: 'ui-workflow',
    api: 'api-contract',
    data: 'data-persistence',
    integration: 'integration-provider',
    scenario: 'scenario-retest',
    multi: 'multi-repo-workflow',
    interactive: 'interactive-stateful',
    cli: 'cli-workflow',
    job: 'background-job',
    docs: 'docs-process',
  };
  return qaScript(repo, { ...options, mode: modeMap[action] || action });
}

function qaScenarioList(repo, options = {}) {
  const scenarios = qaScenarioRecords(repo, options);
  if (!scenarios.length) {
    printObject({ repository: repo, scenarios: 0, note: 'No scenario library found. Configure profile qaScenarioLibrary or add .ai-local/qa-scenarios.md.' });
    return;
  }
  console.log('| ID | Title | Unit | Surface |');
  console.log('| --- | --- | --- | --- |');
  for (const scenario of scenarios) console.log(`| ${escapeCell(scenario.id)} | ${escapeCell(scenario.title)} | ${escapeCell(scenario.unit)} | ${escapeCell(scenario.surface)} |`);
}

function qaScenarioShow(repo, id, options = {}) {
  if (!id) fail('Pass a scenario id.');
  const scenario = qaScenarioRecords(repo, options).find((item) => item.id.toLowerCase() === String(id).toLowerCase());
  if (!scenario) fail(`Scenario not found: ${id}`);
  printObject(scenario);
}

function qaScript(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the QA test script can be scoped.');

  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = git.changedFiles;
  const testingSurfaces = inferTestingSurfaces(repo, task, files, profile);
  const mode = options.mode || qaModeForSurfaces(testingSurfaces, task);
  const sourceHints = qaSourceHints(repo, options);
  const external = externalEvidenceProfile(profile.values);
  const ticketId = options.ticket || firstMatch(task, /\b([A-Z][A-Z0-9]+-\d+)\b/) || '';
  const scopeItems = dedupe([...qaAreas(task, files), ...sourceHints.scope]);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-test-script.md`);
  mkdirSync(dirname(outPath), { recursive: true });

  const content = `# QA Test Script: ${task}

QA Mode: ${mode}

## Summary

${qaSummaryForMode(mode)}

${ticketId || matchesAny(task.toLowerCase(), ['ticket', 'youtrack', 'yt-']) ? `Ticket: ${ticketId || 'provide ticket ID/link if available'}\n` : ''}This script is for human QA testers. It does not assume QA will use AI, inspect source code, run developer commands, or access database/ticket MCP tools.

## Scope

### In Scope

${formatList(scopeItems)}
${sourceHints.scope.length ? `\n### Source Packet Hints\n\n${formatList(sourceHints.scope)}` : ''}

### Out Of Scope

- Repository review and release decisions.
- Merge, deploy, release, or branch movement decisions.

## Environment

- Environment: QA
- Browser/device: ${mode === 'api-contract' ? 'not required unless API change is observable through UI' : ''}
- API client / Swagger:
- User role:
- Test account/data:
- Build/version/branch: ${git.branch || 'unknown'} / ${git.head || 'unknown'}

## Preconditions

- Required permissions:
- Required test data:
- Feature flags/config:
- External systems/sandbox availability:
${matchesAny(task.toLowerCase(), ['database', 'sql', 'data', 'db evidence', 'read-only database']) ? '- Database-backed evidence was developer-facing only; QA should validate observable UI/API/export behavior unless explicitly assigned developer testing.\n' : ''}

## Test Cases

### QA-001: Primary Changed Workflow

**Purpose:** Validate the main behavior changed by this task.

**Steps**
${primaryQaSteps(mode)}

**Result**
- Pass/Fail:
- Actual result:
- Notes:

### QA-002: Regression Check

**Purpose:** Ensure nearby existing behavior still works.

**Steps**
1. Run the closest existing workflow that uses the same page/API/data/integration.
   - Expected: Existing behavior still works.
2. Check validation/error handling for the affected area.
   - Expected: Errors are clear and no unexpected failures occur.

**Result**
- Pass/Fail:
- Actual result:
- Notes:

${qaDomainSections(task, files)}

${scenarioRetestSection(options)}

## Regression Checklist

- [ ] Changed workflow works.
- [ ] Existing nearby workflow still works.
- [ ] Permissions/roles behave correctly.
- [ ] Existing saved data displays correctly.
- [ ] Validation and error messages behave correctly.
- [ ] No unexpected page, API, or integration errors are visible to QA.

## Known Risks / Notes

- Touched surfaces: ${formatInlineList(dedupe(files.map(classifyTouchedSurface)))}
- Changed files: ${files.length}
- Verification maturity: ${profile.values.verificationMaturity || 'not configured'}
- Developer caps to communicate:
${sourceHints.risks.length ? formatList(sourceHints.risks) : '- none recorded'}

## Developer Verification Summary

- Developer/agent checks run:
- Ticket evidence: ${external.ticket.availability === 'available' ? 'available if route-selected; confirm drift before closeout' : `not assumed (${external.ticket.availability})`}
- Database evidence: ${external.database.availability === 'available' ? 'available if route-selected; summarize redacted evidence only' : `not assumed (${external.database.availability})`}
- Known verification caps:

## QA Completion

- QA status:
- QA tester:
- Date:
- Notes:
`;

  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function qaComplete(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const status = options.status || '';
  if (!status) fail('Pass --status "draft|ready|blocked" so QA script readiness is explicit.');
  if (!['draft', 'ready', 'blocked'].includes(status)) fail('Use --status "draft", "ready", or "blocked".');

  const entry = `## QA Script Completion

Completed: ${new Date().toISOString()}
Status: ${status}
Ready for YouTrack paste: ${status === 'ready' ? 'yes' : 'no'}

### Remaining Gaps / Caps

${formatOptionList(options.caps)}

### Linked Evidence

- Impact packet: ${options.impact || ''}
- Touched packet: ${options.touched || ''}
- Developer verification packet: ${options.verify || ''}

### Notes

${options.notes || ''}
`;

  appendPacketCompletion(packetPath, entry);
  console.log(relative(repo, packetPath));
}

function qaReview(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = qaReviewFindings(text);
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    result: findings.length ? 'needs review' : 'ready-looking',
  });
  console.log('\n## Findings\n');
  console.log(formatList(findings));
}

function smokeDependencies() {
  return { classifyTouchedSurface, smokeStepSuggestions, renderedEvidencePlan, resolvePacketPath, appendPacketCompletion };
}

function releaseDependencies() {
  return {
    accessibilityPolicy,
    appendPacketCompletion,
    contextDocCandidates,
    escapeCommandArg,
    formatContextDocs,
    formatReleaseChecks,
    formatReleaseStopGates,
    formatReviewChecks,
    formatReviewTargets,
    formatSecurityOverlay,
    recentCommits,
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
    readiness,
    setupFixPlan,
    sharedContextDetails,
    sharedContextReachability,
  };
}

function finishDependencies() {
  return {
    actionCommandHint,
    actionRisk,
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

function validationLadder(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the validation ladder can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const rows = validationLadderRows(task, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Validation Surface Ladder

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Detected surfaces: ${formatInlineList(surfaces)}

${formatValidationLadder(rows)}

## Rule

Use the strongest available validation surface. If a stronger surface is unavailable, record the fallback and cap instead of claiming it passed.
`;
  if (outPath) {
    safeWriteTextFile(repo, outPath, content);
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function runActionDependencies() {
  return { findPackets, finalGateOpenItems, suggestedFinalGateCommand, taskEvidenceSummary };
}

function qaScenarios(repo, command, options = {}) {
  if (command === 'init') return qaScenariosInit(repo, options);
  if (command === 'match') return qaScenariosMatch(repo, options);
  return qaScenarioList(repo, options);
}

function qaScenariosInit(repo, options = {}) {
  const outPath = options.out ? resolve(repo, options.out) : join(repo, '.ai-local', 'qa-scenarios.md');
  if (existsSync(outPath) && !options.force) fail(`${relative(repo, outPath)} already exists. Pass --force to overwrite.`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# QA Scenario Library

Purpose: local scenario library for human QA Markdown generation. Keep product/client-sensitive scenarios local or external unless the repo approves a sanitized checked-in version.

## Primary Changed Workflow

ID: primary-changed-workflow
Unit:
Surface: ui/api/data/integration/scenario
Setup data:

Steps:
1. Open or invoke the affected workflow in QA.
2. Perform the changed action.
3. Confirm the expected result and one nearby regression path.

Expected result:
- Changed behavior works.
- Nearby existing behavior still works.

Regression risks:
- Unknown until task impact is known.

Environment notes:
- QA environment and test account/data required.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function qaScenariosMatch(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so scenarios can be matched.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const scenarios = qaScenarioRecords(repo, options);
  const matches = scenarios.filter((scenario) => {
    const haystack = `${scenario.title} ${scenario.surface} ${scenario.unit} ${scenario.body}`.toLowerCase();
    return surfaces.some((surface) => haystack.includes(surface.split('-')[0])) || task.toLowerCase().split(/\s+/).some((word) => word.length > 4 && haystack.includes(word));
  });
  printObject({
    repository: repo,
    task,
    testingSurfaces: surfaces.join(', ') || 'service-behavior',
    matches: matches.length,
  });
  console.log('\n| ID | Title | Surface |');
  console.log('| --- | --- | --- |');
  for (const scenario of matches) console.log(`| ${escapeCell(scenario.id)} | ${escapeCell(scenario.title)} | ${escapeCell(scenario.surface)} |`);
}

function verify(repo, options = {}) {
  const profile = loadProfile(repo);
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const commands = discoverCommands(profile.values, packageJson);
  const requested = options.commands ? String(options.commands).split(',').map((value) => value.trim()) : ['test', 'build'];
  const results = [];

  for (const key of requested) {
    const command = commands[key];
    if (!command) {
      results.push({ key, command: '', status: 'missing', code: null });
      continue;
    }

    const result = spawnSync(command, {
      cwd: repo,
      shell: true,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10,
    });
    results.push({ key, command, status: result.status === 0 ? 'pass' : 'fail', code: result.status, stdout: result.stdout, stderr: result.stderr });
  }

  const outPath = join(defaultRunsDir(repo), `${stamp()}-verification.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderVerification(results), 'utf8');
  console.log(renderVerification(results));
  console.log(`\nEvidence: ${relative(repo, outPath)}`);

  if (results.some((result) => result.status === 'fail')) process.exitCode = 1;
}

function learnCapture(repo, options = {}) {
  const summary = options.summary || '';
  if (!summary) fail('Pass --summary "..." so the learning can be captured.');
  const caseId = options.case || options.caseId || '';
  const outPath = options.out ? resolve(repo, options.out) : join(agentsRoot, 'learnings', `${new Date().toISOString().slice(0, 10)}-${slug(caseId || summary)}-learning.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning: ${caseId || summary}

Date: ${new Date().toISOString().slice(0, 10)}
Case: ${caseId || 'not provided'}
Source repository: ${repo}
Privacy: ${options.privacy || 'sensitive-redacted'}

## Summary

${summary}

## Portable Process Lesson

-

## Product-Specific Durable Fact

-

## Sensitive / Redacted Detail

- Do not include secrets, credentials, customer data, private URLs, raw production logs, or unnecessary proprietary source details.

## Candidate Owner

- ${options.owner || 'skills-pack | project | template | tooling | external-context'}

## Validation Needed

-

## Promotion Guidance

- One high-cost miss may create a candidate.
- Three repeated similar events may promote a default rule after human review.
- Product-specific facts must not become global rules without redaction/generalization.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(process.cwd(), outPath));
}

function learnQuick(repo, options = {}) {
  const summary = options.summary || '';
  if (!summary) fail('Pass --summary "..." so the learning can be captured quickly.');
  return learnCapture(repo, {
    ...options,
    summary,
    privacy: options.privacy || 'sensitive-redacted',
    owner: options.owner || 'unknown',
    source: options.source || 'unspecified',
  });
}

function learnSanitize(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const buckets = sanitizeLearningBuckets(text);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learning-sanitization.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Sanitization

Date: ${new Date().toISOString()}
Source learning: ${relative(repo, packetPath)}
Result: ${findings.length ? 'blocked/pending review' : 'ready-looking'}

## Portable Process Lesson

${formatList(buckets.portable)}

## Product-Context Relocation

${formatList(buckets.product)}

## Blocked Sensitive Detail

${formatList(findings.length ? findings : buckets.sensitive)}

## Promotion Rule

- Portable process lessons may become \`.agents/learnings\` candidates.
- Product facts belong in repo/unit/shared external context.
- Sensitive details must be redacted before shared process promotion.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (findings.length) process.exitCode = 1;
}

function learnSyncCheck(repo, options = {}) {
  const learningDir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(learningDir) ? readdirSync(learningDir).filter((file) => file.endsWith('.md')).map((file) => join(learningDir, file)) : [];
  const status = git(agentsRoot, ['status', '--short', '--branch']);
  const unpushed = git(agentsRoot, ['log', '--oneline', '@{u}..HEAD']);
  const behind = git(agentsRoot, ['log', '--oneline', 'HEAD..@{u}']);
  const blocked = files.filter((file) => learningReviewFindings(readFileSync(file, 'utf8')).length);
  printObject({
    repository: agentsRoot,
    branchStatus: status.split(/\r?\n/)[0] || 'not a git repository',
    learningFiles: files.length,
    unpushedCommits: unpushed ? unpushed.split(/\r?\n/).length : 0,
    remoteCommitsNotPulled: behind ? behind.split(/\r?\n/).length : 0,
    sanitizationBlockedFiles: blocked.length,
  });
  console.log('\n## Blocked Learning Files\n');
  console.log(formatList(blocked.map((file) => relative(agentsRoot, file))));
}

function learnReviewCycle(repo, options = {}) {
  const since = options.since || '';
  const learningDir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(learningDir) ? readdirSync(learningDir).filter((file) => file.endsWith('.md')).map((file) => join(learningDir, file)) : [];
  const selected = since ? files.filter((file) => readFileSync(file, 'utf8').includes(since) || basename(file) >= since) : files;
  const rows = selected.map((file) => {
    const text = readFileSync(file, 'utf8');
    const findings = learningReviewFindings(text);
    return `| ${escapeCell(relative(agentsRoot, file))} | ${escapeCell(firstMatch(text, /^Privacy:\s*(.+)$/m) || 'unknown')} | ${findings.length ? 'blocked' : 'candidate'} | ${escapeCell(firstMatch(text, /^Case:\s*(.+)$/m) || '')} |`;
  });
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learning-review-cycle.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Review Cycle

Date: ${new Date().toISOString()}
Since: ${since || 'all'}
Learning directory: ${learningDir}

| Learning | Privacy | Review state | Case |
| --- | --- | --- | --- |
${rows.join('\n') || '| none |  |  |  |'}

## Promotion Levels

${formatList(['Level 0 raw local event', 'Level 1 sanitized shared learning', 'Level 2 reviewed candidate', 'Level 3 implementation plan', 'Level 4 process update', 'Level 5 stable pattern'])}

## Outcomes To Assign

- product context relocated
- process change implemented
- deferred with reason
- archived as not reusable
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function learnArchive(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const reason = options.reason || '';
  if (!reason) fail('Pass --reason "..." so the archive is explainable.');
  const archiveDir = options.archiveDir ? resolve(repo, options.archiveDir) : join(dirname(packetPath), 'archive');
  mkdirSync(archiveDir, { recursive: true });
  const archivedPath = join(archiveDir, basename(packetPath));
  const text = readFileSync(packetPath, 'utf8');
  writeFileSync(archivedPath, `${text.trimEnd()}\n\n## Archive Reason\n\n- ${reason}\n`, 'utf8');
  writeFileSync(packetPath, `# Archived SDLC Learning Pointer\n\nOriginal moved to: ${relative(repo, archivedPath)}\nReason: ${reason}\n`, 'utf8');
  console.log(relative(repo, archivedPath));
}

function learnRoute(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const productSignals = packetHas(text, ['Product-Specific Durable Fact', 'customer', 'client', 'production', 'private URL']);
  const route = findings.length
    ? 'sanitize-before-review'
    : productSignals
      ? 'split-product-context-and-process-learning'
      : 'process-learning-review';
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    route,
    reviewFindings: findings.length,
    recommendedNextCommand: findings.length ? `sdlc learn review --packet ${relative(repo, packetPath)}` : `sdlc learn promote --packet ${relative(repo, packetPath)} --target process`,
  });
  console.log('\n## Findings\n');
  console.log(formatList(findings.length ? findings : ['No blocking sanitization findings detected.']));
}

function learnSummary(repo, options = {}) {
  const dir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => join(dir, file)) : [];
  const rows = files.map((file) => {
    const text = readFileSync(file, 'utf8');
    return `| ${escapeCell(relative(dir, file))} | ${escapeCell(firstMatch(text, /^Privacy:\s*(.+)$/m) || 'unknown')} | ${escapeCell(learningReviewFindings(text).length ? 'needs review' : 'ready-looking')} |`;
  });
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Learning Summary

Date: ${new Date().toISOString()}
Learning directory: ${dir}

| Learning | Privacy | Review state |
| --- | --- | --- |
${rows.join('\n') || '| none |  |  |'}

## Promotion Thresholds

- One high-cost miss can create a candidate after human review.
- Three repeated similar events can promote a default route/template/tooling change.
- Product facts belong in repo/unit/shared external context, not global process rules.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function learnReview(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    result: findings.length ? 'needs review before promotion/share' : 'ready-looking',
  });
  console.log('\n## Findings\n');
  console.log(formatList(findings));
}

function learnPromoteCheck(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const promotion = learningPromotionFindings(text);
  const all = [...findings, ...promotion];
  printObject({
    repository: repo,
    packet: relative(repo, packetPath),
    result: all.length ? 'blocked-or-needs-review' : 'ready-for-human-promotion-review',
  });
  console.log('\n## Checks\n');
  console.log(formatList(all.length ? all : ['Sanitized summary, target bucket, evidence source, and review fields look present.']));
  if (all.length) process.exitCode = 1;
}

function learnCandidates(repo, options = {}) {
  const dir = options.dir ? resolve(repo, options.dir) : join(agentsRoot, 'learnings');
  const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.md')).map((file) => join(dir, file)) : [];
  const rows = files
    .map((file) => ({ file, text: readFileSync(file, 'utf8') }))
    .filter((item) => !options.since || item.text.includes(options.since) || basename(item.file) >= options.since)
    .map((item) => {
      const findings = [...learningReviewFindings(item.text), ...learningPromotionFindings(item.text)];
      return `| ${escapeCell(relative(agentsRoot, item.file))} | ${findings.length ? 'needs review' : 'candidate'} | ${escapeCell(firstMatch(item.text, /^Candidate Owner\s*-?\s*(.+)$/m) || firstMatch(item.text, /^Case:\s*(.+)$/m) || '')} |`;
    });
  console.log('| Learning | State | Owner/Case |');
  console.log('| --- | --- | --- |');
  console.log(rows.join('\n') || '| none |  |  |');
}

function learnPromote(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const target = options.target || '';
  if (!target) fail('Pass --target "process|template|route|context" so promotion intent is explicit.');
  const text = readFileSync(packetPath, 'utf8');
  const findings = learningReviewFindings(text);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-learning-promotion.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Promotion Packet

Date: ${new Date().toISOString()}
Source learning: ${relative(repo, packetPath)}
Target: ${target}
Review result: ${findings.length ? 'blocked/pending sanitization' : 'candidate ready for human review'}

## Findings Before Promotion

${formatList(findings)}

## Promotion Target

- process: update route recipes, router guidance, or helper CLI behavior.
- template: update generated docs, QA scripts, profile templates, or prompts.
- route: add or tune a route/overlay/scenario.
- context: move product-specific durable facts to repo/unit/shared external context.

## Human Review Required

- [ ] Sensitive details redacted.
- [ ] Product facts separated from portable process guidance.
- [ ] Validation evidence is enough for this target.
- [ ] Rollback/deprecation path is clear.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
  if (findings.length) process.exitCode = 1;
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

function sanitizeLearningBuckets(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const portable = lines.filter((line) => /process improvement|run-sdlc|sdlc|route|qa|verification|context bucket|learning|checklist/i.test(line)).slice(0, 20);
  const product = lines.filter((line) => /durable fact|root cause|fix:|failure:|workflow:|route:|endpoint|table|column|repository|scenario/i.test(line)).slice(0, 20);
  const sensitive = lines.filter((line) => /secret|token|credential|customer|client|private url|raw log|production log|stack trace/i.test(line)).slice(0, 20);
  return {
    portable: portable.length ? portable : ['No portable process lesson extracted automatically; review manually.'],
    product: product.length ? product : ['No product-context relocation extracted automatically.'],
    sensitive: sensitive.length ? sensitive : ['No obvious sensitive detail found by simple scanner.'],
  };
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

function intakeCheck(repo, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const caseId = taskCaseId(task, options, profile.values);
  const open = intakeOpenItems(task, profile.values, caseId);
  printObject({
    repository: repo,
    task: task || 'not provided',
    caseId: caseId || 'not provided',
    caseIdPolicy: caseIdPolicy(profile.values),
    status: open.length ? 'open' : 'ready',
    openItems: open.join('; ') || 'none',
  });
  if (requiresCaseId(profile.values) && !caseId) process.exitCode = 1;
}

function contextBucketConfidence(repo, options = {}) {
  const target = options.path || '.';
  const task = options.task || '';
  const profile = loadProfile(repo);
  const targetPath = resolve(repo, target);
  const normalized = normalizeUnitPath(relative(repo, targetPath) || target);
  const aliases = contextAliases(profile.values).filter((item) => normalized.toLowerCase().includes(item.match.toLowerCase()) || task.toLowerCase().includes(item.match.toLowerCase()));
  const units = affectedUnits(repo, [normalized], profile, options.unit);
  const candidates = dedupe([
    ...aliases.map((item) => item.bucket),
    ...units.map((unit) => unit.contextBucket),
    profile.values.repoContext,
    profile.values.productContext,
    profile.values.sharedContextRoot,
  ]).filter(Boolean);
  const confidence = aliases.length === 1 || units.length === 1 && units[0].contextBucket ? 'high' : candidates.length === 1 ? 'medium' : candidates.length > 1 ? 'conflict' : 'low';
  printObject({
    repository: repo,
    path: normalized || '.',
    task: task || 'not provided',
    confidence,
    candidates: candidates.join('; ') || 'none configured',
    recommended: candidates[0] || 'configure repo/unit/shared context bucket',
    gate: ['low', 'conflict'].includes(confidence) ? 'ask human before durable context write' : 'safe to use with normal review',
  });
  if (['low', 'conflict'].includes(confidence)) process.exitCode = 1;
}

function searchClassifyResults(repo, options = {}) {
  return searchClassify(repo, options);
}

function qaHandoff(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const recipes = matchRecipes(task, git, profile.values);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-qa-handoff.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC QA Handoff

Task: ${task}
Case ID: ${taskCaseId(task, options, profile.values) || 'not provided'}
Repository: ${repo}
Branch/build: ${git.branch || 'unknown'} / ${git.head || 'unknown'}

## Tester Instructions

- Environment:
- Test account/data:
- Steps:
- Expected result:
- Regression checks:

## Developer Validation Evidence

${formatList(taskEvidenceSummary(repo, packets))}

## Recipe-Specific QA Notes

${formatList(recipes.flatMap((recipe) => recipe.qaAdditions))}

## Manual QA Ownership

- QA tester follows this Markdown manually.
- QA tester does not need AI, source-code access, or developer command knowledge.
- Developer owns any listed caps, setup notes, and environment limitations.
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

function evidenceProvenance(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const rows = provenanceRows(repo, task, git, packets);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Evidence Provenance

Task: ${task}
Repository: ${repo}

| Source | Trust | Freshness | Note |
| --- | --- | --- | --- |
${rows.map((row) => `| ${escapeCell(row.source)} | ${row.trust} | ${row.freshness} | ${escapeCell(row.note)} |`).join('\n')}

## Rule

- Source code, tests, runtime logs, and current command output outrank advisory context.
- Issue text, generated docs, old agent output, and external/tool summaries are advisory until verified.
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

function taskDoctor(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const open = finalGateOpenItems(repo, task, git, packets);
  printObject({
    repository: repo,
    task,
    route: inferRouteFromTask(task, git, profile.values),
    changedFiles: git.changedFiles.length,
    recipes: matchRecipes(task, git, profile.values).map((recipe) => recipe.id).join(', ') || 'none',
    evidence: taskEvidenceSummary(repo, packets).join('; ') || 'none',
    missing: open.join('; ') || 'none detected',
    qaReady: packets.some((packet) => packet.kind === 'qa-script') ? 'yes' : 'no or not needed',
    nextDecision: open[0] || 'approve commit/push/handoff choice if satisfied',
    nextCommand: open[0] ? suggestedFinalGateCommand(open[0], task) : 'sdlc finish packet --task "..."',
  });
}

function learnSplit(repo, options = {}) {
  const packetPath = resolvePacketPath(repo, options.packet);
  const text = readFileSync(packetPath, 'utf8');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-${slug(basename(packetPath, '.md'))}-learning-split.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Learning Split

Source: ${relative(repo, packetPath)}

## Portable Process Lesson

${extractLearningSection(text, 'Portable Process Lesson') || extractLearningSection(text, 'Key Process Learnings') || 'Review and summarize reusable process-only lesson here.'}

## Product-Specific Durable Fact

${extractLearningSection(text, 'Product-Specific Durable Fact') || extractLearningSection(text, 'Durable Facts') || 'Move product/repo/workflow facts to repo/unit/shared context, not global process guidance.'}

## Sensitive / Redacted Detail

- Confirm no raw prompts, source snippets, ticket bodies, issue comments, private URLs, customer/client names, credentials, secrets, raw logs, row-level database data, or proprietary schema details are promoted.
- Keep issue IDs, table names, record IDs, tenant/customer identifiers, and query results out of shared .agents/learnings unless sanitized into a generalized process pattern.

## Candidate Owner

- process / template / route / context / ticket-intake-pattern / ticket-qa-pattern / database-diagnosis-pattern / database-redaction-pattern / external-evidence-capability-gap / parked
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function learnFromRun(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the run learning review can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const packets = findPackets(repo, {});
  const route = inferRouteFromTask(task, git, profile.values);
  const recipes = matchRecipes(task, git, profile.values);
  const surfaces = inferTestingSurfaces(repo, task, git.changedFiles, profile);
  const breadth = taskBreadthAssessment(task, git.changedFiles, surfaces);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-run-learning-review.md`);
  const content = `# SDLC Run Learning Review

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}
Branch: ${git.branch || 'unknown'}
Route: ${route}
Task breadth: ${breadth.level}
Testing surfaces: ${formatInlineList(surfaces)}
Recipes: ${formatInlineList(recipes.map((recipe) => recipe.id))}

## Evidence Signals

- Changed files: ${git.changedFiles.length}
- Packets found: ${packets.length}
- Breadth signals: ${formatInlineList(breadth.signals)}
- Current evidence: ${formatInlineList(taskEvidenceSummary(repo, packets))}

## Review Prompts

1. Route fit: Did the selected route prevent the most likely expensive failure?
2. Context quality: Which repo/unit/shared context was missing, stale, or useful?
3. Validation surface: Was the strongest practical surface used, or was a cap recorded?
4. Tool availability: Did unavailable MCPs, browser, database, ticket, or runtime tools change the evidence path?
5. Developer friction: What slowed the developer down without improving product quality?
6. QA handoff: Could a human tester follow the Markdown without AI, source access, or developer command knowledge?
7. Kept-change fixture value: If this was a fixture app, did the final product improve in a way worth committing?
8. Portable process lesson: What generalized SDLC rule, helper, or template should be considered?

## Candidate Learning Split

### Portable Process Lesson

-

### Product-Specific Durable Fact

-

### Sensitive / Redacted Detail

- Confirm no raw ticket text, private URLs, customer data, secrets, raw logs, row-level database data, or proprietary schema details are promoted.

## Recommended Follow-Up

\`\`\`bash
sdlc learn split --packet ${relative(repo, outPath)}
\`\`\`
`;
  safeWriteTextFile(repo, outPath, content);
  console.log(relative(repo, outPath));
}

function learnBacklog(repo, options = {}) {
  const root = join(agentsRoot, 'learnings');
  const files = existsSync(root) ? readdirSync(root).filter((file) => file.endsWith('.md')) : [];
  console.log('| Learning | Promotion state | Candidate implementation |');
  console.log('| --- | --- | --- |');
  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    const state = learningPromotionFindings(text).length ? 'needs review' : 'ready for review';
    const candidate = firstMatch(text, /^- Implementation candidate:\s*(.+)$/m) || firstMatch(text, /^Candidate implementation:\s*(.+)$/m) || 'not specified';
    console.log(`| ${file} | ${state} | ${escapeCell(candidate)} |`);
  }
}

function intakeOpenItems(task, profile = {}, caseId = '') {
  const open = [];
  if (!task) open.push('task statement missing');
  if (requiresCaseId(profile) && !caseId) open.push('case ID required before commit message suggestion');
  if (!profile.releasePolicy) open.push('release/commit/push policy not configured');
  if (!profile.qaOwnership && !profile.qaOwner) open.push('QA ownership model not configured');
  if (!profile.repoContext && !profile.productContext && !profile.sharedContextRoot) open.push('context bucket not configured');
  return open;
}

function provenanceRows(repo, task, git, packets) {
  const profile = loadProfile(repo);
  const external = externalEvidenceProfile(profile.values);
  const rows = [
    { source: 'source code', trust: 'authoritative', freshness: git.status ? 'current dirty worktree' : 'current clean worktree', note: `${git.changedFiles.length} changed file(s)` },
    { source: 'tests/current command output', trust: 'strong current evidence', freshness: 'current when run this task', note: packets.some((packet) => packet.kind === 'developer-verification') ? 'verification packet found' : 'not found' },
    { source: 'runtime logs/database/provider evidence', trust: matchesAny(task.toLowerCase(), ['log', 'sql', 'provider', 'staging', 'production']) ? 'strong when sanitized and exact' : 'not used', freshness: 'task-specific', note: 'capture exact failing table/endpoint/status when relevant' },
    { source: 'read-only database MCP evidence', trust: external.database.availability === 'available' ? 'strong for observed state when bounded and redacted' : 'not available/unknown unless human provides sanitized result', freshness: 'environment-specific', note: 'proves observed state, not desired product behavior; record environment/time/caps' },
    { source: 'human task statement', trust: 'intent source', freshness: 'current request', note: task },
    { source: 'issue/ticket text', trust: 'scope/acceptance source when current; advisory when stale or conflicting', freshness: external.ticket.availability === 'available' ? 'refreshable through ticket MCP' : 'pasted or unavailable', note: 'verify drift before closeout when ticket MCP is available' },
    { source: 'generated docs/previous agent output', trust: 'advisory', freshness: 'unknown', note: 'never use as proof without source check' },
    { source: 'context docs', trust: 'routing memory', freshness: 'check freshness/conflicts', note: 'source code/tests/logs win when conflicting' },
  ];
  return rows;
}

function toOtelLiteSpan(row) {
  return {
    name: row.type === 'command' || row.command ? `execute_tool ${row.command || 'sdlc'}` : `sdlc.${row.type || 'event'}`,
    attributes: {
      'gen_ai.operation.name': row.command ? 'execute_tool' : 'invoke_agent',
      'sdlc.event.type': row.type || 'event',
      'sdlc.task': row.task || '',
      'sdlc.route': row.route || '',
      'sdlc.summary': row.summary || '',
      'sdlc.status': row.status || '',
      'sdlc.branch': row.branch || '',
      'sdlc.files_changed': row.filesChanged || 0,
    },
  };
}

function actionRisk(action, command = '') {
  const text = `${action} ${command}`.toLowerCase();
  if (matchesAny(text, ['push', 'deploy', 'release', 'merge', 'rm -rf', 'delete', 'credential', 'token', 'secret'])) return 'high';
  if (matchesAny(text, ['network', 'dependency', 'install', 'learning-promotion', 'external'])) return 'medium';
  return 'low';
}

function actionCommandHint(action) {
  if (action === 'commit') return 'git commit -m "<case>: <summary>"';
  if (action === 'push') return 'git push <remote> <branch>';
  if (action === 'dependency') return '<package-manager> install/add ...';
  if (action === 'learning-promotion') return 'sdlc learn promote --packet <path> --target <target>';
  return 'provide --command "..." for exact preview';
}

function artifactBudget(repo, options = {}) {
  const route = options.route || inferRouteFromTask(options.task || '', getGitInfo(repo), loadProfile(repo).values);
  return artifactBudgetCommand(repo, { ...options, route });
}

function extractLearningSection(text, heading) {
  const pattern = new RegExp(`^##+\\s+${escapeRegExp(heading)}\\s*$([\\s\\S]*?)(?=^##+\\s+|\\z)`, 'im');
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function resolvePacketPath(repo, packet) {
  if (!packet) fail('Pass --packet <path> for the packet to complete.');
  const path = resolve(repo, packet);
  if (!existsSync(path)) fail(`Packet not found: ${relative(repo, path)}`);
  return path;
}

function findPackets(repo, options = {}) {
  const dir = options.dir ? resolve(repo, options.dir) : defaultRunsDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => readPacket(repo, join(dir, file)))
    .filter((packet) => packet.kind !== 'other')
    .sort((a, b) => b.mtimeMs - a.mtimeMs || basename(b.path).localeCompare(basename(a.path)));
}

function findLatestPacket(repo, route) {
  const wanted = packetKindForRoute(route);
  return findPackets(repo, {}).find((packet) => packet.kind === wanted || packet.route === route) || null;
}

function readPacket(repo, path) {
  const text = readFileSync(path, 'utf8');
  const kind = packetKind(text);
  const stats = statSync(path);
  return {
    path,
    kind,
    mtimeMs: stats.mtimeMs,
    route: packetRoute(text, kind),
    completed: /## (Review|Release|Developer Verification|QA Script|Manual Smoke) Completion/.test(text),
    verdict: firstMatch(text, /^Verdict:\s*(.+)$/m),
    action: firstMatch(text, /^Action:\s*(.+)$/m),
    head: firstMatch(text, /^Head:\s*(.+)$/m),
    text,
    repo,
  };
}

function packetKind(text) {
  if (text.includes('# SDLC Intake Packet')) return 'intake';
  if (text.includes('# SDLC Unified Finish Packet')) return 'finish';
  if (text.includes('# SDLC QA Handoff')) return 'qa-handoff';
  if (text.includes('# SDLC Evidence Provenance')) return 'evidence-provenance';
  if (text.includes('# SDLC Fix Scope Packet')) return 'fix-scope';
  if (text.includes('# SDLC Analogous Path Search')) return 'analogous-paths';
  if (text.includes('# SDLC EF Core Diagnostic Packet')) return 'efcore-diagnostic';
  if (text.includes('# SDLC Targeted Regression Plan')) return 'regression-plan';
  if (text.includes('# SDLC Review Packet')) return 'review';
  if (text.includes('# SDLC Release Packet')) return 'release';
  if (text.includes('# SDLC Touched Surface Ledger')) return 'touched';
  if (text.includes('# SDLC Impact Packet')) return 'impact';
  if (text.includes('# SDLC Developer Verification Packet')) return 'developer-verification';
  if (text.includes('# QA Test Script:')) return 'qa-script';
  if (text.includes('# SDLC Manual Smoke Packet')) return 'manual-smoke';
  if (text.includes('# SDLC Task Preflight')) return 'task-preflight';
  if (text.includes('# SDLC Task Ledger')) return 'task-ledger';
  if (text.includes('# SDLC Task Start Contract')) return 'task-start';
  if (text.includes('# SDLC Task Finish Decision')) return 'task-finish';
  if (text.includes('# SDLC Workspace Map')) return 'workspace-map';
  if (text.includes('# SDLC Multi-Repo Task Ledger')) return 'multi-repo-ledger';
  if (text.includes('# SDLC Rendered Evidence Packet')) return 'rendered-evidence';
  if (text.includes('# SDLC Release Order Note')) return 'release-order-note';
  if (text.includes('# SDLC Permission Policy Packet')) return 'permission-policy';
  if (text.includes('# SDLC Tool Use Audit Packet')) return 'tool-audit';
  if (text.includes('# SDLC Agentic Risk Packet')) return 'agentic-risk';
  if (text.includes('# SDLC Unit Doctor')) return 'unit-doctor';
  if (text.includes('# SDLC Context Bucket Check')) return 'context-bucket-check';
  if (text.includes('# SDLC Route Retirement Packet')) return 'route-retirement';
  if (text.includes('# SDLC Final Context Check')) return 'context-final-check';
  if (text.includes('# SDLC Test Bootstrap Plan')) return 'test-bootstrap-plan';
  if (text.includes('# SDLC Hook Adapter Plan')) return 'hook-adapter-plan';
  if (text.includes('# SDLC Learning Sanitization')) return 'learning-sanitization';
  if (text.includes('# SDLC Learning Review Cycle')) return 'learning-review-cycle';
  if (text.includes('# SDLC Learning Summary')) return 'learning-summary';
  if (text.includes('# SDLC Learned Flow Promotion Draft')) return 'learned-flow-promotion';
  if (text.includes('# SDLC Git Action Packet')) return 'git-action';
  if (text.includes('# SDLC Multi-Repo Packet')) return 'multi-repo';
  if (text.includes('# SDLC Contract Packet')) return 'contract';
  if (text.includes('# SDLC Data / Storage Packet')) return 'data';
  if (text.includes('# SDLC Integration Packet')) return 'integration';
  if (text.includes('# SDLC Test Introduction Plan')) return 'test-plan';
  if (text.includes('# SDLC Workspace Packet')) return 'workspace';
  if (text.includes('# SDLC Handoff Draft')) return 'handoff';
  if (text.includes('# SDLC Route Packet')) return 'route';
  if (text.includes('# SDLC Evidence Packet')) return 'evidence';
  return 'other';
}

function packetRoute(text, kind) {
  const route = firstMatch(text, /^Route:\s*(.+)$/m) || firstMatch(text, /^Suggested route:\s*(.+)$/m);
  if (route) return route;
  if (kind === 'review') return 'review-only';
  if (kind === 'release') return 'release-push';
  if (kind === 'multi-repo') return 'multi-repo-integration';
  if (kind === 'contract') return 'contract-first';
  if (kind === 'developer-verification') return 'verification';
  if (kind === 'qa-script') return 'qa-script';
  if (kind === 'manual-smoke') return 'manual-smoke';
  return kind;
}

function packetKindForRoute(route) {
  if (route === 'review-only') return 'review';
  if (route === 'release-push') return 'release';
  if (route === 'multi-repo-integration') return 'multi-repo';
  if (route === 'contract-first') return 'contract';
  return 'route';
}

function firstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function packetHas(text, needles) {
  const haystack = String(text || '').toLowerCase();
  return needles.some((needle) => haystack.includes(String(needle).toLowerCase()));
}

function doneChecksForRoute(route, gitInfo, packet) {
  const checks = [
    { name: 'Git status known', status: 'pass', detail: formatInlineStatus(gitInfo.status) },
  ];
  const text = packet?.text || '';
  const packetPath = packet ? relative(packet.repo, packet.path) : '';
  const hasCompletion = packet?.completed || packetHas(text, ['## Review Completion', '## Release Completion']);
  const hasChecks = packetHas(text, ['## Checks', '### Checks', 'Verification', 'command results', 'tests', 'git diff --check']);
  const hasCaps = packetHas(text, ['Caps', 'Evidence Gaps', 'cap']);
  const hasCalibration = packetHas(text, ['Calibration Command', 'Calibration Stub', 'sdlc calibrate add']);
  const hasContextUpdate = packetHas(text, ['Context Update', 'context update', 'docs/context', 'Memory Bank', 'context-state']);
  const hasSecurity = packetHas(text, ['Security Overlay', 'Security/tool triggers', 'Consent gates']);

  if (route === 'review-only') {
    checks.push(
      { name: 'Review packet exists', status: packet?.kind === 'review' ? 'pass' : 'open', detail: packetPath || 'missing review packet' },
      { name: 'Review completion exists', status: hasCompletion ? 'pass' : 'open', detail: hasCompletion ? 'completion appended' : 'run sdlc review complete' },
      { name: 'Findings or pass verdict recorded', status: packetHas(text, ['Findings', 'Verdict:']) ? 'pass' : 'open', detail: 'review must have findings or a clear pass verdict' },
      { name: 'Evidence gaps/caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'record missing evidence or explicit none' },
      { name: 'Calibration ready', status: hasCalibration ? 'pass' : 'open', detail: 'packet should include calibration command/stub' },
      { name: 'No edit route preserved', status: 'note', detail: 'confirm review did not mutate tracked files unless rerouted' },
    );
    return checks;
  }

  if (route === 'release-push') {
    checks.push(
      { name: 'Release packet exists', status: packet?.kind === 'release' ? 'pass' : 'open', detail: packetPath || 'missing release packet' },
      { name: 'Release completion exists', status: hasCompletion ? 'pass' : 'open', detail: hasCompletion ? `action: ${packet.action || 'unknown'}` : 'run sdlc release complete' },
      { name: 'Checks recorded', status: hasChecks ? 'pass' : 'open', detail: 'release must name checks or caps' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'release caps must be explicit' },
      { name: 'Human approval gate recorded', status: packet?.text.includes('Human approval') || packet?.text.includes('approval') ? 'pass' : 'open', detail: 'approval must be explicit before credentialed release action' },
      { name: 'Git action evidence recorded', status: packetHas(text, ['Git Action Evidence', 'No git or release action performed', 'exact command/result']) ? 'pass' : 'open', detail: 'record exact action or no-action evidence' },
      { name: 'Calibration ready', status: hasCalibration ? 'pass' : 'open', detail: 'packet should include calibration command/stub' },
    );
    return checks;
  }

  if (route === 'multi-repo-integration') {
    checks.push(
      { name: 'Multi-repo packet exists', status: packet?.kind === 'multi-repo' ? 'pass' : 'open', detail: packetPath || 'run sdlc multi packet' },
      { name: 'Related repositories listed', status: packetHas(text, ['Related Repositories']) ? 'pass' : 'open', detail: 'affected repositories must be listed or capped' },
      { name: 'Contracts/interfaces considered', status: packetHas(text, ['Contracts Or Interfaces']) ? 'pass' : 'open', detail: 'cross-repo contract surfaces must be named or capped' },
      { name: 'Release order considered', status: packet?.text.includes('Release order') ? 'pass' : 'open', detail: 'release order must be named or capped' },
      { name: 'Per-repo checklist present', status: packet?.text.includes('Per-Repo Checklist') ? 'pass' : 'open', detail: 'affected repos need per-repo checks' },
      { name: 'Stop gates recorded', status: packetHas(text, ['Stop Gates']) ? 'pass' : 'open', detail: 'multi-repo ownership/release gates must be visible' },
    );
    return checks;
  }

  if (route === 'contract-first') {
    checks.push(
      { name: 'Contract packet exists', status: packet?.kind === 'contract' ? 'pass' : 'open', detail: packetPath || 'run sdlc contract packet' },
      { name: 'Contract surfaces named', status: packetHas(text, ['Contract Surfaces']) ? 'pass' : 'open', detail: 'public/cross-boundary surfaces must be identified' },
      { name: 'Compatibility decision present', status: packet?.text.includes('Backward compatibility') ? 'pass' : 'open', detail: 'contract compatibility must be decided or capped' },
      { name: 'Producer/consumer ownership considered', status: packetHas(text, ['Producer/consumer ownership']) ? 'pass' : 'open', detail: 'ownership must be explicit or capped' },
      { name: 'Verification path named', status: packetHas(text, ['Verification', 'Test or contract verification path']) ? 'pass' : 'open', detail: 'contract verification path must be named or capped' },
      { name: 'Implementation is gated', status: packetHas(text, ['No implementation plan before', 'Stop Gates']) ? 'pass' : 'open', detail: 'implementation should not start before contract direction is clear' },
    );
    return checks;
  }

  if (route === 'ui-rendered-review') {
    checks.push(
      { name: 'Route or evidence packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Verification/checks recorded', status: hasChecks ? 'pass' : 'open', detail: 'tests/build/rendered checks or caps must be recorded' },
      { name: 'Rendered evidence considered', status: packet?.text.includes('render') || packet?.text.includes('screenshot') ? 'pass' : 'open', detail: 'run render smoke or record cap' },
      { name: 'Accessibility policy considered', status: packet?.text.includes('Accessibility') ? 'pass' : 'note', detail: 'accessibility remains optional unless profile/human requires it' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'render/accessibility caps must be explicit when skipped' },
      { name: 'Context update considered', status: hasContextUpdate ? 'pass' : 'note', detail: 'update feature/context docs only when durable UI truth changed' },
    );
    return checks;
  }

  if (route === 'bugfix-regression') {
    checks.push(
      { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Reproduction or expected behavior recorded', status: packetHas(text, ['reproduction', 'expected behavior', 'root cause', 'Regression']) ? 'pass' : 'open', detail: 'bugfix needs expected behavior and reproduction/root cause evidence' },
      { name: 'Regression verification recorded', status: packetHas(text, ['regression', 'test', 'Verification', 'Checks']) ? 'pass' : 'open', detail: 'bugfix needs regression check or explicit cap' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'missing reproduction/test caps must be explicit' },
      { name: 'Context update considered', status: hasContextUpdate ? 'pass' : 'note', detail: 'update context only if durable behavior changed' },
    );
    return checks;
  }

  if (route === 'bugfix-live-system') {
    checks.push(
      { name: 'Live-system evidence packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run sdlc bug evidence or sdlc bug reproduce' },
      { name: 'Exact failure evidence recorded', status: packetHas(text, ['Exact error/log source', 'Exact log/request/SQL/source', 'Failing endpoint/table/contract/job']) ? 'pass' : 'open', detail: 'live bugfix needs exact source/log/request/table evidence or cap' },
      { name: 'Analogous working path considered', status: packetHas(text, ['analogous working path', 'Existing successful analogous path']) ? 'pass' : 'open', detail: 'compare against a known good path when available' },
      { name: 'Smallest fix discipline recorded', status: packetHas(text, ['Smallest evidence-backed fix', 'Smallest evidence-backed fix chosen']) ? 'pass' : 'open', detail: 'avoid broad fallback without evidence' },
      { name: 'Regression or QA scenario retest recorded', status: packetHas(text, ['Regression Coverage', 'QA Scenario Retest', 'scenario']) ? 'pass' : 'open', detail: 'record targeted regression or human QA scenario retest' },
      { name: 'Sensitive detail handled', status: packetHas(text, ['Sensitive details redacted', 'Sensitive / Redacted Detail', 'Sensitive details']) ? 'pass' : 'note', detail: 'sanitize product/client/log detail before global learning' },
    );
    return checks;
  }

  if (route === 'weak-test-legacy') {
    checks.push(
      { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Mutation or negative check recorded', status: packetHas(text, ['mutation', 'negative check', 'failing assertion', 'expected failure']) ? 'pass' : 'open', detail: 'weak-test proof needs failing evidence or explicit cap' },
      { name: 'Restoration proof recorded', status: packetHas(text, ['restoration', 'restored', 'post-restore']) ? 'pass' : 'open', detail: 'temporary mutation must be restored cleanly' },
      { name: 'Coverage cap recorded', status: hasCaps || packetHas(text, ['coverage cap']) ? 'pass' : 'open', detail: 'test weakness/residual coverage must be explicit' },
    );
    return checks;
  }

  if (route === 'tiny-docs') {
    checks.push(
      { name: 'Diff hygiene recorded', status: packetHas(text, ['git diff --check', 'diff hygiene']) ? 'pass' : 'open', detail: 'tiny docs should at least pass diff hygiene' },
      { name: 'Source truth checked', status: packetHas(text, ['source truth', 'references', 'links', 'path search']) ? 'pass' : 'note', detail: 'check references when docs point to code/paths/URLs' },
      { name: 'No broad workflow required', status: 'note', detail: 'tiny docs may skip heavier packets when source truth is clear' },
    );
    return checks;
  }

  if (route === 'standard') {
    checks.push(
      { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
      { name: 'Scope recorded', status: packetHas(text, ['Scope', 'Intent', 'Task']) ? 'pass' : 'open', detail: 'standard work needs a scoped claim' },
      { name: 'Checks recorded', status: hasChecks ? 'pass' : 'open', detail: 'tests/build/diff checks or explicit caps required' },
      { name: 'Security/tool triggers considered', status: hasSecurity ? 'pass' : 'note', detail: 'security overlay required when triggers exist' },
      { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'missing evidence must be explicit' },
      { name: 'Context update considered', status: hasContextUpdate ? 'pass' : 'note', detail: 'update docs only when durable truth changed' },
      { name: 'Calibration ready', status: hasCalibration ? 'pass' : 'open', detail: 'standard work should leave calibration command/stub' },
    );
    return checks;
  }

  checks.push(
    { name: 'Evidence or route packet exists', status: packet ? 'pass' : 'open', detail: packetPath || 'run route/evidence packet' },
    { name: 'Verification recorded', status: hasChecks ? 'pass' : 'open', detail: 'verification evidence or explicit cap required' },
    { name: 'Caps recorded', status: hasCaps ? 'pass' : 'open', detail: 'missing evidence must be explicit' },
  );
  return checks;
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

function detectTestFrameworks(repo, packageJson) {
  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const names = Object.keys(deps);
  const frameworks = [];
  if (names.includes('vitest')) frameworks.push('Vitest');
  if (names.includes('jest') || names.includes('@types/jest')) frameworks.push('Jest');
  if (names.includes('@playwright/test') || existsAny(repo, ['playwright.config.ts', 'playwright.config.js'])) frameworks.push('Playwright');
  if (names.includes('cypress') || existsAny(repo, ['cypress.config.ts', 'cypress.config.js'])) frameworks.push('Cypress');
  if (hasFileExt(repo, ['.csproj']) && projectFilesContain(repo, ['xunit', 'nunit', 'mstest'])) frameworks.push('.NET test project');
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) frameworks.push('Deno test');
  return dedupe(frameworks);
}

function detectCiSystems(repo) {
  const systems = [];
  if (existsSync(join(repo, '.github', 'workflows'))) systems.push('GitHub Actions');
  if (existsAny(repo, ['.gitlab-ci.yml'])) systems.push('GitLab CI');
  if (existsAny(repo, ['azure-pipelines.yml'])) systems.push('Azure Pipelines');
  if (existsAny(repo, ['buildspec.yml'])) systems.push('AWS CodeBuild/CodePipeline');
  if (existsAny(repo, ['Jenkinsfile'])) systems.push('Jenkins');
  return systems;
}

function detectDeploySystems(repo) {
  const systems = [];
  if (existsAny(repo, ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'])) systems.push('containerized deploy');
  if (existsAny(repo, ['buildspec.yml'])) systems.push('AWS build/deploy pipeline');
  if (existsAny(repo, ['serverless.yml', 'serverless.ts'])) systems.push('Serverless');
  if (existsAny(repo, ['vercel.json'])) systems.push('Vercel');
  if (existsAny(repo, ['netlify.toml'])) systems.push('Netlify');
  if (existsSync(join(repo, '.ebextensions'))) systems.push('Elastic Beanstalk');
  return systems;
}

function sharedContextReachability(repo, profile) {
  const paths = sharedContextPaths(repo, profile);
  if (!paths.length) return 'not configured';
  const reachable = paths.filter((item) => existsSync(item.path)).length;
  return `${reachable}/${paths.length}`;
}

function sharedContextDetails(repo, profile) {
  const paths = sharedContextPaths(repo, profile);
  if (!paths.length) return ['- Shared/product/repo context paths are not configured.'];
  return paths.map((item) => `- ${item.label}: ${existsSync(item.path) ? 'reachable' : 'missing'} (${item.display})`);
}

function sharedContextPaths(repo, profile) {
  return [
    ['sharedContextRoot', 'Shared context root'],
    ['productContext', 'Product context'],
    ['repoContext', 'Repo context'],
    ['productContextIndex', 'Product context index'],
    ['repoContextIndex', 'Repo context index'],
    ['serviceMap', 'Service map'],
    ['workflowMap', 'Workflow map'],
    ['releaseOrder', 'Release order'],
    ['knownFailureModes', 'Known failure modes'],
  ]
    .filter(([key]) => profile[key])
    .map(([key, label]) => {
      const path = resolveContextPath(repo, profile[key]);
      return { key, label, path, display: profile[key] };
    });
}

function projectFilesContain(repo, needles) {
  let scanned = 0;
  const lowerNeedles = needles.map((needle) => needle.toLowerCase());
  const visit = (dir, depth = 0) => {
    if (depth > 4 || scanned > 200) return false;
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      if (['.git', 'node_modules', 'dist', 'build', '.next'].includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory() && visit(path, depth + 1)) return true;
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.csproj')) continue;
      scanned++;
      const text = readFileSync(path, 'utf8').toLowerCase();
      if (lowerNeedles.some((needle) => text.includes(needle))) return true;
    }
    return false;
  };
  return visit(repo);
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

function formatReviewTargets(gitInfo) {
  if (gitInfo.changedFiles.length) {
    return `${formatList(gitInfo.changedFiles)}

Suggested diff commands:

\`\`\`bash
git diff --stat
git diff
\`\`\``;
  }

  return `- No dirty working-tree files detected.
- Review the latest commit, branch state, or explicit artifact named in the task.

Suggested read-only commands:

\`\`\`bash
git show --stat --oneline HEAD
git show --check --stat HEAD
\`\`\``;
}

function formatReviewChecks(commands, route) {
  const lines = [
    '- Read the relevant diff/artifacts before running broader checks.',
    '- `git diff --check` when reviewing a dirty working tree.',
    '- `git show --check --stat HEAD` when reviewing the latest committed change.',
  ];
  if (commands.test) lines.push(`- test: \`${commands.test}\``);
  if (commands.build && route !== 'review-only') lines.push(`- build: \`${commands.build}\``);
  if (commands.lint) lines.push(`- lint/typecheck/format: \`${commands.lint}\``);
  if (commands.rendered && route === 'ui-rendered-review') lines.push(`- rendered: \`${commands.rendered}\``);
  return lines.join('\n');
}

function classifyTouchedSurface(file) {
  const value = String(file || '').toLowerCase();
  if (/\.(asp|asa|aspx|ascx)$/.test(value)) return 'frontend/UI';
  if (/\.(tsx|jsx|css|scss|html|vue|svelte)$/.test(value)) return 'frontend/UI';
  if (/\.(cs|vb|fs|go|rs|java|kt|php|rb|py)$/.test(value)) return 'backend/API';
  if (/\.(sql)$/.test(value) || value.includes('migration') || value.includes('schema')) return 'database/storage';
  if (value.includes('contract') || value.includes('openapi') || value.includes('swagger') || value.includes('proto')) return 'contracts/interfaces';
  if (value.includes('integration') || value.includes('webhook') || value.includes('vendor') || value.includes('third')) return 'external integration';
  if (value.includes('package.json') || value.includes('package-lock') || value.includes('pnpm-lock') || value.includes('yarn.lock') || value.includes('deno.json')) return 'dependencies';
  if (value.includes('.env') || value.includes('config') || value.includes('appsettings') || value.includes('pipeline') || value.includes('docker')) return 'config/environment';
  if (/\.(test|spec)\./.test(value) || value.includes('__tests__') || value.includes('/tests/')) return 'tests';
  if (value.endsWith('.md') || value.includes('/docs/')) return 'docs/context';
  if (value.includes('/scripts/') || value.includes('/tools/') || value.includes('/bin/')) return 'scripts/tooling';
  if (value.includes('/dist/') || value.includes('/build/') || value.includes('/generated/')) return 'generated/build artifacts';
  return 'source/other';
}

function classifyRuntimeSurface(file) {
  const value = String(file || '').toLowerCase();
  if (/\.(asp|asa)$/.test(value)) return 'ASP Classic';
  if (/\.(cs|csproj|sln)$/.test(value)) return '.NET';
  if (/\.(sql)$/.test(value)) return 'SQL/database';
  if (value.includes('deno.json') || value.includes('jsr.json')) return 'Deno/JSR';
  if (value.includes('package.json') || /\.(ts|tsx|js|jsx)$/.test(value)) return 'Node/TypeScript';
  if (value.includes('next.config')) return 'Next.js';
  if (value.includes('docker') || value.includes('pipeline') || value.includes('workflow')) return 'deployment/tooling';
  return 'generic';
}

function needsManualQa(file) {
  return ['frontend/UI', 'backend/API', 'database/storage', 'external integration', 'contracts/interfaces', 'config/environment', 'dependencies'].includes(classifyTouchedSurface(file));
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

function smokeStepSuggestions(task, files) {
  const surfaces = dedupe(files.map(classifyTouchedSurface));
  const steps = ['Open or invoke the primary changed workflow and confirm the intended behavior.'];
  if (surfaces.includes('frontend/UI') || matchesAny(task.toLowerCase(), ['ui', 'screen', 'page', 'animation', 'game'])) {
    steps.push('Render the affected UI locally and inspect the changed state on desktop and a narrow/mobile viewport when practical.');
  }
  if (surfaces.includes('backend/API')) steps.push('Exercise the affected API/service path with the smallest available local or QA-safe request.');
  if (surfaces.includes('database/storage')) steps.push('Confirm changed data reads/writes with safe test data and record any migration/backfill cap.');
  if (surfaces.includes('external integration')) steps.push('Use a sandbox/mock path or record the exact external integration cap.');
  if (surfaces.includes('dependencies')) steps.push('Run the closest startup/build/test path to catch dependency upgrade regressions.');
  steps.push('Check the nearest unchanged workflow so QA receives one regression path, not only the happy path.');
  return dedupe(steps);
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

function learningReviewFindings(text) {
  const findings = [];
  const required = ['## Summary', '## Portable Process Lesson', '## Product-Specific Durable Fact', '## Sensitive / Redacted Detail', '## Candidate Owner', '## Validation Needed'];
  for (const heading of required) if (!text.includes(heading)) findings.push(`Missing section: ${heading}.`);
  const sensitiveLines = text
    .split(/\r?\n/)
    .filter((line) => /password|secret|token|api key|credential|https?:\/\/[^\s)]+|production log|raw log|stack trace|customer|client/i.test(line))
    .filter((line) => !/do not include|redact|redacted|privacy|sensitive detail/i.test(line));
  if (sensitiveLines.some((line) => /password|secret|token|api key|credential/i.test(line))) findings.push('Potential secret/credential language found; redact before sharing.');
  if (sensitiveLines.some((line) => /https?:\/\/[^\s)]+/i.test(line))) findings.push('Private URL may be present; replace with a sanitized system label unless it is intentionally public.');
  if (sensitiveLines.some((line) => /production log|raw log|stack trace|customer|client/i.test(line))) findings.push('Potential sensitive product/client/log detail; confirm it is redacted or belongs in external product context.');
  if (!/Privacy:\s*(public|internal|sensitive-redacted)/i.test(text)) findings.push('Privacy classification should be public, internal, or sensitive-redacted.');
  return dedupe(findings);
}

function formatReleaseChecks(commands) {
  const lines = ['- `git diff --check` for dirty work or `git show --check --stat HEAD` for committed-only release review.'];
  if (commands.test) lines.push(`- test: \`${commands.test}\``);
  if (commands.build) lines.push(`- build: \`${commands.build}\``);
  if (commands.lint) lines.push(`- lint/typecheck/format: \`${commands.lint}\``);
  if (!commands.test && !commands.build && !commands.lint) lines.push('- No project test/build/lint commands discovered; record this as a release cap.');
  return lines.join('\n');
}

function formatReleaseStopGates(gitInfo, profile) {
  const gates = [];
  if (gitInfo.status) gates.push('Dirty working tree is present; confirm whether each file belongs in the release before committing or pushing.');
  if (!gitInfo.upstream) gates.push('No upstream branch is configured; confirm push target before any credentialed write.');
  if (gitInfo.behind > 0) gates.push(`Branch is ${gitInfo.behind} commit(s) behind upstream; pull/rebase/merge policy must be confirmed before release.`);
  if (!profile.releasePolicy) gates.push('Release policy is not configured in the SDLC profile.');
  if (!profile.humanApprovalGates) gates.push('Human approval gates are not configured in the SDLC profile.');
  gates.push('Explicit human approval is required before commit, push, merge, deploy, publish, or destructive Git actions.');
  return formatList(gates);
}

function recentCommits(repo, count = 5) {
  return git(repo, ['log', '--oneline', `-${count}`]).split(/\r?\n/).filter(Boolean);
}

function accessibilityPolicy(profile) {
  const value = String(profile.accessibilityReviewPolicy || 'optional').trim().toLowerCase();
  return ['optional', 'suggested', 'required'].includes(value) ? value : 'optional';
}

function formatAccessibilityPolicy(policy, route) {
  const routeText = route === 'ui-rendered-review' ? 'This route touches rendered UI.' : 'This route does not inherently require accessibility evidence.';
  if (policy === 'required') {
    return `Policy: required
${routeText}
Required evidence: run the repository accessibility check or record the work as incomplete/capped until a human waives it.`;
  }
  if (policy === 'suggested') {
    return `Policy: suggested
${routeText}
Suggested evidence: run accessibility checks when UI changes affect real users, keyboard use, forms, navigation, focus, semantics, contrast, or production-facing surfaces. If skipped, record a cap.`;
  }
  return `Policy: optional
${routeText}
Default behavior: accessibility checks are available but not a stopping gate. For internal tools, skipped accessibility is not a failure unless the repository or human requires it.`;
}

function formatSecurityOverlay(triggers) {
  if (!triggers.length) {
    return `Security/tool triggers:
- none detected

Consent gates:
- use normal route gates

Mitigations or caps:
- none`;
  }

  return `Security/tool triggers:
${formatList(triggers)}

Consent gates:
- get explicit approval before credentialed writes, destructive actions, dependency/tool installs, production effects, or external service calls

Mitigations or caps:
- load threat-model/security review guidance when data, auth, dependency, tool, external integration, prompt/tool injection, or production risk is present
- document unavailable security evidence as an explicit cap`;
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

function learningSuggestionsFromRun(repo, runDir, task) {
  const checks = readControlJsonLines(join(runDir, 'checks.jsonl'));
  const gates = readControlJsonLines(join(runDir, 'gates.jsonl'));
  const waivers = readControlJsonLines(join(runDir, 'waivers.jsonl'));
  const suggestions = [];
  if (checks.some((check) => ['sandbox-failure', 'tool-unavailable', 'tool-failure'].includes(check.status))) suggestions.push('Tooling/sandbox failures occurred; consider documenting runtime fallback or command classification guidance.');
  if (gates.filter((gate) => gate.status === 'block').length > 2) suggestions.push('Multiple blocking gates occurred; review whether preflight should expose these earlier.');
  if (waivers.length) suggestions.push('Waivers were used; review whether this is a repeated cap or a one-off environment limitation.');
  if (checks.some((check) => check.status === 'cap')) suggestions.push('Evidence caps were recorded; consider setup/profile changes if this repeats.');
  if (matchesAny(String(task || '').toLowerCase(), ['fixture', 'battle soccer'])) suggestions.push('Fixture validation used; split portable process lessons from product-specific game facts.');
  return dedupe(suggestions);
}

function contextBudget(repo, options = {}) {
  const rows = contextBudgetRows(repo, options);
  printTable(['Source', 'Approx Tokens', 'Status', 'Note'], rows.map((row) => [row.source, row.tokens, row.status, row.note]));
  const total = rows.reduce((sum, row) => sum + row.tokens, 0);
  console.log(`Total approximate tokens: ${total}`);
  if (rows.some((row) => row.status === 'warn')) process.exitCode = 1;
}

function contextAssemble(repo, options = {}) {
  const phase = options.phase || 'planning';
  const packet = buildContextPacket(repo, phase, options);
  const outPath = options.out ? resolve(repo, options.out) : join(ensureControlRunDir(repo, options, options.task || phase), 'context', `${phase}.context.md`);
  safeWriteTextFile(repo, outPath, renderContextPacket(packet));
  appendContextLedger(repo, outPath, packet);
  console.log(relative(repo, outPath));
}

function contextCompact(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const state = readCurrentState(repo, options) || synthesizeState(repo, options.task || '', options);
  const manifest = info.runDir ? readEvidenceManifest(info.runDir) : { required: [], captured: [] };
  const lines = ['# SDLC Compact Context', '', `Task: ${state.task || options.task || 'not provided'}`, `Route: ${state.route || 'unknown'}`, `Stage: ${state.stage || 'unknown'}`, '', '## Evidence Snapshot', '', ...formatList((manifest.captured || []).map((item) => `${item.kind}: ${item.summary}`).slice(-12)).split('\n'), '', '## Next Action', '', nextActionForStage(state.stage || 'intake', state.task || options.task || '')];
  const outPath = options.out ? resolve(repo, options.out) : join(ensureControlRunDir(repo, options, options.task || 'compact'), 'context', 'compact.context.md');
  safeWriteTextFile(repo, outPath, `${lines.join('\n')}\n`);
  console.log(relative(repo, outPath));
}

function contextLedger(repo, options = {}) {
  const info = readCurrentStateInfo(repo, options);
  const ledgers = [];
  if (info.runDir) ledgers.push(join(info.runDir, 'context', 'context-ledger.jsonl'));
  const root = defaultRunsDir(repo);
  if (existsSync(root)) {
    for (const file of readdirSync(root)) {
      const candidate = join(root, file, 'context', 'context-ledger.jsonl');
      if (existsSync(candidate)) ledgers.push(candidate);
    }
  }
  const rows = dedupe(ledgers).flatMap((ledger) => readJsonLines(ledger));
  if (!rows.length) return console.log('No context ledger rows found. Run sdlc context assemble first.');
  printTable(['Time', 'Phase', 'Tokens', 'Path'], rows.map((row) => [row.timestamp, row.phase, row.approxTokens, row.path]));
}

function learnExport(repo, options = {}) {
  const rows = readJsonLines(defaultLearningBacklogPath(repo)).map(sanitizePortableObject);
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), 'sdlc-learnings.sanitized.json');
  safeWriteJsonFile(repo, outPath, { schema: 'sdlc-sanitized-learning-export-v1', exportedAt: new Date().toISOString(), rows });
  console.log(relative(repo, outPath));
}

function learnImport(repo, options = {}) {
  if (!options.file) fail('Pass --file <path>.');
  const input = readJsonIfExists(resolve(repo, options.file));
  const rows = Array.isArray(input?.rows) ? input.rows : Array.isArray(input) ? input : [];
  const target = defaultLearningBacklogPath(repo);
  for (const row of rows) appendControlJsonLine(repo, target, { ...row, importedAt: new Date().toISOString(), importReviewRequired: true });
  console.log(`${rows.length} learning rows imported to ${relative(repo, target)}`);
}

function sanitizePortableObject(value) {
  if (Array.isArray(value)) return value.map(sanitizePortableObject);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = sanitizePortableObject(item);
    return out;
  }
  if (typeof value !== 'string') return value;
  return sanitizeOneLine(value)
    .replace(/\/Users\/[^\s/]+/g, '/Users/[redacted]')
    .replace(/\b[A-Z]{1,10}-\d{1,8}\b/g, '[ticket-id]')
    .replace(/\b(?:client|customer|company|tenant)[-_ ]?[A-Za-z0-9]+\b/gi, '[redacted-entity]');
}

function contextBudgetRows(repo, options = {}) {
  const profile = loadProfile(repo);
  const state = readCurrentState(repo, options) || loadRunState(repo, options.task || '') || {};
  const docs = contextDocCandidates(repo, profile.values).filter((item) => existsSync(item.path));
  return [
    budgetRow('runtime adapter/global skill prompt', 2500, 'estimate', 'keep static instructions minimal'),
    budgetRow('repo profile', approxTokens(profile.path ? readFileSync(profile.path, 'utf8') : ''), profile.path ? 'ok' : 'warn', profile.path ? relative(repo, profile.path) : 'missing'),
    budgetRow('task state', approxTokens(JSON.stringify(state)), state.task || options.task ? 'ok' : 'warn', state.task ? 'current state found' : options.task ? 'task provided without current state file' : 'task not provided'),
    budgetRow('context docs', docs.reduce((sum, item) => sum + approxTokens(safeReadSmall(item.path, 12000)), 0), docs.length > 4 ? 'warn' : 'ok', `${docs.length} candidate docs`),
    budgetRow('tool output summaries', 600, 'estimate', 'prefer summaries over raw logs'),
  ];
}

function budgetRow(source, tokens, status, note) {
  return { source, tokens: Math.round(tokens || 0), status, note };
}

function approxTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function buildContextPacket(repo, phase, options = {}) {
  const task = options.task || '';
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const route = options.route || inferRouteFromTask(task, git, profile.values);
  const files = optionFiles(options, git.changedFiles);
  const units = affectedUnits(repo, files, profile, options.unit);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const requirements = evidenceRequirementsForTask(repo, task, route, git, profile, options);
  return { phase, task, route, repo, branch: git.branch, files, units, surfaces, requirements, profilePath: profile.path ? relative(repo, profile.path) : '', nextAction: nextActionForPhase(phase, task) };
}

function renderContextPacket(packet) {
  return ['# SDLC Context Packet', '', `Phase: ${packet.phase}`, `Task: ${packet.task || 'not provided'}`, `Route: ${packet.route}`, `Repository: ${packet.repo}`, `Branch: ${packet.branch || 'unknown'}`, '', '## Affected Units', '', ...formatList(packet.units.map((unit) => `${unit.name}: ${unit.path} (${unit.testSurface || 'surface?'})`)).split('\n'), '', '## Changed Files', '', ...formatList(packet.files).split('\n'), '', '## Testing Surfaces', '', ...formatList(packet.surfaces).split('\n'), '', '## Required Evidence', '', ...formatList(packet.requirements.map((item) => `${item.level}: ${item.id} - ${item.summary}`)).split('\n'), '', '## Context Source', '', `- Profile: ${packet.profilePath || 'not found'}`, '- Archived plans excluded by default.', '- Load exact code or docs only when needed for this phase.', '', '## Next Action', '', packet.nextAction, ''].join('\n');
}

function appendContextLedger(repo, outPath, packet) {
  const ledger = join(dirname(outPath), 'context-ledger.jsonl');
  appendControlJsonLine(repo, ledger, { timestamp: new Date().toISOString(), phase: packet.phase, task: packet.task, path: outPath, approxTokens: approxTokens(renderContextPacket(packet)) });
}

function nextActionForPhase(phase, task) {
  if (phase === 'intake') return 'sdlc config validate && sdlc capability snapshot';
  if (phase === 'planning') return `sdlc recipe compile --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'implementation') return 'edit within affected units and keep scope ledger current';
  if (phase === 'verification') return `sdlc checks plan && sdlc evidence plan --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'qa') return `sdlc qa build --task "${escapeCommandArg(task || '...')}"`;
  if (phase === 'finish') return `sdlc complete check --task "${escapeCommandArg(task || '...')}"`;
  return 'continue with SDLC state/current evidence';
}

function defaultLearningBacklogPath(repo) {
  return join(repo, '.ai-local', 'sdlc-learning-backlog.jsonl');
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
