import * as paths from './paths.mjs';
import * as state from './state.mjs';
import * as git from './git.mjs';
import * as profile from './profile.mjs';
import * as units from './units.mjs';
import * as recipes from './recipes.mjs';

export function createServices({ agentsRoot = '' } = {}) {
  return {
    agentsRoot,
    paths,
    state,
    git,
    profile,
    units,
    recipes,
  };
}
