/// <reference path="types/node-spinner.d.ts" />

import * as fs from 'fs';
import * as path from 'path';

import * as chalk from 'chalk';
import * as program from 'commander';

import Spinner = require('node-spinner');
const log = require('single-line-log').stdout;

import { Command, Config, Task } from './helpers/config';
import { RunningTask } from './helpers/running-task';
import { ShellService } from './services/shell.service';

program
  .option('-r, --run <s>', 'Run give arbor tasks in current directory', run)
  .parse(process.argv);

let runningTasks: RunningTask[] = [];

function run(taskName: string) {
  renderProgress();
  walkSync('./').forEach((file) => {
    getConfig(file)
      .then((config: Config) => {
        let task = config.tasks[taskName];

        if (task) {
          let runningTask: RunningTask = { name: config.name, complete: false };

          runningTasks.push(runningTask);

          runTask(config, task, runningTask)
            .then(() => {
              runningTasks.find(t => t.name === config.name).complete = true;
            });
        }
      });
  });
}

function renderProgress() {
  let spinner = Spinner();

  let ref = setInterval(() => {
    let out = '';
    let spinValue = spinner.next();

    for (let task of runningTasks) {
      if (task.complete) {
        out += `${task.name}: ${chalk.green('done!')} \n`;
      } else {
        out += `${spinValue} ${task.name}: ${chalk.yellow(`${task.status ? `${task.status}...` : 'building...'}`)} \n`;
      }
    }

    log(out);

    let completed = 0;
    for (let i = 0; i < runningTasks.length; i++) {
      if (runningTasks[i].complete === true) {
        completed = completed + 1;
      }

      if (completed === runningTasks.length) {
        clearInterval(ref);
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

function runTask(config: Config, task: Task, runningTask: RunningTask) {
  const maxBuffer = 1024 * 500;

  let runTasks = Promise.resolve(undefined);

  if (Array.isArray(task) && task.length > 0 && typeof task[0] === 'string') {
    for (let command of <string[]>task) {
      runTasks = runTasks
        .then(() => ShellService.execute(command, { cwd: config.projectPath, maxBuffer }));
    }
  } else if (Array.isArray(task) && task.length > 0) {
    for (let command of <Command[]>task) {
      runTasks = runTasks
        .then(() => {
          runningTask.status = command.status;
        })
        .then(() => {
          let cwd = command.cwd ?  path.join(config.projectPath, command.cwd) : config.projectPath;
          return ShellService.execute(command.command, { cwd, maxBuffer: 1024 * 500 });
        });
    }
  } else if (typeof task === 'string') {
    runTasks = ShellService.execute(task, { cwd: config.projectPath, maxBuffer });
  }

  return runTasks;
}

function getConfig(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      }

      let config: Config = JSON.parse(data.toString());
      filePath = filePath.replace('arbor.json', '');
      config.projectPath = './' + filePath;

      resolve(config);
    });
  });
}
