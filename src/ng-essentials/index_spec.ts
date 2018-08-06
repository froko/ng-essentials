import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { createAppModule } from '@schematics/angular/utility/test/create-app-module';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-essentials', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createAppModule(new UnitTestTree(appTree));
    appTree = createDevelopmentEnvironmentFile(new UnitTestTree(appTree));
    appTree = createProductionEnvironmentFile(new UnitTestTree(appTree));
  });

  it('works', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('ng-add', {}, appTree);

    expect(tree.files).toEqual([
      '/src/app/app.module.ts',
      '/src/environments/environment.ts',
      '/src/environments/environment.prod.ts',
      '/.npmrc',
      '/.prettierrc',
      '/.vscode/launch.json'
    ]);
  });
});

function createDevelopmentEnvironmentFile(tree: UnitTestTree): UnitTestTree {
  tree.create(
    './src/environments/environment.ts',
    `
      export const environment = {
        production: false
      };
    `
  );

  return tree;
}

function createProductionEnvironmentFile(tree: UnitTestTree): UnitTestTree {
  tree.create(
    './src/environments/environment.prod.ts',
    `
      export const environment = {
        production: false
      };
    `
  );

  return tree;
}
