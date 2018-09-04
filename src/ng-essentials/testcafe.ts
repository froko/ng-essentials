import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';
import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from './utils';

export function addTestcafe(options: NgEssentialsOptions): Rule {
  if (!options.testcafe) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'testcafe', '0.22.0'),
    addPackageToPackageJson('devDependencies', 'testcafe-angular-selectors', '0.3.0'),
    addPackageToPackageJson('devDependencies', 'testcafe-live', '0.1.3'),
    addScriptToPackageJson('testcafe', 'testcafe-live chrome testcafe/*.e2e-spec.js'),
    addScriptToPackageJson(
      'testcafe:ci',
      'testcafe chrome testcafe/*.e2e-spec.js --app "ng serve" --app-init-delay 5000'
    ),
    copyConfigFiles('./testcafe')
  ]);
}
