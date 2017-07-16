import { ConsoleService } from './../common/services/console.service';
import { ShellService } from './../common/services/shell.service';
import { VersionService } from './../common/services/version.service';
import { DeployServerCommand } from './commands/deploy-server.command';
import { RunAgentCommand } from './commands/run-agent.command';
import { ArborCiProgramService } from './services/arbor-ci-program.service';
import { FirebaseService } from './services/firebase.service';

export const providers = [
  ArborCiProgramService,
  ConsoleService,
  DeployServerCommand,
  FirebaseService,
  RunAgentCommand,
  ShellService,
  VersionService
];
