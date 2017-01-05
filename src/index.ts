/// <reference path="types/node-spinner.d.ts" />

import * as fs from 'fs';
import * as path from 'path';

import * as chalk from 'chalk';
import * as program from 'commander';

import { Project, Task } from './helpers/project';
import { RunningTask } from './helpers/running-task';
import { ConsoleService } from './services/console.service';
import { ExecResult, ShellService } from './services/shell.service';

const errorLogFile = 'arbor-error.log';

program
  .command('run <tasks...>')
  .action(run);

program.parse(process.argv);

function run(taskNames: string[]) {
  ConsoleService.log(`Arbor: running tasks ${taskNames.join(', ')} in ${process.cwd()}\n`);

  if (taskNames.length) {
    let next = () => {
      taskNames.shift();

      if (taskNames.length) {
        runTask(taskNames[0], next);
      }
    };

    runTask(taskNames[0], next);
  }
}

function runTask(taskName: string, next: () => void, projectNames: string[] = undefined) {
  ConsoleService.log(`Task: ${taskName}`);

  if (fs.existsSync(errorLogFile)) {
    fs.unlinkSync(errorLogFile);
  }

  startTasks(taskName, projectNames)
    .then(runningTasks => renderProgress(taskName, runningTasks))
    .then(() => next())
    .catch((runningTasks: RunningTask[]) => {
      ConsoleService.question('Task failed. Press "y" to restart all projects. Press "f" to restart failed projects. ')
        .then(response => {
          if (response === 'y') {
            ConsoleService.log('');
            runTask(taskName, nrext);
          } else if (response === 'f') {
            let failedProjectNames = runningTasks
              .filter(task => task.success === false)
              .map(task => task.projectName);

            ConsoleService.log('');
            runTask(taskName, next, failedProjectNames);
          }
        });
    });
}

function startTasks(taskName: string, projectNames: string[] = undefined): Promise<RunningTask[]> {
  return getProjects(getConfigs('./'))
    .then(projects => projectNames === undefined ? projects : projects.filter(p => projectNames.some(n => p.name === n)))
    .then(projects => {
      let runningTasks: RunningTask[] = [];

      for (let project of projects) {
        let task = project.tasks[taskName];

        if (task) {
          let runningTask: RunningTask = { projectName: project.name };

          runningTasks.push(runningTask);

          runIndividualTask(project, task, runningTask)
            .then(() => {
              runningTask.success = true;
            }).catch((result: ExecResult) => {
              handleError(project, runningTask, result);
            });
        }
      }

      return runningTasks;
    });
}

function runIndividualTask(project: Project, task: Task, runningTask: RunningTask): Promise<ExecResult> {
  const maxBuffer = 1024 * 500;

  task = Array.isArray(task) ? task : [task];
  let commands = task
    .map(command => typeof command === 'string' ? { command } : command);

  let runCommands = Promise.resolve(undefined);

  for (let command of commands) {
    runCommands = runCommands
      .then(() => {
        runningTask.status = command.status;
      })
      .then(() => {
        let cwd = command.cwd ?  path.join(project.projectPath, command.cwd) : project.projectPath;
        return ShellService.execute(command.command, { cwd, maxBuffer });
      });
  }

  return runCommands;
}

function handleError(project: Project, runningTask: RunningTask, result: ExecResult): void {
  runningTask.success = false;

  let errorText = `
------------------------------------------------------------------------------------------
Project: ${path.join(project.projectPath, 'arbor.json')}
Task: ${runningTask.projectName}
Command: ${result.options.cwd}> ${result.command}

${result.stdout ? `* Standard Output:\n${result.stdout}\n` : ''}
${result.stderr ? `* Standard Error:\n${result.stderr}\n` : ''}
------------------------------------------------------------------------------------------`;

  fs.appendFileSync(errorLogFile, errorText.replace(/\r\n|\r|\n/g, '\r\n'));
}

function renderProgress(taskName: string, runningTasks: RunningTask[]): Promise<RunningTask[]> {
  return new Promise<RunningTask[]>((resolve, reject) => {
    let defaultStatus = getDefaultStatus(taskName);

    let interval = setInterval(() => {
      let output = '';

      for (let task of runningTasks) {
        if (task.success !== undefined) {
          output += `  ${task.projectName}: ${task.success ? chalk.green('done!') : chalk.red('failed!')} \n`;
        } else {
          output += `  ${task.projectName}: ${chalk.yellow(`${task.status ? task.status : defaultStatus}...`)} \n`;
        }
      }

      ConsoleService.progress(output);

      let completedTasks = runningTasks
        .filter(task => task.success !== undefined);

      if (completedTasks.length === runningTasks.length) {
        ConsoleService.finalizeProgress();
        clearInterval(interval);

        let success = runningTasks.every(task => task.success === true);

        if (success) {
          resolve(runningTasks);
        } else {
          reject(runningTasks);
        }
      }
    }, 100);
  });
}

function getConfigs(dir: string, filelist: string[] = []): string[] {
  fs.readdirSync(dir).forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory() && !path.join(dir, file).includes('node_modules')) {
      filelist = getConfigs(path.join(dir, file), filelist);
    } else if (path.join(dir, file).endsWith('arbor.json')) {
      filelist = filelist.concat(path.join(dir, file));
    }
  });

  return filelist;
}

function getProjects(configFiles: string[]): Promise<Project[]> {
  return new Promise<Project[]>((resolve, reject) => {
    let promises = configFiles
      .map(configFile => readConfig(configFile));

    Promise.all(promises)
      .then(projects => resolve([].concat.apply([], projects)))
      .catch(error => reject(error));
  });
}

function readConfig(configFile: string): Promise<Project[]> {
   return new Promise<Project[]>((resolve, reject) => {
    fs.readFile(configFile, (error, data) => {
      if (error) {
        reject(error);
      } else {
        let projectPath = path.resolve(path.dirname(configFile));

        let projects: Project[] = JSON.parse(data.toString());
        projects = Array.isArray(projects) ? projects : [projects];

        for (let project of projects) {
          project.projectPath = projectPath;
        }

        resolve(projects);
      }
    });
  });
}

function getDefaultStatus(taskName: string): string {
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
