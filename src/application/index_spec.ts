import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import * as path from 'path';

import { PACKAGE_JSON, ANGULAR_JSON } from '../constants';

const collectionPath = path.join(__dirname, '../collection.json');

describe('application', () => {
  const appName = 'myApp';

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createPackageJson(new UnitTestTree(appTree));
  });

  describe('when creating a new application', () => {
    let tree: UnitTestTree;

    beforeEach(() => {
      appTree = createAngularJsonWithoutJestOption(new UnitTestTree(appTree));

      const runner = new SchematicTestRunner('schematics', collectionPath);
      tree = runner.runSchematic('application', { name: appName }, appTree);
    });

    it('adds files from the original @angular/schematics command', () => {
      expect(tree.files).toContain(`/libs/${appName}/karma.conf.js`);
      expect(tree.files).toContain(`/libs/${appName}/tsconfig.app.json`);
      expect(tree.files).toContain(`/libs/${appName}/tsconfig.spec.json`);
      expect(tree.files).toContain(`/libs/${appName}/tslint.json`);
      expect(tree.files).toContain(`/libs/${appName}/src/test.ts`);
    });
  });

  describe('when creating a new application with jest option', () => {
    let tree: UnitTestTree;

    beforeEach(() => {
      appTree = createAngularJsonWithJestOption(new UnitTestTree(appTree));
      appTree = createJestConfig(new UnitTestTree(appTree));

      const runner = new SchematicTestRunner('schematics', collectionPath);
      tree = runner.runSchematic('application', { name: appName }, appTree);
    });

    it('removes karma config of application', () => {
      expect(tree.files).not.toContain(`/libs/${appName}/karma.conf.js`);
    });

    it('removes test typescript file of application', () => {
      expect(tree.files).not.toContain(`/libs/${appName}/src/test.ts`);
    });

    it('updates application typescript config file in src folder', () => {
      expect(tree.readContent(`/libs/${appName}/tsconfig.app.json`)).not.toContain('test.ts');
    });

    it('updates spec typescript config file in application folder', () => {
      expect(tree.readContent(`/libs/${appName}/tsconfig.spec.json`)).not.toContain('files');
      expect(tree.readContent(`/libs/${appName}/tsconfig.spec.json`)).not.toContain('jasmine');

      expect(tree.readContent(`/libs/${appName}/tsconfig.spec.json`)).toContain('jest');
      expect(tree.readContent(`/libs/${appName}/tsconfig.spec.json`)).toContain('commonjs');
    });

    it('adds jest config in application folder', () => {
      expect(tree.readContent(`/libs/${appName}/jest.config.js`)).toContain('<rootDir>/src/setup-jest.ts');
    });

    it('switches to jest builder in angular.json', () => {
      expect(tree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
    });
  });
});

function createAngularJsonWithoutJestOption(tree: UnitTestTree): UnitTestTree {
  tree.create(
    ANGULAR_JSON,
    `{
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "newProjectRoot": "libs",
        "projects": {
          "froko-app": {
            "schematics": {
              "@froko/ng-essentials": {
                "jest": false,
                "cypress": false,
                "testcafe": false
              }
            },
            "architect": {
              "test": {
                "builder": "@angular-devkit/build-angular:dev-server"
              }
            }
          },
          "froko-app-e2e": {}
        },
        "defaultProject": "froko-app"
    }`
  );

  return tree;
}

function createAngularJsonWithJestOption(tree: UnitTestTree): UnitTestTree {
  tree.create(
    ANGULAR_JSON,
    `{
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "newProjectRoot": "libs",
        "projects": {
          "froko-app": {
            "schematics": {
              "@froko/ng-essentials": {
                "jest": true,
                "cypress": false,
                "testcafe": false
              }
            },
            "architect": {
              "test": {
                "builder": "@angular-devkit/build-angular:dev-server"
              }
            }
          },
          "froko-app-e2e": {}
        },
        "defaultProject": "froko-app"
      }`
  );

  return tree;
}

function createPackageJson(tree: UnitTestTree): UnitTestTree {
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

function createJestConfig(tree: UnitTestTree): UnitTestTree {
  tree.create(
    './src/jest.config.js',
    `module.exports = {
      preset: 'jest-preset-angular',
      roots: [''],
      setupTestFrameworkScriptFile: '<rootDir>/src/setup-jest.ts'
    };`
  );

  return tree;
}
