import { dedupeBy, splitList } from './common.mjs';
import { matchRecipes } from './recipes.mjs';
import { securityTriggers } from './routes.mjs';
import { inferTestingSurfaces, qaModeForSurfaces } from './units.mjs';

export function evidenceRequirementsForTask(repo, task, route, git, profile, options = {}) {
  const profileValues = profile.values || profile || {};
  const files = optionFiles(options, git.changedFiles);
  const surfaces = inferTestingSurfaces(repo, task, files, profile);
  const qaMode = qaModeForSurfaces(surfaces, task);
  const triggers = securityTriggers(task, profileValues);
  const recipes = matchRecipes(task, git, profileValues);
  const requirements = [
    evidenceRequirement('scope', 'required', 'Task scope/intent is recorded.'),
    evidenceRequirement('changed-files', 'required', 'Changed files and touched surfaces are known.'),
    evidenceRequirement('verification', 'required', 'At least one fresh check, smoke, or explicit cap is recorded.'),
    evidenceRequirement('finish-control', 'required', 'Commit/push/release remains human-controlled.'),
  ];
  if (route === 'tiny-docs') requirements.push(evidenceRequirement('diff-hygiene', 'required', 'Diff hygiene check is recorded.'));
  if (route === 'review-only') requirements.push(evidenceRequirement('review', 'required', 'Review verdict/findings are recorded.'));
  if (route === 'release-push') requirements.push(evidenceRequirement('release-approval', 'required', 'Release/git action approval boundary is explicit.'));
  if (route === 'multi-repo-integration') requirements.push(evidenceRequirement('workspace-ledger', 'required', 'Affected repos/units and release order are recorded.'));
  if (route === 'contract-first') requirements.push(evidenceRequirement('contract', 'required', 'Contract surfaces and compatibility decision are recorded.'));
  if (route === 'bugfix-live-system') requirements.push(evidenceRequirement('exact-live-evidence', 'required', 'Exact sanitized live/log/request evidence or cap is recorded.'));
  if (route === 'weak-test-legacy') requirements.push(evidenceRequirement('manual-qa', 'required', 'Manual QA script or explicit cap is recorded.'));
  if (qaMode !== 'workflow' && qaMode !== 'docs-process') requirements.push(evidenceRequirement('qa-outline', 'recommended', `QA outline/script covers ${qaMode}.`));
  if (surfaces.includes('rendered-product-ui')) requirements.push(evidenceRequirement('rendered-smoke', 'recommended', 'Rendered/browser smoke or cap is recorded.'));
  if (surfaces.includes('api-contract')) requirements.push(evidenceRequirement('api-contract', 'recommended', 'API/Swagger/client contract evidence or cap is recorded.'));
  if (surfaces.includes('data-persistence')) requirements.push(evidenceRequirement('data-evidence', 'recommended', 'Data/storage evidence or cap is recorded.'));
  if (surfaces.includes('integration-provider')) requirements.push(evidenceRequirement('integration-evidence', 'recommended', 'Integration/provider evidence or cap is recorded.'));
  if (triggers.length) requirements.push(evidenceRequirement('policy', 'required', `Security/tool triggers checked: ${triggers.join(', ')}.`));
  for (const recipeItem of recipes) requirements.push(evidenceRequirement(`recipe-${recipeItem.id}`, recipeItem.status === 'experimental' ? 'recommended' : 'required', `${recipeItem.id}: ${recipeItem.requiredProof.join('; ')}`));
  return dedupeBy(requirements, (item) => item.id);
}

export function evidenceRequirement(id, level, summary) {
  return { id, level, summary };
}

function optionFiles(options, fallback = []) {
  if (!options.files) return fallback;
  return splitList(options.files).map((file) => file.trim()).filter(Boolean);
}
