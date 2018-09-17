import {
  apply,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export const NG_ESSENTIALS = '@froko/ng-essentials';
export const PACKAGE_JSON = 'package.json';
export const ANGULAR_JSON = 'angular.json';

const TSLINT_JSON = 'tslint.json';
const TSCONFIGAPP_JSON = './src/tsconfig.app.json';
const TSCONFIGSPEC_JSON = './src/tsconfig.spec.json';

export function removeAutomaticUpdateSymbols(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    for (const index in packageJson.dependencies) {
      packageJson.dependencies[index] = packageJson.dependencies[index].replace('^', '');
      packageJson.dependencies[index] = packageJson.dependencies[index].replace('~', '');
      packageJson.dependencies[index] = packageJson.dependencies[index].replace('>=', '');
    }

    for (const index in packageJson.devDependencies) {
      packageJson.devDependencies[index] = packageJson.devDependencies[index].replace('^', '');
      packageJson.devDependencies[index] = packageJson.devDependencies[index].replace('~', '');
      packageJson.devDependencies[index] = packageJson.devDependencies[index].replace('>=', '');
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function removePackageFromPackageJson(type: string, pkg: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson[type]) {
      return host;
    }

    delete packageJson[type][pkg];

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function addPackageToPackageJson(type: string, pkg: string, version: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson[type]) {
      packageJson[type] = {};
    }

    if (!packageJson[type][pkg]) {
      packageJson[type][pkg] = version;
    }

    if (!packageJson[type][pkg][version]) {
      packageJson[type][pkg] = version;
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function updatePackageInPackageJson(type: string, pkg: string, version: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson[type]) {
      packageJson[type] = {};
    }

    if (packageJson[type][pkg]) {
      packageJson[type][pkg] = version;
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function removeScriptFromPackageJson(key: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson['scripts']) {
      packageJson['scripts'] = {};
    }

    if (packageJson['scripts'][key]) {
      delete packageJson['scripts'][key];
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function addScriptToPackageJson(key: string, command: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson['scripts']) {
      packageJson['scripts'] = {};
    }

    packageJson['scripts'] = {
      ...Object.keys(packageJson['scripts'])
        .filter(existingKey => existingKey !== key)
        .reduce((obj, key) => {
          obj[key] = packageJson['scripts'][key];
          return obj;
        }, {}),
      [key]: command
    };

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function addNodeToPackageJson(key: string, item: any): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(PACKAGE_JSON)) {
      return host;
    }

    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    packageJson[key] = item;

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function editTsLintConfigJson(): Rule {
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
      ['no-implicit-dependencies']: [true, 'dev'],
      ['no-submodule-imports']: false
    };

    host.overwrite(TSLINT_JSON, JSON.stringify(tslintJson, null, 2));

    return host;
  };
}

export function addDefaultSchematicsToAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    angularJson['cli']['defaultCollection'] = NG_ESSENTIALS;

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

export function removeEndToEndTestNodeFromAngularJson(): Rule {
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

export function switchToJestBuilderInAngularJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);
    const defaultProject = angularJson['defaultProject'];

    if (angularJson['projects'][defaultProject]['targets']['test']['builder']) {
      angularJson['projects'][defaultProject]['targets']['test']['builder'] = '@angular-builders/jest:run';
    }

    if (angularJson['projects'][defaultProject]['targets']['test']['options']) {
      angularJson['projects'][defaultProject]['targets']['test']['options'] = {};
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

export function editTsConfigAppJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(TSCONFIGAPP_JSON)) {
      return host;
    }

    const sourceText = host.read(TSCONFIGAPP_JSON).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson['exclude']) {
      tsconfigJson['exclude'] = [];
    }

    tsconfigJson['exclude'] = ['**/*.spec.ts'];

    host.overwrite(TSCONFIGAPP_JSON, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}

export function editTsConfigSpecJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(TSCONFIGSPEC_JSON)) {
      return host;
    }

    const sourceText = host.read(TSCONFIGSPEC_JSON).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (tsconfigJson['files']) {
      delete tsconfigJson['files'];
    }

    if (!tsconfigJson['compilerOptions']['types']) {
      tsconfigJson['compilerOptions']['types'] = [];
    }

    tsconfigJson['compilerOptions']['types'] = ['jest', 'node'];

    if (!tsconfigJson['compilerOptions']['module']) {
      tsconfigJson['compilerOptions']['module'] = '';
    }

    tsconfigJson['compilerOptions']['module'] = 'commonjs';

    host.overwrite(TSCONFIGSPEC_JSON, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}

export function deleteFile(file: string) {
  return (host: Tree, _: SchematicContext) => {
    host.delete(file);

    return host;
  };
}

export function copyConfigFiles(path: string): Rule {
  return mergeWith(
    apply(url(path), [
      template({
        utils: strings,
        dot: '.',
        tmpl: ''
      })
    ]),
    MergeStrategy.Overwrite
  );
}

export function runNpmPackageInstall() {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return host;
  };
}
