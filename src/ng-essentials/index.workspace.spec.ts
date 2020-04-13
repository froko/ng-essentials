import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { ANGULAR_JSON, PACKAGE_JSON, TSLINT_JSON } from '../constants';
import { runSchematic } from '../testing';
import { cypress, essentials, jest, karma } from '../versions';

describe('ng-essentials', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createPackageJson(appTree);
    appTree = createGlobalTsLintJson(appTree);
    appTree = createAngularJsonForFirstRun(appTree);
  });

  describe('without options', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      testTree = await runSchematic('ng-add', {}, appTree);
    });

    it('adds default collection to angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"defaultCollection": "@froko/ng-essentials"');
    });

    it('adds ng-essentials options to angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"jest": false');
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"cypress": false');
    });

    it('removes e2e script from package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).not.toContain('e2e');
    });

    it('removes automatic update symbols in depencencies of package.json', () => {
      const sourceText = testTree.read(PACKAGE_JSON).toString('utf-8');
      const packageJson = JSON.parse(sourceText);
      const depencencies = JSON.stringify(packageJson['dependencies']);

      expect(depencencies).not.toContain('^');
      expect(depencencies).not.toContain('~');
      expect(depencencies).not.toContain('>=');
    });

    it('removes automatic update symbols in devDependencies of package.json', () => {
      const sourceText = testTree.read(PACKAGE_JSON).toString('utf-8');
      const packageJson = JSON.parse(sourceText);
      const devDependencies = JSON.stringify(packageJson['devDependencies']);

      expect(devDependencies).not.toContain('^');
      expect(devDependencies).not.toContain('~');
      expect(devDependencies).not.toContain('>=');
    });

    it('updates angular packages in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/animations": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/common": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/compiler": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/core": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/forms": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"@angular/platform-browser": "${essentials.angularVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"@angular/platform-browser-dynamic": "${essentials.angularVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/router": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"tslib": "${essentials.tslibVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"rxjs": "${essentials.rxjsVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"zone.js": "${essentials.zoneVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"@angular-devkit/build-angular": "${essentials.angularDevKitVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/cli": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/compiler-cli": "${essentials.angularVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"@angular/language-service": "${essentials.angularVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@types/node": "${essentials.nodeVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"codelyzer": "${essentials.codelizerVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"ts-node": "${essentials.tsNodeVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"tslint": "${essentials.tsLintVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"typescript": "${essentials.typescriptVersion}"`);
    });

    it('adds prettier packages in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"prettier": "${essentials.prettierVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"tslint-config-prettier": "${essentials.tsLintConfigPrettierVersion}"`
      );
    });

    it('adds additional scripts in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain('npx npm-force-resolutions');
      expect(testTree.readContent(PACKAGE_JSON)).toContain('format');
    });

    it('updates global tslint.json', () => {
      expect(testTree.readContent(TSLINT_JSON)).toContain('"tslint:recommended"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"tslint-angular"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"tslint-config-prettier"');

      expect(testTree.readContent(TSLINT_JSON)).toContain('"codelyzer"');

      expect(testTree.readContent(TSLINT_JSON)).not.toContain('eofline');
      expect(testTree.readContent(TSLINT_JSON)).not.toContain('whitespace');

      expect(testTree.readContent(TSLINT_JSON)).toContain('"directive-selector"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"component-selector"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"no-console"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"interface-name"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"max-classes-per-file"');
      expect(testTree.readContent(TSLINT_JSON)).toContain('"ordered-imports"');

      expect(testTree.readContent(TSLINT_JSON)).toContain('"app"');
    });

    it('adds launch.json with debug option for karma', () => {
      expect(testTree.readContent('/.vscode/launch.json')).toContain('"url": "http://localhost:9876/debug.html"');
    });

    it('adds essentials files', () => {
      expect(testTree.files).toContain('/.npmrc');
      expect(testTree.files).toContain('/.prettierrc');
      expect(testTree.files).toContain('/.vscode/settings.json');
    });

    it('updates jasmine packages in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@types/jasmine": "${karma.jasmineTypeVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jasmine-core": "${karma.jasmineCoreVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"jasmine-spec-reporter": "${karma.jasmineSpecReporterVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"karma": "${karma.karmaVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"karma-coverage-istanbul-reporter": "${karma.coverageReporterVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"karma-jasmine": "${karma.karmaJasmineVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"karma-jasmine-html-reporter": "${karma.htmlReporterVersion}"`
      );
    });
  });

  describe('with jest option', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      testTree = await runSchematic('ng-add', { jest: true }, appTree);
    });

    it('removes karma config file', () => {
      expect(testTree.files).not.toContain('/karma.conf.js');
    });

    it('removes test typescript file', () => {
      expect(testTree.files).not.toContain('/src/test.ts');
    });

    it('removes jasmine and karma packages from packages.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).not.toContain('jasmine');
      expect(testTree.readContent(PACKAGE_JSON)).not.toContain('karma');
    });

    it('adds jest packages to packages.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular-builders/jest": "${jest.jestBuilderVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@types/jest": "${jest.jestTypeVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jest": "${jest.jestVersion}"`);
    });

    it('adds launch.json with debug option for jest', () => {
      expect(testTree.readContent('/.vscode/launch.json')).toContain(
        '"program": "${workspaceFolder}/node_modules/@angular/cli/bin/ng"'
      );
    });

    it('adds jest config file', () => {
      expect(testTree.files).toContain('/jest.config.js');
    });

    it('adds jest setup file', () => {
      expect(testTree.files).toContain('/jest.setup.ts');
    });

    it('adds spec typescript config file', () => {
      expect(testTree.readContent('./tsconfig.spec.json')).toContain('jest');
    });
  });

  describe('with cypress option', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      testTree = await runSchematic('ng-add', { cypress: true }, appTree);
    });

    it('adds cypress packages to packages.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(
        `"@cypress/webpack-preprocessor": "${cypress.preprocessorVersion}"`
      );
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"cypress": "${cypress.cypressVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"ts-loader": "${cypress.tsLoaderVersion}"`);
    });

    it('adds cypress script to package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"cypress": "run-p start cypress:open"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"cypress:open": "cypress open"`);
    });

    it('adds cypress files', () => {
      expect(testTree.files).toContain('/cypress/tsconfig.json');
      expect(testTree.files).toContain('/cypress/fixtures/example.json');
      expect(testTree.files).toContain('/cypress/integration/spec.ts');
      expect(testTree.files).toContain('/cypress/plugins/index.js');
      expect(testTree.files).toContain('/cypress/support/commands.ts');
      expect(testTree.files).toContain('/cypress/support/index.ts');
    });
  });

  describe('with husky option', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      testTree = await runSchematic('ng-add', { husky: true }, appTree);
    });

    it('adds husky related packages in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"husky": "${essentials.huskyVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"npm-run-all": "${essentials.npmRunAllVersion}"`);
      expect(testTree.readContent(PACKAGE_JSON)).toContain(`"pretty-quick": "${essentials.prettyQuickVersion}"`);
    });

    it('adds husky config in package.json', () => {
      expect(testTree.readContent(PACKAGE_JSON)).toContain('hooks');
      expect(testTree.readContent(PACKAGE_JSON)).toContain('"pre-commit": "run-s format:fix lint"');
    });
  });
});

function createAngularJsonForFirstRun(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "projects": {}
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

function createGlobalTsLintJson(tree: Tree): Tree {
  tree.create(
    TSLINT_JSON,
    `{
      "rules": {
        "eofline": true,
        "whitespace": [
          true,
          "check-branch",
          "check-type"
        ]
      }
    }`
  );

  return tree;
}
