import { join } from 'node:path';
import { slug } from './common.mjs';

export function defaultRunsDir(repo) {
  return join(repo, '.ai-local', 'sdlc-runs');
}

export function defaultScratchScriptsDir(repo) {
  return join(repo, '.ai-local', 'sdlc-scratch', 'scripts');
}

export function defaultCalibrationPath(repo) {
  return join(repo, '.ai-local', 'sdlc-calibration.jsonl');
}

export function defaultFeedbackPath(repo) {
  return join(defaultRunsDir(repo), 'developer-feedback.jsonl');
}

export function defaultSdlcFeedbackPath(repo) {
  return join(repo, '.ai-local', 'sdlc-cache', 'sdlc-feedback.jsonl');
}

export function defaultTracePath(repo, task) {
  return join(defaultRunsDir(repo), `${slug(task || 'current-task')}-trace.jsonl`);
}

export function runStatePath(repo, task) {
  return join(defaultRunsDir(repo), `${slug(task || 'current-task')}-run-state.json`);
}
