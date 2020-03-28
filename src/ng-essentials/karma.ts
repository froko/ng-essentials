import { chain, Rule } from '@angular-devkit/schematics';

import { addPackageToPackageJson } from '../utils';
import { karma } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addKarma(options: NgEssentialsOptions): Rule {
  if (options.jest || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', '@types/jasmine', karma.jasmineTypeVersion),
    addPackageToPackageJson('devDependencies', 'jasmine-core', karma.jasmineCoreVersion),
    addPackageToPackageJson('devDependencies', 'jasmine-spec-reporter', karma.jasmineSpecReporterVersion),
    addPackageToPackageJson('devDependencies', 'karma', karma.karmaVersion),
    addPackageToPackageJson('devDependencies', 'karma-chrome-launcher', karma.chromeLauncherVersion),
    addPackageToPackageJson('devDependencies', 'karma-coverage-istanbul-reporter', karma.coverageReporterVersion),
    addPackageToPackageJson('devDependencies', 'karma-jasmine', karma.karmaJasmineVersion),
    addPackageToPackageJson('devDependencies', 'karma-jasmine-html-reporter', karma.htmlReporterVersion),
  ]);
}
