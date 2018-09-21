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

import { PACKAGE_JSON } from './constants';

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

export function editTsConfigLibJson(path: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(`${path}/tsconfig.lib.json`)) {
      return host;
    }

    const sourceText = host.read(`${path}/tsconfig.lib.json`).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson['exclude']) {
      tsconfigJson['exclude'] = [];
    }

    tsconfigJson['exclude'] = ['**/*.spec.ts'];

    host.overwrite(`${path}/tsconfig.lib.json`, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}

export function editTsConfigSpecJson(path: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(`${path}/tsconfig.spec.json`)) {
      return host;
    }

    const sourceText = host.read(`${path}/tsconfig.spec.json`).toString('utf-8');
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

    host.overwrite(`${path}/tsconfig.spec.json`, JSON.stringify(tsconfigJson, null, 2));

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
