import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { AngularApplicationOptionsSchema } from './schema';

import {
  deleteFile,
  findNewProjectRootInAngularJson,
  findJestOptionInAngularJson,
  removeEndToEndTestNodeFromAngularJson
} from '../utils';

import {
  removeEndToEndTestFiles,
  updateDevelopmentEnvironmentFile,
  updateProductionEnvironmentFile,
  addEnvProvidersToAppModule
} from '../ng-essentials/essentials';

import {
  prepareTsAppOrLibConfigForJest,
  prepareTsSpecConfigForJest,
  switchToJestBuilderInAngularJson
} from '../ng-essentials/jest';

export default function(options: AngularApplicationOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'application', options),
    (tree: Tree, _context: SchematicContext) => {
      const hasJest = findJestOptionInAngularJson(tree);
      const applicationName = options.name;
      const newProjectRoot = findNewProjectRootInAngularJson(tree);
      const applicationPath = `${newProjectRoot}/${applicationName}`;
      const applicationSourcePath = `${applicationPath}/src`;
      const e2eTestPath = `${applicationPath}-e2e`;

      return chain([
        removeEndToEndTestNodeFromAngularJson(applicationName),
        removeEndToEndTestFiles(e2eTestPath),
        updateDevelopmentEnvironmentFile(applicationSourcePath),
        updateProductionEnvironmentFile(applicationSourcePath),
        addEnvProvidersToAppModule(applicationSourcePath),
        hasJest ? deleteFile(`${applicationPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${applicationPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(applicationPath, 'app') : noop(),
        hasJest ? prepareTsSpecConfigForJest(applicationPath) : noop(),
        hasJest ? switchToJestBuilderInAngularJson(applicationName) : noop()
      ]);
    }
  ]);
}
