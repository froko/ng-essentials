import { chain, Rule } from '@angular-devkit/schematics';

import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from '../utils';
import { testcafe } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addTestcafe(options: NgEssentialsOptions): Rule {
  if (!options.testcafe || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'testcafe', testcafe.testcafeVersion),
    addPackageToPackageJson('devDependencies', 'testcafe-angular-selectors', testcafe.angularSelectorsVersion),
    addScriptToPackageJson('testcafe', 'testcafe chrome testcafe/*.e2e-spec.js --app "ng serve" --app-init-delay 5000'),
    copyConfigFiles('./testcafe')
  ]);
}
