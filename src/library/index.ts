import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { prepareTsAppOrLibConfigForJest, prepareTsSpecConfigForJest } from '../ng-essentials/jest';
import {
  addPackageToPackageJson,
  deleteFile,
  findJestOptionInAngularJson,
  findNewProjectRootInAngularJson,
  removeArchitectNodeFromAngularJson,
  removeAutomaticUpdateSymbols,
  removePackageFromPackageJson
} from '../utils';
import { library } from '../versions';

import { LibraryOptionsSchema } from './schema';

export function essentialsLibrary(options: LibraryOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'library', options),
    (tree: Tree, _context: SchematicContext) => {
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
        removePackageFromPackageJson('devDependencies', 'tslib'),
        hasJest ? removeArchitectNodeFromAngularJson(libraryName, 'test') : noop(),
        hasJest ? deleteFile(`${libraryPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${libraryPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(libraryPath, 'lib') : noop(),
        hasJest ? prepareTsSpecConfigForJest(libraryPath) : noop()
      ]);
    }
  ]);
}
