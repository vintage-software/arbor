import { Injectable } from '@angular/core';
import * as program from 'commander';
import { RunCommand, RunOptions } from '../commands/run.command';
import { ScriptCommand, ScriptOptions } from '../commands/script.command';
import { environment } from './../../common/environments/environment';
import { VersionService } from './../../common/services/version.service';
import { ConfigService } from './config.service';

@Injectable()
export class ArborProgramService {
  constructor(
    private configService: ConfigService,
    private runCommand: RunCommand,
    private scriptCommand: ScriptCommand,
    private versionService: VersionService
  ) { }

  run() {
    this.mapVersionFlag();
    this.registerCommands();

    this.versionService.checkForUpdate('arbor')
      .then(() => { program.parse(process.argv); });
  }

  private registerCommands() {
    program.version(environment.version);

    program
      .command('init')
      .description('Create a new Arbor config')
      .action(() => { this.configService.createArborConfig(); });

    program
      .command('run <tasks...>')
      .description('Run a given list of Arbor tasks in the current working directory.')
      .option('--cwd <cwd>', 'Override the current working directory.')
      .action((taskNames: string[], options: RunOptions) => { this.runCommand.run(taskNames, options); });

    program
      .command('script <tasks...>')
      .description('Generate a script to run the given list of Arbor tasks in the current working directory.')
      .option('--output <output>', 'Filename to write script. Required.')
      .action((taskNames: string[], options: ScriptOptions) => { this.scriptCommand.run(taskNames, options); });
  }

  private mapVersionFlag() {
    const vPos = process.argv.indexOf('-v');

    if (vPos > -1) {
      process.argv[vPos] = '-V';
    }
  }
}
