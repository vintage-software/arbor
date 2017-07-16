import { default as arborWebpackConfig } from './webpack.arbor';
import { default as serverWebpackConfig } from './webpack.server';
import { default as webWebpackConfig } from './webpack.web';

export default [
  arborWebpackConfig,
  serverWebpackConfig,
  webWebpackConfig
];
