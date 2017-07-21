import 'reflect-metadata';

import './../common/rxjs-operators';

import { ReflectiveInjector } from '@angular/core';

import { providers } from './providers';
import { ArborCiProgramService } from './services/arbor-ci-program.service';

const nodeCleanup = require('node-cleanup');

const injector = ReflectiveInjector.resolveAndCreate(providers);
const program: ArborCiProgramService = injector.get(ArborCiProgramService);

program.run();

nodeCleanup((_code: number, signal: string) => {
  const cleaupAsync = program.cleanup();

  if (cleaupAsync && signal) {
    cleaupAsync.subscribe(() => { process.kill(process.pid, signal); });
    nodeCleanup.uninstall();
    return false;
  }
});
