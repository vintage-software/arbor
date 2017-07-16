import { Injectable } from '@angular/core';
import * as chalk from 'chalk';

import { BuildProgess } from './../../common/interfaces/build';
import { RunningTask, TaskStatus } from './../../common/interfaces/running-task';
import { ConsoleService } from './../../common/services/console.service';

@Injectable()
export class ProgressService {
  private buildProgress: BuildProgess = { tasks: [] };

  constructor(private console: ConsoleService) { }

  updateRunningTasks(runningTasks: RunningTask[]) {
    this.buildProgress = ProgressService.computeUpdatedBuildProgress(this.buildProgress, runningTasks);

    if (process.send) {
      process.send({ type: 'build-progress', buildProgress: this.buildProgress });
    }

    const output = runningTasks
      .map(runningTask => `  ${runningTask.project.name}: ${ProgressService.getStatusText(runningTask)}`)
      .join('\n');

    this.console.progress(output);
  }

  finalizeRunningTasks() {
    this.console.finalizeProgress();
  }

  private static computeUpdatedBuildProgress(buildProgress: BuildProgess, runningTasks: RunningTask[]) {
    buildProgress = { ...buildProgress };

    for (const runningTask of runningTasks) {
      const taskName = runningTask.taskName;
      const projectName = runningTask.project.name;

      let taskStatus = buildProgress.tasks.find(task => task.taskName === taskName);

      if (taskStatus === undefined) {
        taskStatus = { taskName, projects: [] };
        buildProgress.tasks.push(taskStatus);
      }

      let projectTaskStatus = taskStatus.projects.find(project => project.projectName === projectName);

      if (projectTaskStatus === undefined) {
        projectTaskStatus = { projectName };
        taskStatus.projects.push(projectTaskStatus);
      }

      const showProgressLine = runningTask.progressLogLine && runningTask.currentCommand.noProgress !== true;

      projectTaskStatus.status = runningTask.status;
      projectTaskStatus.statusText = ProgressService.getStatusText(runningTask, false, false);
      projectTaskStatus.progressLogLine = showProgressLine ? runningTask.progressLogLine : null;
    }

    return buildProgress;
  }

  private static getStatusText(runningTask: RunningTask, useProgressLine = true, useColor = true) {
    const defaultStatus = ProgressService.getDefaultStatusText(runningTask.taskName);

    let statusText;

    switch (runningTask.status) {
      case TaskStatus.Waiting:
        statusText = ProgressService.chalk('waiting...', useColor, chalk.gray);
        break;
      case TaskStatus.Success:
        statusText = ProgressService.chalk('done!', useColor, chalk.green);
        break;
      case TaskStatus.Failed:
        statusText = ProgressService.chalk('failed!', useColor, chalk.red);
        break;
      case TaskStatus.DependendecyFailed:
        statusText = ProgressService.chalk('dependency failed!', useColor, chalk.red);
        break;
      case TaskStatus.InProgress:
        const showProgressLine = useProgressLine && runningTask.currentCommand.noProgress !== true;
        const status = `${runningTask.statusText ? runningTask.statusText : defaultStatus}...`;
        const progress = showProgressLine && runningTask.progressLogLine ? runningTask.progressLogLine : '';

        statusText = `${ProgressService.chalk(status, useColor, chalk.yellow)} ${ProgressService.chalk(progress, useColor, chalk.gray)}`;
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

  private static chalk(text: string, useColor: boolean, color: chalk.ChalkChain) {
    return useColor ? color(text) : text;
  }
}
