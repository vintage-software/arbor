const node = typeof window === 'undefined';

export const commonEnvironment = {
  node,
  browser: node === false,
  serverPort: node ? process.env.PORT || 5000 : undefined,
};
