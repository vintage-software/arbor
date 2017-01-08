#! /usr/bin/env node

import * as chalk from 'chalk';
import * as program from 'commander';

import { ConsoleService } from './services/console.service';
import { LogService } from './services/log.service';
import { ProjectService } from './services/project.service';
import { VersionService } from './services/version.service';

import { TaskRunner } from './task-runner';

const currentVersion = require('../package.json').version;

mapVersionFlag();

VersionService.getLatestVersion()
  .then(version => {
    showUpdateMessage(version, currentVersion);
    startArbor();
  })
  .catch(() => {
    startArbor();
  });

function startArbor() {
  program
    .version(currentVersion)
    .command('run <tasks...>')
    .action(run);

  program.parse(process.argv);
}

function run(taskNames: string[]) {
  console.log(taskNames);
  ConsoleService.log(`Arbor: running tasks ${taskNames.join(', ')} in ${process.cwd()}\n`);

  LogService.deleteLogs();

  if (taskNames.length) {
    let projectService = new ProjectService('./');

    projectService.getProjects()
      .then(projects =>  {
        let taskRunner = new TaskRunner(projects);

        let next = () => {
          taskNames.shift();

          if (taskNames.length) {
            taskRunner.runTask(taskNames[0], next);
          }
        };

        taskRunner.runTask(taskNames[0], next);
      });
  }
}

function mapVersionFlag() {
  // maps lower -v to the version flag of commander
  let vPos = process.argv.indexOf('-v');
  if (vPos > -1) {
    process.argv[vPos] = '-V';
  }
}

function showUpdateMessage(latest: string, current: string) {
  if (current !== latest) {
    ConsoleService.log(`
New version available. Run ${chalk.yellow('npm install -g arbor')} to update.
Local Version: ${current}
Latest Version: ${latest}
    `);
  }
}
