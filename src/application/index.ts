import { chain, externalSchematic, noop, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON } from '../constants';
import {
  addEnvProvidersToAppModule,
  updateDevelopmentEnvironmentFile,
  updateProductionEnvironmentFile,
} from '../ng-essentials/essentials';
import { createJestConfig, deleteTsSpecConfig, prepareTsAppOrLibConfigForJest, switchToJestBuilderInAngularJson } from '../ng-essentials/jest';
import {
  deleteFile,
  findJestOptionInAngularJson,
  findNewProjectRootInAngularJson,
  removeArchitectNodeFromAngularJson,
} from '../utils';

import { AngularApplicationOptionsSchema } from './schema';

export function essentialsApplication(options: AngularApplicationOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'application', options),
    (tree: Tree) => {
      const hasJest = findJestOptionInAngularJson(tree);
      const applicationName = options.name;
      const newProjectRoot = findNewProjectRootInAngularJson(tree);
      const applicationPath = `${newProjectRoot}/${applicationName}`;
      const applicationSourcePath = `${applicationPath}/src`;

      return chain([
        removeArchitectNodeFromAngularJson(applicationName, 'e2e'),
        removeEndToEndTsConfigNodeFromAngularJson(applicationName, applicationPath),
        removeEndToEndTestFiles(applicationPath),
        updateDevelopmentEnvironmentFile(applicationSourcePath),
        updateProductionEnvironmentFile(applicationSourcePath),
        addEnvProvidersToAppModule(applicationSourcePath),
        hasJest ? switchToJestBuilderInAngularJson(applicationName) : noop(),
        hasJest ? deleteFile(`${applicationPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${applicationPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(applicationPath, 'app') : noop(),
        hasJest ? deleteTsSpecConfig(applicationPath) : noop(),
        hasJest ? createJestConfig(applicationPath) : noop(),
      ]);
    },
  ]);
}

function removeEndToEndTsConfigNodeFromAngularJson(applicationName: string, applicationPath: string): Rule {
  return (host: Tree) => {
    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (angularJson['projects'][applicationName]['architect']['lint']['options']['tsConfig']) {
      angularJson['projects'][applicationName]['architect']['lint']['options']['tsConfig'] = [
        `${applicationPath}/tsconfig.app.json`,
        `${applicationPath}/tsconfig.spec.json`,
      ];
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function removeEndToEndTestFiles(applicationPath: string): Rule {
  return (host: Tree) => {
    host.delete(`${applicationPath}/e2e/src/app.e2e-spec.ts`);
    host.delete(`${applicationPath}/e2e/src/app.po.ts`);
    host.delete(`${applicationPath}/e2e/protractor.conf.js`);
    host.delete(`${applicationPath}/e2e/tsconfig.json`);
  };
}
