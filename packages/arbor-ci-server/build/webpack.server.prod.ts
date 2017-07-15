import * as webpack from 'webpack';
import * as webpackMerge from 'webpack-merge';

import { commonConfig } from './webpack.server.common';

export default webpackMerge(commonConfig, {
  devtool: 'source-map',
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NormalModuleReplacementPlugin(
      /environments\/environment$/,
      require.resolve('../src/environments/environment.prod.ts')
    )
  ]
});
