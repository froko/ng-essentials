import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, noop, Rule, Tree } from '@angular-devkit/schematics';

import { createJestConfig, deleteTsSpecConfig, prepareTsAppOrLibConfigForJest, switchToJestBuilderInAngularJson } from '../ng-essentials/jest';
import {
  addPackageToPackageJson,
  deleteFile,
  findJestOptionInAngularJson,
  findNewProjectRootInAngularJson,
  removeAutomaticUpdateSymbols,
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

      return chain([
        removeAutomaticUpdateSymbols(),
        addPackageToPackageJson('devDependencies', '@angular-devkit/build-ng-packagr', library.buildNgPackagrVersion),
        addPackageToPackageJson('devDependencies', 'ng-packagr', library.ngPackagrVersion),
        addPackageToPackageJson('devDependencies', 'tsickle', library.tsickleVersion),
        hasJest ? switchToJestBuilderInAngularJson(libraryName) : noop(),
        hasJest ? deleteFile(`${libraryPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${libraryPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(libraryPath, 'lib') : noop(),
        hasJest ? deleteTsSpecConfig(libraryPath) : noop(),
        hasJest ? createJestConfig(libraryPath) : noop(),
      ]);
    },
  ]);
}
