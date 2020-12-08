import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON, NG_ESSENTIALS, TSCONFIG_JSON } from '../constants';
import {
  addEnvProvidersToAppModule,
  addPackageToPackageJson,
  addScriptToPackageJson,
  copyConfigFiles,
  deleteFile,
  findDefaultProjectNameInAngularJson,
  removeArchitectNodeFromAngularJson,
  removeAutomaticUpdateSymbols,
  removeEndToEndTestFiles,
  removePackageFromPackageJson,
  removeScriptFromPackageJson,
  updateDevelopmentEnvironmentFile,
  updateJson,
  updateProductionEnvironmentFile
} from '../utils';
import { essentials } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addEssentials(options: NgEssentialsOptions): Rule {
  if (!options.firstRun) {
    return chain([]);
  }

  return chain([
    (tree: Tree) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);
      const hasDefaultApplication = defaultProjectName !== '';

      return chain([
        preparePackageJson(),
        prepareAngularJson(options),
        prepareTsConfig(),
        prepareEnvironments(hasDefaultApplication),
        addConfigFiles(options),
        removeTsLint(),
        removeEndToEndTestingAssets(hasDefaultApplication, defaultProjectName)
      ]);
    }
  ]);
}

function preparePackageJson(): Rule {
  return chain([
    removeAutomaticUpdateSymbols(),
    addPackageToPackageJson('dependencies', '@angular/animations', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/common', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/compiler', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/core', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/forms', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/platform-browser', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/platform-browser-dynamic', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/router', essentials.angularVersion),
    addPackageToPackageJson('dependencies', 'rxjs', essentials.rxjsVersion),
    addPackageToPackageJson('dependencies', 'tslib', essentials.tslibVersion),
    addPackageToPackageJson('dependencies', 'zone.js', essentials.zoneVersion),
    addPackageToPackageJson('devDependencies', '@angular-devkit/build-angular', essentials.angularDevKitVersion),
    addPackageToPackageJson('devDependencies', '@angular/cli', essentials.angularCliVersion),
    addPackageToPackageJson('devDependencies', '@angular/compiler-cli', essentials.angularVersion),
    addPackageToPackageJson('devDependencies', '@angular/language-service', essentials.angularVersion),
    addPackageToPackageJson('devDependencies', '@types/node', essentials.nodeVersion),
    addPackageToPackageJson('devDependencies', 'ts-node', essentials.tsNodeVersion),
    addPackageToPackageJson('devDependencies', 'typescript', essentials.typescriptVersion),
    addPackageToPackageJson('devDependencies', 'prettier', essentials.prettierVersion),
    addScriptToPackageJson('preinstall', 'npx npm-force-resolutions'),
    addScriptToPackageJson('format', 'prettier --write "./**/*{.ts,.js,.json,.css,.scss}"')
  ]);
}

function prepareAngularJson(options: NgEssentialsOptions): Rule {
  return chain([addDefaultCollectionToAngularJson(), addNgEssentialsOptionsToAngularJson(options)]);
}

function addDefaultCollectionToAngularJson(): Rule {
  return updateJson(ANGULAR_JSON, (json) => {
    return { ...json, cli: { defaultCollection: NG_ESSENTIALS } };
  });
}

function addNgEssentialsOptionsToAngularJson(options: NgEssentialsOptions): Rule {
  return updateJson(ANGULAR_JSON, (json) => {
    if (json.schematics) {
      return json;
    }

    return {
      ...json,
      schematics: {
        '@froko/ng-essentials': {
          jest: options.jest ? options.jest.valueOf() : false,
          cypress: options.cypress ? options.cypress.valueOf() : false
        }
      }
    };
  });
}

function prepareTsConfig(): Rule {
  return updateJson(TSCONFIG_JSON, (json) => {
    const compilerOptions = json['compilerOptions'];

    return {
      ...json,
      compilerOptions: {
        ...compilerOptions,
        paths: {}
      }
    };
  });
}

function prepareEnvironments(hasDefaultApplication: boolean): Rule {
  return chain([
    hasDefaultApplication ? updateDevelopmentEnvironmentFile('src') : noop(),
    hasDefaultApplication ? updateProductionEnvironmentFile('src') : noop(),
    hasDefaultApplication ? addEnvProvidersToAppModule('src') : noop()
  ]);
}

function addConfigFiles(options: NgEssentialsOptions): Rule {
  return chain([createLaunchJson(options), copyConfigFiles('./essentials')]);
}

function createLaunchJson(options: NgEssentialsOptions): Rule {
  return (host: Tree) => {
    if (!options.jest) {
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
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:9876/debug.html",
      "webRoot": "\${workspaceFolder}"
    }
  ]
}`
      );
    }

    return host;
  };
}

function removeTsLint(): Rule {
  return chain([
    removePackageFromPackageJson('devDependencies', 'codelyzer'),
    removePackageFromPackageJson('devDependencies', 'tslint'),
    deleteFile('tslint.json')
  ]);
}

function removeEndToEndTestingAssets(hasDefaultApplication: boolean, defaultProjectName: string): Rule {
  return chain([
    removePackageFromPackageJson('devDependencies', '@types/jasminewd2'),
    removePackageFromPackageJson('devDependencies', 'protractor'),
    removeScriptFromPackageJson('e2e'),
    hasDefaultApplication ? removeEndToEndTestFiles() : noop(),
    hasDefaultApplication ? removeArchitectNodeFromAngularJson(defaultProjectName, 'e2e') : noop()
  ]);
}
