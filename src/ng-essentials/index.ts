import { chain, Rule, Tree } from '@angular-devkit/schematics';

import { ANGULAR_JSON, NG_ESSENTIALS } from '../constants';
import { installPackage, runNpmPackageInstall, runNpmScript } from '../utils';

import { addCypress } from './cypress';
import { addEssentials } from './essentials';
import { addHusky } from './husky';
import { addJest } from './jest';
import { addKarma } from './karma';
import { NgEssentialsOptions } from './schema';

export function essentials(options: NgEssentialsOptions): Rule {
  return (tree: Tree) => {
    options = readNgEssentialsOptionsFromAngularJson(tree, options);

    return chain([
      addKarma(options),
      addJest(options),
      addCypress(options),
      addEssentials(options),
      addHusky(options),
      // The following rules are being executed in reverse order (latest first)
      runNpmScript('lint', '--', '--fix'),
      runNpmScript('format'),
      installPackage('@froko/ng-essentials'),
      runNpmPackageInstall(),
    ]);
  };
}

function readNgEssentialsOptionsFromAngularJson(host: Tree, options: NgEssentialsOptions): NgEssentialsOptions {
  options.firstRun = true;

  const sourceText = host.read(ANGULAR_JSON).toString('utf-8');
  const angularJson = JSON.parse(sourceText);

  if (!angularJson['schematics']) {
    return options;
  }

  const optionsFromAngularJson = angularJson['schematics'][NG_ESSENTIALS];

  if (optionsFromAngularJson) {
    options.firstRun = false;
    options.jest = optionsFromAngularJson.jest;
    options.cypress = optionsFromAngularJson.cypress;
  }

  return options;
}
