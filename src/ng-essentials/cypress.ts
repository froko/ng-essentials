import { chain, Rule } from '@angular-devkit/schematics';

import { addPackageToPackageJson, addScriptToPackageJson, copyConfigFiles } from '../utils';
import { cypress } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addCypress(options: NgEssentialsOptions): Rule {
  if (!options.cypress || !options.firstRun) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', '@cypress/webpack-preprocessor', cypress.preprocessorVersion),
    addPackageToPackageJson('devDependencies', 'cypress', cypress.cypressVersion),
    addPackageToPackageJson('devDependencies', 'ts-loader', cypress.tsLoaderVersion),
    addScriptToPackageJson('cypress', 'run-p start cypress:open'),
    addScriptToPackageJson('cypress:open', 'cypress open'),
    copyConfigFiles('./cypress'),
  ]);
}
