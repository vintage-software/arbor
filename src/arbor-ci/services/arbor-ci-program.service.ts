import { Injectable } from '@angular/core';
import * as yargs from 'yargs';

import { environment } from './../../common/environments/environment';
import { Command } from './../../common/interfaces/command';
import { VersionService } from './../../common/services/version.service';
import { DeployServerCommand } from './../commands/deploy-server.command';
import { RunAgentCommand } from './../commands/run-agent.command';

@Injectable()
export class ArborCiProgramService {
  private command: Command;

  constructor(
    private deployServerCommand: DeployServerCommand,
    private runAgentCommand: RunAgentCommand,
    private versionService: VersionService
  ) { }

  run() {
    this.versionService.checkForUpdate('arbor-ci')
      .then(() => this.registerCommands())
      .then(() => yargs.argv);
  }

  cleanup() {
    return this.command.stop();
  }

  private registerCommands() {
    yargs.version(environment.version);

    yargs
      .command('deploy-server', 'Deploy the Arbor CI website to Firebase', yargs2 => yargs2,
      () => { this.command = this.deployServerCommand; this.deployServerCommand.run(); });

    yargs
      .command('run-agent', 'Runs the Arbor CI build agent.', yargs2 => yargs2,
      () => { this.command = this.runAgentCommand; this.runAgentCommand.run(); });
  }
}
