import { printObject } from './common.mjs';
import { buildCommandPlan } from './commandplan.mjs';

export function guideStart(repo, options = {}) {
  const task = options.task || '';
  if (!task) {
    console.error('Pass --task "...".');
    process.exit(1);
  }
  const plan = buildCommandPlan(repo, task, { ...options, phase: options.phase || 'intake' });
  printGuide('start', plan);
}

export function guideStatus(repo, options = {}) {
  const task = options.task || 'current task';
  const plan = buildCommandPlan(repo, task, { ...options, phase: options.phase || 'verification' });
  printGuide('status', plan);
}

export function guideFinish(repo, options = {}) {
  const task = options.task || '';
  if (!task) {
    console.error('Pass --task "...".');
    process.exit(1);
  }
  const plan = buildCommandPlan(repo, task, { ...options, phase: 'finish' });
  printGuide('finish', plan);
}

function printGuide(mode, plan) {
  printObject({ guide: mode, task: plan.task, route: plan.route, qaMode: plan.qaMode, securityTriggers: plan.securityTriggers.join(', ') || 'none' });
  console.log('\nNext actions');
  for (const row of plan.commands.slice(0, 5)) console.log(`- ${row.command}\n  Why: ${row.why}`);
  console.log('\nChat prompt');
  console.log(`Use SDLC for this task: ${plan.task}. Follow the recommended route, keep context compact, verify with surface-correct evidence, and perform requested Git actions only with applicable user/repository authority.`);
  console.log('\nHuman gates');
  console.log('- Commit and push require explicit approval.');
  console.log('- Merge, deploy, release, ticket updates, database writes, and pipeline triggers are not automatic.');
  if (plan.securityTriggers.length) console.log('- Security/tool triggers are present; run policy/risk checks before high-impact actions.');
}
