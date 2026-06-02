import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fail, formatInlineStatus } from './common.mjs';
import { defaultRunsDir } from './paths.mjs';

export function resolvePacketPath(repo, packet) {
  if (!packet) fail('Pass --packet <path> for the packet to complete.');
  const path = resolve(repo, packet);
  if (!existsSync(path)) fail(`Packet not found: ${relative(repo, path)}`);
  return path;
}

export function findPackets(repo, options = {}) {
  const dir = options.dir ? resolve(repo, options.dir) : defaultRunsDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => readPacket(repo, join(dir, file)))
    .filter((packet) => packet.kind !== 'other')
    .sort((a, b) => b.mtimeMs - a.mtimeMs || basename(b.path).localeCompare(basename(a.path)));
}

export function findLatestPacket(repo, route) {
  const wanted = packetKindForRoute(route);
  return findPackets(repo, {}).find((packet) => packet.kind === wanted || packet.route === route) || null;
}

export function readPacket(repo, path) {
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

export function packetKind(text) {
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

export function packetRoute(text, kind) {
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

export function packetKindForRoute(route) {
  if (route === 'review-only') return 'review';
  if (route === 'release-push') return 'release';
  if (route === 'multi-repo-integration') return 'multi-repo';
  if (route === 'contract-first') return 'contract';
  return 'route';
}

export function firstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

export function packetHas(text, needles) {
  const haystack = String(text || '').toLowerCase();
  return needles.some((needle) => haystack.includes(String(needle).toLowerCase()));
}

export function doneChecksForRoute(route, gitInfo, packet) {
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
