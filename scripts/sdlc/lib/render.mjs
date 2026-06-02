import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { dedupe, fail, formatInlineList, formatList, readJsonIfExists, stamp } from './common.mjs';
import { getGitInfo } from './git.mjs';
import { discoverCommands, loadProfile } from './profile.mjs';
import { defaultRunsDir } from './paths.mjs';
import { existsAny, hasFileExt, inferTestingSurfaces, matchesAny } from './units.mjs';

export async function renderSmoke(repo, options = {}) {
  const url = options.url || '';
  if (!url) fail('Pass --url <url> for rendered smoke validation.');

  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-render-smoke.md`);
  const screenshotDir = options.screenshotDir ? resolve(repo, options.screenshotDir) : join(repo, '.ai-local', 'rendered');
  const cdp = options.cdp || '';
  const evidence = {
    date: new Date().toISOString(),
    url,
    status: 'capped',
    notes: [],
    screenshots: [],
  };

  if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)/.test(url)) {
    evidence.notes.push('Only local URLs are supported by this dependency-free smoke helper.');
  } else if (!cdp) {
    evidence.notes.push('No --cdp endpoint provided. Start Chrome with remote debugging or record manual rendered evidence.');
  } else {
    try {
      const result = await captureRenderedSmoke(url, cdp, screenshotDir);
      evidence.status = result.status;
      evidence.notes.push(...result.notes);
      evidence.screenshots.push(...result.screenshots);
    } catch (error) {
      evidence.notes.push(`CDP smoke failed: ${error.message}`);
    }
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderSmokeEvidence(evidence), 'utf8');
  console.log(renderSmokeEvidence(evidence).trimEnd());
  console.log(`\nEvidence: ${relative(repo, outPath)}`);
}

export function renderPlan(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so the render plan can be scoped.');
  const profile = loadProfile(repo);
  const git = getGitInfo(repo);
  const outPath = options.out ? resolve(repo, options.out) : '';
  const content = `# SDLC Render Plan

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Detected UI/Render Setup

- Render command: ${profile.values.renderedUiReviewCommand || discoverCommands(profile.values, readJsonIfExists(join(repo, 'package.json'))).rendered || 'not configured'}
- Dev server hints: ${formatInlineList(devServerHints(repo))}
- Accessibility policy: ${accessibilityPolicy(profile.values)}

## Plan

${formatList(renderedEvidencePlan(task, git.changedFiles, profile.values))}

## Evidence To Capture

- URL:
- Viewports:
- Interaction path:
- Screenshot/log paths:
- Console or visible errors:
- Accessibility result/cap:
`;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content, 'utf8');
    console.log(relative(repo, outPath));
  } else {
    console.log(content.trimEnd());
  }
}

export function renderEvidencePacket(repo, options = {}) {
  const task = options.task || '';
  if (!task) fail('Pass --task "..." so rendered evidence can be scoped.');
  const outPath = options.out ? resolve(repo, options.out) : join(defaultRunsDir(repo), `${stamp()}-rendered-evidence-packet.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  const content = `# SDLC Rendered Evidence Packet

Date: ${new Date().toISOString()}
Task: ${task}
Repository: ${repo}

## Rendered Path

- URL:
- Command/server:
- Browser/tool:
- Viewports:
- Interaction path:

## Evidence

- Screenshots:
- Console errors:
- Layout/text overlap notes:
- Animation/interaction notes:
- Accessibility policy/result/cap:

## Caps

- Browser unavailable:
- Screenshot unavailable:
- Local server unavailable:
`;
  writeFileSync(outPath, content, 'utf8');
  console.log(relative(repo, outPath));
}

export function renderedEvidencePlan(task, files, profile = {}) {
  const testingSurfaces = inferTestingSurfaces(process.cwd(), task, files, { values: profile, units: [] });
  const text = String(task || '').toLowerCase();
  const plan = [];
  if (profile.renderedUiReviewCommand) plan.push(`Use configured rendered UI command: ${profile.renderedUiReviewCommand}.`);
  if (testingSurfaces.includes('rendered-product-ui') || matchesAny(text, ['user interface', 'layout', 'page', 'screen', 'react view', 'asp classic page'])) {
    plan.push('Start the local/dev server when available and approved.');
    plan.push('Inspect the affected workflow in a browser or record the exact browser-tool cap.');
    plan.push('Check a normal desktop width and one narrow/mobile width when layout can be affected.');
    plan.push('Capture screenshots or note why screenshots are unavailable.');
  } else if (testingSurfaces.includes('api-contract')) {
    plan.push('Rendered product UI evidence is not required for API-contract-only work; use Swagger/OpenAPI/API verification instead.');
  }
  if (!plan.length) plan.push('Rendered evidence is not required unless the task affects visible UI.');
  return dedupe(plan);
}

function devServerHints(repo) {
  const packageJson = readJsonIfExists(join(repo, 'package.json'));
  const scripts = packageJson?.scripts || {};
  const hints = [];
  if (scripts.dev) hints.push(`npm run dev (${scripts.dev})`);
  if (scripts.start) hints.push(`npm start (${scripts.start})`);
  if (scripts.preview) hints.push(`npm run preview (${scripts.preview})`);
  if (existsAny(repo, ['vite.config.ts', 'vite.config.js'])) hints.push('Vite app');
  if (existsAny(repo, ['next.config.js', 'next.config.mjs', 'next.config.ts'])) hints.push('Next.js app');
  if (existsAny(repo, ['deno.json', 'deno.jsonc'])) hints.push('Deno project');
  if (hasFileExt(repo, ['.asp', '.asa'])) hints.push('ASP Classic/local IIS or configured web server likely needed');
  if (existsAny(repo, ['index.html']) && !packageJson) hints.push('static HTML may open directly');
  return dedupe(hints);
}

function accessibilityPolicy(profile = {}) {
  const value = String(profile.accessibilityPolicy || profile.a11yPolicy || '').trim();
  if (value) return value;
  if (profile.accessibilityRequired === 'true' || profile.a11yRequired === 'true') return 'mandatory';
  if (profile.accessibilityOptional === 'true' || profile.a11yOptional === 'true') return 'optional';
  return 'optional / profile not configured';
}

async function captureRenderedSmoke(url, cdpBase, screenshotDir) {
  const targets = await fetchJson(`${trimSlash(cdpBase)}/json`);
  const page = targets.find((target) => target.type === 'page') || targets[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('No CDP page target found.');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, (message) => {
        if (message.error) {
          reject(new Error(JSON.stringify(message.error)));
          return;
        }
        resolve(message.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url });
    await sleep(600);
    const title = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    const bodyLength = await send('Runtime.evaluate', { expression: 'document.body ? document.body.innerText.length : 0', returnByValue: true });
    mkdirSync(screenshotDir, { recursive: true });
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = join(screenshotDir, `${stamp()}-render-smoke.png`);
    writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    return {
      status: Number(bodyLength.result.value || 0) > 0 ? 'pass' : 'fail',
      notes: [`Loaded title: ${title.result.value || '(untitled)'}`, `Body text length: ${bodyLength.result.value || 0}`],
      screenshots: [screenshotPath],
    };
  } finally {
    ws.close();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.json();
}

function renderSmokeEvidence(evidence) {
  return `# SDLC Render Smoke Evidence

Date: ${evidence.date}
URL: ${evidence.url}
Status: ${evidence.status}

## Notes

${formatList(evidence.notes)}

## Screenshots

${formatList(evidence.screenshots)}
`;
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
