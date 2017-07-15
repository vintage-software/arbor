import * as webpackMerge from 'webpack-merge';

import { commonConfig } from './webpack.server.common';

export default webpackMerge(commonConfig, {
  devtool: 'source-map',
});
