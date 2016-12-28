#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const program = require('commander');
const Spinner = require('node-spinner');
const log = require('single-line-log').stdout;
const chalk = require('chalk');

// #4CAF50

program
  .option('-r, --run <s>', 'Run give arbor tasks in current directory', task)
  .parse(process.argv);

function build() {
  task('build');
}

function buildProd() {
  console.log(program);
  if (program.prod) {
    task('build--prod');
  }
}

let runningTasks = [];

function task(taskName) {
  renderProgress();
  walkSync('./').forEach((file, i) => {
    getConfig(file).then(config => {
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
  var s = Spinner();

  let ref = setInterval(() => {
    let out = '';

    runningTasks.forEach(t => {
      if (t.complete) {
        out += `${t.name}: ${chalk.green('done!')} \n`;
      } else {
        out += `${s.next()} ${t.name}: ${chalk.yellow('building...')} \n`;
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

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory() && !path.join(dir, file).includes('node_modules')) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else if (path.join(dir, file).endsWith('arbor.json')) {
      filelist = filelist.concat(path.join(dir, file));
    }
  });

  return filelist;
}

function runBuildTask(config, buildTask, command) {
  return new Promise((resolve, reject) => {
    let exec = require('child_process').exec;

    exec(`cd ${config.projectPath} && ${buildTask}`, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
      if (error) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getConfig(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      }

      let config = JSON.parse(data);
      filePath = filePath.replace('arbor.json', '');
      config.projectPath = './' + filePath;

      resolve(config);
    });
  });
}
