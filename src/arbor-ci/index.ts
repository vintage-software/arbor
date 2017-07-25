import 'reflect-metadata';
import 'zone.js/dist/zone-node';
import './../common/rxjs-operators';

import { getInjector } from './../common/helpers/ng.helpers';
import { ArborCiModule } from './arbor-ci.module';
import { ArborCiProgramService } from './services/arbor-ci-program.service';

const nodeCleanup = require('node-cleanup');

(async function () {
  const injector = await getInjector(ArborCiModule);
  const program = injector.get(ArborCiProgramService);

  program.run();

  nodeCleanup((_code: number, signal: string) => {
    const cleaupAsync = program.cleanup();

    if (cleaupAsync && signal) {
      cleaupAsync.subscribe(() => { process.kill(process.pid, signal); });
      nodeCleanup.uninstall();
      return false;
    }
  });
})();
