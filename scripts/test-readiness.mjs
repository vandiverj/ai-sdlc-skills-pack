#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'scripts/sdlc/sdlc.mjs');
const repo = mkdtempSync(join(tmpdir(), 'sdlc-readiness-'));
const task = 'fix README typo';
function run(args, expected = 0, taskName = task) {
  const result = spawnSync(process.execPath, [cli, ...args, '--repo', repo, '--task', taskName], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, expected, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
// Command arguments after -- belong to the child, not the helper.
function check(command, expected = 0) {
  const result = spawnSync(process.execPath, [cli, 'run-check', '--repo', repo, '--task', task, '--name', 'diff', '--criterion', 'ac-1', '--', ...command], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, expected, `${command.join(' ')}\n${result.stdout}\n${result.stderr}`);
}
try {
  assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
  writeFileSync(join(repo, '.gitignore'), '.ai-local/\n');
  writeFileSync(join(repo, 'README.md'), '# Correct spelling\n');
  run(['start', '--files', 'README.md']);
  run(['prove'], 1);
  run(['finish-ready'], 1);
  check(['git', 'diff', '--check']);
  run(['prove']);
  assert.match(run(['finish-ready']), /Result: pass/);
  assert.match(run(['next']), /Finish the authorized task/);
  // Compatibility route uses the same proof and does not demand QA/impact packets.
  assert.match(run(['final', 'gate']), /Ready To Commit: yes|Ready to commit: yes|ReadyToCommit: yes|Ready To Commit: yes/i);

  writeFileSync(join(repo, 'README.md'), '# Changed after verification\n');
  run(['prove'], 1);
  run(['finish-ready'], 1);
  check(['git', 'diff', '--check']);
  run(['finish-ready']);
  check([process.execPath, '-e', 'process.exit(1)'], 1);
  run(['prove'], 1);
  run(['finish-ready'], 1);
  check(['git', 'diff', '--check']);
  run(['run-check', '--name', 'diff', '--criterion', 'ac-1', '--cap', 'tool unavailable'], 1);
  run(['finish-ready'], 1);
  check(['definitely-not-an-installed-sdlc-command'], 1);
  run(['finish-ready'], 1);
  check(['git', 'diff', '--check']);
  run(['finish-ready']);

  // Staging identical contents preserves proof freshness.
  assert.equal(spawnSync('git', ['add', '.'], { cwd: repo }).status, 0);
  run(['finish-ready']);
  run(['run-check', '--name', 'docs-test', '--criterion', 'ac-1', '--cap', 'unresolved independent check'], 1);
  run(['finish-ready'], 1);
  run(['prove'], 1);
  run(['final', 'gate'], 1);
  run(['run-check', '--name', 'docs-test', '--criterion', 'ac-1', '--manual', 'docs check passed']);
  run(['finish-ready']);
  const selectedContract = join(repo, '.ai-local/selected-contract.json');
  writeFileSync(selectedContract, JSON.stringify({ task, acceptanceCriteria: [{ id: 'ac-1', text: 'docs check' }, { id: 'ac-2', text: 'independent acceptance' }] }));
  run(['prove', '--contract', selectedContract], 1);
  run(['finish-ready', '--contract', selectedContract], 1);
  run(['final', 'gate', '--contract', selectedContract], 1);

  const singleContract = { task, acceptanceCriteria: [{ id: 'ac-1', text: 'docs spelling check' }] };
  writeFileSync(selectedContract, JSON.stringify(singleContract));
  run(['run-check', '--contract', selectedContract, '--name', 'contract-docs', '--criterion', 'ac-1', '--manual', 'docs spelling check passed']);
  run(['prove', '--contract', selectedContract]);
  singleContract.acceptanceCriteria[0].text = 'All linked pages must return HTTP 200';
  writeFileSync(selectedContract, JSON.stringify(singleContract));
  run(['prove', '--contract', selectedContract], 1);
  run(['finish-ready', '--contract', selectedContract], 1);

  // An explicit different task never reuses the current task's proof.
  run(['start', '--files', 'README.md'], 0, 'review README wording');
  run(['finish-ready'], 1, 'review README wording');
  run(['finish-ready']);

  const scopeTask = 'fix crash';
  run(['start', '--files', 'README.md'], 0, scopeTask);
  mkdirSync(join(repo, 'app'), { recursive: true });
  writeFileSync(join(repo, 'app/NewView.swift'), 'struct NewView {}\n');
  run(['run-check', '--name', 'test', '--criterion', 'ac-1', '--manual', 'test passed'], 0, scopeTask);
  run(['finish-ready'], 1, scopeTask);

  const behaviorTask = 'Change the editor so a user can replace a saved observation and keep its identity';
  mkdirSync(join(repo, 'app'), { recursive: true });
  writeFileSync(join(repo, 'app/EditorView.swift'), 'struct EditorView {}\n');
  run(['start', '--files', 'app/EditorView.swift'], 0, behaviorTask);
  run(['evidence', 'add', '--kind', 'test', '--criterion', 'ac-1', '--summary', 'build passed'], 0, behaviorTask);
  run(['finish-ready'], 1, behaviorTask);
  run(['run-check', '--name', 'ui-test', '--criterion', 'ac-1', '--manual', 'Rendered UI replacement and identity regression passed'], 0, behaviorTask);
  run(['finish-ready'], 1, behaviorTask); // outcome/impact closure still missing
  run(['evidence', 'add', '--kind', 'experience-impact', '--summary', 'Replacement closure', '--outcome', 'User replaces the observation with stable identity', '--connected-impact', 'Save and cancel preserve draft identity', '--proof', 'Rendered UI replacement and identity regression'], 0, behaviorTask);
  run(['finish-ready'], 0, behaviorTask);
  // A declaration alone cannot hide changed inputs.
  writeFileSync(join(repo, 'app/EditorView.swift'), 'struct EditorView { var changed = true }\n');
  run(['finish-ready'], 1, behaviorTask);

  const manifest = JSON.parse(readFileSync(join(repo, '.ai-local/sdlc-runs/fix-readme-typo/evidence.json')));
  assert.equal(manifest.task, task);
  assert.ok(manifest.files.includes('README.md'));
  // Newly introduced source scope is retained even after refreshing evidence.
  run(['run-check', '--name', 'diff', '--criterion', 'ac-1', '--manual', 'docs check passed']);
  run(['finish-ready'], 1);
  console.log('Readiness behavior check passed.');
} finally {
  rmSync(repo, { recursive: true, force: true });
}
