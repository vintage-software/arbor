import * as chalk from 'chalk';

import { TaskProgress } from './../interfaces/build';
import { RunningTask, TaskStatus } from './../interfaces/running-task';

export function computeUpdatedBuildTaskProgress(buildTaskProgress: TaskProgress[], runningTasks: RunningTask[]) {
  buildTaskProgress = [ ...buildTaskProgress ];

  for (const runningTask of runningTasks) {
    const taskFlag = runningTask.taskFlag;
    const projectName = runningTask.project.name;

    let taskProgress = buildTaskProgress.find(task => task.taskFlag === taskFlag);

    if (taskProgress === undefined) {
      taskProgress = { taskFlag, projects: [] };
      buildTaskProgress.push(taskProgress);
    }

    let projectTaskStatus = taskProgress.projects.find(project => project.projectName === projectName);

    if (projectTaskStatus === undefined) {
      projectTaskStatus = { projectName };
      taskProgress.projects.push(projectTaskStatus);
    }

    const showProgressLine = runningTask.progressLogLine && runningTask.currentCommand.noProgress !== true;

    projectTaskStatus.status = runningTask.status;
    projectTaskStatus.statusText = getStatusText(runningTask, false, false);
    projectTaskStatus.progressLogLine = showProgressLine ? runningTask.progressLogLine : null;
  }

  return buildTaskProgress;
}

export function getStatusText(runningTask: RunningTask, useProgressLine = true, useColor = true) {
  const defaultStatus = getDefaultStatusText(runningTask.taskFlag);

  let statusText;

  switch (runningTask.status) {
    case TaskStatus.Waiting:
      statusText = makeStatusText('waiting...', useColor, chalk.gray);
      break;
    case TaskStatus.Success:
      statusText = makeStatusText('done!', useColor, chalk.green);
      break;
    case TaskStatus.Failed:
      statusText = makeStatusText('failed!', useColor, chalk.red);
      break;
    case TaskStatus.DependendecyFailed:
      statusText = makeStatusText('dependency failed!', useColor, chalk.red);
      break;
    case TaskStatus.InProgress:
      const showProgressLine = useProgressLine && runningTask.currentCommand.noProgress !== true;
      const status = `${runningTask.statusText ? runningTask.statusText : defaultStatus}...`;
      const progress = showProgressLine && runningTask.progressLogLine ? runningTask.progressLogLine : '';

      statusText = `${makeStatusText(status, useColor, chalk.yellow)} ${makeStatusText(progress, useColor, chalk.gray)}`;
      break;
    default:
      throw new Error(`Unkown task status '${runningTask.status}' in project '${runningTask.project.name}.'`);
  }

  return statusText;
}

export function getDefaultStatusText(taskFlag: string): string {
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

function makeStatusText(text: string, useColor: boolean, color: chalk.ChalkChain) {
  return useColor ? color(text) : text;
}
