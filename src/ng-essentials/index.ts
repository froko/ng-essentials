import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { addKarma } from './karma';
import { addJest } from './jest';
import { addCypress } from './cypress';
import { addTestcafe } from './testcafe';
import { addEssentials } from './essentials';

import { ANGULAR_JSON, NG_ESSENTIALS } from '../constants';
import { installPackage, runNpmPackageInstall } from '../utils';

export default function(options: NgEssentialsOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    options = readNgEssentialsOptionsFromAngularJson(tree, options);

    const rule = chain([
      addKarma(options),
      addJest(options),
      addCypress(options),
      addTestcafe(options),
      addEssentials(options),
      installPackage('@froko/ng-essentials'),
      runNpmPackageInstall()
    ]);

    return rule(tree, _context);
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
    options.testcafe = optionsFromAngularJson.testcafe;
    options.wallaby = optionsFromAngularJson.wallaby;
  }

  return options;
}
