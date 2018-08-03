import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';
import { addPackageToPackageJson } from './utils';

export function addKarma(options: NgEssentialsOptions): Rule {
  if (options.jest) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', '@types/jasmine', '2.8.8'),
    addPackageToPackageJson('devDependencies', 'jasmine-core', '3.1.0'),
    addPackageToPackageJson('devDependencies', 'karma', '2.0.5'),
    addPackageToPackageJson('devDependencies', 'karma-coverage-istanbul-reporter', '2.0.1'),
    addPackageToPackageJson('devDependencies', 'karma-jasmine', '1.1.2'),
    addPackageToPackageJson('devDependencies', 'karma-jasmine-html-reporter', '1.2.0')
  ]);
}
