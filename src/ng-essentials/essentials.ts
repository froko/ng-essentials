import { Rule, chain } from '@angular-devkit/schematics';

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
  const ANGULAR_VERSION = '6.1.1';

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
    addPackageToPackageJson('dependencies', 'rxjs', '6.2.2'),
    addPackageToPackageJson('devDependencies', '@angular-devkit/build-angular', '0.7.2'),
    addPackageToPackageJson('devDependencies', '@angular/cli', ANGULAR_VERSION),
    addPackageToPackageJson('devDependencies', '@angular/compiler-cli', ANGULAR_VERSION),
    addPackageToPackageJson('devDependencies', '@angular/language-service', ANGULAR_VERSION),
    addPackageToPackageJson('devDependencies', 'codelyzer', '4.4.2'),
    addPackageToPackageJson('devDependencies', 'ts-node', '7.0.0'),
    addPackageToPackageJson('devDependencies', 'tslint', '5.11.0'),
    addPackageToPackageJson('devDependencies', 'typescript', '2.9.2'),
    addPackageToPackageJson('devDependencies', 'husky', '0.14.3'),
    addPackageToPackageJson('devDependencies', 'npm-run-all', '4.1.3'),
    addPackageToPackageJson('devDependencies', 'prettier', '1.14.0'),
    addPackageToPackageJson('devDependencies', 'pretty-quick', '1.6.0'),
    addPackageToPackageJson('devDependencies', 'tslint-config-prettier', '1.14.0'),
    addScriptToPackageJson('format', 'prettier --write "src/{app,environments,assets}/**/*{.ts,.js,.json,.css,.scss}"'),
    addScriptToPackageJson(
      'format:check',
      'prettier --list-different "src/{app,environments,assets}/**/*{.ts,.js,.json,.css,.scss}"'
    ),
    addScriptToPackageJson('format:fix', 'pretty-quick --staged'),
    addScriptToPackageJson('precommit', 'run-s format:fix lint'),
    editTsLintConfigJson(),
    copyConfigFiles('./files')
  ]);
}
