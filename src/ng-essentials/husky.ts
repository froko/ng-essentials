import { chain, Rule, Tree } from '@angular-devkit/schematics';

import { PACKAGE_JSON } from '../constants';
import { addPackageToPackageJson, addScriptToPackageJson } from '../utils';
import { essentials } from '../versions';

import { NgEssentialsOptions } from './schema';

export function addHusky(options: NgEssentialsOptions): Rule {
  if (!options.husky) {
    return chain([]);
  }

  return chain([
    addPackageToPackageJson('devDependencies', 'husky', essentials.huskyVersion),
    addPackageToPackageJson('devDependencies', 'npm-run-all', essentials.npmRunAllVersion),
    addPackageToPackageJson('devDependencies', 'pretty-quick', essentials.prettyQuickVersion),
    addScriptToPackageJson('format:fix', 'pretty-quick --staged'),
    addHuskyConfigToPackageJson()
  ]);
}

function addHuskyConfigToPackageJson(): Rule {
  return (host: Tree) => {
    const sourceText = host.read(PACKAGE_JSON).toString('utf-8');
    const packageJson = JSON.parse(sourceText);

    if (!packageJson['husky']) {
      packageJson['husky'] = {
        hooks: {
          'pre-commit': 'run-s format:fix lint'
        }
      };
    }

    host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

    return host;
  };
}
