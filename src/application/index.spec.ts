import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { ANGULAR_JSON } from '../constants';
import {
  createAngularJsonWithJestOption,
  createAngularJsonWithoutJestOption,
  createPackageJson,
  createTsConfig,
  runSchematic
} from '../testing';

describe('application', () => {
  const appName = 'myApp';
  const dasherizedAppName = dasherize(appName);

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createPackageJson(appTree);
    appTree = createTsConfig(appTree);
  });

  describe('when creating a new application', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      appTree = createAngularJsonWithoutJestOption(appTree);
      testTree = await runSchematic('application', { name: appName }, appTree);
    });

    it('adds files from the original @angular/schematics command', () => {
      expect(testTree.files).toContain(`/libs/${dasherizedAppName}/karma.conf.js`);
      expect(testTree.files).toContain(`/libs/${dasherizedAppName}/tsconfig.app.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedAppName}/tsconfig.spec.json`);
      expect(testTree.files).toContain(`/libs/${dasherizedAppName}/src/test.ts`);
    });

    it('removes e2e files from the original @angular/schematics command', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/e2e/tsconfig.json`);
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/e2e/protractor.conf.js`);
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/e2e/src/app.e2e-spec.ts`);
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/e2e/src/app.po.ts`);
    });

    it('switches from tsLint to esLint', () => {
      expect(testTree.files).toContain(`/libs/${dasherizedAppName}/.eslintrc.json`);
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/tslint.json`);
    });
  });

  describe('when creating a new application with jest option', () => {
    let testTree: UnitTestTree;

    beforeEach(async () => {
      appTree = createAngularJsonWithJestOption(appTree);
      testTree = await runSchematic('application', { name: appName }, appTree);
    });

    it('removes karma config of application', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/karma.conf.js`);
    });

    it('removes test typescript file of application', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/src/test.ts`);
    });

    it('removes spec typescript config file in library folder', () => {
      expect(testTree.files).not.toContain(`/libs/${dasherizedAppName}/tsconfig.spec.json`);
    });

    it('patches TsLint config in angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain(`"libs/${dasherizedAppName}/tsconfig.app.json"`);
      expect(testTree.readContent(ANGULAR_JSON)).toContain('"tsconfig.spec.json"');
    });

    it('switches to jest builder in angular.json', () => {
      expect(testTree.readContent(ANGULAR_JSON)).toContain('@angular-builders/jest:run');
    });

    it('updates application typescript config file in src folder', () => {
      expect(testTree.readContent(`/libs/${dasherizedAppName}/tsconfig.app.json`)).not.toContain('test.ts');
    });

    it('adds jest config file', () => {
      expect(testTree.files).toContain(`/libs/${dasherizedAppName}/jest.config.js`);
    });
  });
});
