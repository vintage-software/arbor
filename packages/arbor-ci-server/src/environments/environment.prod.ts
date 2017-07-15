import { commonEnvironment } from './environment.common';

const prodEnvironment = {
  production: true
};

export const environment = { ...commonEnvironment, ...prodEnvironment };
