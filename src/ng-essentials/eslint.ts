import { chain, noop, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON } from '../constants';
import {
  addPackageToPackageJson,
  AppOrLibType,
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
        options.hasDefaultApplication = true;
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
        copyConfigFiles('./esLint', options),
        hasDefaultApplication ? addEsLintConfigToAngularJson(defaultProjectName, 'src') : noop()
      ]);
    }
  ]);
}

export function addEsLintConfigToAngularJson(projectName: string, projectPath: string): Rule {
  return updateJson(ANGULAR_JSON, (json) => {
    json['projects'][projectName]['architect']['lint'].builder = '@angular-eslint/builder:lint';
    json['projects'][projectName]['architect']['lint'].options = {
      lintFilePatterns: [`${projectPath}/**/*.ts`, `${projectPath}/**/*.html`]
    };

    return json;
  });
}

export function addEsLintConfig(rootPath: string, context: AppOrLibType, elementPrefix: string): Rule {
  return (host: Tree) => {
    host.create(
      `${rootPath}/.eslintrc.json`,
      `{
  "extends": "../../.eslintrc.json",
  "ignorePatterns": ["!**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "parserOptions": {
      "project": ["${rootPath}/tsconfig.${context}.json"],
      "createDefaultProgram": true
    },
    "rules": {
      "@angular-eslint/component-selector": [
        "error",
        {
          "type": "element",
         "prefix": "${elementPrefix}",
          "style": "kebab-case"
        }
      ],
      "@angular-eslint/directive-selector": [
        "error",
        {
          "type": "attribute",
          "prefix": "${elementPrefix}",
          "style": "camelCase"
        }
      ]
    }
  },
  {
    "files": ["*.html"],
      "rules": {}
    }
  ]
}`
    );
  };
}
