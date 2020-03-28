import { chain, externalSchematic, noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON } from '../constants';
import {
  addEnvProvidersToAppModule,
  updateDevelopmentEnvironmentFile,
  updateProductionEnvironmentFile,
} from '../ng-essentials/essentials';
import { prepareTsAppOrLibConfigForJest, prepareTsSpecConfigForJest } from '../ng-essentials/jest';
import {
  deleteFile,
  findJestOptionInAngularJson,
  findNewProjectRootInAngularJson,
  removeArchitectNodeFromAngularJson,
  removePackageFromPackageJson,
} from '../utils';

import { AngularApplicationOptionsSchema } from './schema';

export function essentialsApplication(options: AngularApplicationOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'application', options),
    (tree: Tree, _context: SchematicContext) => {
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
        removePackageFromPackageJson('devDependencies', 'tslib'),
        hasJest ? removeArchitectNodeFromAngularJson(applicationName, 'test') : noop(),
        hasJest ? deleteFile(`${applicationPath}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${applicationPath}/src/test.ts`) : noop(),
        hasJest ? prepareTsAppOrLibConfigForJest(applicationPath, 'app') : noop(),
        hasJest ? prepareTsSpecConfigForJest(applicationPath) : noop(),
      ]);
    },
  ]);
}

function removeEndToEndTsConfigNodeFromAngularJson(applicationName: string, applicationPath: string): Rule {
  return (host: Tree, _: SchematicContext) => {
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
  return (host: Tree, __: SchematicContext) => {
    host.delete(`${applicationPath}/e2e/src/app.e2e-spec.ts`);
    host.delete(`${applicationPath}/e2e/src/app.po.ts`);
    host.delete(`${applicationPath}/e2e/protractor.conf.js`);
    host.delete(`${applicationPath}/e2e/tsconfig.json`);
  };
}
