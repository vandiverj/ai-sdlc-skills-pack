import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fail, writeOrPrint } from './common.mjs';
import { configNormalize } from './config.mjs';
import { indexBuild } from './index.mjs';

export function upgradePlan(repo, options = {}) {
  const findings = [];
  if (!existsSync(join(repo, '.ai-local', 'sdlc-profile.json'))) findings.push('Create normalized local profile with sdlc config normalize.');
  if (!existsSync(join(repo, '.ai-local', 'sdlc-index.json'))) findings.push('Create local deterministic index with sdlc index build.');
  if (!findings.length) findings.push('No local upgrade actions detected.');
  const content = ['# SDLC Upgrade Plan', '', ...findings.map((item) => `- ${item}`), ''].join('\n');
  writeOrPrint(repo, options.out, content);
}

export function upgradeApply(repo, options = {}) {
  if (!options.write) fail('Dry run only. Pass --write to create/update local SDLC upgrade artifacts.');
  configNormalize(repo, { ...options, out: join(repo, '.ai-local', 'sdlc-profile.json') });
  indexBuild(repo, { ...options, out: join(repo, '.ai-local', 'sdlc-index.json') });
}

export function upgradeExplain(repo, options = {}) {
  console.log('SDLC upgrades are local-first and non-destructive: normalize profile, build local index, validate artifacts, and regenerate runtime adapters. They do not merge, deploy, push, or overwrite team config without explicit file-level action.');
}
