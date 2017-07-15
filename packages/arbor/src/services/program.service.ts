import { Injectable } from '@angular/core';
import * as program from 'commander';

import { RunOptions, ScriptOptions } from './../helpers/options';
import { ConfigService } from './config.service';
import { ScriptService } from './script.service';
import { TaskRunnerService } from './task-runner.service';
import { currentVersion, VersionService } from './version.service';

@Injectable()
export class ProgramService {
  constructor(
    private configService: ConfigService,
    private scriptService: ScriptService,
    private taskRunner: TaskRunnerService,
    private versionService: VersionService) {
  }

  start() {
    this.mapVersionFlag();
    this.registerCommands();

    this.versionService.checkForUpdate()
      .then(() => program.parse(process.argv));
  }

  private registerCommands() {
    program.version(currentVersion);

    program
      .command('init')
      .description('Create a new Arbor config')
      .action(() => { this.configService.createArborConfig(); });

    program
      .command('run <tasks...>')
      .description('Run a given list of Arbor tasks in the current working directory.')
      .option('--cwd <cwd>', 'Override the current working directory.')
      .option('--port <port>', 'POST progress updates to Arbor CI Server.')
      .option('--live-log-file', 'Logs process output to arbor-live.log as it is captured.')
      .option('--live-log-console', 'Logs process output to the console as it is captured.')
      .action((taskNames: string[], options: RunOptions) => this.run(taskNames, options));

    program
      .command('script <tasks...>')
      .description('Generate a script to run the given list of Arbor tasks in the current working directory.')
      .option('--output <output>', 'Filename to write script. Required.')
      .action((taskNames: string[], options: ScriptOptions) => this.script(taskNames, options));
  }

  private run(taskNames: string[], options: RunOptions) {
    if (options.cwd && options.cwd.length) {
      this.chdir(options.cwd);
    }

    options.port = +options.port;

    this.taskRunner.runTasks(taskNames, options);
  }

  private script(taskNames: string[], options: ScriptOptions) {
    this.scriptService.generateScript(taskNames, options);
  }

  private chdir(cwd: string) {
    try {
      process.chdir(cwd);
    } catch (e) {
      console.log(`fatal: error changing directory to ${cwd}.`);
      process.exit(1);
    }
  }

  private mapVersionFlag() {
    // maps lower -v to the version flag of commander
    const vPos = process.argv.indexOf('-v');
    if (vPos > -1) {
      process.argv[vPos] = '-V';
    }
  }
}
