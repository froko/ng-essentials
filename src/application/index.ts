import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, noop, Rule, Tree } from '@angular-devkit/schematics';

import { prepareJest } from '../ng-essentials/jest';
import {
  addEnvProvidersToAppModule,
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

      return chain([
        prepareEnvironments(applicationSourcePath),
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

function removeEndToEndTestingAssets(applicationName: string, applicationPath: string): Rule {
  return chain([removeEndToEndTestFiles(applicationPath), removeArchitectNodeFromAngularJson(applicationName, 'e2e')]);
}
