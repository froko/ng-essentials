import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { LibraryOptionsSchema } from './schema';

import { ANGULAR_JSON, NG_ESSENTIALS } from '../constants';
import {
  removeAutomaticUpdateSymbols,
  addPackageToPackageJson,
  deleteFile,
  editTsConfigLibJson,
  editTsConfigSpecJson
} from '../utils';

export default function(options: LibraryOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'library', options),
    (tree: Tree, _context: SchematicContext) => {
      const hasJest = findJestOptionInAngularJson(tree);

      return chain([
        removeAutomaticUpdateSymbols(),
        addPackageToPackageJson('devDependencies', '@angular-devkit/build-angular', '0.8.2'),
        addPackageToPackageJson('devDependencies', '@angular-devkit/build-ng-packagr', '0.8.2'),
        addPackageToPackageJson('devDependencies', 'ng-packagr', '4.1.1'),
        addPackageToPackageJson('devDependencies', 'tsickle', '0.32.1'),
        addPackageToPackageJson('devDependencies', 'tslib', '1.9.3'),
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

function editTsLintConfigJsonForLibrary(path: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(`${path}/tslint.json`)) {
      return host;
    }

    const sourceText = host.read(`${path}/tslint.json`).toString('utf-8');
    const tslintJson = JSON.parse(sourceText);

    if (!tslintJson['rules']) {
      tslintJson['rules'] = [];
    }

    if (!tslintJson['rules']['no-implicit-dependencies']) {
      tslintJson['rules']['no-implicit-dependencies'] = false;
    }

    host.overwrite(`${path}/tslint.json`, JSON.stringify(tslintJson, null, 2));

    return host;
  };
}

function switchToJestBuilderInAngularJsonForLibrary(libraryName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (angularJson['projects'][libraryName]['architect']['test']['builder']) {
      angularJson['projects'][libraryName]['architect']['test']['builder'] = '@angular-builders/jest:run';
    }

    if (angularJson['projects'][libraryName]['architect']['test']['options']) {
      angularJson['projects'][libraryName]['architect']['test']['options'] = {};
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}
