import { ConsoleService } from './../common/services/console.service';
import { ShellService } from './../common/services/shell.service';
import { VersionService } from './../common/services/version.service';
import { DeployServerCommand } from './commands/deploy-server.command';
import { RunAgentCommand } from './commands/run-agent.command';
import { AgentService } from './services/agent.service';
import { ArborCiProgramService } from './services/arbor-ci-program.service';
import { FirebaseConfigService } from './services/firebase-config.service';
import { FirebaseInitService } from './services/firebase-init.service';
import { GitService } from './services/git-service';

export const providers = [
  AgentService,
  ArborCiProgramService,
  ConsoleService,
  DeployServerCommand,
  FirebaseConfigService,
  FirebaseInitService,
  GitService,
  RunAgentCommand,
  ShellService,
  VersionService
];
