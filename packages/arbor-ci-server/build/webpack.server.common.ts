import * as path from 'path';

const webpackNodeExternals = require('webpack-node-externals');

export const commonConfig = {
  target: 'node',
  externals: [
    webpackNodeExternals()
  ],
  entry: {
    'index': './src/server/index.ts'
  },
  output: {
    path: path.resolve('./dist/server'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['awesome-typescript-loader']
      }
    ]
  }
};
