import { AotPlugin } from '@ngtools/webpack';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import { realpathSync } from 'fs';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import * as path from 'path';
import * as webpack from 'webpack';

const { GlobCopyWebpackPlugin } = require('@angular/cli/plugins/webpack');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const RemoveAssetsPlugin = require('remove-assets-webpack-plugin');

const nodeModules = path.join(process.cwd(), 'node_modules');
const realNodeModules = realpathSync(nodeModules);

const entryPoints = ['polyfills', 'styles', 'vendor', 'main'];

const production = process.env.NODE_ENV === 'production';

export default {
  devtool: 'source-map',
  entry: {
    'main': './src/web/main.ts',
    'polyfills': './src/web/polyfills.ts',
    'styles': './src/web/styles.scss',
  },
  output: {
    path: path.resolve('./dist/arbor-ci/web'),
    filename: production ? '[name].[hash].js' : '[name].js'
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['@ngtools/webpack']
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.scss$/,
        use: ['to-string-loader', 'css-loader', 'sass-loader'],
        exclude: [/styles/]
      },
      {
        test: /styles\.scss$/,
        use: production ? ExtractTextPlugin.extract({ fallback: 'style-loader',  use: ['css-loader', 'sass-loader'] }) : ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      chunks: ['main'],
      minChunks: (module) => module.resource && (module.resource.startsWith(nodeModules) || module.resource.startsWith(realNodeModules))
    }),
    new HtmlWebpackPlugin({
      template: './src/web/index.html',
      excludeAssets: production ? [/style.*\.js/] : [],
      chunksSortMode: (left, right) => entryPoints.indexOf(left.names[0]) - entryPoints.indexOf(right.names[0])
    }),
    new HtmlWebpackExcludeAssetsPlugin(),
    new AotPlugin({
      mainPath: 'main.ts',
      tsConfigPath: './src/web/tsconfig.json',
      skipCodeGeneration: production === false,
      exclude: []
    }),
    new GlobCopyWebpackPlugin({
      patterns: [ 'assets' ],
      globOptions: {
        cwd: './src/web',
        dot: true,
        ignore: '**/.gitkeep'
      }
    }),
    ...(production ? [new webpack.NoEmitOnErrorsPlugin()] : []),
    ...(production ? [new webpack.optimize.UglifyJsPlugin()] : []),
    ...(production ? [new ExtractTextPlugin('styles.[hash].css')] : []),
    ...(production ? [new OptimizeCssAssetsPlugin()] : []),
    ...(production ? [new RemoveAssetsPlugin(/styles\..+\.js/)] : []),
  ]
} as webpack.Configuration;
