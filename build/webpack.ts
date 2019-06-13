import * as path from 'path';
import * as webpack from 'webpack';

const webpackNodeExternals = require('webpack-node-externals');

const production = process.env.NODE_ENV === 'production';

export default {
  target: 'node',
  mode: 'development',
  devtool: 'source-map',
  externals: [
    webpackNodeExternals()
  ],
  entry: {
    'index': './src/index.ts'
  },
  output: {
    path: path.resolve('./dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'awesome-typescript-loader'
        }
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
    ...(production ? [new webpack.NoEmitOnErrorsPlugin()] : [])
  ]
} as webpack.Configuration;
