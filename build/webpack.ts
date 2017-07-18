import { default as nodeWebpackConfig } from './webpack.node';
import { default as webWebpackConfig } from './webpack.web';

export default [
  nodeWebpackConfig,
  webWebpackConfig
];
