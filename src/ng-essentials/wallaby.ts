import { Rule, chain, Tree, SchematicContext } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { wallaby } from '../versions';
import { TSCONFIGAPP_JSON } from '../constants';
import { addPackageToPackageJson, findDefaultProjectNameInAngularJson } from '../utils';

export function addWallaby(options: NgEssentialsOptions): Rule {
  if (!options.firstRun || !options.wallaby) {
    return chain([]);
  }
  return chain([
    (tree: Tree, _context: SchematicContext) => {
      const defaultProjectName = findDefaultProjectNameInAngularJson(tree);

      if (options.jest) {
        return chain([
          addPackageToPackageJson('devDependencies', 'ngx-wallaby-jest', wallaby.wallabyJest),
          addWallabyConfigForJest(defaultProjectName)
        ]);
      }

      return chain([
        addPackageToPackageJson('devDependencies', 'angular2-template-loader', wallaby.angularTemplateLoader),
        addPackageToPackageJson('devDependencies', 'wallaby-webpack', wallaby.wallabyWebpack),
        addWallabyConfigForJasmine(defaultProjectName),
        addWallabyTestFile(),
        editTsConfigAppJson()
      ]);
    }
  ]);
}

function addWallabyConfigForJest(defaultProjectName: string): Rule {
  return (host: Tree) => {
    host.create(
      './wallaby.js',
      `const ngxWallabyJest = require('ngx-wallaby-jest');

module.exports = function(wallaby) {
  return {
    files: [
      'src/**/*.+(ts|html|json|snap|css|less|sass|scss|jpg|jpeg|gif|png|svg)',
      '${defaultProjectName}/**/*.+(ts|html|json|snap|css|less|sass|scss|jpg|jpeg|gif|png|svg)',
      'tsconfig.json',
      'tsconfig.spec.json',
      'jest.config.js',
      '!src/**/*.spec.ts',
      '!${defaultProjectName}/**/*.spec.ts'
    ],

    tests: ['src/**/*.spec.ts', '${defaultProjectName}/**/*.spec.ts'],

    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({ module: 'commonjs' })
    },
    preprocessors: {
      'src/**/*.component.ts': ngxWallabyJest,
      '${defaultProjectName}/**/*.component.ts': ngxWallabyJest
    },
    testFramework: 'jest'
  };
};
`
    );

    return host;
  };
}

function addWallabyConfigForJasmine(defaultProjectName: string): Rule {
  return (host: Tree) => {
    host.create(
      './wallaby.js',
      `var wallabyWebpack = require('wallaby-webpack');
var path = require('path');

var compilerOptions = Object.assign(
  require('./tsconfig.json').compilerOptions,
  require('./src/tsconfig.spec.json').compilerOptions
);

compilerOptions.module = 'CommonJs';

module.exports = function(wallaby) {
  var webpackPostprocessor = wallabyWebpack({
    entryPatterns: ['src/wallabyTest.js', 'src/**/*spec.js', '${defaultProjectName}/**/*spec.js'],

    module: {
      rules: [
        { test: /\.css$/, loader: ['raw-loader'] },
        { test: /\.html$/, loader: 'raw-loader' },
        {
          test: /\.ts$/,
          loader: '@ngtools/webpack',
          include: /node_modules/,
          query: { tsConfigPath: 'tsconfig.json' }
        },
        { test: /\.js$/, loader: 'angular2-template-loader', exclude: /node_modules/ },
        { test: /\.styl$/, loaders: ['raw-loader', 'stylus-loader'] },
        { test: /\.less$/, loaders: ['raw-loader', { loader: 'less-loader', options: { paths: [__dirname] } }] },
        { test: /\.scss$|\.sass$/, loaders: ['raw-loader', 'sass-loader'] },
        { test: /\.(jpg|png|svg)$/, loader: 'url-loader?limit=128000' }
      ]
    },

    resolve: {
      extensions: ['.js', '.ts'],
      modules: [
        path.join(wallaby.projectCacheDir, 'src/app'),
        path.join(wallaby.projectCacheDir, 'src'),
        path.join(wallaby.projectCacheDir, '${defaultProjectName}'),
        'node_modules'
      ]
    },
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      dns: 'empty'
    }
  });

  return {
    files: [
      { pattern: 'src/**/*.+(ts|css|less|scss|sass|styl|html|json|svg)', load: false },
      { pattern: 'src/**/*.d.ts', ignore: true },
      { pattern: 'src/**/*spec.ts', ignore: true },
      { pattern: '${defaultProjectName}/**/*.+(ts|css|less|scss|sass|styl|html|json|svg)', load: false },
      { pattern: '${defaultProjectName}/**/*.d.ts', ignore: true },
      { pattern: '${defaultProjectName}/**/*spec.ts', ignore: true }
    ],

    tests: [{ pattern: 'src/**/*spec.ts', load: false }, { pattern: '${defaultProjectName}/**/*spec.ts', load: false }],

    testFramework: 'jasmine',

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript(compilerOptions)
    },

    middleware: function(app, express) {
      var path = require('path');
        app.use('/favicon.ico', express.static(path.join(__dirname, 'src/favicon.ico')));
        app.use('/assets', express.static(path.join(__dirname, 'src/assets')));
    },

    env: {
      kind: 'chrome'
    },

    postprocessor: webpackPostprocessor,

    setup: function() {
      window.__moduleBundler.loadTests();
    },

    debug: true
  };
};
`
    );

    return host;
  };
}

function addWallabyTestFile(): Rule {
  return (host: Tree) => {
    host.create(
      './src/wallabyTest.ts',
      `import './polyfills';

import 'core-js/es7/reflect';
import 'zone.js/dist/zone-testing';

import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
`
    );

    return host;
  };
}

function editTsConfigAppJson(): Rule {
  return (host: Tree, _: SchematicContext) => {
    if (!host.exists(TSCONFIGAPP_JSON)) {
      return host;
    }

    const sourceText = host.read(TSCONFIGAPP_JSON).toString('utf-8');
    const tsconfigJson = JSON.parse(sourceText);

    if (!tsconfigJson['exclude']) {
      tsconfigJson['exclude'] = [];
    }

    tsconfigJson['exclude'] = ['test.ts', 'wallabyTest.ts', '**/*.spec.ts'];

    host.overwrite(TSCONFIGAPP_JSON, JSON.stringify(tsconfigJson, null, 2));

    return host;
  };
}
