import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON } from '../constants';
import {
  addPackageToPackageJson,
  addScriptToPackageJson,
  AppOrLibType,
  copyConfigFiles,
  deleteFile,
  findDefaultProjectNameInAngularJson,
  removePackageFromPackageJson,
  tsconfigFilePath,
  updateJson
} from '../utils';
import { jest } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addJest(options: NgEssentialsOptions): Rule {
  if (!options.jest || !options.firstRun) {
    return chain([]);
  }

  return chain([
    (tree: Tree, _context: SchematicContext) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);

      return chain([
        deleteFile('karma.conf.js'),
        deleteFile('src/test.ts'),
        addScriptToPackageJson('test', 'ng test --coverage'),
        addScriptToPackageJson('test:watch', 'ng test --watch'),
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
        addPackageToPackageJson('devDependencies', 'jest', jest.jestVersion),
        addPackageToPackageJson('devDependencies', 'tsconfig-paths-jest', jest.tsconfigPathsJestVersion),
        switchToJestBuilderInAngularJson(defaultProjectName),
        prepareTsAppOrLibConfigForJest('.', 'app'),
        prepareTsSpecConfigForJest('.'),
        createLaunchJson(),
        copyConfigFiles('jest')
      ]);
    }
  ]);
}

export function prepareTsAppOrLibConfigForJest(rootPath: string, context: AppOrLibType): Rule {
  return updateJson(tsconfigFilePath(rootPath, context), json => {
    return {
      ...json,
      exclude: ['**/*.spec.ts', 'src/jest.ts']
    };
  });
}

export function prepareTsSpecConfigForJest(rootPath: string): Rule {
  return updateJson(tsconfigFilePath(rootPath, 'spec'), json => {
    if (json['files']) {
      delete json['files'];
    }

    return {
      ...json,
      compilerOptions: {
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        types: ['jest']
      }
    };
  });
}

export function switchToJestBuilderInAngularJson(projectName: string): Rule {
  return updateJson(ANGULAR_JSON, json => {
    json['projects'][projectName]['architect']['test'].builder = '@angular-builders/jest:run';
    json['projects'][projectName]['architect']['test'].options = {
      detectOpenHandles: true
    };

    return json;
  });
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
      "program": "\${workspaceFolder}/node_modules/@angular/cli/bin/ng",
      "args": ["test", "-- --runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}`
    );

    return host;
  };
}
