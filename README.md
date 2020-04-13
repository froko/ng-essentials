# ng-essentials

Adds better defaults to a new Angular application generated with the Angular-CLI. _ng-essentials_ is heavily inspired by the following schematics:

- [@davinkevin/jest](https://github.com/davinkevin/jest)
- [@martin_hotell/schematics](https://github.com/Hotell/ng-cli-schematics)

It includes many of the ideas of the following blog post, also written by Martin Hochel: [Use React tools for better Angular apps](https://medium.com/@martin_hotell/use-react-tools-for-better-angular-apps-b0f14f3f8114).

### Usage

This schematic uses the `ng add` command to add it's value to a new Angular application:

```bash
ng add @froko/ng-essentials
```

The above command does the following:

- Updates all npm packages to their latest stable versions
- Installs `prettier` for advanced code formatting
- Improves TsLint rules, especially import statement ordering with different blocks
- Adds Angular debugging support for Visual Studio Code
- Adds formatting and linting support for saved files in Visual Studio Code
- Adds common Visual Studio Code plugin recommendations
- Adds an `ENV_PROVIDERS` configuration array with the current environment name and a base URL to the `environment.ts` and `environment.prod.ts` files and provides this array in the AppModules's `providers` array.
- Removes e2e testing functionality with `protractor`. See below how to add a better alternative.

_ng-essentials_ comes with some configuration switches to add even more value:

- `--jest` removes testing functionality with `jasmine` and `karma` and replaces it with [jest](https://jestjs.io/) using [@angular-builders/jest](https://github.com/meltedspark/angular-builders).

- `--cypress` adds e2e testing functionality with [Cypress.io](https://www.cypress.io/). Please note that `ng e2e` won't work anymore. Use `npm run cypress` or `yarn cypress` instead.

- `--husky` installs [husky](https://openbase.io/js/husky) which formats and lints staged files (pre-commit hook).

#### Adding a new library with jest support

This schematic enhances the creation of a new library when the schematic was previously installed with the `--jest` option. By running

```bash
ng generate lib myAwesomeLib
```

it will delete the karma/jasmine configuration and add jest support for the new library as well.

#### Adding a new application with jest support

This schematic enhances the creation of a new application when the schematic was previously installed with the `--jest` option. By running

```bash
ng generate app myAwesomeApp
```

it will delete the karma/jasmine configuration and add jest support for the new application as well.
