import { commonEnvironment } from './environment.common';

const devEnvironment = {
  production: false
};

export const environment = { ...commonEnvironment, ...devEnvironment };
