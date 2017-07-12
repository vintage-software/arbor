import { Injectable } from '@angular/core';
import * as program from 'commander';

import { RunOptions } from './../helpers/run-options';
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
      .command('run <tasks...>')
      .description('Run a given list of Arbor tasks in the current working directory.')
      .option('--cwd <cwd>', 'Override the current working directory.')
      .option('--script', 'Output a build script.')
      .option('--live-log', 'Logs process output to arbor-live.log as it is captured.')
      .action((taskNames: string[], options: RunOptions) => this.run(taskNames, options));

    program
      .command('init')
      .description('Create a new Arbor config')
      .action(() => { this.configService.createArborConfig(); });
  }

  private run(taskNames: string[], options: RunOptions) {
    if (options.cwd && options.cwd.length) {
      this.chdir(options.cwd);
    }

    if (options.script) {
      this.scriptService.generateScript(taskNames);
    } else {
      this.taskRunner.runTasks(taskNames, options);
    }
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
