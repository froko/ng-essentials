import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { LibraryOptionsSchema } from './schema';

import { ANGULAR_JSON, NG_ESSENTIALS } from '../constants';
import { library } from '../versions';
import {
  removeAutomaticUpdateSymbols,
  addPackageToPackageJson,
  deleteFile,
  editTsConfigSpecJson,
  findDefaultProjectNameInAngularJson
} from '../utils';

export default function(options: LibraryOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'library', options),
    (tree: Tree, _context: SchematicContext) => {
      const hasJest = findJestOptionInAngularJson(tree);
      const dasherizedLibraryName = dasherize(options.name.valueOf());
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);

      return chain([
        removeAutomaticUpdateSymbols(),
        addPackageToPackageJson('dependencies', 'tslib', library.tslibVersion),
        addPackageToPackageJson('devDependencies', '@angular-devkit/build-ng-packagr', library.buildNgPackagrVersion),
        addPackageToPackageJson('devDependencies', 'ng-packagr', library.ngPackagrVersion),
        addPackageToPackageJson('devDependencies', 'tsickle', library.tsickleVersion),
        hasJest ? deleteFile(`${defaultProjectName}/${dasherizedLibraryName}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${defaultProjectName}/${dasherizedLibraryName}/src/test.ts`) : noop(),
        hasJest ? editTsConfigLibJson(`${defaultProjectName}/${dasherizedLibraryName}`) : noop(),
        hasJest ? editTsConfigSpecJson(`${defaultProjectName}/${dasherizedLibraryName}`) : noop(),
        hasJest ? addJestConfigInLibraryFolder(defaultProjectName, dasherizedLibraryName) : noop(),
        hasJest ? switchToJestBuilderInAngularJsonForLibrary(`${options.name}`) : noop(),
        hasJest ? updateJestConfig(defaultProjectName) : noop()
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

function editTsConfigLibJson(path: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(`${path}/tsconfig.lib.json`)) {
      return host;
    }

    const sourceText = host.read(`${path}/tsconfig.lib.json`).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson['exclude']) {
      tsconfigJson['exclude'] = [];
    }

    tsconfigJson['exclude'] = ['**/*.spec.ts'];

    host.overwrite(`${path}/tsconfig.lib.json`, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}

function addJestConfigInLibraryFolder(defaultProjectName: string, dasherizedLibraryName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    host.create(
      `${defaultProjectName}/${dasherizedLibraryName}/jest.config.js`,
      `module.exports = {
  preset: 'jest-preset-angular',
  setupTestFrameworkScriptFile: '<rootDir>/src/setup-jest.ts'
};`
    );

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

function updateJestConfig(defaultProjectName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    host.overwrite(
      './jest.config.js',
      `module.exports = {
  preset: 'jest-preset-angular',
  roots: ['src', '${defaultProjectName}'],
  setupTestFrameworkScriptFile: '<rootDir>/src/setup-jest.ts'
};`
    );

    return host;
  };
}
