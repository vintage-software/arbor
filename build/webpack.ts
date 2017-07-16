import { default as arborWebpackConfig } from './webpack.arbor';
import { default as ciWebpackConfig } from './webpack.ci';
import { default as webWebpackConfig } from './webpack.web';

export default [
  arborWebpackConfig,
  ciWebpackConfig,
  webWebpackConfig
];
