import * as program from 'commander';

import { Injectable } from '@angular/core';

import { RunOptions } from '../helpers/run-options';

import { ConfigService } from './config.service';
import { ConsoleService } from './console.service';
import { LogService } from './log.service';
import { ProjectService } from './project.service';
import { TaskRunnerService } from './task-runner.service';
import { currentVersion, VersionService } from './version.service';

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
    this.registerCommands();

    this.versionService.checkForUpdate()
      .then(() => program.parse(process.argv));
  }

  private registerCommands() {
    program.version(currentVersion);

    program
      .command('run <tasks...>')
      .description('Run a given list of Arbor tasks')
      .option('--live-log', 'Logs process output to arbor-live.log as it is captured.')
      .action((taskNames: string[], options: RunOptions) => this.run(taskNames, options));

    program
      .command('init')
      .description('Create a new Arbor config')
      .action(() => { this.configService.createArborConfig(); });
  }

  private run(taskNames: string[], options: RunOptions) {
    this.console.log(`Arbor: running tasks ${taskNames.join(', ')} in ${process.cwd()}`);

    if (options.liveLog) {
      this.console.log('Live log is enabled.');
    }

    this.console.log();

    this.logService.deleteLogs();

    if (taskNames.length) {
      this.projectService.getProjects()
        .then(projects => {
          let next = () => {
            taskNames.shift();

            if (taskNames.length) {
              this.taskRunner.runTask(projects, taskNames[0], options, next);
            }
          };

          this.taskRunner.runTask(projects, taskNames[0], options, next);
        });
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
