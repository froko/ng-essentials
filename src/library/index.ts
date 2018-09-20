import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { LibraryOptionsSchema } from './schema';
import {
  ANGULAR_JSON,
  NG_ESSENTIALS,
  deleteFile,
  removeAutomaticUpdateSymbols,
  updatePackageInPackageJson,
  editTsConfigLibJson,
  editTsConfigSpecJson,
  editTsLintConfigJsonForLibrary,
  switchToJestBuilderInAngularJsonForLibrary
} from '../utils';

export default function(options: LibraryOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'library', options),
    (tree: Tree, _context: SchematicContext) => {
      const hasJest = findJestOptionInAngularJson(tree);

      return chain([
        removeAutomaticUpdateSymbols(),
        updatePackageInPackageJson('devDependencies', '@angular-devkit/build-angular', '0.8.2'),
        updatePackageInPackageJson('devDependencies', '@angular-devkit/build-ng-packagr', '0.8.2'),
        updatePackageInPackageJson('devDependencies', 'ng-packagr', '4.1.1'),
        updatePackageInPackageJson('devDependencies', 'tsickle', '0.32.1'),
        updatePackageInPackageJson('devDependencies', 'tslib', '1.9.3'),
        editTsLintConfigJsonForLibrary(`projects/${options.name}`),
        hasJest ? deleteFile(`projects/${options.name}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`projects/${options.name}/src/test.ts`) : noop(),
        hasJest ? editTsConfigLibJson(`projects/${options.name}`) : noop(),
        hasJest ? editTsConfigSpecJson(`projects/${options.name}`) : noop(),
        hasJest ? switchToJestBuilderInAngularJsonForLibrary(`${options.name}`) : noop()
      ]);
    }
  ]);
}

function findJestOptionInAngularJson(host: Tree): boolean {
  if (!host.exists(ANGULAR_JSON)) {
    return false;
  }

  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);
  const defaultProject = angularJson['defaultProject'];
  const optionsFromAngularJson = angularJson['projects'][defaultProject]['schematics'][NG_ESSENTIALS];

  if (optionsFromAngularJson) {
    return optionsFromAngularJson.jest;
  }

  return false;
}
