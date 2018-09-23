import { Rule, chain, Tree, SchematicContext } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { TSCONFIGAPP_JSON, ANGULAR_JSON } from '../constants';
import { jest } from '../versions';
import {
  deleteFile,
  removePackageFromPackageJson,
  addPackageToPackageJson,
  editTsConfigSpecJson,
  copyConfigFiles
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
    addPackageToPackageJson('devDependencies', '@angular-builders/jest', jest.jestBuilderVersion),
    addPackageToPackageJson('devDependencies', '@types/jest', jest.jestTypeVersion),
    addPackageToPackageJson('devDependencies', 'babel-core', jest.babelCoreVersion),
    addPackageToPackageJson('devDependencies', 'babel-jest', jest.babelJestVersion),
    addPackageToPackageJson('devDependencies', 'jest', jest.jestVersion),
    addPackageToPackageJson('devDependencies', 'jest-preset-angular', jest.angularPresetVersion),
    switchToJestBuilderInAngularJson(),
    editTsConfigAppJson(),
    editTsConfigSpecJson('src'),
    createLaunchJson(),
    copyConfigFiles('jest')
  ]);
}

function switchToJestBuilderInAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);
    const defaultProject = angularJson['defaultProject'];

    if (angularJson['projects'][defaultProject]['architect']['test']['builder']) {
      angularJson['projects'][defaultProject]['architect']['test']['builder'] = '@angular-builders/jest:run';
    }

    if (angularJson['projects'][defaultProject]['architect']['test']['options']) {
      angularJson['projects'][defaultProject]['architect']['test']['options'] = {};
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function editTsConfigAppJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(TSCONFIGAPP_JSON)) {
      return host;
    }

    const sourceText = host.read(TSCONFIGAPP_JSON).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson['exclude']) {
      tsconfigJson['exclude'] = [];
    }

    tsconfigJson['exclude'] = ['**/*.spec.ts', 'setup-jest.ts'];

    host.overwrite(TSCONFIGAPP_JSON, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}

function createLaunchJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    host.create(
      './.vscode/launch.json',
      `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "ng serve",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200/#",
      "webRoot": "\${workspaceFolder}"
    },
    {
      "name": "ng test",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/node_modules/jest/bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}`
    );

    return host;
  };
}
