import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { createAppModule } from '@schematics/angular/utility/test/create-app-module';

import * as path from 'path';

import { ANGULAR_JSON, PACKAGE_JSON, TSLINT_JSON } from '../constants';
import { essentials, jest, cypress, testcafe, karma, wallaby } from '../versions';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-essentials', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createPackageJson(new UnitTestTree(appTree));
    appTree = createAppModule(new UnitTestTree(appTree));
    appTree = createGlobalTsLintJson(new UnitTestTree(appTree));
    appTree = createDevelopmentEnvironmentFile(new UnitTestTree(appTree));
    appTree = createProductionEnvironmentFile(new UnitTestTree(appTree));
    appTree = createKarmaConfig(new UnitTestTree(appTree));
    appTree = createTestTypescriptFile(new UnitTestTree(appTree));
    appTree = createTsConfigAppInSrcDirectory(new UnitTestTree(appTree));
    appTree = createTsConfigSpecInSrcDirectory(new UnitTestTree(appTree));
    appTree = createEndToEndTestingFiles(new UnitTestTree(appTree));
  });

  describe('when running for the first time', () => {
    beforeEach(() => {
      appTree = createAngularJsonForFirstRun(new UnitTestTree(appTree));
    });

    describe('without options', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', {}, appTree);
      });

      it('adds default collection to angular.json', () => {
        expect(tree.readContent(ANGULAR_JSON)).toContain('"defaultCollection": "@froko/ng-essentials"');
      });

      it('adds ng-essentials options to angular.json', () => {
        expect(tree.readContent(ANGULAR_JSON)).toContain('"jest": false');
        expect(tree.readContent(ANGULAR_JSON)).toContain('"cypress": false');
        expect(tree.readContent(ANGULAR_JSON)).toContain('"testcafe": false');
      });

      it('removes e2e test node from angular.json', () => {
        expect(tree.readContent(ANGULAR_JSON)).not.toContain('froko-app-e2e');
      });

      it('removes protractor packages from angular.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('protractor');
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('@types/jasminewd2');
      });

      it('removes e2e script from package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('e2e');
      });

      it('removes automatic update symbols from package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('^');
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('~');
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('>=');
      });

      it('updates angular packages in package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/animations": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/common": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/compiler": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/core": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/forms": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/http": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/platform-browser": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"@angular/platform-browser-dynamic": "${essentials.angularVersion}"`
        );
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/router": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"core-js": "${essentials.coreJsVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"tslib": "${essentials.tslibVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"rxjs": "${essentials.rxjsVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"zone.js": "${essentials.zoneVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"@angular-devkit/build-angular": "${essentials.buildAngularVersion}"`
        );
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/cli": "${essentials.cliVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/compiler-cli": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular/language-service": "${essentials.angularVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@types/node": "${essentials.nodeVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"codelyzer": "${essentials.codelizerVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"ts-node": "${essentials.tsNodeVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"tslint": "${essentials.tsLintVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"typescript": "${essentials.typescriptVersion}"`);
      });

      it('adds additional packages in package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"husky": "${essentials.huskyVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"npm-run-all": "${essentials.npmRunAllVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"prettier": "${essentials.prettierVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"pretty-quick": "${essentials.prettyQuickVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"tslint-config-prettier": "${essentials.tsLintConfigPrettierVersion}"`
        );
      });

      it('adds additional scripts in package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain('format');
        expect(tree.readContent(PACKAGE_JSON)).toContain('format:check');
        expect(tree.readContent(PACKAGE_JSON)).toContain('format:fix');
      });

      it('adds husky config in package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain('hooks');
        expect(tree.readContent(PACKAGE_JSON)).toContain('"pre-commit": "run-s format:fix lint"');
      });

      it('updates global tslint.json', () => {
        expect(tree.readContent(TSLINT_JSON)).toContain('"tslint:latest"');
        expect(tree.readContent(TSLINT_JSON)).toContain('"tslint-config-prettier"');

        expect(tree.readContent(TSLINT_JSON)).not.toContain('eofline');
        expect(tree.readContent(TSLINT_JSON)).not.toContain('whitespace');

        expect(tree.readContent(TSLINT_JSON)).toContain('"jsdoc-format": false');
        expect(tree.readContent(TSLINT_JSON)).toContain('"no-implicit-dependencies"');
        expect(tree.readContent(TSLINT_JSON)).toContain('"no-submodule-imports": false');
      });

      it('updates development environment file', () => {
        expect(tree.readContent('src/environments/environment.ts')).toContain(
          "{ provide: 'environment', useValue: 'Development' },"
        );
        expect(tree.readContent('src/environments/environment.ts')).toContain(
          'export const ENV_PROVIDERS = providers;'
        );
      });

      it('updates production environment file', () => {
        expect(tree.readContent('src/environments/environment.prod.ts')).toContain(
          "{ provide: 'environment', useValue: 'Production' },"
        );
        expect(tree.readContent('src/environments/environment.prod.ts')).toContain(
          'export const ENV_PROVIDERS = providers;'
        );
      });

      it('adds ENV_PROVIDERS to app module', () => {
        expect(tree.readContent('src/app/app.module.ts')).toContain(
          "import { ENV_PROVIDERS } from '../environments/environment';"
        );
        expect(tree.readContent('src/app/app.module.ts')).toContain('providers: [ENV_PROVIDERS]');
      });

      it('adds launch.json with debug option for karma', () => {
        expect(tree.readContent('/.vscode/launch.json')).toContain('"url": "http://localhost:9876/debug.html"');
      });

      it('adds essentials files', () => {
        expect(tree.files).toContain('/.npmrc');
        expect(tree.files).toContain('/.prettierrc');
        expect(tree.files).toContain('/.vscode/settings.json');
      });

      it('updates jasmine packages in package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@types/jasmine": "${karma.jasmineTypeVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"jasmine-core": "${karma.jasmineCoreVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"karma": "${karma.karmaVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"karma-coverage-istanbul-reporter": "${karma.coverageReporterVersion}"`
        );
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"karma-jasmine": "${karma.karmaJasmineVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"karma-jasmine-html-reporter": "${karma.htmlReporterVersion}"`
        );
      });
    });

    describe('with jest option', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', { jest: true }, appTree);
      });

      it('removes karma config file', () => {
        expect(tree.files).not.toContain('/src/karma.conf.js');
      });

      it('removes test typescript file', () => {
        expect(tree.files).not.toContain('/src/test.ts');
      });

      it('removes jasmine and karma packages from packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('jasmine');
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('karma');
      });

      it('adds jest packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@angular-builders/jest": "${jest.jestBuilderVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"@types/jest": "${jest.jestTypeVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"babel-core": "${jest.babelCoreVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"babel-jest": "${jest.babelJestVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"jest": "${jest.jestVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"jest-preset-angular": "${jest.angularPresetVersion}"`);
      });

      it('switches to jest builder in angular.json', () => {
        expect(tree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
      });

      it('updates application typescript config file in src folder', () => {
        expect(tree.readContent('src/tsconfig.app.json')).not.toContain('test.ts');
      });

      it('updates spec typescript config file in src folder', () => {
        expect(tree.readContent('/src/tsconfig.spec.json')).not.toContain('files');
        expect(tree.readContent('/src/tsconfig.spec.json')).not.toContain('jasmine');

        expect(tree.readContent('/src/tsconfig.spec.json')).toContain('jest');
        expect(tree.readContent('/src/tsconfig.spec.json')).toContain('commonjs');
      });

      it('adds launch.json with debug option for jest', () => {
        expect(tree.readContent('/.vscode/launch.json')).toContain(
          '"program": "${workspaceFolder}/node_modules/jest/bin/jest"'
        );
      });

      it('adds jest files', () => {
        expect(tree.files).toContain('/jest.config.js');
        expect(tree.files).toContain('/src/jest.config.js');
        expect(tree.files).toContain('/src/setup-jest.ts');
      });
    });

    describe('with cypress option', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', { cypress: true }, appTree);
      });

      it('adds cypress packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"cypress": "${cypress.cypressVersion}"`);
      });

      it('adds cypress script to package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"cypress": "run-p start cypress:open"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"cypress:open": "cypress open"`);
      });

      it('adds cypress files', () => {
        expect(tree.files).toContain('/cypress/tsconfig.json');
        expect(tree.files).toContain('/cypress/fixtures/example.json');
        expect(tree.files).toContain('/cypress/integration/spec.js');
        expect(tree.files).toContain('/cypress/plugins/index.js');
        expect(tree.files).toContain('/cypress/support/commands.js');
        expect(tree.files).toContain('/cypress/support/index.js');
      });
    });

    describe('with testcafe option', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', { testcafe: true }, appTree);
      });

      it('adds testcafe packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"testcafe": "${testcafe.testcafeVersion}"`);
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"testcafe-angular-selectors": "${testcafe.angularSelectorsVersion}"`
        );
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"testcafe-live": "${testcafe.liveVersion}"`);
      });

      it('adds testcafe files', () => {
        expect(tree.files).toContain('/testcafe/index.e2e-spec.js');
      });
    });

    describe('with wallaby option', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', { wallaby: true }, appTree);
      });

      it('adds wallaby packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(
          `"angular2-template-loader": "${wallaby.angularTemplateLoader}"`
        );
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"wallaby-webpack": "${wallaby.wallabyWebpack}"`);
      });

      it('adds wallaby.js file with jasmine support', () => {
        expect(tree.files).toContain('/wallaby.js');
        expect(tree.readContent('/wallaby.js')).toContain('jasmine');
      });

      it('adds wallaby test file', () => {
        expect(tree.files).toContain('/src/wallabyTest.ts');
      });

      it('adds wallabyTest.ts in tsconfig.app', () => {
        expect(tree.readContent('src/tsconfig.app.json')).toContain('wallabyTest.ts');
      });
    });

    describe('with wallaby and jest option', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', { wallaby: true, jest: true }, appTree);
      });

      it('adds wallaby packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain(`"ngx-wallaby-jest": "${wallaby.wallabyJest}"`);
      });

      it('adds wallaby.js file with jasmine support', () => {
        expect(tree.files).toContain('/wallaby.js');
        expect(tree.readContent('/wallaby.js')).toContain('jest');
      });
    });
  });

  describe('when running for a subsequent time', () => {
    beforeEach(() => {
      appTree = createAngularJsonForSubsequentRun(new UnitTestTree(appTree));
    });

    describe('with all options', () => {
      let tree: UnitTestTree;

      beforeEach(() => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        tree = runner.runSchematic('ng-add', { jest: true, cypress: true, tesetcafe: true }, appTree);
      });

      it('does not add default collection to angular.json', () => {
        expect(tree.readContent(ANGULAR_JSON)).not.toContain('"defaultCollection": "@froko/ng-essentials"');
      });

      it('does not add essentials files', () => {
        expect(tree.files).not.toContain('/.npmrc');
        expect(tree.files).not.toContain('/.prettierrc');
        expect(tree.files).not.toContain('/.vscode/launch.json');
      });

      it('does not update jasmine packages in package.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).toContain('"jasmine-core": "~2.99.1"');
      });

      it('does not delete karma config file', () => {
        expect(tree.files).toContain('/src/karma.conf.js');
      });

      it('does not switch to jest builder in angular.json', () => {
        expect(tree.readContent(ANGULAR_JSON)).toContain('@angular-devkit/build-angular:dev-server');
      });

      it('does not add cypress packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('concurrently');
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('cypress');
      });

      it('does not add cypress files', () => {
        expect(tree.files).not.toContain('/cypress/fixtures/example.json');
        expect(tree.files).not.toContain('/cypress/integration/spec.js');
        expect(tree.files).not.toContain('/cypress/plugins/index.js');
        expect(tree.files).not.toContain('/cypress/support/commands.js');
        expect(tree.files).not.toContain('/cypress/support/index.js');
      });

      it('does not add testcafe packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('testcafe');
      });

      it('does not add testcafe files', () => {
        expect(tree.files).not.toContain('/testcafe/index.e2e-spec.js');
      });

      it('does not add wallaby packages to packages.json', () => {
        expect(tree.readContent(PACKAGE_JSON)).not.toContain('wallaby');
      });

      it('does not add wallaby files', () => {
        expect(tree.files).not.toContain('/wallaby.js');
        expect(tree.files).not.toContain('/src/wallabyTest.ts');
      });
    });
  });
});

function createAngularJsonForFirstRun(tree: UnitTestTree): UnitTestTree {
  tree.create(
    ANGULAR_JSON,
    `{
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
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

function createAngularJsonForSubsequentRun(tree: UnitTestTree): UnitTestTree {
  tree.create(
    ANGULAR_JSON,
    `{
      "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
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

function createGlobalTsLintJson(tree: UnitTestTree): UnitTestTree {
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

function createDevelopmentEnvironmentFile(tree: UnitTestTree): UnitTestTree {
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

function createProductionEnvironmentFile(tree: UnitTestTree): UnitTestTree {
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

function createKarmaConfig(tree: UnitTestTree): UnitTestTree {
  tree.create('src/karma.conf.js', 'module.exports = function(confg) {};');

  return tree;
}

function createTestTypescriptFile(tree: UnitTestTree): UnitTestTree {
  tree.create('src/test.ts', "import { getTestBed } from '@angular/core/testing';");

  return tree;
}

function createTsConfigAppInSrcDirectory(tree: UnitTestTree): UnitTestTree {
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

function createTsConfigSpecInSrcDirectory(tree: UnitTestTree): UnitTestTree {
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

function createEndToEndTestingFiles(tree: UnitTestTree): UnitTestTree {
  tree.create('/e2e/src/app.e2e-spec.ts', '');
  tree.create('/e2e/src/app.po.ts', '');
  tree.create('/e2e/protractor.conf.js', '');
  tree.create('/e2e/tsconfig.e2e.json', '');

  return tree;
}
