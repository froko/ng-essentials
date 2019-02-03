import { Rule, chain, Tree, SchematicsException, SchematicContext } from '@angular-devkit/schematics';
import { addProviderToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

import * as ts from 'typescript';

import { NgEssentialsOptions } from './schema';

import { ANGULAR_JSON, NG_ESSENTIALS, TSLINT_JSON, PACKAGE_JSON } from '../constants';
import { essentials } from '../versions';
import {
  removePackageFromPackageJson,
  removeScriptFromPackageJson,
  removeAutomaticUpdateSymbols,
  addPackageToPackageJson,
  addScriptToPackageJson,
  copyConfigFiles
} from '../utils';

export function addEssentials(options: NgEssentialsOptions): Rule {
  if (!options.firstRun) {
    return chain([]);
  }

  return chain([
    addDefaultSchematicsToAngularJson(),
    addNgEssentialsToAngularJson(options),
    removeEndToEndTestNodeFromAngularJson(),
    removeEndToEndTestFiles(),
    removePackageFromPackageJson('devDependencies', '@types/jasminewd2'),
    removePackageFromPackageJson('devDependencies', 'protractor'),
    removeScriptFromPackageJson('e2e'),
    removeAutomaticUpdateSymbols(),
    addPackageToPackageJson('dependencies', '@angular/animations', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/common', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/compiler', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/core', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/forms', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/http', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/platform-browser', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/platform-browser-dynamic', essentials.angularVersion),
    addPackageToPackageJson('dependencies', '@angular/router', essentials.angularVersion),
    addPackageToPackageJson('dependencies', 'core-js', essentials.coreJsVersion),
    addPackageToPackageJson('dependencies', 'tslib', essentials.tslibVersion),
    addPackageToPackageJson('dependencies', 'rxjs', essentials.rxjsVersion),
    addPackageToPackageJson('dependencies', 'zone.js', essentials.zoneVersion),
    addPackageToPackageJson('devDependencies', '@angular-devkit/build-angular', essentials.buildAngularVersion),
    addPackageToPackageJson('devDependencies', '@angular/cli', essentials.cliVersion),
    addPackageToPackageJson('devDependencies', '@angular/compiler-cli', essentials.angularVersion),
    addPackageToPackageJson('devDependencies', '@angular/language-service', essentials.angularVersion),
    addPackageToPackageJson('devDependencies', '@types/node', essentials.nodeVersion),
    addPackageToPackageJson('devDependencies', 'codelyzer', essentials.codelizerVersion),
    addPackageToPackageJson('devDependencies', 'ts-node', essentials.tsNodeVersion),
    addPackageToPackageJson('devDependencies', 'tslint', essentials.tsLintVersion),
    addPackageToPackageJson('devDependencies', 'typescript', essentials.typescriptVersion),
    addPackageToPackageJson('devDependencies', 'husky', essentials.huskyVersion),
    addPackageToPackageJson('devDependencies', 'npm-run-all', essentials.npmRunAllVersion),
    addPackageToPackageJson('devDependencies', 'prettier', essentials.prettierVersion),
    addPackageToPackageJson('devDependencies', 'pretty-quick', essentials.prettyQuickVersion),
    addPackageToPackageJson('devDependencies', 'tslint-config-prettier', essentials.tsLintConfigPrettierVersion),
    addPackageToPackageJson('devDependencies', 'terser', essentials.terserVersion),
    addScriptToPackageJson('format', 'prettier --write "{src,lib}/**/*{.ts,.js,.json,.css,.scss}"'),
    addScriptToPackageJson('format:check', 'prettier --list-different "{src,lib}/**/*{.ts,.js,.json,.css,.scss}"'),
    addScriptToPackageJson('format:fix', 'pretty-quick --staged'),
    addHuskyConfigToPackageJson(),
    editTsLintConfigJson(),
    updateDevelopmentEnvironmentFile(),
    updateProductionEnvironmentFile(),
    addEnvProvidersToAppModule(),
    createLaunchJson(options),
    copyConfigFiles('./essentials')
  ]);
}

function addDefaultSchematicsToAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (!angularJson['cli']) {
      angularJson['cli'] = {};
    }

    if (!angularJson['cli']['defaultCollection']) {
      angularJson['cli']['defaultCollection'] = NG_ESSENTIALS;
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function addNgEssentialsToAngularJson(options: NgEssentialsOptions): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);
    const defaultProject = angularJson['defaultProject'];

    if (angularJson['projects'][defaultProject]['schematics'][NG_ESSENTIALS]) {
      return host;
    }

    angularJson['projects'][defaultProject]['schematics'][NG_ESSENTIALS] = {
      jest: options.jest ? options.jest.valueOf() : false,
      cypress: options.cypress ? options.cypress.valueOf() : false,
      testcafe: options.testcafe ? options.testcafe.valueOf() : false,
      wallaby: options.wallaby ? options.wallaby.valueOf() : false
    };

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function removeEndToEndTestNodeFromAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);
    const defaultProject = angularJson['defaultProject'];
    const e2eTestProject = defaultProject + '-e2e';

    if (angularJson['projects'][e2eTestProject]) {
      delete angularJson['projects'][e2eTestProject];
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function removeEndToEndTestFiles(): Rule {
  return (host: Tree, _: SchematicContext) => {
    host.delete('e2e/src/app.e2e-spec.ts');
    host.delete('e2e/src/app.po.ts');
    host.delete('e2e/protractor.conf.js');
    host.delete('e2e/tsconfig.e2e.json');

    if (host.exists('e2e/src')) {
      host.delete('e2e/src');
    }

    if (host.exists('e2e')) {
      host.delete('e2e');
    }
  };
}

function addHuskyConfigToPackageJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson['husky']) {
      packageJson['husky'] = {
        hooks: {
          'pre-commit': 'run-s format:fix lint'
        }
      };
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

function editTsLintConfigJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(TSLINT_JSON)) {
      return host;
    }

    const sourceText = host.read(TSLINT_JSON).toString('utf-8');
    const tslintJson = JSON.parse(sourceText);

    if (!tslintJson['extends']) {
      tslintJson['extends'] = [];
    }

    tslintJson['extends'] = ['tslint:latest', 'tslint-config-prettier'];

    if (!tslintJson['rules']) {
      tslintJson['rules'] = {};
    }

    const obsoloete = [
      'eofline',
      'import-spacing',
      'indent',
      'max-line-length',
      'no-trailing-whitespace',
      'one-line',
      'quotemark',
      'semicolon',
      'typedef-whitespace',
      'whitespace'
    ];

    tslintJson['rules'] = {
      ...Object.keys(tslintJson['rules'])
        .filter(key => !obsoloete.includes(key))
        .reduce((obj, key) => {
          obj[key] = tslintJson['rules'][key];
          return obj;
        }, {}),
      ['jsdoc-format']: false,
      ['no-implicit-dependencies']: false,
      ['no-submodule-imports']: false,
      ['interface-name']: [true, 'never-prefix'],
      ['ordered-imports']: true
    };

    host.overwrite(TSLINT_JSON, JSON.stringify(tslintJson, null, 2));

    return host;
  };
}

function updateDevelopmentEnvironmentFile(): Rule {
  return (host: Tree) => {
    host.overwrite(
      './src/environments/environment.ts',
      `
      const providers: any[] = [
        { provide: 'environment', useValue: 'Development' },
        { provide: 'baseUrl', useValue: 'http://localhost:3000' }
      ];

      export const ENV_PROVIDERS = providers;

      export const environment = {
        production: false
      };
    `
    );

    return host;
  };
}

function updateProductionEnvironmentFile(): Rule {
  return (host: Tree) => {
    host.overwrite(
      './src/environments/environment.prod.ts',
      `
      const providers: any[] = [
        { provide: 'environment', useValue: 'Production' },
        { provide: 'baseUrl', useValue: 'http://localhost:3000' }
      ];

      export const ENV_PROVIDERS = providers;

      export const environment = {
        production: true
      };
    `
    );

    return host;
  };
}

function addEnvProvidersToAppModule(): Rule {
  return (host: Tree) => {
    const modulePath = './src/app/app.module.ts';
    const text = host.read(modulePath);

    if (!text) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }

    const sourceText = text.toString('utf-8');
    const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
    const changes = addProviderToModule(source, modulePath, 'ENV_PROVIDERS', '../environments/environment');

    const recorder = host.beginUpdate(modulePath);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(recorder);

    return host;
  };
}

function createLaunchJson(options: NgEssentialsOptions): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!options.jest) {
      host.create(
        './.vscode/launch.json',
        `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "ng serve",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200/#",
      "webRoot": "\${workspaceFolder}"
    },
    {
      "name": "ng test",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:9876/debug.html",
      "webRoot": "\${workspaceFolder}"
    }
  ]
}`
      );
    }

    return host;
  };
}
