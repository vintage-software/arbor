#! /usr/bin/env node

import 'reflect-metadata';

import { AppModule } from './app.module';
import { ProgramService } from './services/program.service';
import { getInjector } from './utilities/get-injector';

(async function () {
  const injector = await getInjector(AppModule);
  const program: ProgramService = injector.get(ProgramService);

  program.start();
})();
