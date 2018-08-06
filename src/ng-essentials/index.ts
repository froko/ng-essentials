import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { addKarma } from './karma';
import { addJest } from './jest';
import { addCypress } from './cypress';
import { addTestcafe } from './testcafe';
import { addEssentials } from './essentials';
import { runNpmPackageInstall } from './utils';

export default function(options: NgEssentialsOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const rule = chain([
      addKarma(options),
      addJest(options),
      addCypress(options),
      addTestcafe(options),
      addEssentials(),
      runNpmPackageInstall()
    ]);

    return rule(tree, _context);
  };
}
