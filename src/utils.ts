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
import { NodePackageInstallTaskOptions } from '@angular-devkit/schematics/tasks/node-package/install-task';

import { PACKAGE_JSON, ANGULAR_JSON, NG_ESSENTIALS } from './constants';

export type DependencyType = 'dependencies' | 'devDependencies';

export type AppOrLibType = 'app' | 'lib';

export type TsConfigContext = 'app' | 'spec' | 'lib';

export function removeAutomaticUpdateSymbols(): Rule {
  return (host: Tree, _: SchematicContext) => {
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

export function removePackageFromPackageJson(type: DependencyType, pkg: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (packageJson[type][pkg]) {
      delete packageJson[type][pkg];
      host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
    }

    return host;
  };
}

export function addPackageToPackageJson(type: DependencyType, pkg: string, version: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

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

export function removeScriptFromPackageJson(key: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (packageJson['scripts'][key]) {
      delete packageJson['scripts'][key];
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}

export function addScriptToPackageJson(key: string, command: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

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

export function findDefaultProjectNameInAngularJson(host: Tree): string {
  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);
  const defaulProjectName = angularJson['defaultProject'];

  return defaulProjectName ? defaulProjectName : '';
}

export function findNewProjectRootInAngularJson(host: Tree): string {
  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);
  const newProjectRoot = angularJson['newProjectRoot'];

  return newProjectRoot ? newProjectRoot : 'projects';
}

export function findJestOptionInAngularJson(host: Tree): boolean {
  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);
  const optionsFromAngularJson = angularJson['schematics'][NG_ESSENTIALS];

  if (optionsFromAngularJson) {
    return optionsFromAngularJson.jest;
  }

  return false;
}

export function removeArchitectNodeFromAngularJson(applicationName: string, node: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (angularJson['projects'][applicationName]['architect'][node]) {
      delete angularJson['projects'][applicationName]['architect'][node];
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

export function tsconfigFilePath(rootPath: string, context: TsConfigContext): string {
  return `${rootPath}/tsconfig.${context}.json`;
}

export function updateJson<T = any, O = T>(filePath: string, callback: (json: T) => O): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(filePath)) {
      return host;
    }

    const fileContent = host.read(filePath).toString('utf-8');
    const json = JSON.parse(fileContent);

    host.overwrite(filePath, JSON.stringify(callback(json), null, 2));

    return host;
  };
}

export function deleteFile(file: string) {
  return (host: Tree, _: SchematicContext) => {
    if (host.exists(file)) {
      host.delete(file);
    }

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

export function installPackage(packageName: string) {
  return (host: Tree, context: SchematicContext) => {
    const options = new NodePackageInstallTaskOptions();
    options.packageName = packageName;

    context.addTask(new NodePackageInstallTask(options));
    return host;
  };
}
