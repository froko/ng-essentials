import { Rule, chain, Tree, SchematicContext } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { ANGULAR_JSON, PACKAGE_JSON } from '../constants';
import { jest } from '../versions';
import {
  deleteFile,
  removePackageFromPackageJson,
  addPackageToPackageJson,
  copyConfigFiles,
  updateJson,
  tsconfigFilePath,
  AppOrLibType,
  findDefaultProjectNameInAngularJson,
  addScriptToPackageJson
} from '../utils';

export function addJest(options: NgEssentialsOptions): Rule {
  if (!options.jest || !options.firstRun) {
    return chain([]);
  }

  return chain([
    (tree: Tree, _context: SchematicContext) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);

      return chain([
        deleteFile('src/karma.conf.js'),
        deleteFile('src/test.ts'),
        addScriptToPackageJson('test', 'ng test'),
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
        switchToJestBuilderInAngularJson(defaultProjectName),
        addJestConfigToPackageJson(),
        prepareTsAppOrLibConfigForJest('src', 'app'),
        prepareTsSpecConfigForJest('src'),
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
      exclude: ['**/*.spec.ts', 'setup-jest.ts']
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
        types: ['jest', 'node'],
        module: 'commonjs'
      }
    };
  });
}

export function switchToJestBuilderInAngularJson(projectName: string): Rule {
  return updateJson(ANGULAR_JSON, json => {
    json['projects'][projectName]['architect']['test'].builder = '@angular-builders/jest:run';
    json['projects'][projectName]['architect']['test'].options = {
      coverage: true,
      detectOpenHandles: true
    };

    return json;
  });
}

export function copyJestConfig(targetDirectory: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const buffer = host.read('./src/jest.config.js');
    const content = buffer.toString();

    host.create(`${targetDirectory}/jest.config.js`, content);
  };
}

function addJestConfigToPackageJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson['jest']) {
      packageJson['jest'] = {
        preset: 'jest-preset-angular',
        setupFilesAfterEnv: '<rootDir>/src/setup-jest.ts'
      };
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

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
