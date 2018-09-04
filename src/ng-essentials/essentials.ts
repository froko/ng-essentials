import { Rule, chain, Tree, SchematicsException } from '@angular-devkit/schematics';
import { addProviderToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

import * as ts from 'typescript';

import {
  removeEndToEndTestNodeFromAngularJson,
  removePackageFromPackageJson,
  removeScriptFromPackageJson,
  removeAutomaticUpdateSymbols,
  addPackageToPackageJson,
  addScriptToPackageJson,
  editTsLintConfigJson,
  copyConfigFiles
} from './utils';

export function addEssentials(): Rule {
  const ANGULAR_VERSION = '6.1.6';

  return chain([
    removeEndToEndTestNodeFromAngularJson(),
    removePackageFromPackageJson('devDependencies', '@types/jasminewd2'),
    removePackageFromPackageJson('devDependencies', 'protractor'),
    removeScriptFromPackageJson('e2e'),
    removeAutomaticUpdateSymbols(),
    addPackageToPackageJson('dependencies', '@angular/animations', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/common', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/compiler', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/core', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/forms', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/http', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/platform-browser', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/platform-browser-dynamic', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', '@angular/router', ANGULAR_VERSION),
    addPackageToPackageJson('dependencies', 'core-js', '2.5.7'),
    addPackageToPackageJson('dependencies', 'rxjs', '6.3.1'),
    addPackageToPackageJson('devDependencies', '@angular-devkit/build-angular', '0.7.5'),
    addPackageToPackageJson('devDependencies', '@angular/cli', '6.1.5'),
    addPackageToPackageJson('devDependencies', '@angular/compiler-cli', ANGULAR_VERSION),
    addPackageToPackageJson('devDependencies', '@angular/language-service', ANGULAR_VERSION),
    addPackageToPackageJson('devDependencies', '@types/node', '10.9.4'),
    addPackageToPackageJson('devDependencies', 'codelyzer', '4.4.4'),
    addPackageToPackageJson('devDependencies', 'ts-node', '7.0.1'),
    addPackageToPackageJson('devDependencies', 'tslint', '5.11.0'),
    addPackageToPackageJson('devDependencies', 'typescript', '2.9.2'),
    addPackageToPackageJson('devDependencies', 'husky', '0.14.3'),
    addPackageToPackageJson('devDependencies', 'npm-run-all', '4.1.3'),
    addPackageToPackageJson('devDependencies', 'prettier', '1.14.2'),
    addPackageToPackageJson('devDependencies', 'pretty-quick', '1.6.0'),
    addPackageToPackageJson('devDependencies', 'tslint-config-prettier', '1.15.0'),
    addScriptToPackageJson('format', 'prettier --write "src/{app,environments,assets}/**/*{.ts,.js,.json,.css,.scss}"'),
    addScriptToPackageJson(
      'format:check',
      'prettier --list-different "src/{app,environments,assets}/**/*{.ts,.js,.json,.css,.scss}"'
    ),
    addScriptToPackageJson('format:fix', 'pretty-quick --staged'),
    addScriptToPackageJson('precommit', 'run-s format:fix lint'),
    editTsLintConfigJson(),
    updateDevelopmentEnvironmentFile(),
    updateProductionEnvironmentFile(),
    addEnvProvidersToAppModule(),
    copyConfigFiles('./files')
  ]);
}

function updateDevelopmentEnvironmentFile(): Rule {
  return (host: Tree) => {
    host.overwrite(
      './src/environments/environment.ts',
      `
      const providers: any[] = [
        { provide: 'environment', useValue: 'Development' },
        { provide: 'baseUrl', useValue: 'http://localhost:3000' }
      ];

      export const ENV_PROVIDERS = providers;

      export const environment = {
        production: false
      };
    `
    );

    return host;
  };
}

function updateProductionEnvironmentFile(): Rule {
  return (host: Tree) => {
    host.overwrite(
      './src/environments/environment.prod.ts',
      `
      const providers: any[] = [
        { provide: 'environment', useValue: 'Production' },
        { provide: 'baseUrl', useValue: 'http://localhost:3000' }
      ];
      
      export const ENV_PROVIDERS = providers;
      
      export const environment = {
        production: true
      };
    `
    );

    return host;
  };
}

function addEnvProvidersToAppModule(): Rule {
  return (host: Tree) => {
    const modulePath = './src/app/app.module.ts';
    const text = host.read(modulePath);

    if (!text) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }

    const sourceText = text.toString('utf-8');
    const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
    const changes = addProviderToModule(source, modulePath, 'ENV_PROVIDERS', '../environments/environment');

    const recorder = host.beginUpdate(modulePath);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(recorder);

    return host;
  };
}
