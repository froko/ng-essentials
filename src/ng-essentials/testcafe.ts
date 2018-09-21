import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { testcafe } from '../versions';
import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from '../utils';

export function addTestcafe(options: NgEssentialsOptions): Rule {
  if (!options.testcafe || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'testcafe', testcafe.testcafeVersion),
    addPackageToPackageJson('devDependencies', 'testcafe-angular-selectors', testcafe.angularSelectorsVersion),
    addPackageToPackageJson('devDependencies', 'testcafe-live', testcafe.liveVersion),
    addScriptToPackageJson('testcafe', 'testcafe-live chrome testcafe/*.e2e-spec.js'),
    addScriptToPackageJson(
      'testcafe:ci',
      'testcafe chrome testcafe/*.e2e-spec.js --app "ng serve" --app-init-delay 5000'
    ),
    copyConfigFiles('./testcafe')
  ]);
}
