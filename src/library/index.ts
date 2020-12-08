import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, noop, Rule, Tree } from '@angular-devkit/schematics';

import { addEsLintConfig, addEsLintConfigToAngularJson } from '../ng-essentials/eslint';
import { prepareJest } from '../ng-essentials/jest';
import {
  addPackageToPackageJson,
  deleteFile,
  findElementPrefixInAngularJson,
  findJestOptionInAngularJson,
  findNewProjectRootInAngularJson,
  removeAutomaticUpdateSymbols,
  runNpmScript
} from '../utils';
import { library } from '../versions';

import { LibraryOptionsSchema } from './schema';

export function essentialsLibrary(options: LibraryOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'library', options),
    (tree: Tree) => {
      const hasJest = findJestOptionInAngularJson(tree);
      const libraryName = options.name;
      const newProjectRoot = findNewProjectRootInAngularJson(tree);
      const dasherizedLibraryName = dasherize(libraryName);
      const libraryPath = `${newProjectRoot}/${dasherizedLibraryName}`;
      const elementPrefix = findElementPrefixInAngularJson(tree, libraryName);

      return chain([
        preparePackageJson(),
        switchToEsLint(libraryName, libraryPath, elementPrefix),
        hasJest ? prepareJest(libraryName, libraryPath, 'lib') : noop(),
        runNpmScript('lint', '--', '--fix'),
        runNpmScript('format')
      ]);
    }
  ]);
}

function preparePackageJson(): Rule {
  return chain([
    removeAutomaticUpdateSymbols(),
    addPackageToPackageJson('devDependencies', 'ng-packagr', library.ngPackagrVersion)
  ]);
}

function switchToEsLint(libraryName: string, libraryPath: string, elementPrefix: string): Rule {
  return chain([
    addEsLintConfig(libraryPath, 'app', elementPrefix),
    addEsLintConfigToAngularJson(libraryName, libraryPath),
    deleteFile(`${libraryPath}/tslint.json`)
  ]);
}
