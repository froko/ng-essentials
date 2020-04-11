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
          "@angular/animations": "^6.1.0",
          "@angular/common": "^6.1.0",
          "@angular/compiler": "^6.1.0",
          "@angular/core": "^6.1.0",
          "@angular/forms": "^6.1.0",
          "@angular/http": "^6.1.0",
          "@angular/platform-browser": "^6.1.0",
          "@angular/platform-browser-dynamic": "^6.1.0",
          "@angular/router": "^6.1.0",
          "core-js": "^2.5.4",
          "rxjs": "~6.2.0",
          "zone.js": ">=0.8.26"
        },
        "devDependencies": {
          "@angular-devkit/build-angular": "~0.8.0",
          "@angular/cli": "~6.2.2",
          "@angular/compiler-cli": "^6.1.0",
          "@angular/language-service": "^6.1.0",
          "@types/jasmine": "~2.8.8",
          "@types/jasminewd2": "~2.0.3",
          "@types/node": "~8.9.4",
          "codelyzer": "~4.3.0",
          "jasmine-core": "~2.99.1",
          "jasmine-spec-reporter": "~4.2.1",
          "karma": "~3.0.0",
          "karma-chrome-launcher": "~2.2.0",
          "karma-coverage-istanbul-reporter": "~2.0.1",
          "karma-jasmine": "~1.1.2",
          "karma-jasmine-html-reporter": "^0.2.2",
          "protractor": "~5.4.0",
          "ts-node": "~7.0.0",
          "tslint": "~5.11.0",
          "typescript": "~2.9.2"
        }
      }`
  );

  return tree;
}
