import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON, NG_ESSENTIALS, TSCONFIG_JSON, TSLINT_JSON } from '../constants';
import {
  addEnvProvidersToAppModule,
  addPackageToPackageJson,
  addScriptToPackageJson,
  copyConfigFiles,
  findDefaultProjectNameInAngularJson,
  findElementPrefixInAngularJson,
  removeArchitectNodeFromAngularJson,
  removeAutomaticUpdateSymbols,
  removeEndToEndTestFiles,
  removeEndToEndTsConfigNodeFromAngularJson,
  removePackageFromPackageJson,
  removeScriptFromPackageJson,
  updateDevelopmentEnvironmentFile,
  updateJson,
  updateProductionEnvironmentFile
} from '../utils';
import { essentials, resolutions } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addEssentials(options: NgEssentialsOptions): Rule {
  if (!options.firstRun) {
    return chain([]);
  }

  return chain([
    (tree: Tree) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);
      const hasDefaultApplication = defaultProjectName !== '';
      const elementPrefix = hasDefaultApplication ? findElementPrefixInAngularJson(tree, defaultProjectName) : 'app';

      return chain([
        preparePackageJson(),
        prepareAngularJson(options),
        prepareTsLint(elementPrefix),
        prepareTsConfig(),
        prepareEnvironments(hasDefaultApplication),
        addConfigFiles(options),
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
    addPackageToPackageJson('devDependencies', 'codelyzer', essentials.codelizerVersion),
    addPackageToPackageJson('devDependencies', 'ts-node', essentials.tsNodeVersion),
    addPackageToPackageJson('devDependencies', 'tslint', essentials.tsLintVersion),
    addPackageToPackageJson('devDependencies', 'typescript', essentials.typescriptVersion),
    addPackageToPackageJson('devDependencies', 'prettier', essentials.prettierVersion),
    addPackageToPackageJson('devDependencies', 'tslint-angular', essentials.tsLintAngularRulesVersion),
    addPackageToPackageJson('devDependencies', 'tslint-config-prettier', essentials.tsLintConfigPrettierVersion),
    addPackageToPackageJson('resolutions', 'acorn', resolutions.acornVersion),
    addPackageToPackageJson('resolutions', 'kind-of', resolutions.kindOfVersion),
    addPackageToPackageJson('resolutions', 'minimist', resolutions.minimistVersion),
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
        NG_ESSENTIALS: {
          jest: options.jest ? options.jest.valueOf() : false,
          cypress: options.cypress ? options.cypress.valueOf() : false
        }
      }
    };
  });
}

function prepareTsLint(elementPrefix: string): Rule {
  return updateJson(TSLINT_JSON, (json) => {
    json['extends'] = ['tslint:recommended', 'tslint-angular', 'tslint-config-prettier'];
    json['rulesDirectory'] = ['codelyzer'];
    json['rules'] = {
      'directive-selector': [true, 'attribute', elementPrefix, 'camelCase'],
      'component-selector': [true, 'element', elementPrefix, 'kebab-case'],
      'no-console': [true, 'debug', 'info', 'time', 'timeEnd', 'trace'],
      'interface-name': false,
      'max-classes-per-file': false,
      'ordered-imports': [
        true,
        {
          'grouped-imports': true,
          groups: [
            {
              name: 'angular',
              match: '^@angular',
              order: 1
            },

            {
              name: 'scoped_paths',
              match: '^@',
              order: 3
            },
            {
              name: 'node_modules',
              match: '^[a-zA-Z]',
              order: 2
            },
            {
              name: 'parent',
              match: '^../',
              order: 4
            },
            {
              name: 'silbing',
              match: '^./',
              order: 5
            },
            {
              match: null,
              order: 5
            }
          ]
        }
      ]
    };

    return json;
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

function removeEndToEndTestingAssets(hasDefaultApplication: boolean, defaultProjectName: string): Rule {
  return chain([
    removePackageFromPackageJson('devDependencies', '@types/jasminewd2'),
    removePackageFromPackageJson('devDependencies', 'protractor'),
    removeScriptFromPackageJson('e2e'),
    hasDefaultApplication ? removeEndToEndTsConfigNodeFromAngularJson(defaultProjectName) : noop(),
    hasDefaultApplication ? removeEndToEndTestFiles() : noop(),
    hasDefaultApplication ? removeArchitectNodeFromAngularJson(defaultProjectName, 'e2e') : noop()
  ]);
}
