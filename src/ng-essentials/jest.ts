import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';
import {
  deleteFile,
  switchToJestBuilderInAngularJson,
  removePackageFromPackageJson,
  addPackageToPackageJson,
  editTsConfigAppJson,
  editTsConfigSpecJson
} from '../utils';

export function addJest(options: NgEssentialsOptions): Rule {
  if (!options.jest || !options.firstRun) {
    return chain([]);
  }

  return chain([
    deleteFile('src/karma.conf.js'),
    deleteFile('src/test.ts'),
    removePackageFromPackageJson('devDependencies', '@types/jasmine'),
    removePackageFromPackageJson('devDependencies', 'jasmine-core'),
    removePackageFromPackageJson('devDependencies', 'jasmine-spec-reporter'),
    removePackageFromPackageJson('devDependencies', 'karma'),
    removePackageFromPackageJson('devDependencies', 'karma-chrome-launcher'),
    removePackageFromPackageJson('devDependencies', 'karma-coverage-istanbul-reporter'),
    removePackageFromPackageJson('devDependencies', 'karma-jasmine'),
    removePackageFromPackageJson('devDependencies', 'karma-jasmine-html-reporter'),
    addPackageToPackageJson('devDependencies', '@angular-builders/jest', '1.2.2'),
    addPackageToPackageJson('devDependencies', '@types/jest', '23.3.2'),
    addPackageToPackageJson('devDependencies', 'babel-core', '6.26.3'),
    addPackageToPackageJson('devDependencies', 'babel-jest', '23.6.0'),
    addPackageToPackageJson('devDependencies', 'jest', '23.6.0'),
    switchToJestBuilderInAngularJson(),
    editTsConfigAppJson(),
    editTsConfigSpecJson()
  ]);
}
