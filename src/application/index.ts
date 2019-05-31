import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { AngularApplicationOptionsSchema } from './schema';

import { ANGULAR_JSON } from '../constants';

import {
  deleteFile,
  findNewProjectRootInAngularJson,
  findJestOptionInAngularJson,
  removeEndToEndTestNodeFromAngularJson,
  removePackageFromPackageJson
} from '../utils';

import {
  updateDevelopmentEnvironmentFile,
  updateProductionEnvironmentFile,
  addEnvProvidersToAppModule
} from '../ng-essentials/essentials';

import {
  prepareTsAppOrLibConfigForJest,
  prepareTsSpecConfigForJest,
  switchToJestBuilderInAngularJson,
  copyJestConfig
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

      return chain([
        removeEndToEndTestNodeFromAngularJson(applicationName),
        removeEndToEndTsConfigNodeFromAngularJson(applicationName, applicationPath),
        updateDevelopmentEnvironmentFile(applicationSourcePath),
        updateProductionEnvironmentFile(applicationSourcePath),
        addEnvProvidersToAppModule(applicationSourcePath),
        removePackageFromPackageJson('devDependencies', 'tslib'),
        hasJest ? deleteFile(`${applicationPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${applicationPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(applicationPath, 'app') : noop(),
        hasJest ? prepareTsSpecConfigForJest(applicationPath) : noop(),
        hasJest ? switchToJestBuilderInAngularJson(applicationName) : noop(),
        hasJest ? copyJestConfig(applicationPath) : noop()
      ]);
    }
  ]);
}

function removeEndToEndTsConfigNodeFromAngularJson(applicationName: string, applicationPath: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (angularJson['projects'][applicationName]['architect']['lint']['options']['tsConfig']) {
      angularJson['projects'][applicationName]['architect']['lint']['options']['tsConfig'] = [
        `${applicationPath}/tsconfig.app.json`,
        `${applicationPath}/tsconfig.spec.json`
      ];
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}
