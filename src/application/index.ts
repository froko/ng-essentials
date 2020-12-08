import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, noop, Rule, Tree } from '@angular-devkit/schematics';

import { addEsLintConfig, addEsLintConfigToAngularJson } from '../ng-essentials/eslint';
import { prepareJest } from '../ng-essentials/jest';
import {
  addEnvProvidersToAppModule,
  deleteFile,
  findElementPrefixInAngularJson,
  findJestOptionInAngularJson,
  findNewProjectRootInAngularJson,
  removeArchitectNodeFromAngularJson,
  removeEndToEndTestFiles,
  runNpmScript,
  updateDevelopmentEnvironmentFile,
  updateProductionEnvironmentFile
} from '../utils';

import { AngularApplicationOptionsSchema } from './schema';

export function essentialsApplication(options: AngularApplicationOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'application', options),
    (tree: Tree) => {
      const hasJest = findJestOptionInAngularJson(tree);
      const applicationName = options.name;
      const newProjectRoot = findNewProjectRootInAngularJson(tree);
      const dasherizedApplicationName = dasherize(applicationName);
      const applicationPath = `${newProjectRoot}/${dasherizedApplicationName}`;
      const applicationSourcePath = `${applicationPath}/src`;
      const elementPrefix = findElementPrefixInAngularJson(tree, applicationName);

      return chain([
        prepareEnvironments(applicationSourcePath),
        switchToEsLint(applicationName, applicationPath, elementPrefix),
        hasJest ? prepareJest(applicationName, applicationPath, 'app') : noop(),
        removeEndToEndTestingAssets(applicationName, applicationPath),
        runNpmScript('lint', '--', '--fix'),
        runNpmScript('format')
      ]);
    }
  ]);
}

function prepareEnvironments(applicationSourcePath: string): Rule {
  return chain([
    updateDevelopmentEnvironmentFile(applicationSourcePath),
    updateProductionEnvironmentFile(applicationSourcePath),
    addEnvProvidersToAppModule(applicationSourcePath)
  ]);
}

function switchToEsLint(applicationName: string, applicationPath: string, elementPrefix: string): Rule {
  return chain([
    addEsLintConfig(applicationPath, 'app', elementPrefix),
    addEsLintConfigToAngularJson(applicationName, applicationPath),
    deleteFile(`${applicationPath}/tslint.json`)
  ]);
}

function removeEndToEndTestingAssets(applicationName: string, applicationPath: string): Rule {
  return chain([removeEndToEndTestFiles(applicationPath), removeArchitectNodeFromAngularJson(applicationName, 'e2e')]);
}
