/// <reference path="types/node-spinner.d.ts" />

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import * as chalk from 'chalk';
import * as program from 'commander';

import Spinner = require('node-spinner');
const log = require('single-line-log').stdout;

import { Config } from './helpers/config';
import { RunningTask } from './helpers/running-task';

program
  .option('-r, --run <s>', 'Run give arbor tasks in current directory', task)
  .parse(process.argv);

let runningTasks: RunningTask[] = [];

function task(taskName: string) {
  renderProgress();
  walkSync('./').forEach((file) => {
    getConfig(file).then((config: Config) => {
      runningTasks.push({ name: config.name, complete: false });

      runBuildTask(config, config.tasks[taskName]).then(() => {
        runningTasks.forEach(t => {
          if (t.name === config.name) {
            t.complete = true;
          }
        });
      });
    });
  });
}

function renderProgress() {
  let spinner = Spinner();

  let ref = setInterval(() => {
    let out = '';
    let spinValue = spinner.next();

    runningTasks.forEach(t => {
      if (t.complete) {
        out += `${t.name}: ${chalk.green('done!')} \n`;
      } else {
        out += `${spinValue} ${t.name}: ${chalk.yellow('building...')} \n`;
      }
    });

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

function runBuildTask(config: Config, buildTask: string) {
  return new Promise((resolve, reject) => {
    exec(`cd ${config.projectPath} && ${buildTask}`, { maxBuffer: 1024 * 500 }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
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
