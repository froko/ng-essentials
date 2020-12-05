import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON } from '../constants';
import {
  addPackageToPackageJson,
  copyConfigFiles,
  findDefaultProjectNameInAngularJson,
  findElementPrefixInAngularJson,
  updateJson
} from '../utils';
import { eslint } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addEsLint(options: NgEssentialsOptions): Rule {
  return chain([
    (tree: Tree) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);
      const hasDefaultApplication = defaultProjectName !== '';

      if (hasDefaultApplication) {
        options.elementPrefix = findElementPrefixInAngularJson(tree, defaultProjectName);
      }

      return chain([
        addPackageToPackageJson('devDependencies', '@angular-eslint/builder', eslint.angularVersion),
        addPackageToPackageJson('devDependencies', '@angular-eslint/eslint-plugin', eslint.angularVersion),
        addPackageToPackageJson('devDependencies', '@angular-eslint/eslint-plugin-template', eslint.angularVersion),
        addPackageToPackageJson('devDependencies', '@angular-eslint/template-parser', eslint.angularVersion),
        addPackageToPackageJson('devDependencies', '@typescript-eslint/eslint-plugin', eslint.typescriptVersion),
        addPackageToPackageJson('devDependencies', '@typescript-eslint/parser', eslint.typescriptVersion),
        addPackageToPackageJson('devDependencies', 'eslint', eslint.eslintVersion),
        addPackageToPackageJson('devDependencies', 'eslint-config-prettier', eslint.configPrettierVersion),
        addPackageToPackageJson('devDependencies', 'eslint-plugin-import', eslint.plugin.importVersion),
        addPackageToPackageJson('devDependencies', 'eslint-plugin-jsdoc', eslint.plugin.jsDocVersion),
        addPackageToPackageJson('devDependencies', 'eslint-plugin-prefer-arrow', eslint.plugin.preferArrowVersion),
        addPackageToPackageJson('devDependencies', 'eslint-plugin-prettier', eslint.plugin.prettierVersion),
        hasDefaultApplication ? copyConfigFiles('./esLint', options) : noop(),
        hasDefaultApplication ? addEsLintConfigToAngularJson(defaultProjectName) : noop()
      ]);
    }
  ]);
}

function addEsLintConfigToAngularJson(projectName: string): Rule {
  return updateJson(ANGULAR_JSON, (json) => {
    json['projects'][projectName]['architect']['lint'].builder = '@angular-eslint/builder:lint';
    json['projects'][projectName]['architect']['lint'].options = {
      lintFilePatterns: ['src/**/*.ts', 'src/**/*.html']
    };

    return json;
  });
}
