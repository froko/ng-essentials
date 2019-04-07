import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { LibraryOptionsSchema } from './schema';

import { library } from '../versions';
import {
  removeAutomaticUpdateSymbols,
  addPackageToPackageJson,
  deleteFile,
  findNewProjectRootInAngularJson,
  findJestOptionInAngularJson,
  removePackageFromPackageJson
} from '../utils';

import {
  prepareTsAppOrLibConfigForJest,
  prepareTsSpecConfigForJest,
  switchToJestBuilderInAngularJson,
  copyJestConfig
} from '../ng-essentials/jest';

export default function(options: LibraryOptionsSchema): Rule {
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
        hasJest ? deleteFile(`${libraryPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${libraryPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(libraryPath, 'lib') : noop(),
        hasJest ? prepareTsSpecConfigForJest(libraryPath) : noop(),
        hasJest ? switchToJestBuilderInAngularJson(libraryName) : noop(),
        hasJest ? copyJestConfig(libraryPath) : noop()
      ]);
    }
  ]);
}
