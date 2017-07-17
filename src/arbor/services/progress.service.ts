import { Injectable } from '@angular/core';
import * as chalk from 'chalk';

import { RunningTask, TaskStatus } from './../../common/interfaces/running-task';
import { ConsoleService } from './../../common/services/console.service';

@Injectable()
export class ProgressService {
  constructor(private console: ConsoleService) { }

  updateRunningTasks(runningTasks: RunningTask[]) {
    const output = runningTasks
      .map(runningTask => `  ${runningTask.project.name}: ${ProgressService.getStatusText(runningTask)}`)
      .join('\n');

    this.console.progress(output);
  }

  finalizeRunningTasks() {
    this.console.finalizeProgress();
  }

  private static getStatusText(runningTask: RunningTask) {
    const defaultStatus = ProgressService.getDefaultStatusText(runningTask.taskName);

    let statusText;

    switch (runningTask.status) {
      case TaskStatus.Waiting:
        statusText = chalk.gray('waiting...');
        break;
      case TaskStatus.Success:
        statusText = chalk.green('done!');
        break;
      case TaskStatus.Failed:
        statusText = chalk.red('failed!');
        break;
      case TaskStatus.DependendecyFailed:
        statusText = chalk.red('dependency failed!');
        break;
      case TaskStatus.InProgress:
        const showProgress = runningTask.currentCommand.noProgress !== true;
        const status = `${runningTask.statusText ? runningTask.statusText : defaultStatus}...`;
        const progress = showProgress && runningTask.progressLogLine ? runningTask.progressLogLine : '';

        statusText = `${chalk.yellow(status)} ${chalk.gray(progress)}`;
        break;
      default:
        throw new Error(`Unkown task status '${runningTask.status}' in project '${runningTask.project.name}.'`);
    }

    return statusText;
 }

  private static getDefaultStatusText(taskName: string): string {
    let status = 'processing';

    if (taskName.indexOf('install') > -1) {
      status = 'installing';
    } else if (taskName.indexOf('build') > -1) {
      status = 'building';
    } else if (taskName.indexOf('test') > -1) {
      status = 'testing';
    }

    return status;
  }
}
