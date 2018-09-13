import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';
import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from './utils';

export function addCypress(options: NgEssentialsOptions): Rule {
  if (!options.cypress || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'concurrently', '4.0.1'),
    addPackageToPackageJson('devDependencies', 'cypress', '3.1.0'),
    addScriptToPackageJson('cypress', 'concurrently "ng serve" "cypress open"'),
    copyConfigFiles('./cypress')
  ]);
}
