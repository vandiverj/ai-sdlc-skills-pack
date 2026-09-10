import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { escapeCommandArg } from './common.mjs';
import { contextDocCandidates, contextFreshnessRow } from './context.mjs';
import { ensureEvidenceManifest, evidenceStatusRows } from './evidence.mjs';
import { getGitInfo } from './git.mjs';
import { loadProfile } from './profile.mjs';
import { policyRowsForTask } from './policy.mjs';
import { readControlJsonLines } from './state.mjs';
import { inferTestingSurfaces, matchesAny, unitRegistry } from './units.mjs';
import { experienceImpactRequired } from './routes.mjs';
import { impactPacketFindings } from './changeimpact.mjs';
import { findPackets } from './packets.mjs';

export function controlGateRows(repo, state, runDir, options = {}) {
  const manifest = ensureEvidenceManifest(repo, runDir, state.task, state.route, options);
  const evidenceRows = evidenceStatusRows(repo, runDir, manifest, options).map((row) => ({
    id: `evidence-${row.id}`,
    status: row.status === 'missing' && row.level === 'required' ? 'block' : row.status === 'missing' ? 'warn' : 'pass',
    detail: row.summary,
    next: row.status !== 'missing' ? '' : row.id === 'verification'
      ? `sdlc run-check --task "${escapeCommandArg(state.task)}" --name test --criterion ac-1 -- <focused-check>`
      : row.id === 'experience-impact'
        ? `sdlc evidence add --task "${escapeCommandArg(state.task)}" --kind experience-impact --summary "..." --outcome "..." --connected-impact "..." --proof "..."`
        : `sdlc evidence add --task "${escapeCommandArg(state.task)}" --kind ${row.id} --summary "..."`,
  }));
  const contextRows = contextGateRows(repo, state.task, loadProfile(repo), getGitInfo(repo), options);
  const policyRows = policyRowsForTask(repo, state.task, loadProfile(repo).values);
  // A recorded waiver describes a partial handoff; it cannot turn missing proof into a pass.
  return [...evidenceRows, ...contextRows, ...policyRows];
}

export function contextGateRows(repo, task, profile, git, options = {}) {
  const rows = [];
  const docs = profile.path ? contextDocCandidates(repo, profile.values || profile) : [];
  const missing = docs.filter((item) => !existsSync(item.path));
  const stale = docs.map((item) => contextFreshnessRow(repo, item, Number(options.days || 60))).filter((row) => row.status === 'stale');
  const multi = matchesAny(String(task || '').toLowerCase(), ['multi-repo', 'multi repo', 'multiple repositories', 'workspace', 'deployable codebase', 'multiple projects', 'multi-project', 'multi project']);
  rows.push({ id: 'context-profile', status: 'pass', detail: profile.path ? `profile ${relative(repo, profile.path)}` : 'optional profile not configured', next: '' });
  rows.push({ id: 'context-missing-docs', status: missing.length > 3 ? 'warn' : 'pass', detail: missing.length ? `${missing.length} context docs missing/unconfigured` : 'no major missing context docs', next: missing.length > 3 ? 'sdlc context inventory' : '' });
  rows.push({ id: 'context-stale-docs', status: stale.length ? 'warn' : 'pass', detail: stale.length ? `${stale.length} stale context docs` : 'no stale context docs detected', next: stale.length ? `sdlc context freshness --task "${escapeCommandArg(task || 'current task')}"` : '' });
  rows.push({ id: 'context-unit-map', status: multi && unitRegistry(repo, profile).length <= 1 ? 'block' : 'pass', detail: multi ? 'multi-repo/project task needs unit/workspace mapping' : 'unit map not required by task signals', next: multi ? 'sdlc unit doctor' : '' });
  return rows;
}
