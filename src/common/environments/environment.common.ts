const node = typeof window === 'undefined';

export const commonEnvironment = {
  node,
  browser: node === false,
  version: require('./../../../package.json').default.version,
  serverPort: node ? process.env.PORT || 5000 : undefined
};
