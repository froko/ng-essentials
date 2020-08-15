import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { createAppModule } from '@schematics/angular/utility/test/create-app-module';

import { ANGULAR_JSON, PACKAGE_JSON, TSCONFIG_BASE_JSON, TSCONFIG_JSON, TSLINT_JSON } from '../constants';
import {
  createPackageJson,
  createTsConfig,
  createTsConfigApp,
  createTsConfigBase,
  createTsConfigSpec,
  runSchematic
} from '../testing';
import { cypress, essentials, jest, karma } from '../versions';

describe('ng-essentials', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createAppModule(new UnitTestTree(appTree));
    appTree = createPackageJson(appTree);
    appTree = createGlobalTsLintJson(appTree);
    appTree = createDevelopmentEnvironmentFile(appTree);
    appTree = createProductionEnvironmentFile(appTree);
    appTree = createKarmaConfig(appTree);
    appTree = createTestTypescriptFile(appTree);
    appTree = createTsConfig(appTree);
    appTree = createTsConfigBase(appTree);
    appTree = createTsConfigApp(appTree);
    appTree = createTsConfigSpec(appTree);
    appTree = createEndToEndTestingFiles(appTree);
  });

  describe('when running for the first time', () => {
    beforeEach(() => {
      appTree = createAngularJsonForFirstRun(appTree);
    });

    describe('without options', () => {
      let testTree: UnitTestTree;

      beforeEach(async () => {
        testTree = await runSchematic('ng-add', {}, appTree);
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
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/cli": "${essentials.angularCliVersion}"`);
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

      it('adds default collection to angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"defaultCollection": "@froko/ng-essentials"');
      });

      it('adds ng-essentials options to angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"jest": false');
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"cypress": false');
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

      it('adds paths collection to tsconfig.base.json', () => {
        expect(testTree.readContent(TSCONFIG_BASE_JSON)).toContain('paths');
      });

      it('updates development environment file', () => {
        expect(testTree.readContent('src/environments/environment.ts')).toContain(
          "{ provide: 'environment', useValue: 'Development' },"
        );
        expect(testTree.readContent('src/environments/environment.ts')).toContain(
          'export const ENV_PROVIDERS = providers;'
        );
      });

      it('updates production environment file', () => {
        expect(testTree.readContent('src/environments/environment.prod.ts')).toContain(
          "{ provide: 'environment', useValue: 'Production' },"
        );
        expect(testTree.readContent('src/environments/environment.prod.ts')).toContain(
          'export const ENV_PROVIDERS = providers;'
        );
      });

      it('adds ENV_PROVIDERS to app module', () => {
        expect(testTree.readContent('src/app/app.module.ts')).toContain(
          "import { ENV_PROVIDERS } from '../environments/environment';"
        );
        expect(testTree.readContent('src/app/app.module.ts')).toContain('providers: [ENV_PROVIDERS]');
      });

      it('adds launch.json with debug option for karma', () => {
        expect(testTree.readContent('/.vscode/launch.json')).toContain('"url": "http://localhost:9876/debug.html"');
      });

      it('adds essentials files', () => {
        expect(testTree.files).toContain('/.npmrc');
        expect(testTree.files).toContain('/.prettierrc');
        expect(testTree.files).toContain('/.vscode/settings.json');
      });

      it('removes e2e tsconfig.json in linting options from angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).not.toContain('e2e/tsconfig.json');
      });

      it('removes e2e test node from angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).not.toContain('"e2e": {');
      });

      it('removes protractor packages from angular.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('protractor');
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('@types/jasminewd2');
      });

      it('removes e2e script from package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('e2e');
      });

      it('removes e2e entry from tsconfig.json', () => {
        expect(testTree.readContent(TSCONFIG_JSON)).not.toContain('e2e/tsconfig.json');
      });
    });

    describe('with jest option', () => {
      let testTree: UnitTestTree;

      beforeEach(async () => {
        testTree = await runSchematic('ng-add', { jest: true }, appTree);
      });

      it('removes jasmine and karma packages from packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('jasmine');
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('karma');
      });

      it('adds jest packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular-builders/jest": "${jest.jestBuilderVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@types/jest": "${jest.jestTypeVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jest": "${jest.jestVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jest-preset-angular": "${jest.presetAngularVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"ts-jest": "${jest.tsJestVersion}"`);
      });

      it('adds test scripts in package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain('"test": "ng test --coverage"');
        expect(testTree.readContent(PACKAGE_JSON)).toContain('"test:watch": "ng test --watch"');
      });

      it('switches to jest builder in angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
      });

      it('updates application typescript config file', () => {
        expect(testTree.readContent('tsconfig.app.json')).not.toContain('test.ts');
      });

      it('updates spec typescript config file', () => {
        expect(testTree.readContent('tsconfig.spec.json')).not.toContain('files');
        expect(testTree.readContent('tsconfig.spec.json')).not.toContain('jasmine');

        expect(testTree.readContent('tsconfig.spec.json')).toContain('jest');
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

      it('removes karma config file', () => {
        expect(testTree.files).not.toContain('/karma.conf.js');
      });

      it('removes test typescript file', () => {
        expect(testTree.files).not.toContain('/src/test.ts');
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
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"npm-run-all": "${essentials.npmRunAllVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"ts-loader": "${cypress.tsLoaderVersion}"`);
      });

      it('adds cypress scripts in package.json', () => {
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
        expect(testTree.files).toContain('/cypress.json');
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

  describe('when running for a subsequent time', () => {
    beforeEach(() => {
      appTree = createAngularJsonForSubsequentRun(appTree);
    });

    describe('with all options', () => {
      let testTree: UnitTestTree;

      beforeEach(async () => {
        testTree = await runSchematic('ng-add', { jest: true, cypress: true, husky: true }, appTree);
      });

      it('does not add default collection to angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).not.toContain('"defaultCollection": "@froko/ng-essentials"');
      });

      it('does not add essentials files', () => {
        expect(testTree.files).not.toContain('/.npmrc');
        expect(testTree.files).not.toContain('/.prettierrc');
        expect(testTree.files).not.toContain('/.vscode/launch.json');
      });

      it('does not update jasmine packages in package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain('"jasmine-core": "~3.5.0"');
      });

      it('does not delete karma config file', () => {
        expect(testTree.files).toContain('/src/karma.conf.js');
      });

      it('does not switch to jest builder in angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('@angular-devkit/build-angular:dev-server');
      });

      it('does not add cypress packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('concurrently');
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('cypress');
      });

      it('does not add cypress files', () => {
        expect(testTree.files).not.toContain('/cypress/fixtures/example.json');
        expect(testTree.files).not.toContain('/cypress/integration/spec.ts');
        expect(testTree.files).not.toContain('/cypress/plugins/index.js');
        expect(testTree.files).not.toContain('/cypress/support/commands.ts');
        expect(testTree.files).not.toContain('/cypress/support/index.ts');
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
});

function createAngularJsonForFirstRun(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "projects": {
        "froko-app": {
          "architect": {
            "test": {
              "builder": "@angular-devkit/build-angular:dev-server"
            },
            "lint": {
              "builder": "@angular-devkit/build-angular:tslint",
              "options": {
                "tsConfig": [
                  "tsconfig.app.json",
                  "tsconfig.spec.json",
                  "e2e/tsconfig.json"
                ]
              }
            },
            "e2e": {
              "builder": "@angular-devkit/build-angular:protractor"
            }
          }
        }
      },
      "defaultProject": "froko-app"
    }`
  );

  return tree;
}

function createAngularJsonForSubsequentRun(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "projects": {
        "froko-app": {
          "architect": {
            "test": {
              "builder": "@angular-devkit/build-angular:dev-server"
            },
            "lint": {
              "builder": "@angular-devkit/build-angular:tslint",
              "options": {
                "tsConfig": [
                  "tsconfig.app.json",
                  "tsconfig.spec.json"
                ]
              }
            }
          }
        }
      },
      "defaultProject": "froko-app",
      "schematics": {
        "@froko/ng-essentials": {
          "jest": true,
          "cypress": true
        }
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

function createDevelopmentEnvironmentFile(tree: Tree): Tree {
  tree.create(
    './src/environments/environment.ts',
    `
      export const environment = {
        production: false
      };
    `
  );

  return tree;
}

function createProductionEnvironmentFile(tree: Tree): Tree {
  tree.create(
    './src/environments/environment.prod.ts',
    `
      export const environment = {
        production: true
      };
    `
  );

  return tree;
}

function createKarmaConfig(tree: Tree): Tree {
  tree.create('src/karma.conf.js', 'module.exports = function(confg) {};');

  return tree;
}

function createTestTypescriptFile(tree: Tree): Tree {
  tree.create('src/test.ts', "import { getTestBed } from '@angular/core/testing';");

  return tree;
}

function createEndToEndTestingFiles(tree: Tree): Tree {
  tree.create('/e2e/src/app.e2e-spec.ts', '');
  tree.create('/e2e/src/app.po.ts', '');
  tree.create('/e2e/protractor.conf.js', '');
  tree.create('/e2e/tsconfig.json', '');

  return tree;
}
