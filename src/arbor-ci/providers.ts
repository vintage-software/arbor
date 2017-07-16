import { ConsoleService } from './../common/services/console.service';
import { ShellService } from './../common/services/shell.service';
import { VersionService } from './../common/services/version.service';
import { ArborCiProgramService } from './services/arbor-ci-program.service';

export const providers = [
  ArborCiProgramService,
  ConsoleService,
  ShellService,
  VersionService
];
