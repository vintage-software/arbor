import * as chalk from 'chalk';

import { RunningTask, TaskStatus } from './../interfaces/running-task';

export function getStatusText(runningTask: RunningTask) {
  const defaultStatus = getDefaultStatusText(runningTask.taskFlag);

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
      const showProgressLine = runningTask.currentCommand.noProgress !== true;
      const status = `${runningTask.statusText ? runningTask.statusText : defaultStatus}...`;
      const progress = showProgressLine && runningTask.progressLogLine ? runningTask.progressLogLine : '';

      statusText = `${chalk.yellow(status)} ${chalk.gray(progress)}`;
      break;
    default:
      throw new Error(`Unkown task status '${runningTask.status}' in project '${runningTask.project.name}.'`);
  }

  return statusText;
}

function getDefaultStatusText(taskFlag: string): string {
  let status = 'in progress';

  if (taskFlag.indexOf('clean') > -1) {
    status = 'cleaning';
  } else if (taskFlag.indexOf('clone') > -1) {
    status = 'cloning';
  } else if (taskFlag.indexOf('install') > -1) {
    status = 'installing';
  } else if (taskFlag.indexOf('build') > -1) {
    status = 'building';
  } else if (taskFlag.indexOf('test') > -1) {
    status = 'testing';
  }

  return status;
}
