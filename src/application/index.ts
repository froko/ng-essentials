import { SchematicContext, Tree, chain, Rule, externalSchematic, noop } from '@angular-devkit/schematics';

import { AngularApplicationOptionsSchema } from './schema';

import { ANGULAR_JSON, NG_ESSENTIALS } from '../constants';
import { deleteFile, editTsConfigSpecJson, findDefaultProjectNameInAngularJson } from '../utils';

export default function(options: AngularApplicationOptionsSchema): Rule {
  return chain([
    externalSchematic('@schematics/angular', 'application', options),
    (tree: Tree, _context: SchematicContext) => {
      const hasJest = findJestOptionInAngularJson(tree);
      const applicationName = options.name;
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);

      return chain([
        removeEndToEndTestNodeFromAngularJson(`${options.name}`),
        removeEndToEndTestFiles(`${options.name}`),
        hasJest ? deleteFile(`${defaultProjectName}/${applicationName}/karma.conf.js`) : noop(),
        hasJest ? deleteFile(`${defaultProjectName}/${applicationName}/src/test.ts`) : noop(),
        hasJest ? editTsConfigAppJson(`${defaultProjectName}/${applicationName}`) : noop(),
        hasJest ? editTsConfigSpecJson(`${defaultProjectName}/${applicationName}`) : noop(),
        hasJest ? addJestConfigInApplicationFolder(defaultProjectName, applicationName) : noop(),
        hasJest ? switchToJestBuilderInAngularJsonForApplication(`${options.name}`) : noop(),
        hasJest ? updateJestConfig(defaultProjectName) : noop()
      ]);
    }
  ]);
}

function findJestOptionInAngularJson(host: Tree): boolean {
  if (!host.exists(ANGULAR_JSON)) {
    return false;
  }

  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);
  const defaultProject = angularJson['defaultProject'];
  const optionsFromAngularJson = angularJson['projects'][defaultProject]['schematics'][NG_ESSENTIALS];

  if (optionsFromAngularJson) {
    return optionsFromAngularJson.jest;
  }

  return false;
}

function removeEndToEndTestNodeFromAngularJson(applicationName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);
    const e2eTestProject = applicationName + '-e2e';

    if (angularJson['projects'][e2eTestProject]) {
      delete angularJson['projects'][e2eTestProject];
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function removeEndToEndTestFiles(applicationName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);
    const projectsDirectory = angularJson['newProjectRoot'];
    const e2eTestProjectName = applicationName + '-e2e';
    const e2eDirectory = `${projectsDirectory}/${e2eTestProjectName}`;

    host.delete(`${e2eDirectory}/src/app.e2e-spec.ts`);
    host.delete(`${e2eDirectory}/src/app.po.ts`);
    host.delete(`${e2eDirectory}/protractor.conf.js`);
    host.delete(`${e2eDirectory}/tsconfig.e2e.json`);

    if (host.exists(`${e2eDirectory}/src`)) {
      host.delete(`${e2eDirectory}/src`);
    }

    if (host.exists(`${e2eDirectory}`)) {
      host.delete(`${e2eDirectory}`);
    }
  };
}

function editTsConfigAppJson(path: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(`${path}/tsconfig.app.json`)) {
      return host;
    }

    const sourceText = host.read(`${path}/tsconfig.app.json`).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson['exclude']) {
      tsconfigJson['exclude'] = [];
    }

    tsconfigJson['exclude'] = ['**/*.spec.ts'];

    host.overwrite(`${path}/tsconfig.app.json`, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}

function addJestConfigInApplicationFolder(defaultProjectName: string, dasherizedApplicationName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    host.create(
      `${defaultProjectName}/${dasherizedApplicationName}/jest.config.js`,
      `module.exports = {
    preset: 'jest-preset-angular',
    setupTestFrameworkScriptFile: '<rootDir>/src/setup-jest.ts'
  };`
    );

    return host;
  };
}

function switchToJestBuilderInAngularJsonForApplication(applicationName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(ANGULAR_JSON)) {
      return host;
    }

    const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
    const angularJson = JSON.parse(sourceText);

    if (angularJson['projects'][applicationName]['architect']['test']['builder']) {
      angularJson['projects'][applicationName]['architect']['test']['builder'] = '@angular-builders/jest:run';
    }

    if (angularJson['projects'][applicationName]['architect']['test']['options']) {
      angularJson['projects'][applicationName]['architect']['test']['options'] = {};
    }

    host.overwrite(ANGULAR_JSON, JSON.stringify(angularJson, null, 2));

    return host;
  };
}

function updateJestConfig(defaultProjectName: string): Rule {
  return (host: Tree, _: SchematicContext) => {
    host.overwrite(
      './jest.config.js',
      `module.exports = {
    preset: 'jest-preset-angular',
    roots: ['src', '${defaultProjectName}'],
    setupTestFrameworkScriptFile: '<rootDir>/src/setup-jest.ts'
  };`
    );

    return host;
  };
}
