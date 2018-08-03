import { Rule, chain } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';
import {
  deleteFile,
  removeTestNodeFromAngularJson,
  removePackageFromPackageJson,
  addPackageToPackageJson,
  addNodeToPackageJson,
  addScriptToPackageJson,
  editTsConfigAppJson,
  editTsConfigSpecJson,
  copyConfigFiles
} from './utils';

export function addJest(options: NgEssentialsOptions): Rule {
  if (!options.jest) {
    return chain([]);
  }

  return chain([
    deleteFile('src/karma.conf.js'),
    deleteFile('src/test.ts'),
    removeTestNodeFromAngularJson(),
    removePackageFromPackageJson('devDependencies', '@types/jasmine'),
    removePackageFromPackageJson('devDependencies', 'jasmine-core'),
    removePackageFromPackageJson('devDependencies', 'jasmine-spec-reporter'),
    removePackageFromPackageJson('devDependencies', 'karma'),
    removePackageFromPackageJson('devDependencies', 'karma-chrome-launcher'),
    removePackageFromPackageJson('devDependencies', 'karma-coverage-istanbul-reporter'),
    removePackageFromPackageJson('devDependencies', 'karma-jasmine'),
    removePackageFromPackageJson('devDependencies', 'karma-jasmine-html-reporter'),
    addPackageToPackageJson('devDependencies', '@types/jest', '23.3.1'),
    addPackageToPackageJson('devDependencies', 'jest', '23.4.2'),
    addPackageToPackageJson('devDependencies', 'jest-preset-angular', '6.0.0'),
    addNodeToPackageJson('jest', {
      testURL: 'http://localhost/',
      preset: 'jest-preset-angular',
      setupTestFrameworkScriptFile: '<rootDir>/src/setupJest.ts'
    }),
    addScriptToPackageJson('test', 'jest'),
    addScriptToPackageJson('test:watch', 'jest --watch'),
    removeTestNodeFromAngularJson(),
    editTsConfigAppJson(),
    editTsConfigSpecJson(),
    copyConfigFiles('./jest')
  ]);
}
