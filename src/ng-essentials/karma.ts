import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { karma } from '../versions';
import { addPackageToPackageJson } from '../utils';

export function addKarma(options: NgEssentialsOptions): Rule {
  if (options.jest || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', '@types/jasmine', karma.jasmineTypeVersion),
    addPackageToPackageJson('devDependencies', 'jasmine-core', karma.jasmineCoreVersion),
    addPackageToPackageJson('devDependencies', 'karma', karma.karmaVersion),
    addPackageToPackageJson('devDependencies', 'karma-coverage-istanbul-reporter', karma.coverageReporterVersion),
    addPackageToPackageJson('devDependencies', 'karma-jasmine', karma.karmaJasmineVersion),
    addPackageToPackageJson('devDependencies', 'karma-jasmine-html-reporter', karma.htmlReporterVersion)
  ]);
}
