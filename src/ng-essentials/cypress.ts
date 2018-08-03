import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';
import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from './utils';

export function addCypress(options: NgEssentialsOptions): Rule {
  if (!options.cypress) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'concurrently', '3.6.1'),
    addPackageToPackageJson('devDependencies', 'cypress', '3.0.3'),
    addScriptToPackageJson('cypress', 'concurrently "ng serve" "cypress open"'),
    copyConfigFiles('./cypress')
  ]);
}
