import 'reflect-metadata';

import { ReflectiveInjector } from 'injection-js';

import { providers } from './providers';
import { ArborProgramService } from './services/arbor-program.service';

const injector = ReflectiveInjector.resolveAndCreate(providers);
const program: ArborProgramService = injector.get(ArborProgramService);

program.run();
