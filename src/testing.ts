import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

import { ANGULAR_JSON, PACKAGE_JSON } from './constants';

const testRunner = new SchematicTestRunner('@froko/ng-essentials', require.resolve('./collection.json'));

export function runSchematic(schematicName: string, options: any, tree: Tree) {
  return testRunner.runSchematicAsync(schematicName, options, tree).toPromise();
}

export function createPackageJson(tree: Tree): Tree {
  tree.create(
    PACKAGE_JSON,
    `{
      "scripts": {
        "ng": "ng",
        "start": "ng serve",
        "build": "ng build",
        "test": "ng test",
        "lint": "ng lint",
        "e2e": "ng e2e"
      },
      "private": true,
      "dependencies": {
        "@angular/animations": "~10.0.3",
        "@angular/common": "~10.0.3",
        "@angular/compiler": "~10.0.3",
        "@angular/core": "~10.0.3",
        "@angular/forms": "~10.0.3",
        "@angular/platform-browser": "~10.0.3",
        "@angular/platform-browser-dynamic": "~10.0.3",
        "@angular/router": "~10.0.3",
        "rxjs": "~6.5.5",
        "tslib": "^2.0.0",
        "zone.js": "~0.10.3"
      },
      "devDependencies": {
        "@angular-devkit/build-angular": "~0.1000.2",
        "@angular/cli": "~10.0.2",
        "@angular/compiler-cli": "~10.0.3",
        "@types/node": "^12.11.1",
        "@types/jasmine": "~3.5.0",
        "@types/jasminewd2": "~2.0.3",
        "codelyzer": "^6.0.0",
        "jasmine-core": "~3.5.0",
        "jasmine-spec-reporter": "~5.0.0",
        "karma": "~5.0.0",
        "karma-chrome-launcher": "~3.1.0",
        "karma-coverage-istanbul-reporter": "~3.0.2",
        "karma-jasmine": "~3.3.0",
        "karma-jasmine-html-reporter": "^1.5.0",
        "protractor": "~7.0.0",
        "ts-node": "~8.3.0",
        "tslint": "~6.1.0",
        "typescript": "~3.9.5"
      }
    }`
  );

  return tree;
}

export function createTsConfig(tree: Tree): Tree {
  tree.create(
    'tsconfig.json',
    `{
      "files": [],
      "references": [
        {
          "path": "./tsconfig.app.json"
        },
        {
          "path": "./tsconfig.spec.json"
        },
        {
          "path": "./e2e/tsconfig.json"
        }
    ]
    }`
  );

  return tree;
}

export function createTsConfigBase(tree: Tree): Tree {
  tree.create(
    'tsconfig.base.json',
    `{
      "compileOnSave": false,
      "compilerOptions": {
        "baseUrl": "./",
        "outDir": "./dist/out-tsc",
        "sourceMap": true,
        "declaration": false,
        "downlevelIteration": true,
        "experimentalDecorators": true,
        "moduleResolution": "node",
        "importHelpers": true,
        "target": "es2015",
        "module": "es2020",
        "lib": [
          "es2018",
          "dom"
        ]
      }
    }`
  );

  return tree;
}

export function createTsConfigApp(tree: Tree): Tree {
  tree.create(
    'tsconfig.app.json',
    `{
      "extends": "./tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./out-tsc/app",
        "types": []
      },
      "files": [
        "src/main.ts",
        "src/polyfills.ts"
      ],
      "include": [
        "src/**/*.d.ts"
      ]
    }`
  );

  return tree;
}

export function createTsConfigSpec(tree: Tree): Tree {
  tree.create(
    'tsconfig.spec.json',
    `{
      "extends": "./tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./out-tsc/spec",
        "types": [
          "jasmine"
        ]
      },
      "files": [
        "src/test.ts",
        "src/polyfills.ts"
      ],
      "include": [
        "src/**/*.spec.ts",
        "src/**/*.d.ts"
      ]
    }`
  );

  return tree;
}

export function createAngularJsonWithoutJestOption(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "version": 1,
        "newProjectRoot": "libs",
        "projects": {
          "froko-app": {}
        },
        "defaultProject": "froko-app",
        "schematics": {
          "@froko/ng-essentials": {
            "jest": false
          }
        }
    }`
  );

  return tree;
}

export function createAngularJsonWithJestOption(tree: Tree): Tree {
  tree.create(
    ANGULAR_JSON,
    `{
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        "version": 1,
        "newProjectRoot": "libs",
        "projects": {
          "froko-app": {}
        },
        "defaultProject": "froko-app",
        "schematics": {
          "@froko/ng-essentials": {
            "jest": true
          }
        }
      }`
  );

  return tree;
}
