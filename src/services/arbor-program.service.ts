import { Injectable } from '@angular/core';
import * as yargs from 'yargs';

import { RunCommand } from './../commands/run.command';
import { ScriptCommand } from './../commands/script.command';
import { ConfigService } from './config.service';
import { VersionService } from './version.service';

@Injectable()
export class ArborProgramService {
  constructor(
    private configService: ConfigService,
    private runCommand: RunCommand,
    private scriptCommand: ScriptCommand,
    private versionService: VersionService
  ) { }

  run() {
    this.versionService.checkForUpdate('arbor')
      .then(() => this.registerCommands())
      .then(() => yargs.argv);
  }

  private registerCommands() {
    yargs.version(VersionService.version);

    yargs
      .command('init', 'Create a new Arbor config', yargs2 => yargs2,
      () => { this.configService.createArborConfig(); });

    yargs
      .command('run <tasks...>', 'Run a given list of Arbor tasks in the current working directory.', yargs2 => yargs2
      .option('cwd', { default: '.', description: 'Override the current working directory.' }),
      args => { this.runCommand.run(args.tasks, { cwd: args.cwd }); });

    yargs
      .command('script <tasks...>', 'Generate a script to run the given list of Arbor tasks in the current working directory.', yargs2 => yargs2
      .option('output', { default: 'build.bat', description: 'Filename to write script.' })
      .option('dry-run', { default: false, description: 'Skip writing the output file.' }),
      args => { this.scriptCommand.run(args.tasks, { output: args.output, dryRun: !!args.dryRun }); });
  }
}
