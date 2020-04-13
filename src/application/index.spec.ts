import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { ANGULAR_JSON, PACKAGE_JSON } from '../constants';
import { runSchematic } from '../testing';

describe('application', () => {
  const appName = 'myApp';

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createPackageJson(appTree);
  });

  describe('when creating a new application', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      appTree = createAngularJsonWithoutJestOption(appTree);
      testTree = await runSchematic('application', { name: appName }, appTree);
    });

    it('adds files from the original @angular/schematics command', () => {
      expect(testTree.files).toContain(`/libs/${appName}/karma.conf.js`);
      expect(testTree.files).toContain(`/libs/${appName}/tsconfig.app.json`);
      expect(testTree.files).toContain(`/libs/${appName}/tsconfig.spec.json`);
      expect(testTree.files).toContain(`/libs/${appName}/tslint.json`);
      expect(testTree.files).toContain(`/libs/${appName}/src/test.ts`);
    });

    it('removes e2e files from the original @angular/schematics command', () => {
      expect(testTree.files).not.toContain(`/libs/${appName}/e2e/tsconfig.json`);
      expect(testTree.files).not.toContain(`/libs/${appName}/e2e/protractor.conf.js`);
      expect(testTree.files).not.toContain(`/libs/${appName}/e2e/src/app.e2e-spec.ts`);
      expect(testTree.files).not.toContain(`/libs/${appName}/e2e/src/app.po.ts`);
    });
  });

  describe('when creating a new application with jest option', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      appTree = createAngularJsonWithJestOption(appTree);
      testTree = await runSchematic('application', { name: appName }, appTree);
    });

    it('removes karma config of application', () => {
      expect(testTree.files).not.toContain(`/libs/${appName}/karma.conf.js`);
    });

    it('removes test typescript file of application', () => {
      expect(testTree.files).not.toContain(`/libs/${appName}/src/test.ts`);
    });

    it('removes spec typescript config file in library folder', () => {
      expect(testTree.files).not.toContain(`/libs/${appName}/tsconfig.spec.json`);
    });

    it('patches TsLint config in angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"libs/myApp/tsconfig.app.json"');
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"tsconfig.spec.json"');
    });

    it('switches to jest builder in angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
    });

    it('updates application typescript config file in src folder', () => {
      expect(testTree.readContent(`/libs/${appName}/tsconfig.app.json`)).not.toContain('test.ts');
    });

    it('adds jest config file', () => {
      expect(testTree.files).toContain(`/libs/${appName}/jest.config.js`);
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
