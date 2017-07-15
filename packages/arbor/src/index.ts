#! /usr/bin/env node

import 'reflect-metadata';

import { ReflectiveInjector } from '@angular/core';

import { providers } from './providers';
import { ProgramService } from './services/program.service';

const injector = ReflectiveInjector.resolveAndCreate(providers);
const program: ProgramService = injector.get(ProgramService);

program.start();
