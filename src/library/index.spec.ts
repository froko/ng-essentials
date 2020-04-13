import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { ANGULAR_JSON, PACKAGE_JSON } from '../constants';
import { runSchematic } from '../testing';
import { essentials, library } from '../versions';

describe('library', () => {
  const libraryName = 'myLib';
  const dasherizedLibraryName = dasherize(libraryName);

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createPackageJson(appTree);
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

function createAngularJsonWithoutJestOption(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "version": 1,
        "newProjectRoot": "libs",
        "projects": {
          "froko-app": {}
        },
        "defaultProject": "froko-app",
        "schematics": {
          "@froko/ng-essentials": {
            "jest": false
          }
        }
    }`
  );

  return tree;
}

function createAngularJsonWithJestOption(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "version": 1,
        "newProjectRoot": "libs",
        "projects": {
          "froko-app": {}
        },
        "defaultProject": "froko-app",
        "schematics": {
          "@froko/ng-essentials": {
            "jest": true
          }
        }
      }`
  );

  return tree;
}

function createPackageJson(tree: Tree): Tree {
  tree.create(
    PACKAGE_JSON,
    `{
        "scripts": {
          "ng": "ng",
          "start": "ng serve",
          "build": "ng build",
          "test": "ng test",
          "lint": "ng lint",
          "e2e": "ng e2e"
        },
        "dependencies": {
          "@angular/animations": "~9.0.3",
          "@angular/common": "~9.0.3",
          "@angular/compiler": "~9.0.3",
          "@angular/core": "~9.0.3",
          "@angular/forms": "~9.0.3",
          "@angular/platform-browser": "~9.0.3",
          "@angular/platform-browser-dynamic": "~9.0.3",
          "@angular/router": "~9.0.3",
          "rxjs": "~6.5.4",
          "tslib": "^1.10.0",
          "zone.js": "~0.10.2"
        },
        "devDependencies": {
          "@angular-devkit/build-angular": "~0.900.4",
          "@angular/cli": "~9.0.4",
          "@angular/compiler-cli": "~9.0.3",
          "@angular/language-service": "~9.0.3",
          "@types/node": "^12.11.1",
          "@types/jasmine": "~3.5.0",
          "@types/jasminewd2": "~2.0.3",
          "codelyzer": "^5.1.2",
          "jasmine-core": "~3.5.0",
          "jasmine-spec-reporter": "~4.2.1",
          "karma": "~4.3.0",
          "karma-chrome-launcher": "~3.1.0",
          "karma-coverage-istanbul-reporter": "~2.1.0",
          "karma-jasmine": "~2.0.1",
          "karma-jasmine-html-reporter": "^1.4.2",
          "protractor": "~5.4.3",
          "ts-node": "~8.3.0",
          "tslint": "~5.18.0",
          "typescript": "~3.7.5"
        }
    }`
  );

  return tree;
}
