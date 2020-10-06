import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { ANGULAR_JSON, PACKAGE_JSON, TSCONFIG_JSON } from '../constants';
import {
  createAngularJsonWithJestOption,
  createAngularJsonWithoutJestOption,
  createPackageJson,
  createTsConfig,
  runSchematic
} from '../testing';
import { essentials, library } from '../versions';

describe('library', () => {
  const libraryName = 'myLib';
  const dasherizedLibraryName = dasherize(libraryName);

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createPackageJson(appTree);
    appTree = createTsConfig(appTree);
  });

  describe('when creating a new library', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      appTree = createAngularJsonWithoutJestOption(appTree);
      testTree = await runSchematic('library', { name: libraryName }, appTree);
    });

    it('adds files from the original @angular/schematics command', () => {
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/karma.conf.js`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/ng-package.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/package.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/tsconfig.lib.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/tsconfig.spec.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/tslint.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/src/public-api.ts`);
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/src/test.ts`);
    });

    it('removes automatic update symbols from package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).not.toContain('^');
      expect(testTree.readContent(PACKAGE_JSON)).not.toContain('~');
      expect(testTree.readContent(PACKAGE_JSON)).not.toContain('>=');
    });

    it('updates angular packages in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"@angular-devkit/build-ng-packagr": "${essentials.angularDevKitVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"ng-packagr": "${library.ngPackagrVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"tsickle": "${library.tsickleVersion}"`);
    });
  });

  describe('when creating a new library with jest option', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      appTree = createAngularJsonWithJestOption(appTree);
      testTree = await runSchematic('library', { name: libraryName }, appTree);
    });

    it('removes karma config of library', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedLibraryName}/karma.conf.js`);
    });

    it('removes test typescript file of library', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedLibraryName}/src/test.ts`);
    });

    it('removes spec typescript config file in library folder', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedLibraryName}/tsconfig.spec.json`);
    });

    it('removes reference to spec typescript config file in library folder', () => {
      expect(testTree.readContent(TSCONFIG_JSON)).not.toContain(`/libs/${dasherizedLibraryName}/tsconfig.spec.json`);
    });

    it('patches TsLint config in angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain(`"libs/${dasherizedLibraryName}/tsconfig.lib.json"`);
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"tsconfig.spec.json"');
    });

    it('switches to jest builder in angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
    });

    it('updates application typescript config file in library folder', () => {
      expect(testTree.readContent(`/libs/${dasherizedLibraryName}/tsconfig.lib.json`)).not.toContain('test.ts');
    });

    it('adds jest config file', () => {
      expect(testTree.files).toContain(`/libs/${dasherizedLibraryName}/jest.config.js`);
    });
  });
});
