#! /usr/bin/env node

const Vorpal = require('vorpal');
const fs = require('fs');
const path = require('path');

let program = new Vorpal();
program.delimiter('blanket$').show();

program.command('build', 'Recursively builds blanket projects').action(function (args, callback) {
  let self = this;

  walkSync('./').forEach(file => {
    getBlanketConfig(file).then(config => runBuildTask(config, self));
  });

  callback();
});

function walkSync(dir, filelist = []) { 
  fs.readdirSync(dir).forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory() && !path.join(dir, file).includes('node_modules')) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else if (path.join(dir, file).endsWith('blanket.json')) {
      filelist = filelist.concat(path.join(dir, file));
    }
  });

  return filelist;
}

function runBuildTask(config, command) {
  let exec = require('child_process').exec;
  command.log(`${config.name}: Building...`);

  exec(`cd ${config.projectPath} && ${config.tasks.build}`, {maxBuffer: 1024 * 500}, (error, stdout, stderr) => {
    if (error) {
      command.log(`${config.name}: Error`);
      command.log(error);
    } else {
      command.log(`${config.name}: Complete`);
    }
  });
}

function getBlanketConfig(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      }

      let config =  JSON.parse(data);
      filePath = filePath.replace('blanket.json', '');
      config.projectPath = './' + filePath;

      resolve(config);
    });
  });
}

