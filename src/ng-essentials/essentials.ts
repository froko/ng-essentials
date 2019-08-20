import { Rule, chain, Tree, SchematicContext, SchematicsException } from '@angular-devkit/schematics';
import { addProviderToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

import * as ts from 'typescript';

import { NgEssentialsOptions } from './schema';

import { ANGULAR_JSON, NG_ESSENTIALS, TSLINT_JSON, PACKAGE_JSON, TSCONFIG_JSON } from '../constants';
import { essentials } from '../versions';
import {
  findDefaultProjectNameInAngularJson,
  findNewProjectRootInAngularJson,
  removeArchitectNodeFromAngularJson,
  removePackageFromPackageJson,
  removeScriptFromPackageJson,
  removeAutomaticUpdateSymbols,
  addPackageToPackageJson,
  addScriptToPackageJson,
  copyConfigFiles,
  deleteFile,
  updateJson
} from '../utils';

export function addEssentials(options: NgEssentialsOptions): Rule {
  if (!options.firstRun) {
    return chain([]);
  }

  return chain([
    (tree: Tree, _context: SchematicContext) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);
      const defaultProjectRoot = findNewProjectRootInAngularJson(tree);

      return chain([
        addDefaultSchematicsToAngularJson(),
        addNgEssentialsToAngularJson(options),
        removeEndToEndTsConfigNodeFromAngularJson(defaultProjectName),
        removeArchitectNodeFromAngularJson(defaultProjectName, 'e2e'),
        removeEndToEndTestFiles(),
        removePackageFromPackageJson('devDependencies', '@types/jasminewd2'),
        removePackageFromPackageJson('devDependencies', 'protractor'),
        removeScriptFromPackageJson('e2e'),
        removeAutomaticUpdateSymbols(),
        removePackageFromPackageJson('dependencies', '@angular/http'),
        addPackageToPackageJson('dependencies', '@angular/animations', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/common', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/compiler', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/core', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/forms', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/platform-browser', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/platform-browser-dynamic', essentials.angularVersion),
        addPackageToPackageJson('dependencies', '@angular/router', essentials.angularVersion),
        addPackageToPackageJson('dependencies', 'rxjs', essentials.rxjsVersion),
        addPackageToPackageJson('dependencies', 'tslib', essentials.tslibVersion),
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
        addPackageToPackageJson('devDependencies', 'tslint-eslint-rules', essentials.tsLintEsLintRulesVersion),
        addPackageToPackageJson('devDependencies', 'tslint-config-prettier', essentials.tsLintConfigPrettierVersion),
        addScriptToPackageJson(
          'format',
          `prettier --write "{src,${defaultProjectRoot}}/**/*{.ts,.js,.json,.css,.scss}"`
        ),
        addScriptToPackageJson('format:fix', 'pretty-quick --staged'),
        updateDevelopmentEnvironmentFile('src'),
        updateProductionEnvironmentFile('src'),
        addEnvProvidersToAppModule('src'),
        addHuskyConfigToPackageJson(),
        editTsLintConfigJson(),
        editTsConfigJson(),
        createLaunchJson(options),
        copyConfigFiles('./essentials')
      ]);
    }
  ]);
}

function removeEndToEndTsConfigNodeFromAngularJson(applicationName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (angularJson['projects'][applicationName]['architect']['lint']['options']['tsConfig']) {
      angularJson['projects'][applicationName]['architect']['lint']['options']['tsConfig'] = [
        'tsconfig.app.json',
        'tsconfig.spec.json'
      ];
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function removeEndToEndTestFiles(): Rule {
  return (_: Tree, __: SchematicContext) => {
    deleteFile('e2e/src/app.e2e-spec.ts');
    deleteFile('e2e/src/app.po.ts');
    deleteFile('e2e/protractor.conf.js');
    deleteFile('e2e/tsconfig.json');
  };
}

export function updateDevelopmentEnvironmentFile(sourceDirectory: string): Rule {
  return (host: Tree) => {
    host.overwrite(
      `${sourceDirectory}/environments/environment.ts`,
      `const providers: any[] = [
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

export function updateProductionEnvironmentFile(sourceDirectory: string): Rule {
  return (host: Tree) => {
    host.overwrite(
      `${sourceDirectory}/environments/environment.prod.ts`,
      `const providers: any[] = [
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

export function addEnvProvidersToAppModule(sourceDirectory: string): Rule {
  return (host: Tree) => {
    const modulePath = `${sourceDirectory}/app/app.module.ts`;
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

function addDefaultSchematicsToAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
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
    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (!angularJson['schematics']) {
      angularJson['schematics'] = {};
    }

    if (angularJson['schematics'][NG_ESSENTIALS]) {
      return host;
    }

    angularJson['schematics'][NG_ESSENTIALS] = {
      jest: options.jest ? options.jest.valueOf() : false,
      cypress: options.cypress ? options.cypress.valueOf() : false,
      testcafe: options.testcafe ? options.testcafe.valueOf() : false,
      wallaby: options.wallaby ? options.wallaby.valueOf() : false
    };

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function addHuskyConfigToPackageJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
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
    const sourceText = host.read(TSLINT_JSON).toString('utf-8');
    const tslintJson = JSON.parse(sourceText);

    tslintJson['extends'] = ['tslint:recommended', 'tslint-eslint-rules', 'tslint-config-prettier'];

    const obsolete = [
      'eofline',
      'import-spacing',
      'indent',
      'max-line-length',
      'no-use-before-declare',
      'no-trailing-whitespace',
      'one-line',
      'quotemark',
      'semicolon',
      'typedef-whitespace',
      'use-input-property-decorator',
      'use-output-property-decorator',
      'use-host-property-decorator',
      'whitespace'
    ];

    tslintJson['rules'] = {
      ...Object.keys(tslintJson['rules'])
        .filter(key => !obsolete.includes(key))
        .reduce((obj, key) => {
          obj[key] = tslintJson['rules'][key];
          return obj;
        }, {}),
      ['align']: true,
      ['no-conditional-assignment']: true,
      ['no-consecutive-blank-lines']: true,
      ['no-implicit-dependencies']: false,
      ['no-string-literal']: true,
      ['no-submodule-imports']: false,
      ['jsdoc-format']: false,
      ['one-line']: [true, 'check-open-brace'],
      ['only-arrow-functions']: [true, 'allow-named-functions'],
      ['prefer-for-of']: true,
      ['prefer-object-spread']: true,
      ['trailing-comma']: [
        false,
        {
          multiline: 'always',
          singleline: 'never'
        }
      ],
      ['variable-name']: [true, 'allow-pascal-case', 'ban-keywords', 'check-format'],
      ['ordered-imports']: [
        true,
        {
          'grouped-imports': true,
          groups: [
            {
              name: 'app',
              match: '^@app',
              order: 20
            },
            {
              name: 'shared-lib',
              match: '^@shared-lib',
              order: 20
            },
            {
              name: 'relative_paths',
              match: '^[.][.]?',
              order: 20
            },
            {
              name: 'scoped_paths',
              match: '^@',
              order: 10
            },
            {
              name: 'absolute_paths',
              match: '^[a-zA-Z]',
              order: 10
            },
            {
              match: null,
              order: 10
            }
          ]
        }
      ],
      ['array-bracket-spacing']: [true, 'never'],
      ['object-curly-spacing']: [true, 'always']
    };

    host.overwrite(TSLINT_JSON, JSON.stringify(tslintJson, null, 2));

    return host;
  };
}

function editTsConfigJson(): Rule {
  return updateJson(TSCONFIG_JSON, json => {
    const compilerOptions = json['compilerOptions'];

    return {
      ...json,
      compilerOptions: {
        ...compilerOptions,
        paths: {}
      }
    };
  });
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
