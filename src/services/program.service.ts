import * as chalk from 'chalk';
import * as program from 'commander';

import { Injectable } from '@angular/core';

import { ConfigService } from './config.service';
import { ConsoleService } from './console.service';
import { LogService } from './log.service';
import { ProjectService } from './project.service';
import { TaskRunnerService } from './task-runner.service';
import { VersionService } from './version.service';

const currentVersion = require('../../package.json').version;

@Injectable()
export class ProgramService {
  constructor(
    private configService: ConfigService,
    private console: ConsoleService,
    private logService: LogService,
    private projectService: ProjectService,
    private taskRunner: TaskRunnerService,
    private versionService: VersionService) {
  }

  start() {
    this.mapVersionFlag();

    this.versionService.getLatestVersion()
      .then(version => {
        this.showUpdateMessage(version);
        this.startArbor();
      })
      .catch(() => {
        this.startArbor();
      });
  }

  private startArbor() {
    program.version(currentVersion);

    program
      .command('run <tasks...>')
      .description('Run a given list of Arbor tasks')
      .action((taskNames: string[]) => this.run(taskNames));

    program
      .command('init')
      .description('Create a new Arbor config')
      .action(() => { this.configService.createArborConfig(); });

    program.parse(process.argv);
  }

  private run(taskNames: string[]) {
    this.console.log(`Arbor: running tasks ${taskNames.join(', ')} in ${process.cwd()}\n`);

    this.logService.deleteLogs();

    if (taskNames.length) {
      this.projectService.getProjects()
        .then(projects => {
          let next = () => {
            taskNames.shift();

            if (taskNames.length) {
              this.taskRunner.runTask(projects, taskNames[0], next);
            }
          };

          this.taskRunner.runTask(projects, taskNames[0], next);
        });
    }
  }

  private showUpdateMessage(latestVersion: string) {
    if (currentVersion !== latestVersion) {
      this.console.log(`
  New version available. Run ${chalk.yellow('npm install -g arbor')} to update.
  Local Version: ${currentVersion}
  Latest Version: ${latestVersion}
      `);
    }
  }

  private mapVersionFlag() {
    // maps lower -v to the version flag of commander
    let vPos = process.argv.indexOf('-v');
    if (vPos > -1) {
      process.argv[vPos] = '-V';
    }
  }
}
