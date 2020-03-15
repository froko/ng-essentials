const wp = require('@cypress/webpack-preprocessor');

const webpackOptions = {
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'ts-loader',
        options: { transpileOnly: true }
      }
    ]
  }
};

module.exports = on => {
  const options = {
    webpackOptions
  };
  on('file:preprocessor', wp(options));
};
