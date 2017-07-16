import { Injectable } from '@angular/core';
import * as program from 'commander';

import { environment } from './../../common/environments/environment';
import { VersionService } from './../../common/services/version.service';
import { DeployServerCommand } from './../commands/deploy-server.command';
import { RunAgentCommand } from './../commands/run-agent.command';

@Injectable()
export class ArborCiProgramService {
  constructor(
    private deployServerCommand: DeployServerCommand,
    private runAgentCommand: RunAgentCommand,
    private versionService: VersionService
  ) { }

  run() {
    this.mapVersionFlag();
    this.registerCommands();

    this.versionService.checkForUpdate('arbor-ci')
      .then(() => { program.parse(process.argv); });
  }

  private registerCommands() {
    program.version(environment.version);

    program
      .command('deploy-server')
      .description('Deploy the Arbor CI website to Firebase.')
      .action(() => { this.deployServerCommand.run(); });

    program
      .command('run-agent')
      .description('Runs the Arbor CI build agent.')
      .action(() => { this.runAgentCommand.run(); });
  }

  private mapVersionFlag() {
    const vPos = process.argv.indexOf('-v');

    if (vPos > -1) {
      process.argv[vPos] = '-V';
    }
  }
}
