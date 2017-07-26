import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { ConsoleService } from './../common/services/console.service';
import { GitHubApiService } from './../common/services/github-api.service';
import { ShellService } from './../common/services/shell.service';
import { VersionService } from './../common/services/version.service';
import { DeployServerCommand } from './commands/deploy-server.command';
import { RunAgentCommand } from './commands/run-agent.command';
import { AgentService } from './services/agent.service';
import { ArborCiProgramService } from './services/arbor-ci-program.service';
import { BuildService } from './services/build.service';
import { FirebaseConfigService } from './services/firebase-config.service';
import { FirebaseInitService } from './services/firebase-init.service';
import { GitService } from './services/git.service';
import { GitHubAppService } from './services/github-app.service';

@NgModule({
  imports: [
    ServerModule,
  ],
  providers: [
    AgentService,
    ArborCiProgramService,
    BuildService,
    ConsoleService,
    DeployServerCommand,
    FirebaseConfigService,
    FirebaseInitService,
    GitHubApiService,
    GitHubAppService,
    GitService,
    RunAgentCommand,
    ShellService,
    VersionService
  ]
})
export class ArborCiModule {
  ngDoBootstrap() { }
}
