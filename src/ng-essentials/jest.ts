import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON, TSCONFIG_JSON } from '../constants';
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
    (tree: Tree) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);
      const hasDefaultApplication = defaultProjectName !== '';

      return chain([
        preparePackageJson(),
        prepareAngularJson(hasDefaultApplication, defaultProjectName),
        prepareTsConfig(hasDefaultApplication),
        addConfigFiles(),
        removeKarmaAssets(hasDefaultApplication)
      ]);
    }
  ]);
}

function preparePackageJson(): Rule {
  return chain([
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
    addPackageToPackageJson('devDependencies', 'jest-preset-angular', jest.presetAngularVersion),
    addPackageToPackageJson('devDependencies', 'ts-jest', jest.tsJestVersion),
    addScriptToPackageJson('test', 'ng test --coverage'),
    addScriptToPackageJson('test:watch', 'ng test --watch')
  ]);
}

function prepareAngularJson(hasDefaultApplication: boolean, defaultProjectName: string): Rule {
  return chain([hasDefaultApplication ? switchToJestBuilderInAngularJson(defaultProjectName) : noop()]);
}

export function switchToJestBuilderInAngularJson(projectName: string): Rule {
  return updateJson(ANGULAR_JSON, (json) => {
    json['projects'][projectName]['architect']['test'].builder = '@angular-builders/jest:run';
    json['projects'][projectName]['architect']['test'].options = {};

    return json;
  });
}

function prepareTsConfig(hasDefaultApplication: boolean): Rule {
  return chain([
    prepareGlobalTsSpecConfigForJest(),
    hasDefaultApplication ? prepareTsAppOrLibConfigForJest('.', 'app') : noop()
  ]);
}

function prepareGlobalTsSpecConfigForJest(): Rule {
  return (host: Tree) => {
    const specConfigFile = tsconfigFilePath('.', 'spec');
    if (host.exists(specConfigFile)) {
      return updateJson(specConfigFile, (json) => {
        if (json['files']) {
          delete json['files'];
        }

        if (json['include']) {
          delete json['include'];
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
    } else {
      host.create(
        specConfigFile,
        `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "types": ["jest"]
  }
}`
      );
    }
  };
}

function prepareTsAppOrLibConfigForJest(rootPath: string, context: AppOrLibType): Rule {
  return updateJson(tsconfigFilePath(rootPath, context), (json) => {
    return {
      ...json,
      exclude: ['**/*.spec.ts']
    };
  });
}

function addConfigFiles(): Rule {
  return chain([createLaunchJson, copyConfigFiles('jest')]);
}

function createLaunchJson(): Rule {
  return (host: Tree) => {
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

function removeKarmaAssets(hasDefaultApplication: boolean): Rule {
  return chain([deleteFile('karma.conf.js'), hasDefaultApplication ? deleteFile('src/test.ts') : noop()]);
}

export function prepareJest(projectName: string, projectPath: string, context: AppOrLibType): Rule {
  return chain([
    switchToJestBuilderInAngularJson(projectName),
    patchTsLintOptionsInAngularJson(projectName, projectPath, context),
    deleteFile(`${projectPath}/karma.conf.js`),
    deleteFile(`${projectPath}/src/test.ts`),
    prepareTsAppOrLibConfigForJest(projectPath, context),
    deleteTsSpecConfig(projectPath),
    prepareGlobalTsSpecConfigForJest(),
    createJestConfig(projectPath)
  ]);
}

function patchTsLintOptionsInAngularJson(projectName: string, projectPath: string, context: AppOrLibType): Rule {
  return updateJson(ANGULAR_JSON, (json) => {
    json['projects'][projectName]['architect']['lint']['options']['tsConfig'] = [
      `${projectPath}/tsconfig.${context}.json`,
      'tsconfig.spec.json'
    ];

    return json;
  });
}

function deleteTsSpecConfig(rootPath: string): Rule {
  return (host: Tree) => {
    host.delete(`${rootPath}/tsconfig.spec.json`);
  };
}

function createJestConfig(rootPath: string): Rule {
  return (host: Tree) => {
    host.create(
      `${rootPath}/jest.config.js`,
      `const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('../../tsconfig');

module.exports = {
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
};`
    );
  };
}
