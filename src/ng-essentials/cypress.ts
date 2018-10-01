import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { cypress } from '../versions';
import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from '../utils';

export function addCypress(options: NgEssentialsOptions): Rule {
  if (!options.cypress || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'cypress', cypress.cypressVersion),
    addScriptToPackageJson('cypress', 'run-p start cypress:open'),
    addScriptToPackageJson('cypress:open', 'cypress open'),
    copyConfigFiles('./cypress')
  ]);
}
