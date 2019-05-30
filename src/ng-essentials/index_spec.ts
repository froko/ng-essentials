import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { createAppModule } from '@schematics/angular/utility/test/create-app-module';

import { ANGULAR_JSON, PACKAGE_JSON, TSLINT_JSON } from '../constants';
import { essentials, jest, cypress, testcafe, karma, wallaby } from '../versions';
import { runSchematic } from '../testing';

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
    appTree = createTsConfigAppInSrcDirectory(appTree);
    appTree = createTsConfigSpecInSrcDirectory(appTree);
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

      it('adds default collection to angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"defaultCollection": "@froko/ng-essentials"');
      });

      it('adds ng-essentials options to angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"jest": false');
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"cypress": false');
        expect(testTree.readContent(ANGULAR_JSON)).toContain('"testcafe": false');
      });

      it('removes e2e test node from angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).not.toContain('froko-app-e2e');
      });

      it('removes protractor packages from angular.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('protractor');
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('@types/jasminewd2');
      });

      it('removes e2e script from package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('e2e');
      });

      it('removes automatic update symbols from package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('^');
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('~');
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('>=');
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
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"core-js": "${essentials.coreJsVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"tslib": "${essentials.tslibVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"rxjs": "${essentials.rxjsVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"zone.js": "${essentials.zoneVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(
          `"@angular-devkit/build-angular": "${essentials.buildAngularVersion}"`
        );
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@angular/cli": "${essentials.cliVersion}"`);
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

      it('adds additional packages in package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"husky": "${essentials.huskyVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"npm-run-all": "${essentials.npmRunAllVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"prettier": "${essentials.prettierVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"pretty-quick": "${essentials.prettyQuickVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(
          `"tslint-config-prettier": "${essentials.tsLintConfigPrettierVersion}"`
        );
      });

      it('adds additional scripts in package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain('format');
        expect(testTree.readContent(PACKAGE_JSON)).toContain('format:check');
        expect(testTree.readContent(PACKAGE_JSON)).toContain('format:fix');
      });

      it('runs format scripts in src and configured projects path', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain('{src,projects}');
      });

      it('adds husky config in package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain('hooks');
        expect(testTree.readContent(PACKAGE_JSON)).toContain('"pre-commit": "run-s format:fix lint"');
      });

      it('updates global tslint.json', () => {
        expect(testTree.readContent(TSLINT_JSON)).toContain('"tslint:latest"');
        expect(testTree.readContent(TSLINT_JSON)).toContain('"tslint-config-prettier"');

        expect(testTree.readContent(TSLINT_JSON)).not.toContain('eofline');
        expect(testTree.readContent(TSLINT_JSON)).not.toContain('whitespace');

        expect(testTree.readContent(TSLINT_JSON)).toContain('"jsdoc-format": false');
        expect(testTree.readContent(TSLINT_JSON)).toContain('"no-implicit-dependencies"');
        expect(testTree.readContent(TSLINT_JSON)).toContain('"no-submodule-imports": false');
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

      it('updates jasmine packages in package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"@types/jasmine": "${karma.jasmineTypeVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jasmine-core": "${karma.jasmineCoreVersion}"`);
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
        expect(testTree.files).not.toContain('/src/karma.conf.js');
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
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"babel-core": "${jest.babelCoreVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"babel-jest": "${jest.babelJestVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jest": "${jest.jestVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"jest-preset-angular": "${jest.angularPresetVersion}"`);
      });

      it('switches to jest builder in angular.json', () => {
        expect(testTree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
      });

      it('updates application typescript config file in src folder', () => {
        expect(testTree.readContent('src/tsconfig.app.json')).not.toContain('test.ts');
      });

      it('updates spec typescript config file in src folder', () => {
        expect(testTree.readContent('/src/tsconfig.spec.json')).not.toContain('files');
        expect(testTree.readContent('/src/tsconfig.spec.json')).not.toContain('jasmine');

        expect(testTree.readContent('/src/tsconfig.spec.json')).toContain('jest');
        expect(testTree.readContent('/src/tsconfig.spec.json')).toContain('commonjs');
      });

      it('adds launch.json with debug option for jest', () => {
        expect(testTree.readContent('/.vscode/launch.json')).toContain(
          '"program": "${workspaceFolder}/node_modules/@angular/cli/bin/ng"'
        );
      });

      it('adds jest setup file', () => {
        expect(testTree.files).toContain('/src/setup-jest.ts');
      });

      it('adds jest config to package.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain('<rootDir>/src/setup-jest.ts');
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

    describe('with testcafe option', () => {
      let testTree: UnitTestTree;

      beforeEach(async () => {
        testTree = await runSchematic('ng-add', { testcafe: true }, appTree);
      });

      it('adds testcafe packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"testcafe": "${testcafe.testcafeVersion}"`);
        expect(testTree.readContent(PACKAGE_JSON)).toContain(
          `"testcafe-angular-selectors": "${testcafe.angularSelectorsVersion}"`
        );
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"testcafe-live": "${testcafe.liveVersion}"`);
      });

      it('adds testcafe files', () => {
        expect(testTree.files).toContain('/testcafe/index.e2e-spec.js');
      });
    });

    describe('with wallaby option', () => {
      let testTree: UnitTestTree;

      beforeEach(async () => {
        testTree = await runSchematic('ng-add', { wallaby: true }, appTree);
      });

      it('adds wallaby packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain(
          `"angular2-template-loader": "${wallaby.angularTemplateLoader}"`
        );
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"wallaby-webpack": "${wallaby.wallabyWebpack}"`);
      });

      it('adds wallaby.js file with jasmine support', () => {
        expect(testTree.files).toContain('/wallaby.js');
        expect(testTree.readContent('/wallaby.js')).toContain('jasmine');
      });

      it('adds wallaby test file', () => {
        expect(testTree.files).toContain('/src/wallabyTest.ts');
      });

      it('adds wallabyTest.ts in tsconfig.app', () => {
        expect(testTree.readContent('src/tsconfig.app.json')).toContain('wallabyTest.ts');
      });
    });

    describe('with wallaby and jest option', () => {
      let testTree: UnitTestTree;

      beforeEach(async () => {
        testTree = await runSchematic('ng-add', { wallaby: true, jest: true }, appTree);
      });

      it('adds wallaby packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).toContain(`"ngx-wallaby-jest": "${wallaby.wallabyJest}"`);
      });

      it('adds wallaby.js file with jasmine support', () => {
        expect(testTree.files).toContain('/wallaby.js');
        expect(testTree.readContent('/wallaby.js')).toContain('jest');
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
        testTree = await runSchematic('ng-add', { jest: true, cypress: true, tesetcafe: true }, appTree);
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
        expect(testTree.readContent(PACKAGE_JSON)).toContain('"jasmine-core": "~2.99.1"');
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

      it('does not add testcafe packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('testcafe');
      });

      it('does not add testcafe files', () => {
        expect(testTree.files).not.toContain('/testcafe/index.e2e-spec.js');
      });

      it('does not add wallaby packages to packages.json', () => {
        expect(testTree.readContent(PACKAGE_JSON)).not.toContain('wallaby');
      });

      it('does not add wallaby files', () => {
        expect(testTree.files).not.toContain('/wallaby.js');
        expect(testTree.files).not.toContain('/src/wallabyTest.ts');
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
          "schematics": {},
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

function createAngularJsonForSubsequentRun(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
      "version": 1,
      "projects": {
        "froko-app": {
          "schematics": {
            "@froko/ng-essentials": {
              "jest": true,
              "cypress": true,
              "testcafe": true,
              "wallaby": true
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
        "zone.js": "~0.8.26"
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

function createTsConfigAppInSrcDirectory(tree: Tree): Tree {
  tree.create(
    'src/tsconfig.app.json',
    `{
      "extends": "../tsconfig.json",
      "compilerOptions": {
        "outDir": "../out-tsc/app",
        "types": []
      },
      "exclude": [
        "test.ts",
        "**/*.spec.ts"
      ]
    }`
  );

  return tree;
}

function createTsConfigSpecInSrcDirectory(tree: Tree): Tree {
  tree.create(
    '/src/tsconfig.spec.json',
    `{
      "extends": "../tsconfig.json",
      "compilerOptions": {
        "outDir": "../out-tsc/spec",
        "types": [
          "jasmine",
          "node"
        ]
      },
      "files": [
        "test.ts",
        "polyfills.ts"
      ],
      "include": [
        "**/*.spec.ts",
        "**/*.d.ts"
      ]
    }`
  );

  return tree;
}

function createEndToEndTestingFiles(tree: Tree): Tree {
  tree.create('/e2e/src/app.e2e-spec.ts', '');
  tree.create('/e2e/src/app.po.ts', '');
  tree.create('/e2e/protractor.conf.js', '');
  tree.create('/e2e/tsconfig.e2e.json', '');

  return tree;
}
