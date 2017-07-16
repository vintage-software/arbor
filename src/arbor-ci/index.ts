import 'reflect-metadata';

import { ReflectiveInjector } from '@angular/core';

import { providers } from './providers';
import { ArborCiProgramService } from './services/arbor-ci-program.service';

const injector = ReflectiveInjector.resolveAndCreate(providers);
const program: ArborCiProgramService = injector.get(ArborCiProgramService);

program.run();
