import { join, relative } from 'node:path';
import { escapeCommandArg, fail, optionFiles, printObject, slug } from './common.mjs';
import { agentsLint, agentsPacket, agentsPlan } from './agentpackets.mjs';
import { journalCheck } from './journal.mjs';
import { defaultRunsDir } from './paths.mjs';
import { findPackets } from './packets.mjs';
import { runStartGates } from './run.mjs';
import { taskCaseId, taskPreflight, taskType } from './task.mjs';
import { confidenceBlock, fastPassAssessment, formatQualityFloorTable, preflightHumanJudgment, preflightInferred, preflightProved, qualityFloorRows, routeConfidence, safeDefaultsForPreflight, taskBreadthAssessment } from './assessment.mjs';
import { verifyLadder } from './verify.mjs';

export function dryRunValidate(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "...".');
  const taskId = options.taskId || slug(task);
  const role = options.role || 'verification-worker';
  const runOptions = { ...options, task, taskId, dryRun: true };
  const packetPath = join(defaultRunsDir(repo), taskId, 'agents', `${role}.md`);

  console.log('# SDLC Dry-Run Validation\n');
  printObject({
    repository: repo,
    task,
    taskId,
    role,
  });

  section('Preflight');
  taskPreflight(repo, runOptions, preflightDependencies());

  section('Agent Plan');
  agentsPlan(repo, runOptions);

  section('Agent Packet');
  agentsPacket(repo, { ...runOptions, role });

  section('Agent Packet Lint');
  agentsLint(repo, { ...runOptions, packet: relative(repo, packetPath) });

  section('Verify Ladder');
  verifyLadder(repo, runOptions);

  section('Journal Check');
  journalCheck(repo, runOptions);

  section('Summary');
  printObject({
    result: process.exitCode ? 'needs review' : 'completed',
    packet: relative(repo, packetPath),
    journal: relative(repo, join(defaultRunsDir(repo), taskId, 'run.json')),
    nextAction: process.exitCode ? 'Review warnings above before relying on this dry run.' : `Review ${relative(repo, packetPath)} or rerun with --role <role> for another packet.`,
  });
}

function section(title) {
  console.log(`\n## ${title}\n`);
}

function preflightDependencies() {
  return {
    confidenceBlock,
    escapeCommandArg,
    fastPassAssessment,
    findPackets,
    formatQualityFloorTable,
    optionFiles,
    preflightHumanJudgment,
    preflightInferred,
    preflightProved,
    qualityFloorRows,
    routeConfidence,
    runStartGates,
    safeDefaultsForPreflight,
    taskBreadthAssessment,
    taskCaseId,
    taskType,
  };
}
