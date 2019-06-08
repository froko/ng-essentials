import { Rule, chain, Tree, SchematicContext } from '@angular-devkit/schematics';

import { NgEssentialsOptions } from './schema';

import { wallaby } from '../versions';
import { addPackageToPackageJson, findNewProjectRootInAngularJson, updateJson, tsconfigFilePath } from '../utils';

export function addWallaby(options: NgEssentialsOptions): Rule {
  if (!options.firstRun || !options.wallaby) {
    return chain([]);
  }
  return chain([
    (tree: Tree, _context: SchematicContext) => {
      const newProjectRoot = findNewProjectRootInAngularJson(tree);

      if (options.jest) {
        return chain([
          addPackageToPackageJson('devDependencies', 'ngx-wallaby-jest', wallaby.wallabyJest),
          addWallabyConfigForJest(newProjectRoot)
        ]);
      }

      return chain([
        addPackageToPackageJson('devDependencies', 'angular2-template-loader', wallaby.angularTemplateLoader),
        addPackageToPackageJson('devDependencies', 'wallaby-webpack', wallaby.wallabyWebpack),
        addWallabyConfigForJasmine(newProjectRoot),
        addWallabyTestFile(),
        editTsConfigAppJson()
      ]);
    }
  ]);
}

function addWallabyConfigForJest(newProjectRoot: string): Rule {
  return (host: Tree) => {
    host.create(
      './wallaby.js',
      `const ngxWallabyJest = require('ngx-wallaby-jest');

module.exports = function(wallaby) {
  return {
    files: [
      'src/**/*.+(ts|html|json|snap|css|less|sass|scss|jpg|jpeg|gif|png|svg)',
      '${newProjectRoot}/**/*.+(ts|html|json|snap|css|less|sass|scss|jpg|jpeg|gif|png|svg)',
      '!src/**/*.spec.ts',
      '!${newProjectRoot}/**/*.spec.ts'
    ],

    tests: ['src/**/*.spec.ts', '${newProjectRoot}/**/*.spec.ts'],

    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({ module: 'commonjs' })
    },
    preprocessors: {
      'src/**/*.component.ts': ngxWallabyJest,
      '${newProjectRoot}/**/*.component.ts': ngxWallabyJest
    },
    testFramework: 'jest'
  };
};
`
    );

    return host;
  };
}

function addWallabyConfigForJasmine(newProjectRoot: string): Rule {
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
    entryPatterns: ['src/wallabyTest.js', 'src/**/*spec.js', '${newProjectRoot}/**/*spec.js'],

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
        path.join(wallaby.projectCacheDir, '${newProjectRoot}'),
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
      { pattern: '${newProjectRoot}/**/*.+(ts|css|less|scss|sass|styl|html|json|svg)', load: false },
      { pattern: '${newProjectRoot}/**/*.d.ts', ignore: true },
      { pattern: '${newProjectRoot}/**/*spec.ts', ignore: true }
    ],

    tests: [{ pattern: 'src/**/*spec.ts', load: false }, { pattern: '${newProjectRoot}/**/*spec.ts', load: false }],

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
  return updateJson(tsconfigFilePath('.', 'app'), json => {
    return {
      ...json,
      exclude: ['test.ts', 'wallabyTest.ts', '**/*.spec.ts']
    };
  });
}
