import { strings } from '@angular-devkit/core';
import {
  apply,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext,
  SchematicsException,
  TaskConfigurationGenerator,
  TaskExecutor,
  TaskExecutorFactory,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodePackageInstallTaskOptions } from '@angular-devkit/schematics/tasks/package-manager/install-task';

import { spawn, SpawnOptions } from 'child_process';
import decomment = require('decomment');
import { Observable } from 'rxjs';
import ts = require('typescript');

import { addProviderToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

import { ANGULAR_JSON, NG_ESSENTIALS, PACKAGE_JSON, TSCONFIG_JSON } from './constants';
import { NgEssentialsOptions } from './ng-essentials/schema';

export type DependencyType = 'dependencies' | 'devDependencies' | 'resolutions';

export type AppOrLibType = 'app' | 'lib';

export type TsConfigContext = 'app' | 'spec' | 'lib';

export function removeAutomaticUpdateSymbols(): Rule {
  return (host: Tree) => {
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
  return (host: Tree) => {
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
  return (host: Tree) => {
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

export function removeScriptFromPackageJson(key: string): Rule {
  return (host: Tree) => {
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
  return (host: Tree) => {
    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    packageJson['scripts'] = {
      ...Object.keys(packageJson['scripts'])
        .filter((existingKey) => existingKey !== key)
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

export function findElementPrefixInAngularJson(host: Tree, projectName: string): string {
  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);
  const elementPrefix = angularJson['projects'][projectName]['prefix'];

  return elementPrefix ? elementPrefix : 'app';
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
  return (host: Tree) => {
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
  return (host: Tree) => {
    if (!host.exists(filePath)) {
      return host;
    }

    const fileContent = host.read(filePath).toString('utf-8');
    const json = JSON.parse(decomment(fileContent));

    host.overwrite(filePath, JSON.stringify(callback(json), null, 2));

    return host;
  };
}

export function deleteFile(file: string): Rule {
  return (host: Tree) => {
    if (host.exists(file)) {
      host.delete(file);
    }

    return host;
  };
}

export function copyConfigFiles(path: string, options: NgEssentialsOptions = undefined): Rule {
  return mergeWith(
    apply(url(path), [
      template({
        ...options,
        utils: strings,
        dot: '.',
        tmpl: ''
      })
    ]),
    MergeStrategy.Overwrite
  );
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

export function removeEndToEndTestFiles(applicationPath: string = ''): Rule {
  if (applicationPath && !applicationPath.endsWith('/')) {
    applicationPath = applicationPath + '/';
  }

  return (host: Tree) => {
    host.delete(`${applicationPath}e2e/src/app.e2e-spec.ts`);
    host.delete(`${applicationPath}e2e/src/app.po.ts`);
    host.delete(`${applicationPath}e2e/protractor.conf.js`);
    host.delete(`${applicationPath}e2e/tsconfig.json`);
  };
}

export function runNpmPackageInstall(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return host;
  };
}

export function installPackage(packageName: string) {
  return (host: Tree, context: SchematicContext) => {
    const options = new NodePackageInstallTaskOptions();
    options.packageName = packageName;

    context.addTask(new NodePackageInstallTask());
    return host;
  };
}

let taskRegistered = false;

export function runNpmScript(scriptName: string, ...args: string[]): Rule {
  return (_host: Tree, context: SchematicContext) => {
    if (!context.engine.workflow) {
      return;
    }

    if (!taskRegistered) {
      const engineHost = (context.engine.workflow as any)._engineHost;
      engineHost.registerTaskExecutor(createRunNpmScript());

      taskRegistered = true;
    }

    (context.engine as any)._taskSchedulers.forEach((scheduler: any) => {
      if (
        scheduler._queue.peek() &&
        scheduler._queue.peek().configuration.name === 'RunNpmScript' &&
        scheduler._queue.peek().configuration.options.scriptName === scriptName
      ) {
        scheduler._queue.pop();
      }
    });

    context.addTask(new RunNpmScript(scriptName, args));
  };
}

interface NpmScriptOptions {
  scriptName: string;
  args: string[];
}

class RunNpmScript implements TaskConfigurationGenerator<NpmScriptOptions> {
  constructor(private taskName: string, private args: string[]) {}

  toConfiguration() {
    return {
      name: 'RunNpmScript',
      options: {
        scriptName: this.taskName,
        args: this.args
      }
    };
  }
}

function createRunNpmScript(): TaskExecutorFactory<NpmScriptOptions> {
  return {
    name: 'RunNpmScript',
    create: () => {
      return Promise.resolve<TaskExecutor<NpmScriptOptions>>(
        (options: NpmScriptOptions, _context: SchematicContext) => {
          const args: string[] = [];
          args.push('run');
          args.push(options.scriptName);
          args.push(...options.args);

          const outputStream = process.stdout;
          const errorStream = process.stderr;
          const spawnOptions: SpawnOptions = {
            stdio: [process.stdin, outputStream, errorStream],
            shell: true,
            cwd: process.cwd()
          };

          return new Observable((obs) => {
            spawn('npm', args, spawnOptions).on('close', (code: number) => {
              if (code === 0) {
                obs.next();
                obs.complete();
              } else {
                const message = 'npm task failed, see above.';
                obs.error(new Error(message));
              }
            });
          });
        }
      );
    }
  };
}
