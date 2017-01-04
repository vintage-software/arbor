/// <reference path="types/node-spinner.d.ts" />

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import * as chalk from 'chalk';
import * as program from 'commander';

import { Command, Project, Task } from './helpers/project';
import { RunningTask } from './helpers/running-task';
import { ExecResult, ShellService } from './services/shell.service';

const errorLogFile = 'arbor-error.log';
let exitCode = 0;

program
  .option('-r, --run <s>', 'Run given arbor tasks in current directory', run)
  .parse(process.argv);

let runningTasks: RunningTask[] = [];

function run(taskName: string) {
  renderProgress();
  walkSync('./').forEach((file) => {
    getProjects(file)
      .then(projects => {
        for (let project of projects) {
          let task = project.tasks[taskName];

          if (task) {
            let runningTask: RunningTask = { name: project.name };

            runningTasks.push(runningTask);

            runTask(project, task, runningTask)
              .then(() => {
                runningTask.success = true;
              })
              .catch((result: ExecResult) => {
                exitCode = 1;
                runningTask.success = false;

                let errorText = `
------------------------------------------------------------------------------------------
Project: ${path.join(project.projectPath, 'arbor.json')}
Task: ${taskName}
Command: ${result.options.cwd}> ${result.command}

* Standard Output:
${result.stdout}

* Standard Error:
${result.stderr}
------------------------------------------------------------------------------------------`;

                fs.appendFileSync(errorLogFile, errorText.replace(/\r\n|\r|\n/g, '\r\n'));
              });
          }
        }
      });
  });
}

function renderProgress() {
  let maxLineLength = 0;

  let ref = setInterval(() => {
    let out = '';

    for (let task of runningTasks) {
      if (task.success !== undefined) {
        out += `${task.name}: ${task.success ? chalk.green('done!') : chalk.red('failed!')} \n`;
      } else {
        out += `${task.name}: ${chalk.yellow(`${task.status ? `${task.status}...` : 'building...'}`)} \n`;
      }
    }

    out = out
      .split('\n')
      .map(line => padRight(line, maxLineLength))
      .join('\n');

    readline.cursorTo(process.stdout, 0, 0);
    console.log(out);

    maxLineLength = Math.max.apply(null, out.split('\n').map(line => line.length));

    let completed = 0;
    for (let i = 0; i < runningTasks.length; i++) {
      if (runningTasks[i].success !== undefined) {
        completed = completed + 1;
      }

      if (completed === runningTasks.length) {
        clearInterval(ref);
        process.exit(exitCode);
      }
    }
  }, 100);
}

function walkSync(dir: string, filelist: string[] = []) {
  fs.readdirSync(dir).forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory() && !path.join(dir, file).includes('node_modules')) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else if (path.join(dir, file).endsWith('arbor.json')) {
      filelist = filelist.concat(path.join(dir, file));
    }
  });

  return filelist;
}

function runTask(project: Project, task: Task, runningTask: RunningTask) {
  const maxBuffer = 1024 * 500;

  let runTasks = Promise.resolve(undefined);

  if (Array.isArray(task) && task.length > 0 && typeof task[0] === 'string') {
    for (let command of <string[]>task) {
      runTasks = runTasks
        .then(() => ShellService.execute(command, { cwd: project.projectPath, maxBuffer }));
    }
  } else if (Array.isArray(task) && task.length > 0) {
    for (let command of <Command[]>task) {
      runTasks = runTasks
        .then(() => {
          runningTask.status = command.status;
        })
        .then(() => {
          let cwd = command.cwd ?  path.join(project.projectPath, command.cwd) : project.projectPath;
          return ShellService.execute(command.command, { cwd, maxBuffer: 1024 * 500 });
        });
    }
  } else if (typeof task === 'string') {
    runTasks = ShellService.execute(task, { cwd: project.projectPath, maxBuffer });
  }

  return runTasks;
}

function getProjects(filePath: string) {
  return new Promise<Project[]>((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) {
        reject(error);
      } else {
        let projectPath = path.resolve(path.dirname(filePath));

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

function padRight(value: string, length: number) {
  return value.length >= length ?
    value :
    (value + new Array(length - value.length).join(' '));
}
